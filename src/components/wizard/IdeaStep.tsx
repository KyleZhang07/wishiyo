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

interface ImagePrompt {
  question: string;
  prompt: string;
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
  const [imagePrompts, setImagePrompts] = useState<ImagePrompt[]>([]);
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

      const personNameKeyMap: { [key: string]: string } = {
        'love-story': 'loveStoryPersonName',
      };

      const personGenderKeyMap: { [key: string]: string } = {
        'love-story': 'loveStoryPersonGender',
      };

      const storageKey = storageKeyMap[bookType];
      const authorNameKey = authorNameKeyMap[bookType];
      const personNameKey = personNameKeyMap[bookType];
      const personGenderKey = personGenderKeyMap[bookType];
      const { ideasKey, promptsKey } = getStorageKeys(bookType);

      if (!storageKey || !authorNameKey) {
        throw new Error('Invalid book type');
      }

      const authorName = localStorage.getItem(authorNameKey);
      const savedAnswers = localStorage.getItem(storageKey);
      
      // Get person name and gender for love-story category
      let personName = null;
      let personGender = null;
      if (category === 'love') {
        personName = localStorage.getItem(personNameKey);
        personGender = localStorage.getItem(personGenderKey);
        
        if (!personName || !personGender) {
          toast({
            title: "Missing recipient information",
            description: "Please complete the author step with recipient information first.",
            variant: "destructive",
          });
          return;
        }
      }
      
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
          category,
          personName,
          personGender
        }
      });

      if (error) throw error;

      if (!data) {
        throw new Error('No data received from the server');
      }

      if (!Array.isArray(data.ideas)) {
        throw new Error('Invalid response format: ideas should be an array');
      }

      // Process ideas differently based on category
      let processedIdeas;
      if (category === 'love') {
        // For love story, keep only the title
        processedIdeas = data.ideas.map(idea => ({
          ...idea,
          author: authorName,
          // Keep description for internal use but won't display it
        }));
      } else {
        // For other categories, keep everything
        processedIdeas = data.ideas.map(idea => ({
          ...idea,
          author: authorName,
          description: idea.description || ''
        }));
      }

      setIdeas(processedIdeas);
      setSelectedIdeaIndex(null);
      localStorage.setItem(ideasKey, JSON.stringify(processedIdeas));

      // Store image prompts separately for love category books
      if (category === 'love' && data.imagePrompts && promptsKey) {
        setImagePrompts(data.imagePrompts);
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
    const { ideasKey, selectedIdeaKey, promptsKey } = getStorageKeys(bookType);
    
    if (!ideasKey) {
      console.error('Invalid book type, no storage key found');
      return;
    }

    const savedIdeasString = localStorage.getItem(ideasKey);
    const savedIdeaIndexString = localStorage.getItem(selectedIdeaKey);

    // Load image prompts for love story
    if (category === 'love' && promptsKey) {
      const savedPromptsString = localStorage.getItem(promptsKey);
      if (savedPromptsString) {
        try {
          const parsedPrompts = JSON.parse(savedPromptsString);
          if (Array.isArray(parsedPrompts)) {
            setImagePrompts(parsedPrompts);
          }
        } catch (error) {
          console.error('Error parsing saved prompts:', error);
        }
      }
    }

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
      title="Let's pick a fantasy life story"
      description="Choose from these AI-generated fantasy autobiography ideas or regenerate for more options."
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

        {category === 'love' ? (
          <div className="space-y-6">
            {/* Horizontal layout for love story ideas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <h3 className="text-2xl font-bold">{idea.title}</h3>
                </div>
              ))}
            </div>
            
            {/* Single box for all image prompts */}
            {selectedIdeaIndex !== null && imagePrompts.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Images for "{ideas[selectedIdeaIndex].title}"
                  </h3>
                  <p className="text-gray-500 mt-1">Below are the images that will be generated for this story</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {imagePrompts.map((prompt, promptIndex) => (
                    <div key={promptIndex} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">
                        Image {promptIndex + 1}:
                      </h4>
                      <p className="text-gray-600">{prompt.question}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Original vertical layout for other categories
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
        )}
      </div>
    </WizardStep>
  );
};

export default IdeaStep;
