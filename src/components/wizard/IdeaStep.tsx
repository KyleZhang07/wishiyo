import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import WizardStep from './WizardStep';
import { useToast } from "@/components/ui/use-toast";

export interface IdeaStepProps {
  category: 'friends' | 'love';
  previousStep: string;
  nextStep: string;
  currentStep: number;
  totalSteps: number;
}

const IdeaStep = ({
  category,
  previousStep,
  nextStep,
  currentStep,
  totalSteps
}: IdeaStepProps) => {
  const [ideas, setIdeas] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedIdeas = localStorage.getItem(`${category}StoryIdeas`);
    if (savedIdeas) {
      setIdeas(JSON.parse(savedIdeas));
    }
  }, [category]);

  const handleGenerateIdeas = async () => {
    // Placeholder for generating ideas logic
    // In a real implementation, this would call an API to generate ideas
    const generatedIdeas = [
      "Idea 1: A heartwarming tale of friendship",
      "Idea 2: An adventurous journey together",
      "Idea 3: Overcoming challenges as best friends",
    ];
    setIdeas(generatedIdeas);
    localStorage.setItem(`${category}StoryIdeas`, JSON.stringify(generatedIdeas));
  };

  const handleContinue = () => {
    if (ideas.length === 0) {
      toast({
        variant: "destructive",
        title: "No ideas generated",
        description: "Please generate ideas to continue"
      });
      return;
    }
    navigate(nextStep);
  };

  return (
    <WizardStep
      title="Generate Story Ideas"
      description="Let AI help you brainstorm ideas for your book."
      previousStep={previousStep}
      nextStep={nextStep}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNextClick={handleContinue}
    >
      <div className="space-y-6">
        <Button variant="outline" className="w-full h-16 border-dashed text-lg" onClick={handleGenerateIdeas}>
          Generate Ideas
        </Button>
        {ideas.map((idea, index) => (
          <div key={index} className="bg-white rounded-lg border p-4">
            <p className="text-lg">{idea}</p>
          </div>
        ))}
      </div>
    </WizardStep>
  );
};

export default IdeaStep;
