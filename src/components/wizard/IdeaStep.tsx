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
  {
    id: 'Comic Book',
    name: 'Comic Book',
    description: 'Bold outlines and vibrant colors',
    image: '/images/art-styles/comic-book.png'
  },
  {
    id: 'Line Art',
    name: 'Line Art',
    description: 'Elegant, minimalist and black and white illustration',
    image: '/images/art-styles/line-art.png'
  },
  {
    id: 'Fantasy Art',
    name: 'Fantasy Art',
    description: 'Dreamlike and magical aesthetic',
    image: '/images/art-styles/fantasy-art.png'
  },
  {
    id: 'Photographic',
    name: 'Photographic',
    description: 'Realistic, photography-like images',
    image: '/images/art-styles/photographic.png'
  },
  {
    id: 'Disney Character',
    name: 'Disney Character',
    description: 'Cartoon-like characters with Disney animation style',
    image: '/images/art-styles/disney-character.png'
  }
];

interface IdeaStepProps {
  category: 'friends' | 'love';
  previousStep: string;
  nextStep: string;
  currentStep: number;
  totalSteps: number;
}

const IdeaStep = ({
  category,
  previousStep,
  nextStep,
  currentStep,
  totalSteps
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

    const lastQuestionsHashStorageKeyMap: { [key: string]: string } = {
      'love-story': 'loveStoryLastQuestionsHash',
    };

    const lastToneStorageKeyMap: { [key: string]: string } = {
      'love-story': 'loveStoryLastTone',
    };

    return {
      ideasKey: ideaStorageKeyMap[bookType] || '',
      selectedIdeaKey: selectedIdeaStorageKeyMap[bookType] || '',
      promptsKey: promptsStorageKeyMap[bookType] || '',
      toneKey: toneStorageKeyMap[bookType] || '',
      styleKey: styleStorageKeyMap[bookType] || '',
      textsKey: textsStorageKeyMap[bookType] || '',
      lastQuestionsHashKey: lastQuestionsHashStorageKeyMap[bookType] || '',
      lastToneKey: lastToneStorageKeyMap[bookType] || '',
    };
  };

  // 计算问题答案的哈希值，用于检测变化
  const calculateQuestionsHash = (answers: any): string => {
    try {
      // 简单地将答案转换为字符串并返回，用于比较
      return JSON.stringify(answers);
    } catch (error) {
      console.error('Error calculating questions hash:', error);
      return '';
    }
  };

  const generateIdeas = async () => {
    // 如果是 love 类别，我们不设置 isLoading，因为这是异步的，不应阻止用户继续
    if (category !== 'love') {
      setIsLoading(true);
    }

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
      const { ideasKey, promptsKey, toneKey, lastQuestionsHashKey, lastToneKey } = getStorageKeys(bookType);

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
          if (category !== 'love') {
            toast({
              title: "Missing recipient information",
              description: "Please complete the author step with recipient information first.",
              variant: "destructive",
            });
          }
          return;
        }
      }

      if (!authorName || !savedAnswers) {
        if (category !== 'love') {
          toast({
            title: "Missing information",
            description: "Please complete the previous steps first.",
            variant: "destructive",
          });
        }
        return;
      }

      let answers;
      try {
        answers = JSON.parse(savedAnswers);
      } catch (error) {
        console.error('Error parsing saved answers:', error);
        if (category !== 'love') {
          toast({
            title: "Error",
            description: "Invalid saved answers format. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      // 检查问题答案是否有变化
      const currentQuestionsHash = calculateQuestionsHash(answers);

      // 检查文本风格是否有变化
      const currentTone = localStorage.getItem(toneKey) || 'Heartfelt';

      // 如果问题或风格没有变化，且不是第一次生成（已有哈希值），则不重新生成
      if (category === 'love' &&
          currentQuestionsHash === localStorage.getItem(lastQuestionsHashKey) &&
          currentTone === localStorage.getItem(lastToneKey) &&
          localStorage.getItem(lastQuestionsHashKey) !== '' &&
          localStorage.getItem(lastToneKey) !== '') {
        console.log('No changes detected in questions or tone, skipping generation');
        if (category !== 'love') {
          setIsLoading(false);
        }
        return;
      }

      // 更新最后一次生成时的问题哈希和风格
      localStorage.setItem(lastQuestionsHashKey, currentQuestionsHash);
      localStorage.setItem(lastToneKey, currentTone);

      // 对于 love 类别，我们显示一个 toast 通知用户生成已在后台开始
      if (category === 'love') {
        toast({
          title: "Generating story",
          description: "Your story is being generated in the background. You can continue to the next step.",
        });
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

      if (category === 'love') {
        // 检查是否有图像提示
        if (data.imagePrompts && Array.isArray(data.imagePrompts)) {
          // 如果没有 ideas 字段，创建一个默认的
          if (!data.ideas || !Array.isArray(data.ideas)) {
            const defaultIdea = {
              title: `${personName}'s Love Story`,
              description: `A beautiful love story featuring ${personName}.`,
              author: authorName
            };

            setIdeas([defaultIdea]);
            setSelectedIdeaIndex(0);
            localStorage.setItem(ideasKey, JSON.stringify([defaultIdea]));
            localStorage.setItem(getStorageKeys(bookType).selectedIdeaKey, "0");
          } else {
            // 如果有 ideas 字段，使用它
            const processedIdea = {
              ...data.ideas[0],
              author: authorName,
            };
            setIdeas([processedIdea]);
            setSelectedIdeaIndex(0);
            localStorage.setItem(ideasKey, JSON.stringify([processedIdea]));
            localStorage.setItem(getStorageKeys(bookType).selectedIdeaKey, "0");
          }

          // 处理图像提示
          setImagePrompts(data.imagePrompts);
          localStorage.setItem(promptsKey, JSON.stringify(data.imagePrompts));
          generateImageTexts(data.imagePrompts, selectedTone);
        } else {
          throw new Error('Invalid response format: imagePrompts should be an array');
        }
      } else {
        if (!Array.isArray(data.ideas)) {
          throw new Error('Invalid response format: ideas should be an array');
        }

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
      if (category !== 'love') {
        toast({
          title: "Error generating ideas",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      if (category !== 'love') {
        setIsLoading(false);
      }
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
    // 如果选择了不同的想法，设置标记
    if (selectedIdeaIndex !== index) {
      const path = window.location.pathname;
      // 更准确地确定书籍类型
      let bookType = '';

      if (path.includes('/friends/funny-biography/')) {
        bookType = 'funnyBiography';
      } else if (path.includes('/love/love-story/')) {
        bookType = 'loveStory';
      } else {
        // 提取路径中的最后一个有意义的部分作为书籍类型
        const pathParts = path.split('/').filter(part => part);
        if (pathParts.length >= 2) {
          bookType = pathParts[pathParts.length - 2];
        }
      }

      if (bookType) {
        // 设置一个明确的标记，表示想法选择已更改
        localStorage.setItem(`${bookType}IdeaChanged`, Date.now().toString());

        // 为了调试，添加控制台日志
        console.log(`Idea changed for ${bookType}. Set localStorage key: ${bookType}IdeaChanged`);
      }
    }

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

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    const path = window.location.pathname;
    const bookType = path.split('/')[3];
    const { styleKey } = getStorageKeys(bookType);

    localStorage.setItem(styleKey, styleId);
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

      // 对于 love 类别，在导航到下一步之前启动异步生成
      // 这样用户可以继续浏览应用，而生成过程在后台进行
      generateIdeas();
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

  useEffect(() => {
    const path = window.location.pathname;
    const bookType = path.split('/')[3];
    const { ideasKey, selectedIdeaKey, promptsKey, toneKey, styleKey, textsKey, lastQuestionsHashKey, lastToneKey } = getStorageKeys(bookType);

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
      title={category === 'love' ? "Style Selection" : "Let's pick your book idea"}
      description={category === 'love'
        ? "Choose a visual style for your book"
        : ""}
      previousStep={previousStep}
      currentStep={category === 'love' ? 5 : currentStep}
      totalSteps={category === 'love' ? 8 : totalSteps}
      onNextClick={handleContinue}
    >
      {category !== 'love' && !isLoading && (
        <div className="flex justify-end -mt-8 mb-2">
          <Button
            variant="outline"
            className="bg-[#FF7F50] text-white hover:bg-[#FF7F50]/80"
            onClick={generateIdeas}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
        </div>
      )}

      <div className="flex justify-center w-full">
        <div className="space-y-6 w-[95%]">
          {category === 'love' && (
            <>


              <div className="flex flex-col space-y-4">

                {STYLE_OPTIONS.map((style) => (
                  <div
                    key={style.id}
                    onClick={() => handleStyleSelect(style.id)}
                    className={`
                      border rounded-xl cursor-pointer transition-all py-[0.8rem] px-4 flex items-center
                      ${selectedStyle === style.id
                        ? 'border-2 border-[#FF7F50] bg-[#FF7F50]/10'
                        : 'border border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    <div className="flex-shrink-0 mr-4">
                      <div className="relative rounded-lg overflow-hidden w-[4.25rem] h-[4.25rem] border border-gray-100">
                        <img
                          src={style.image}
                          alt={style.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h4 className={`font-medium leading-tight ${selectedStyle === style.id ? 'text-[#FF7F50]' : 'text-gray-900'}`}>{style.name}</h4>
                      <p className={`text-sm leading-snug ${selectedStyle === style.id ? 'text-[#FF7F50]/80' : 'text-gray-500'}`}>{style.description}</p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      {selectedStyle === style.id ? (
                        <div className="w-8 h-8 rounded-full bg-[#FF7F50] flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full border-2 border-gray-200"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {category === 'love' ? (
            <></>
          ) : (
            <>
              {isLoading ? (
                <div className="text-center py-20">
                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-16 h-16 mb-6">
                      <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-t-transparent border-[#FF7F50] animate-spin"></div>
                      <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-r-transparent border-b-transparent border-l-transparent border-[#FF7F50]/20"></div>
                    </div>
                    <h3 className="text-xl font-medium text-[#FF7F50]">
                      Creating book ideas
                    </h3>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {ideas.map((idea, index) => (
                    <div
                      key={index}
                      className={`${category === 'friends' ? 'bg-white rounded-lg p-5' : ''} cursor-pointer transition-all hover:shadow-md border ${
                        selectedIdeaIndex === index
                          ? 'ring-2 ring-[#FF7F50] shadow-lg scale-[1.02]'
                          : 'border-gray-200'
                      }`}
                      onClick={() => handleIdeaSelect(index)}
                    >
                      <h3 className="text-xl font-bold mb-1">{idea.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{idea.author}</p>
                      <p className="text-gray-800 text-sm">{idea.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </WizardStep>
  );
};

export default IdeaStep;
