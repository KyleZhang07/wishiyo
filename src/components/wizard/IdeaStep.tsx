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

interface ImageText {
  text: string;
  tone: string;
}

// Text tone options for love story
const TONE_OPTIONS = [
  'Humorous',
  'Poetic',
  'Dramatic',
  'Heartfelt',
  'Encouraging'
];

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
  const [selectedTone, setSelectedTone] = useState<string>('Heartfelt');
  const [selectedStyle, setSelectedStyle] = useState<string>('Photographic');
  const [isGeneratingTexts, setIsGeneratingTexts] = useState(false);
  const [imageTexts, setImageTexts] = useState<ImageText[]>([]);
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

    const toneStorageKeyMap: { [key: string]: string } = {
      'love-story': 'loveStoryTone',
    };

    const styleStorageKeyMap: { [key: string]: string } = {
      'love-story': 'loveStoryStyle',
    };

    const textsStorageKeyMap: { [key: string]: string } = {
      'love-story': 'loveStoryImageTexts',
    };

    return {
      ideasKey: ideaStorageKeyMap[bookType] || '',
      selectedIdeaKey: selectedIdeaStorageKeyMap[bookType] || '',
      promptsKey: promptsStorageKeyMap[bookType] || '',
      toneKey: toneStorageKeyMap[bookType] || '',
      styleKey: styleStorageKeyMap[bookType] || '',
      textsKey: textsStorageKeyMap[bookType] || '',
    };
  };

  const generateIdeas = async () => {
    setIsLoading(true);
    try {
      const path = window.location.pathname;
      const bookType = path.split('/')[3];
      const { promptsKey } = getStorageKeys(bookType);

      // Get data from localStorage
      let answers: Record<string, string> = {};
      if (bookType === 'funny-biography') {
        const interests = localStorage.getItem('funnyBiographyPersonInterests');
        const achievements = localStorage.getItem('funnyBiographyPersonAchievements');
        const dreams = localStorage.getItem('funnyBiographyPersonDreams');
        const funnyQuirks = localStorage.getItem('funnyBiographyPersonQuirks');
        const personalityTraits = localStorage.getItem('funnyBiographyPersonTraits');
        const gender = localStorage.getItem('funnyBiographyPersonGender');
        const name = localStorage.getItem('funnyBiographyPersonName');
        const authorName = localStorage.getItem('funnyBiographyAuthorName');

        if (!name || !gender) {
          throw new Error('Missing required information');
        }

        answers = {
          interests: interests || '',
          achievements: achievements || '',
          dreams: dreams || '',
          funnyQuirks: funnyQuirks || '',
          personalityTraits: personalityTraits || '',
          gender,
          name,
          authorName: authorName || '',
        };
      } else if (bookType === 'love-story') {
        const howMet = localStorage.getItem('loveStoryHowMet');
        const memorableMoments = localStorage.getItem('loveStoryMemorableMoments');
        const insideJokes = localStorage.getItem('loveStoryInsideJokes');
        const traditions = localStorage.getItem('loveStoryTraditions');
        const whyLove = localStorage.getItem('loveStoryWhyLove');
        const personGender = localStorage.getItem('loveStoryPersonGender');
        const personName = localStorage.getItem('loveStoryPersonName');
        const authorName = localStorage.getItem('loveStoryAuthorName');

        if (!personName || !personGender) {
          throw new Error('Missing required information');
        }

        answers = {
          howMet: howMet || '',
          memorableMoments: memorableMoments || '',
          insideJokes: insideJokes || '',
          traditions: traditions || '',
          whyLove: whyLove || '',
          personGender,
          personName,
          authorName: authorName || '',
        };
      }

      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: { answers, bookType }
      });

      if (error) throw error;

      console.log('Generated ideas:', data);
      setIdeas(data.ideas);
      localStorage.setItem(`${bookType}GeneratedIdeas`, JSON.stringify(data.ideas));
      handleIdeaSelect(0); // Select the first idea by default
      setImagePrompts(data.imagePrompts);
      localStorage.setItem(promptsKey, JSON.stringify(data.imagePrompts));
      
      // Only generate image texts for non-love-story genres
      if (bookType !== 'love-story') {
        generateImageTexts(data.imagePrompts, selectedTone);
      } else {
        // Create default texts for love-story genre
        const defaultTexts = data.imagePrompts.map(prompt => ({
          text: "A special moment captured in time.",
          tone: selectedTone
        }));
        
        setImageTexts(defaultTexts);
        localStorage.setItem(getStorageKeys('love-story').textsKey, JSON.stringify(defaultTexts));
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

  const generateImageTexts = async (prompts: ImagePrompt[], tone: string) => {
    setIsGeneratingTexts(true);
    try {
      const path = window.location.pathname;
      const bookType = path.split('/')[3];
      const { textsKey } = getStorageKeys(bookType);

      // Create default texts for all genres
      const defaultTexts = prompts.map(prompt => ({
        text: "A special moment captured in time.",
        tone: tone
      }));
      
      setImageTexts(defaultTexts);
      localStorage.setItem(textsKey, JSON.stringify(defaultTexts));

    } catch (error) {
      console.error('Error generating image texts:', error);
      toast({
        title: "Error generating text accompaniments",
        description: "Using default text instead.",
        variant: "destructive",
      });
      
      // Create default texts as fallback
      const defaultTexts = prompts.map(prompt => ({
        text: "A special moment captured in time.",
        tone: tone
      }));
      
      setImageTexts(defaultTexts);
      const path = window.location.pathname;
      const bookType = path.split('/')[3];
      const { textsKey } = getStorageKeys(bookType);
      localStorage.setItem(textsKey, JSON.stringify(defaultTexts));
    } finally {
      setIsGeneratingTexts(false);
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

  const handleToneSelect = (tone: string) => {
    setSelectedTone(tone);
    
    // Only regenerate text for non-love-story genres when tone changes
    const path = window.location.pathname;
    const bookType = path.split('/')[3];
    
    if (bookType !== 'love-story' && imagePrompts.length > 0) {
      generateImageTexts(imagePrompts, tone);
    } else if (bookType === 'love-story' && imagePrompts.length > 0) {
      // Create default texts for love-story genre
      const defaultTexts = imagePrompts.map(prompt => ({
        text: "A special moment captured in time.",
        tone: tone
      }));
      
      setImageTexts(defaultTexts);
      localStorage.setItem(getStorageKeys('love-story').textsKey, JSON.stringify(defaultTexts));
    }
  };

  const handleStyleSelect = (style: string) => {
    setSelectedStyle(style);
    const path = window.location.pathname;
    const bookType = path.split('/')[3];
    const { styleKey } = getStorageKeys(bookType);
    
    localStorage.setItem(styleKey, style);
  };

  const handleContinue = () => {
    if (category === 'love') {
      // For love story, we need to check if tone and style are selected
      if (!selectedTone || !selectedStyle) {
        toast({
          title: "Selection required",
          description: "Please select both a text tone and image style.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // For other categories, check if an idea is selected
      if (selectedIdeaIndex === null) {
        toast({
          title: "No idea selected",
          description: "Please select an idea before continuing.",
          variant: "destructive",
        });
        return;
      }
    }

    navigate(nextStep);
  };

  useEffect(() => {
    const path = window.location.pathname;
    const bookType = path.split('/')[3];
    const { ideasKey, selectedIdeaKey, promptsKey, toneKey, styleKey, textsKey } = getStorageKeys(bookType);
    
    if (!ideasKey) {
      console.error('Invalid book type, no storage key found');
      return;
    }

    // Load saved tone and style for love story
    if (category === 'love') {
      const savedTone = localStorage.getItem(toneKey);
      const savedStyle = localStorage.getItem(styleKey);
      
      if (savedTone) {
        setSelectedTone(savedTone);
      }
      
      if (savedStyle) {
        setSelectedStyle(savedStyle);
      }
      
      // Load saved image texts
      const savedTexts = localStorage.getItem(textsKey);
      if (savedTexts) {
        try {
          setImageTexts(JSON.parse(savedTexts));
        } catch (error) {
          console.error('Error parsing saved texts:', error);
        }
      }
    }

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
      title={category === 'love' ? "Customize Your Love Story" : "Let's pick a fantasy life story"}
      description={category === 'love' 
        ? "Choose a writing tone and visual style for your personalized love story."
        : "Choose from these AI-generated fantasy autobiography ideas or regenerate for more options."}
      previousStep={previousStep}
      currentStep={4}
      totalSteps={5}
      onNextClick={handleContinue}
    >
      <div className="space-y-6">
        {category === 'love' ? (
          <>
            {/* Love story tone and style selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Text Tone Selection */}
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Select a Writing Tone</h3>
                <p className="text-gray-500 mb-6">
                  This determines how the text accompanying each image will be written.
                </p>
                
                <div className="space-y-3">
                  {TONE_OPTIONS.map((tone) => (
                    <div 
                      key={tone}
                      onClick={() => handleToneSelect(tone)}
                      className={`
                        flex items-center p-3 rounded-md cursor-pointer transition-all
                        ${selectedTone === tone 
                          ? 'bg-primary/10 border border-primary' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}
                      `}
                    >
                      <div className="flex-shrink-0 mr-3">
                        {selectedTone === tone ? (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{tone}</h4>
                        <p className="text-sm text-gray-500">
                          {tone === 'Humorous' && 'Light-hearted and witty captions'}
                          {tone === 'Poetic' && 'Lyrical and expressive language'}
                          {tone === 'Dramatic' && 'Intense and emotionally charged'}
                          {tone === 'Heartfelt' && 'Warm, sincere, and emotionally genuine'}
                          {tone === 'Encouraging' && 'Positive, uplifting, and supportive'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Image Style Selection */}
              <div className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Select an Image Style</h3>
                <p className="text-gray-500 mb-6">
                  This determines the visual aesthetic of the generated images.
                </p>
                
                <div className="space-y-3">
                  {STYLE_OPTIONS.map((style) => (
                    <div 
                      key={style}
                      onClick={() => handleStyleSelect(style)}
                      className={`
                        flex items-center p-3 rounded-md cursor-pointer transition-all
                        ${selectedStyle === style 
                          ? 'bg-primary/10 border border-primary' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}
                      `}
                    >
                      <div className="flex-shrink-0 mr-3">
                        {selectedStyle === style ? (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{style}</h4>
                        <p className="text-sm text-gray-500">
                          {style === 'Comic Book' && 'Bold outlines and vibrant colors'}
                          {style === 'Line Art' && 'Elegant, minimalist black and white illustration'}
                          {style === 'Fantasy Art' && 'Dreamlike and magical aesthetic'}
                          {style === 'Photographic' && 'Realistic, photography-like images'}
                          {style === 'Cinematic' && 'Film-like with dramatic lighting and composition'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Loading states */}
            {(isLoading || isGeneratingTexts) && (
              <div className="text-center py-4">
                <RefreshCw className="animate-spin h-6 w-6 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">
                  {isLoading ? 'Generating story elements...' : 'Creating text accompaniments...'}
                </p>
              </div>
            )}

            {/* Regenerate button */}
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                className="bg-black text-white hover:bg-black/90" 
                onClick={generateIdeas}
                disabled={isLoading || isGeneratingTexts}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Generating...' : 'Regenerate Story'}
              </Button>
            </div>
          </>
        ) : (
          // Original layout for other categories
          <>
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
          </>
        )}
      </div>
    </WizardStep>
  );
};

export default IdeaStep;
