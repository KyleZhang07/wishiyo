import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface IdeaStepProps {
  category: 'friends' | 'love';
  previousStep: string;
  nextStep: string;
  currentStep: number;
  totalSteps: number;
}

const IdeaStep = ({ category, previousStep, nextStep, currentStep, totalSteps }: IdeaStepProps) => {
  const [generatedIdeas, setGeneratedIdeas] = useState<any[]>([]);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: { category }
      });

      if (error) {
        throw error;
      }

      if (data && data.ideas) {
        setGeneratedIdeas(data.ideas);
        localStorage.setItem('funnyBiographyGeneratedIdeas', JSON.stringify(data.ideas));
      }
    } catch (error) {
      console.error('Error loading ideas:', error);
      toast({
        variant: "destructive",
        title: "Error loading ideas",
        description: "Failed to load book ideas. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectIdea = (index: number) => {
    setSelectedIdeaIndex(index);
    localStorage.setItem('funnyBiographySelectedIdea', index.toString());
  };

  const handleSubmit = () => {
    if (selectedIdeaIndex === null) {
      toast({
        variant: "destructive",
        title: "No idea selected",
        description: "Please select an idea to continue.",
      });
      return;
    }
    navigate(nextStep);
  };
  
  let promptFocus = category === 'friends' ? 'friend' : 'loved one';
  let bookType = category === 'friends' ? 'funny biography' : 'love story';

  return (
    <WizardStep
      title="Choose a Book Concept"
      description={`Select one of our concepts for your ${bookType}`}
      previousStep={previousStep}
      nextStep={nextStep}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNextClick={handleSubmit}
      nextDisabled={selectedIdeaIndex === null}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center">Loading ideas...</div>
        ) : (
          generatedIdeas.map((idea, index) => (
            <Card
              key={index}
              className={`cursor-pointer transition-transform hover:scale-[1.02] ${selectedIdeaIndex === index ? 'ring-2 ring-[#FF7F50]' : ''}`}
              onClick={() => selectIdea(index)}
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{idea.title}</h3>
                <p className="text-sm text-gray-500">{idea.description}</p>
                {selectedIdeaIndex === index && (
                  <div className="absolute top-2 right-2">
                    <Check className="h-5 w-5 text-[#FF7F50]" />
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </WizardStep>
  );
};

export default IdeaStep;
