
import { useState, useEffect } from 'react';
import WizardStep from './WizardStep';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface BookIdea {
  title: string;
  author: string;
  description: string;
}

interface IdeaStepProps {
  category: 'friends' | 'love' | 'kids';
  previousStep: string;
  nextStep: string;
}

const IdeaStep = ({
  category,
  previousStep,
  nextStep
}: IdeaStepProps) => {
  const [ideas, setIdeas] = useState<BookIdea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateIdeas = async () => {
    setIsLoading(true);
    try {
      const authorName = localStorage.getItem('funnyBiographyAuthorName');
      const savedAnswers = localStorage.getItem('funnyBiographyAnswers');
      
      if (!authorName || !savedAnswers) {
        toast({
          title: "Missing information",
          description: "Please complete the previous steps first.",
          variant: "destructive",
        });
        return;
      }

      const stories = JSON.parse(savedAnswers);
      const response = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorName,
          stories,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ideas');
      }

      const data = await response.json();
      setIdeas(data.ideas);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error generating ideas",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateIdeas();
  }, []);

  return (
    <WizardStep
      title="Let's pick a book idea"
      description="Choose from these AI-generated book ideas or regenerate for more options."
      previousStep={previousStep}
      currentStep={3}
      totalSteps={4}
      nextStep={nextStep}
    >
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            className="bg-black text-white hover:bg-black/90" 
            onClick={generateIdeas}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Generating...' : 'Regenerate'}
          </Button>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4" />
            <p className="text-gray-500">Generating creative ideas...</p>
          </div>
        )}

        <div className="space-y-4">
          {ideas.map((idea, index) => (
            <div key={index} className="bg-white rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow">
              <h3 className="text-2xl font-bold mb-1">{idea.title}</h3>
              <p className="text-gray-600 text-sm mb-2">{idea.author}</p>
              <p className="text-gray-800">{idea.description}</p>
            </div>
          ))}
        </div>
      </div>
    </WizardStep>
  );
};

export default IdeaStep;
