import { useState, useEffect } from 'react';
import WizardStep from './WizardStep';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Chapter {
  title: string;
  description: string;
  imagePrompt: string; // Added for storing AI image generation prompts
}

interface BookIdea {
  title: string;
  author: string;
  description: string;
  chapters?: Chapter[];
}

interface IdeaStepProps {
  category: 'friends' | 'love';
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
      'love-story': 'loveStoryGeneratedIdeas',
    };

    const selectedIdeaStorageKeyMap: { [key: string]: string } = {
      'funny-biography': 'funnyBiographySelectedIdea',
      'love-story': 'loveStorySelectedIdea',
    };

    const promptsStorageKeyMap: { [key: string]: string } = {
      'love-story': 'loveStoryImagePrompts',
    };

    return {
      ideasKey: ideaStorageKeyMap[bookType] || '',
      selectedIdeaKey: selectedIdeaStorageKeyMap[bookType] || '',
      promptsKey: promptsStorageKeyMap[bookType] || ''
    };
  };

  const generateIdeas = async () => {
    setIsLoading(true);
    try {
      const path = window.location.pathname;
      const bookType = path.split('/')[3];
      
      const storageKeyMap: { [key: string]: string } = {
        'funny-biography': 'funnyBiographyAnswers',
        'love-story': 'loveStoryAnswers',
      };

      const authorNameKeyMap: { [key: string]: string } = {
        'funny-biography': 'funnyBiographyAuthorName',
        'love-story': 'loveStoryAuthorName',
      };

      const storageKey = storageKeyMap[bookType];
      const authorNameKey = authorNameKeyMap[bookType];
      const { ideasKey, promptsKey } = getStorageKeys(bookType);

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

      let answers;
      try {
        answers = JSON.parse(savedAnswers);
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
          answers,
          bookType,
          category
        }
      });

      if (error) throw error;

      if (!data) {
        throw new Error('No data received from the server');
      }

      if (!Array.isArray(data.ideas)) {
        throw new Error('Invalid response format: ideas should be an array');
      }

      // Force correct author name and subtitle length
      const processedIdeas = data.ideas.map(idea => ({
        ...idea,
        author: authorName, // Force author to be exactly authorName
        description: idea.description || '' // Keep complete description without truncation
      }));

      setIdeas(processedIdeas);
      setSelectedIdeaIndex(null);
      localStorage.setItem(ideasKey, JSON.stringify(processedIdeas));

      // Store image prompts separately for love category books
      if (category === 'love' && data.imagePrompts && promptsKey) {
        localStorage.setItem(promptsKey, JSON.stringify(data.imagePrompts));
      }

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
    if (selectedIdeaIndex === null) {
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
              className={`bg-white rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                selectedIdeaIndex === index 
                  ? 'ring-2 ring-primary shadow-lg scale-[1.02]' 
                  : ''
              }`}
              onClick={() => handleIdeaSelect(index)}
            >
              <h3 className="text-2xl font-bold mb-1">{idea.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{idea.author}</p>
              <p className="text-gray-800">{idea.description}</p>
            </div>
          ))}
        </div>
      </div>
    </WizardStep>
  );
};

export default IdeaStep;
