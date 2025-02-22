
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
  category: 'friends' | 'love' | 'kids';
  previousStep: string;
  nextStep: string;
  bookType?: 'illustrated' | 'regular';
}

const IdeaStep = ({
  category,
  previousStep,
  nextStep,
  bookType
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

  const checkPreviousSteps = () => {
    const path = window.location.pathname;
    const bookType = path.split('/')[3];
    
    // Check for partner name (from author step)
    const partnerName = localStorage.getItem('loveStoryPartnerName');
    if (!partnerName) {
      toast({
        title: "Missing partner's name",
        description: "Please go back and enter your partner's name first.",
        variant: "destructive",
      });
      navigate(previousStep);
      return false;
    }

    // Check for answers (from questions step)
    const savedAnswers = localStorage.getItem('loveStoryAnswers');
    if (!savedAnswers) {
      toast({
        title: "Missing love story details",
        description: "Please go back and share some stories about your relationship.",
        variant: "destructive",
      });
      navigate(previousStep);
      return false;
    }

    try {
      const answers = JSON.parse(savedAnswers);
      if (!Array.isArray(answers) || answers.length === 0) {
        toast({
          title: "No stories shared",
          description: "Please go back and share at least one story about your relationship.",
          variant: "destructive",
        });
        navigate(previousStep);
        return false;
      }
    } catch (error) {
      toast({
        title: "Invalid data format",
        description: "Please go back and fill in the questions again.",
        variant: "destructive",
      });
      navigate(previousStep);
      return false;
    }

    return true;
  };

  const generateIdeas = async () => {
    if (!checkPreviousSteps()) {
      return;
    }

    setIsLoading(true);
    try {
      const path = window.location.pathname;
      const bookType = path.split('/')[3];
      
      const authorNameKey = 'loveStoryPartnerName';
      const storageKey = 'loveStoryAnswers';
      const { ideasKey } = getStorageKeys(bookType);

      const authorName = localStorage.getItem(authorNameKey);
      const savedAnswers = localStorage.getItem(storageKey);
      
      if (!authorName || !savedAnswers) {
        return; // checkPreviousSteps will handle the navigation
      }

      let stories;
      try {
        stories = JSON.parse(savedAnswers);
      } catch (error) {
        console.error('Error parsing saved answers:', error);
        return; // checkPreviousSteps will handle the error
      }

      const endpoint = category === 'love' && bookType === 'illustrated' 
        ? 'generate-love-story'
        : 'generate-ideas';

      const { data, error } = await supabase.functions.invoke(endpoint, {
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

      if (!data.idea || !data.idea.chapters) {
        throw new Error('Invalid response format');
      }
      
      const singleIdea = data.idea;
      setIdeas([singleIdea]);
      setSelectedIdeaIndex(0);
      localStorage.setItem(ideasKey, JSON.stringify(singleIdea));
      
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
    if (savedIdeasString) {
      try {
        const parsedIdea = JSON.parse(savedIdeasString);
        if (parsedIdea && typeof parsedIdea === 'object') {
          setIdeas([parsedIdea]);
          setSelectedIdeaIndex(0);
        }
      } catch (error) {
        console.error('Error parsing saved ideas:', error);
        if (checkPreviousSteps()) {
          generateIdeas();
        }
      }
    } else {
      if (checkPreviousSteps()) {
        generateIdeas();
      }
    }
  }, [category]);

  return (
    <WizardStep
      title="Your Book Outline"
      description="Review your AI-generated book outline or regenerate for a different one."
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
            <p className="text-gray-500">Generating your book outline...</p>
          </div>
        )}

        <div className="space-y-4">
          {ideas.map((idea, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg p-6"
            >
              <h3 className="text-2xl font-bold mb-1">{idea.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{idea.author}</p>
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
            </div>
          ))}
        </div>
      </div>
    </WizardStep>
  );
};

export default IdeaStep;
