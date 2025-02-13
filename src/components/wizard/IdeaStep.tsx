
import { useState } from 'react';
import WizardStep from './WizardStep';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

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

const IdeaStep = ({ category, previousStep, nextStep }: IdeaStepProps) => {
  const [ideas, setIdeas] = useState<BookIdea[]>([
    {
      title: "Skiing Startup Secrets",
      author: "by kk",
      description: "How My Childhood Dreams of the Alps Shaped a Tech Empire"
    },
    {
      title: "Board Games & Business Strategy",
      author: "by kk",
      description: "Everything I Know About Startups I Learned from Monopoly"
    },
    {
      title: "Hiking the Startup Trail",
      author: "by kk",
      description: "Lessons from Mountain Trails to Boardroom Battles with a Dash of Childhood Nostalgia"
    }
  ]);

  const handleRegenerate = () => {
    // In the future, this will call an AI endpoint to generate new ideas
    console.log('Regenerating ideas...');
  };

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
            onClick={handleRegenerate}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
        </div>

        <div className="space-y-4">
          {ideas.map((idea, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <h3 className="text-2xl font-bold mb-1">{idea.title}</h3>
              <p className="text-gray-600 text-sm mb-2">{idea.author}</p>
              <p className="text-gray-800">{idea.description}</p>
            </div>
          ))}
        </div>

        <Button 
          className="w-full bg-[#F26B4D] hover:bg-[#F26B4D]/90 text-white py-6 rounded-lg mt-6"
        >
          Continue
        </Button>
      </div>
    </WizardStep>
  );
};

export default IdeaStep;
