import { useState, useEffect } from 'react';
import WizardStep from './WizardStep';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Praise {
  quote: string;
  source: string;
}

interface Chapter {
  title: string;
  description: string;
}

interface BookIdea {
  title: string;
  author: string;
  description: string;
  praises: Praise[];
  chapters?: Chapter[];
}

interface IdeaStepProps {
  category: 'fun' | 'fantasy' | 'kids';
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
      'funny-book': 'funnyBookGeneratedIdeas',
      'wild-fantasy': 'wildFantasyGeneratedIdeas',
      'prank-book': 'prankBookGeneratedIdeas',
      'fantasy-book': 'fantasyBookGeneratedIdea',
      'love-poems': 'lovePoemsGeneratedIdea',
      'picture-album': 'pictureAlbumGeneratedIdea',
      'adventure': 'kidsAdventureGeneratedIdea',
      'story-book': 'kidsStoryGeneratedIdea',
      'learning': 'learningJourneyGeneratedIdea'
    };

    const selectedIdeaStorageKeyMap: { [key: string]: string } = {
      'funny-book': 'funnyBookSelectedIdea',
      'wild-fantasy': 'wildFantasySelectedIdea',
      'prank-book': 'prankBookSelectedIdea',
      'fantasy-book': 'fantasyBookSelectedIdea',
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
        'funny-book': 'funnyBookAnswers',
        'wild-fantasy': 'wildFantasyAnswers',
        'prank-book': 'prankBookAnswers',
        'fantasy-book': 'fantasyBookAnswers',
        'love-poems': 'lovePoemsAnswers',
        'picture-album': 'pictureAlbumAnswers',
        'adventure': 'kidsAdventureAnswers',
        'story-book': 'kidsStoryAnswers',
        'learning': 'learningJourneyAnswers'
      };

      const authorNameKeyMap: { [key: string]: string } = {
        'funny-book': 'funnyBookAuthorName',
        'wild-fantasy': 'wildFantasyAuthorName',
        'prank-book': 'prankBookAuthorName',
        'fantasy-book': 'fantasyBookAuthorName',
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

      if (category === 'fun') {
        if (!data.ideas || !Array.isArray(data.ideas)) {
          throw new Error('Invalid response format for fun category');
        }
        setIdeas(data.ideas);
        setSelectedIdeaIndex(null);
        localStorage.setItem(ideasKey, JSON.stringify(data.ideas));
      } else {
        if (!data.idea || !data.idea.chapters) {
          throw new Error('Invalid response format for fantasy/kids category');
        }
        const singleIdea = data.idea;
        setIdeas([singleIdea]);
        setSelectedIdeaIndex(0);
        localStorage.setItem(ideasKey, JSON.stringify(singleIdea));
      }

      console.log('Generated ideas:', data);
    } catch (error) {
      console.error('Error generating ideas:', error);
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
    if (category === 'fun' && selectedIdeaIndex === null) {
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
        if (category === 'fun') {
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
      title={category === 'fun' ? "Let's pick a book idea" : "Your Book Outline"}
      description={category === 'fun' 
        ? "Choose from these AI-generated book ideas or regenerate for more options."
        : "Review your AI-generated book outline or regenerate for a different one."}
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
              {category === 'fun' 
                ? "Generating creative ideas..." 
                : "Generating your book outline..."}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {ideas.map((idea, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-lg p-6 ${
                category === 'fun' 
                  ? 'cursor-pointer transition-all hover:shadow-md ' + 
                    (selectedIdeaIndex === index 
                      ? 'ring-2 ring-primary shadow-lg scale-[1.02]' 
                      : '')
                  : ''
              }`}
              onClick={() => category === 'fun' && handleIdeaSelect(index)}
            >
              <h3 className="text-2xl font-bold mb-1">{idea.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{idea.author}</p>
              
              {category === 'fun' ? (
                <p className="text-gray-800">{idea.description}</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-800">{idea.description}</p>
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold mb-3">Table of Contents</h4>
                    <div className="space-y-3">
                      {idea.chapters?.map((chapter, idx) => (
                        <div key={idx} className="border-b pb-3">
                          <h5 className="font-medium">Chapter {idx + 1}: {chapter.title}</h5>
                          <p className="text-gray-600 text-sm mt-1">{chapter.description}</p>
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
