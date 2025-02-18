
import { useState, useEffect } from 'react';
import WizardStep from './WizardStep';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

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
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const generateIdeas = async () => {
    setIsLoading(true);
    try {
      const path = window.location.pathname;
      const bookType = path.split('/')[3]; // e.g., 'funny-biography', 'prank-book', etc.
      
      // Get the appropriate storage key and author name based on book type
      const storageKeyMap: { [key: string]: string } = {
        'funny-biography': 'funnyBiographyAnswers',
        'wild-fantasy': 'wildFantasyAnswers',
        'prank-book': 'prankBookAnswers',
        'love-story': 'loveStoryAnswers',
        'love-poems': 'lovePoemsAnswers',
        'picture-album': 'pictureAlbumAnswers',
        'adventure': 'kidsAdventureAnswers',
        'story-book': 'kidsStoryAnswers',
        'learning': 'learningJourneyAnswers'
      };

      const authorNameKeyMap: { [key: string]: string } = {
        'funny-biography': 'funnyBiographyAuthorName',
        'wild-fantasy': 'wildFantasyAuthorName',
        'prank-book': 'prankBookAuthorName',
        'love-story': 'loveStoryAuthorName',
        'love-poems': 'lovePoemsAuthorName',
        'picture-album': 'pictureAlbumAuthorName',
        'adventure': 'kidsAdventureAuthorName',
        'story-book': 'kidsStoryAuthorName',
        'learning': 'learningJourneyAuthorName'
      };

      const storageKey = storageKeyMap[bookType];
      const authorNameKey = authorNameKeyMap[bookType];

      if (!storageKey || !authorNameKey) {
        throw new Error('Invalid book type');
      }

      const authorName = localStorage.getItem(authorNameKey);
      const savedAnswers = localStorage.getItem(storageKey);
      
      if (!authorName || !savedAnswers) {
        toast({
          title: "Missing information",
          description: "Please complete the previous steps first.",
          variant: "destructive",
        });
        return;
      }

      const stories = JSON.parse(savedAnswers);
      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: { 
          authorName,
          stories,
          bookType,
          category
        }
      });

      if (error) throw error;
      setIdeas(data.ideas);
      setSelectedIdeaIndex(null); // Reset selection when generating new ideas
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

  const handleIdeaSelect = (index: number) => {
    setSelectedIdeaIndex(index);
  };

  const handleContinue = () => {
    if (selectedIdeaIndex === null) {
      toast({
        title: "No idea selected",
        description: "Please select an idea before continuing.",
        variant: "destructive",
      });
      return;
    }

    // Save selected idea to localStorage
    const selectedIdea = ideas[selectedIdeaIndex];
    localStorage.setItem('selectedIdea', JSON.stringify(selectedIdea));

    // Navigate to next step
    navigate(nextStep);
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
      onNextClick={handleContinue}
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
            <div 
              key={index} 
              className={`bg-white rounded-lg p-6 cursor-pointer transition-all ${
                selectedIdeaIndex === index 
                  ? 'ring-2 ring-primary shadow-lg scale-[1.02]' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleIdeaSelect(index)}
            >
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
