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
  'Heartfelt',
  'Playful',
  'Inspirational'
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

      const personAgeKeyMap: { [key: string]: string } = {
        'love-story': 'loveStoryPersonAge',
      };

      const storageKey = storageKeyMap[bookType];
      const authorNameKey = authorNameKeyMap[bookType];
      const personNameKey = personNameKeyMap[bookType];
      const personGenderKey = personGenderKeyMap[bookType];
      const personAgeKey = personAgeKeyMap[bookType];
      const { ideasKey, promptsKey } = getStorageKeys(bookType);

      if (!storageKey || !authorNameKey) {
        throw new Error('Invalid book type');
      }

      const authorName = localStorage.getItem(authorNameKey);
      const savedAnswers = localStorage.getItem(storageKey);
      
      let personName = null;
      let personGender = null;
      let personAge = null;
      if (category === 'love') {
        personName = localStorage.getItem(personNameKey);
        personGender = localStorage.getItem(personGenderKey);
        personAge = localStorage.getItem(personAgeKey);
        
        if (!personName || !personGender || !personAge) {
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
          personGender,
          personAge
        }
      });

      if (error) throw error;

      if (!data) {
        throw new Error('No data received from the server');
      }

      if (!Array.isArray(data.ideas)) {
        throw new Error('Invalid response format: ideas should be an array');
      }

      if (category === 'love') {
        const processedIdea = {
          ...data.ideas[0],
          author: authorName,
        };
        setIdeas([processedIdea]);
        setSelectedIdeaIndex(0);
        localStorage.setItem(ideasKey, JSON.stringify([processedIdea]));
        localStorage.setItem(getStorageKeys(bookType).selectedIdeaKey, "0");
        
        if (data.imagePrompts && promptsKey) {
          setImagePrompts(data.imagePrompts);
          localStorage.setItem(promptsKey, JSON.stringify(data.imagePrompts));
          generateImageTexts(data.imagePrompts, selectedTone);
        }
      } else {
        const processedIdeas = data.ideas.map(idea => ({
          ...idea,
          author: authorName,
          description: idea.description || ''
        }));
        setIdeas(processedIdeas);
        setSelectedIdeaIndex(null);
        localStorage.setItem(ideasKey, JSON.stringify(processedIdeas));
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

      const personName = localStorage.getItem('loveStoryPersonName');
      const personAge = localStorage.getItem('loveStoryPersonAge');
      
      // Get the answers to questions about the person
      const savedAnswers = localStorage.getItem('loveStoryAnswers');
      const questionsAndAnswers = savedAnswers ? JSON.parse(savedAnswers) : [];
      
      if (!personName) {
        throw new Error('Missing person name');
      }

      const { data, error } = await supabase.functions.invoke('generate-image-texts', {
        body: { 
          prompts,
          tone,
          personName,
          personAge,
          questionsAndAnswers
        }
      });

      if (error) throw error;

      if (!data || !data.texts) {
        throw new Error('No texts received from the server');
      }

      setImageTexts(data.texts);
      localStorage.setItem(textsKey, JSON.stringify(data.texts));

    } catch (error) {
      console.error('Error generating image texts:', error);
      toast({
        title: "Error generating text accompaniments",
        description: "Using default text instead.",
        variant: "destructive",
      });
      
      const defaultTexts = prompts.map(prompt => ({
        text: "A special moment captured in time.",
        tone: tone
      }));
      
      setImageTexts(defaultTexts);
      localStorage.setItem(getStorageKeys('love-story').textsKey, JSON.stringify(defaultTexts));
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
    const path = window.location.pathname;
    const bookType = path.split('/')[3];
    const { toneKey } = getStorageKeys(bookType);
    
    localStorage.setItem(toneKey, tone);
    
    if (imagePrompts.length > 0) {
      generateImageTexts(imagePrompts, tone);
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
      if (!selectedStyle) {
        toast({
          title: "Selection required",
          description: "Please select an image style.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (selectedIdeaIndex === null) {
        toast({
          title: "Selection required",
          description: "Please select an idea to continue",
          variant: "destructive",
        });
        return;
      }
    }

    navigate(nextStep);
  };

  const showExtendedOptions = (creationType: string) => {
    return creationType === "friends" || creationType === "love" || creationType === "holidays" || creationType === "colleagues";
  };

  useEffect(() => {
    const path = window.location.pathname;
    const bookType = path.split('/')[3];
    const { ideasKey, selectedIdeaKey, promptsKey, toneKey, styleKey, textsKey } = getStorageKeys(bookType);
    
    if (!ideasKey) {
      console.error('Invalid book type, no storage key found');
      return;
    }

    if (category === 'love') {
      const savedTone = localStorage.getItem(toneKey);
      const savedStyle = localStorage.getItem(styleKey);
      
      if (savedTone) {
        setSelectedTone(savedTone);
      }
      
      if (savedStyle) {
        console.log('Loading saved style:', savedStyle);
        setSelectedStyle(savedStyle);
      }
      
      const savedTexts = localStorage.getItem(textsKey);
      if (savedTexts) {
        try {
          setImageTexts(JSON.parse(savedTexts));
        } catch (error) {
          console.error('Error parsing saved texts:', error);
        }
      }
    }

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
        ? "Choose a visual style for your personalized love story."
        : "Choose from these AI-generated fantasy autobiography ideas or regenerate for more options."}
      previousStep={previousStep}
      currentStep={4}
      totalSteps={category === 'love' ? 7 : 5}
      onNextClick={handleContinue}
    >
      <div className="space-y-6">
        {category === 'love' && (
          <div className="bg-white rounded-lg p-6 shadow-md mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Select an Image Style</h3>
            <p className="text-gray-500 mb-6">
              This determines the visual aesthetic of all the generated images in your love story.
            </p>
            
            <div className="space-y-3">
              {STYLE_OPTIONS.map((style) => (
                <div 
                  key={style}
                  onClick={() => handleStyleSelect(style)}
                  className={`
                    flex items-center p-3 rounded-md cursor-pointer transition-all
                    ${selectedStyle === style 
                      ? category === 'love'
                        ? 'bg-[#FF7F50]/10 border border-[#FF7F50]'
                        : 'bg-[#F6C744]/10 border border-[#F6C744]' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}
                  `}
                >
                  <div className="flex-shrink-0 mr-3">
                    {selectedStyle === style ? (
                      <div className={`w-5 h-5 rounded-full ${category === 'love' ? 'bg-[#FF7F50]' : 'bg-[#F6C744]'} flex items-center justify-center`}>
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
        )}

        {category === 'love' ? (
          <>
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                className={`${(category as string) === 'love' ? 'bg-[#FF7F50] text-white hover:bg-[#FF7F50]/80' : 'bg-[#F6C744] text-white hover:bg-[#E5B73E]'}`}
                onClick={generateIdeas}
                disabled={isLoading || isGeneratingTexts}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Generating...' : 'Regenerate Story'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <Button 
                variant="outline" 
                className={`${(category as string) === 'love' ? 'bg-[#FF7F50] text-white hover:bg-[#FF7F50]/80' : 'bg-[#F6C744] text-white hover:bg-[#E5B73E]'}`}
                onClick={generateIdeas}
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Generating...' : 'Regenerate'}
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-20">
                <div className="flex flex-col items-center justify-center">
                  {/* 使用主题色的加载圆环 */}
                  <div className="relative w-16 h-16 mb-6">
                    <div className={`absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-t-transparent ${category === 'love' ? 'border-[#FF7F50]' : 'border-[#F6C744]'} animate-spin`}></div>
                    <div className={`absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-r-transparent border-b-transparent border-l-transparent ${category === 'love' ? 'border-[#FF7F50]/20' : 'border-[#F6C744]/20'}`}></div>
                  </div>
                  {/* 主题色的标题文字 */}
                  <h3 className={`text-xl font-medium ${category === 'love' ? 'text-[#FF7F50]' : 'text-[#F6C744]'}`}>
                    Creating book ideas
                  </h3>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {ideas.map((idea, index) => (
                  <div 
                    key={index} 
                    className={`bg-white rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
                      selectedIdeaIndex === index 
                        ? category === 'friends' 
                          ? 'ring-2 ring-[#F6C744] shadow-lg scale-[1.02]' 
                          : 'ring-2 ring-[#FF7F50] shadow-lg scale-[1.02]' 
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
          </>
        )}
      </div>
    </WizardStep>
  );
};

export default IdeaStep;

