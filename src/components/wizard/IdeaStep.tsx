import { useState, useEffect } from 'react';
import WizardStep from './WizardStep';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

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

// Image style options for love story
const STYLE_OPTIONS = [
  'Comic Book',
  'Line Art',
  'Fantasy Art',
  'Photographic',
  'Cinematic'
];

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
  const [selectedStyle, setSelectedStyle] = useState<string>('Photographic');
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

    const styleStorageKeyMap: { [key: string]: string } = {
      'love-story': 'loveStoryStyle',
    };

    return {
      ideasKey: ideaStorageKeyMap[bookType] || '',
      selectedIdeaKey: selectedIdeaStorageKeyMap[bookType] || '',
      promptsKey: promptsStorageKeyMap[bookType] || '',
      styleKey: styleStorageKeyMap[bookType] || '',
    };
  };

  // Modified function to ensure style is saved before navigating
  const handleFormSubmit = async () => {
    if (!selectedStyle && category === 'love') {
      toast({
        title: "Style required",
        description: "Please select an image style before continuing",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Save selected style to localStorage
      const path = window.location.pathname;
      const bookType = path.split('/')[3];
      const { styleKey } = getStorageKeys(bookType);
      if (styleKey) {
        localStorage.setItem(styleKey, selectedStyle);
      }

      // Navigate to the next step
      navigate(nextStep);
    } catch (error) {
      console.error('Error handling form submission:', error);
      toast({
        title: "Error",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAgain = () => {
    setIsLoading(true);
    toast({
      title: "Regenerating ideas",
      description: "Please wait while we generate new ideas for you...",
    });
    
    // Simply clear existing idea selection and toggle loading state
    setSelectedIdeaIndex(null);
    
    // Set a timeout to simulate generation
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Ideas regenerated",
        description: "Please select your favorite idea.",
      });
    }, 1000);
  };

  const selectIdea = (index: number) => {
    setSelectedIdeaIndex(index);
    
    const path = window.location.pathname;
    const bookType = path.split('/')[3];
    const { selectedIdeaKey } = getStorageKeys(bookType);
    
    localStorage.setItem(selectedIdeaKey, index.toString());
  };

  const handleStyleSelect = (style: string) => {
    setSelectedStyle(style);
  };

  useEffect(() => {
    // Load saved ideas
    const path = window.location.pathname;
    const bookType = path.split('/')[3];
    const { ideasKey, selectedIdeaKey, styleKey } = getStorageKeys(bookType);
    
    const savedIdeas = localStorage.getItem(ideasKey);
    const savedSelectedIdea = localStorage.getItem(selectedIdeaKey);
    const savedStyle = localStorage.getItem(styleKey);
    
    if (savedStyle) {
      setSelectedStyle(savedStyle);
    } else if (category === 'love') {
      // Set default to Photographic if not already saved
      setSelectedStyle('Photographic');
    }

    if (savedIdeas) {
      try {
        const ideas = JSON.parse(savedIdeas);
        setIdeas(ideas);
        
        if (savedSelectedIdea) {
          const index = parseInt(savedSelectedIdea);
          if (!isNaN(index) && index >= 0 && index < ideas.length) {
            setSelectedIdeaIndex(index);
          }
        }
      } catch (error) {
        console.error('Error parsing saved ideas:', error);
      }
    } else if (category === 'love') {
      // For love story, we proceed directly to generate a single idea
      // handleGenerateIdeas();
    }
  }, [category]);

  // Don't render the idea selection UI for love story books
  if (category === 'love') {
    return (
      <WizardStep
        title="Style Selection"
        description="Choose a visual style for your love story images."
        previousStep={previousStep}
        nextStep={nextStep}
        currentStep={5}
        totalSteps={6}
        onNextClick={handleFormSubmit}
      >
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-2 gap-6 mb-8">
            {STYLE_OPTIONS.map((style) => (
              <div 
                key={style}
                onClick={() => handleStyleSelect(style)}
                className={`
                  border-2 p-6 rounded-xl cursor-pointer transition-all
                  ${selectedStyle === style 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="flex items-center mb-2">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                    {selectedStyle === style && (
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium ml-2">{style}</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  {style === 'Comic Book' && 'Bold outlines and vibrant colors'}
                  {style === 'Line Art' && 'Elegant, minimalist black and white illustration'}
                  {style === 'Fantasy Art' && 'Dreamlike and magical aesthetic'}
                  {style === 'Photographic' && 'Realistic, photography-like images'}
                  {style === 'Cinematic' && 'Film-like with dramatic lighting and composition'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </WizardStep>
    );
  }

  return (
    <WizardStep
      title="Story Ideas"
      description="Select your favorite story idea. You can regenerate if you want different options."
      previousStep={previousStep}
      nextStep={nextStep}
      currentStep={2}
      totalSteps={4}
    >
      <div className="max-w-3xl mx-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Generating ideas...</p>
          </div>
        ) : (
          <>
            {ideas.length > 0 ? (
              <div className="space-y-6 mb-8">
                {ideas.map((idea, index) => (
                  <div 
                    key={index}
                    onClick={() => selectIdea(index)}
                    className={`
                      border-2 p-6 rounded-xl cursor-pointer transition-all
                      ${selectedIdeaIndex === index 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    <div className="flex items-center mb-2">
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                        {selectedIdeaIndex === index && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                      <h3 className="text-xl font-medium ml-2">{idea.title}</h3>
                    </div>
                    <p className="text-gray-600">{idea.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No ideas found. Click the button below to generate ideas.</p>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleGenerateAgain}
                disabled={isLoading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate Ideas
              </Button>
              
              <Button
                variant="default"
                onClick={handleFormSubmit}
                disabled={isLoading || selectedIdeaIndex === null}
              >
                Continue
              </Button>
            </div>
          </>
        )}
      </div>
    </WizardStep>
  );
};

export default IdeaStep;
