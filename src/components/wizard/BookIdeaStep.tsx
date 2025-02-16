
import { useState } from 'react';
import WizardStep from './WizardStep';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface BookIdea {
  title: string;
  author: string;
  description: string;
}

interface BookIdeaStepProps {
  genre: 'funny-biography' | 'wild-fantasy' | 'prank-book';
  previousStep: string;
  nextStep: string;
  currentStep: number;
  totalSteps: number;
}

const getIdeasByGenre = (genre: string): BookIdea[] => {
  switch (genre) {
    case 'funny-biography':
      return [
        {
          title: "Life Through Laughter",
          author: "A Hilarious Biography",
          description: "From epic fails to triumphant victories, discover the endearingly human side of an extraordinary friend."
        },
        {
          title: "Coffee, Chaos & Comedy",
          author: "A Friend's Tale",
          description: "Join us on a journey through memorable mishaps and infectious laughter that define true friendship."
        },
        {
          title: "The Art of Being Ridiculous",
          author: "A Biography of Joy",
          description: "Celebrating the perfectly imperfect moments that make life worth living and friendships worth keeping."
        }
      ];
    case 'wild-fantasy':
      return [
        {
          title: "The Crystal Keeper",
          author: "A Magical Journey",
          description: "When ordinary friendship meets extraordinary magic, legends are born and destinies are forged."
        },
        {
          title: "Guardians of the Dream Realm",
          author: "An Epic Tale",
          description: "Two friends discover their shared destiny as protectors of a magical world between reality and dreams."
        },
        {
          title: "The Enchanted Chronicles",
          author: "A Mystical Adventure",
          description: "From urban life to magical realms, follow an epic journey of friendship and discovery."
        }
      ];
    case 'prank-book':
      return [
        {
          title: "The Prankster's Almanac",
          author: "Tales of Mischief",
          description: "A collection of legendary pranks and the friendship that survived them all."
        },
        {
          title: "Masters of Mayhem",
          author: "A Story of Fun",
          description: "Chronicles of creative chaos and the laughter that brings friends closer together."
        },
        {
          title: "The Art of the Perfect Prank",
          author: "Friendship & Fun",
          description: "Behind every great prank is an even greater friendship - and these are the best of both."
        }
      ];
    default:
      return [];
  }
};

const BookIdeaStep = ({
  genre,
  previousStep,
  nextStep,
  currentStep,
  totalSteps
}: BookIdeaStepProps) => {
  const [ideas, setIdeas] = useState<BookIdea[]>(() => getIdeasByGenre(genre));

  const handleRegenerate = () => {
    // In the future, this will call an AI endpoint to generate new ideas
    console.log('Regenerating ideas...');
  };

  return (
    <WizardStep
      title="Choose Your Book Style"
      description="Select from these AI-generated book ideas or regenerate for more options."
      previousStep={previousStep}
      currentStep={currentStep}
      totalSteps={totalSteps}
      nextStep={nextStep}
    >
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <Button variant="outline" className="bg-black text-white hover:bg-black/90" onClick={handleRegenerate}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
        </div>

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

export default BookIdeaStep;
