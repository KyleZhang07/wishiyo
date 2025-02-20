import { useState, useEffect } from 'react';
import WizardStep from './WizardStep';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Story {
  title: string;
}

interface BookIdea {
  title: string;
  author: string;
  stories?: Story[];
  description?: string;
  praises?: { quote: string; source: string; }[];
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
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const getStorageKeys = (bookType: string) => {
    const ideaStorageKeyMap: { [key: string]: string } = {
      'funny-biography': 'funnyBiographyGeneratedIdeas',
      'wild-fantasy': 'wildFantasyGeneratedIdeas',
      'prank-book': 'prankBookGeneratedIdeas',
      'love-story': 'loveStoryGeneratedIdea',
      'love-poems': 'lovePoemsGeneratedIdea',
      'picture-album': 'pictureAlbumGeneratedIdea',
      'adventure': 'kidsAdventureGeneratedIdea',
      'story-book': 'kidsStoryGeneratedIdea',
      'learning': 'learningJourneyGeneratedIdea'
    };

    const selectedIdeaStorageKeyMap: { [key: string]: string } = {
      'funny-biography': 'funnyBiographySelectedIdea',
      'wild-fantasy': 'wildFantasySelectedIdea',
      'prank-book': 'prankBookSelectedIdea',
      'love-story': 'loveStorySelectedIdea',
      'love-poems': 'lovePoemsSelectedIdea',
      'picture-album': 'pictureAlbumSelectedIdea',
      'adventure': 'kidsAdventureSelectedIdea',
      'story-book': 'kidsStorySelectedIdea',
      'learning': 'learningJourneySelectedIdea'
    };

    return {
      ideasKey: ideaStorageKeyMap[bookType] || '',
      selectedIdeaKey: selectedIdeaStorageKeyMap[bookType] || ''
    };
  };

  const generateIdeas = async () => {
    setIsLoading(true);
    try {
      const path = window.location.pathname;
      const bookType = path.split('/')[3];
      
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
      const { ideasKey } = getStorageKeys(bookType);

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

      let stories;
      try {
        stories = JSON.parse(savedAnswers);
      } catch (error) {
        console.error('Error parsing saved answers:', error);
        toast({
          title: "Error",
          description: "Invalid saved answers format. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: { 
          authorName,
          stories,
          bookType,
          category
        }
      });

      if (error) throw error;

      if (!data) {
        throw new Error('No data received from the server');
      }

      if (category === 'friends') {
        if (!data.ideas || !Array.isArray(data.ideas)) {
          throw new Error('Invalid response format for friends category');
        }
        setIdeas(data.ideas);
        setSelectedIdeaIndex(null);
        localStorage.setItem(ideasKey, JSON.stringify(data.ideas));
      } else {
        // For love and kids categories
        if (!data.idea || !data.idea.stories) {
          throw new Error('Invalid response format for love/kids category');
        }
        const singleIdea = data.idea;
        setIdeas([singleIdea]);
        setSelectedIdeaIndex(0);
        localStorage.setItem(ideasKey, JSON.stringify(singleIdea));
      }
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
    const path = window.location.pathname;
    const bookType = path.split('/')[3];
    const { selectedIdeaKey } = getStorageKeys(bookType);
    if (selectedIdeaKey) {
      localStorage.setItem(selectedIdeaKey, index.toString());
    }
  };

  const handleContinue = () => {
    if (category === 'friends' && selectedIdeaIndex === null) {
      toast({
        title: "No idea selected",
        description: "Please select an idea before continuing.",
        variant: "destructive",
      });
      return;
    }

    navigate(nextStep);
  };

  useEffect(() => {
    const path = window.location.pathname;
    const bookType = path.split('/')[3];
    const { ideasKey, selectedIdeaKey } = getStorageKeys(bookType);
    
    if (!ideasKey) {
      console.error('Invalid book type, no storage key found');
      return;
    }

    const savedIdeasString = localStorage.getItem(ideasKey);
    const savedIdeaIndexString = localStorage.getItem(selectedIdeaKey);

    if (savedIdeasString) {
      try {
        if (category === 'friends') {
          const parsedIdeas = JSON.parse(savedIdeasString);
          if (Array.isArray(parsedIdeas)) {
            setIdeas(parsedIdeas);
            if (savedIdeaIndexString) {
              const index = parseInt(savedIdeaIndexString);
              if (!isNaN(index)) {
                setSelectedIdeaIndex(index);
              }
            }
          }
        } else {
          // For love and kids categories
          const parsedIdea = JSON.parse(savedIdeasString);
          if (parsedIdea && typeof parsedIdea === 'object') {
            setIdeas([parsedIdea]);
            setSelectedIdeaIndex(0);
          }
        }
      } catch (error) {
        console.error('Error parsing saved ideas:', error);
        generateIdeas();
      }
    } else {
      generateIdeas();
    }
  }, [category]);

  return (
    <WizardStep
      title={category === 'friends' ? "Let's pick a book idea" : "Your Story Book"}
      description={category === 'friends' 
        ? "Choose from these AI-generated book ideas or regenerate for more options."
        : "Review your AI-generated story book or regenerate for a different one."}
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
            <p className="text-gray-500">
              {category === 'friends' 
                ? "Generating creative ideas..." 
                : "Generating your story book..."}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {ideas.map((idea, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-lg p-6 ${
                category === 'friends' 
                  ? 'cursor-pointer transition-all hover:shadow-md ' + 
                    (selectedIdeaIndex === index 
                      ? 'ring-2 ring-primary shadow-lg scale-[1.02]' 
                      : '')
                  : ''
              }`}
              onClick={() => category === 'friends' && handleIdeaSelect(index)}
            >
              <h3 className="text-2xl font-bold mb-4">{idea.title}</h3>
              <p className="text-gray-600 text-sm mb-6">By {idea.author}</p>
              
              {category === 'friends' ? (
                <p className="text-gray-800">{idea.description}</p>
              ) : (
                <div className="space-y-4">
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-3">Stories</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {idea.stories?.map((story, idx) => (
                        <div key={idx} className="border p-3 rounded-lg">
                          <p className="font-medium">Story {idx + 1}: {story.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </WizardStep>
  );
};

export default IdeaStep;
