import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CoverPreviewCard } from './components/CoverPreviewCard';
import { ContentImageCard } from './components/ContentImageCard';
import { 
  getDataFromStore, 
  storeData, 
  removeData, 
  migrateFromLocalStorage 
} from '@/utils/indexedDB';

interface ImageText {
  text: string;
  tone: string;
}

// Define image-related localStorage keys for migration
const IMAGE_STORAGE_KEYS = [
  'loveStoryCoverImage',
  'loveStoryIntroImage',
  'loveStoryContentImage1',
  'loveStoryContentImage2',
  'loveStoryContentImage3',
  'loveStoryContentImage4',
  'loveStoryContentImage5',
  'loveStoryContentImage6',
  'loveStoryContentImage7',
  'loveStoryContentImage8',
  'loveStoryContentImage9',
  'loveStoryContentImage10'
];

// 定义照片存储键名 - 与MomentsStep中的定义保持一致
const PHOTO_KEYS = {
  MAIN: 'loveStoryCharacterPhoto',
  SECOND: 'loveStoryCharacterPhoto2',
  THIRD: 'loveStoryCharacterPhoto3',
  FOURTH: 'loveStoryCharacterPhoto4'
};

// 映射到API schema
const API_PHOTO_KEYS = {
  [PHOTO_KEYS.MAIN]: 'input_image',
  [PHOTO_KEYS.SECOND]: 'input_image2', 
  [PHOTO_KEYS.THIRD]: 'input_image3',
  [PHOTO_KEYS.FOURTH]: 'input_image4'
};

const GenerateStep = () => {
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [backCoverText, setBackCoverText] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [introImage, setIntroImage] = useState<string>();
  const [contentImage1, setContentImage1] = useState<string>();
  const [contentImage2, setContentImage2] = useState<string>();
  const [contentImage3, setContentImage3] = useState<string>();
  const [contentImage4, setContentImage4] = useState<string>();
  const [contentImage5, setContentImage5] = useState<string>();
  const [contentImage6, setContentImage6] = useState<string>();
  const [contentImage7, setContentImage7] = useState<string>();
  const [contentImage8, setContentImage8] = useState<string>();
  const [contentImage9, setContentImage9] = useState<string>();
  const [contentImage10, setContentImage10] = useState<string>();

  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isGeneratingIntro, setIsGeneratingIntro] = useState(false);
  const [isGeneratingContent1, setIsGeneratingContent1] = useState(false);
  const [isGeneratingContent2, setIsGeneratingContent2] = useState(false);
  const [isGeneratingContent3, setIsGeneratingContent3] = useState(false);
  const [isGeneratingContent4, setIsGeneratingContent4] = useState(false);
  const [isGeneratingContent5, setIsGeneratingContent5] = useState(false);
  const [isGeneratingContent6, setIsGeneratingContent6] = useState(false);
  const [isGeneratingContent7, setIsGeneratingContent7] = useState(false);
  const [isGeneratingContent8, setIsGeneratingContent8] = useState(false);
  const [isGeneratingContent9, setIsGeneratingContent9] = useState(false);
  const [isGeneratingContent10, setIsGeneratingContent10] = useState(false);

  const [selectedStyle, setSelectedStyle] = useState<string>('Photographic (Default)');
  const [imageTexts, setImageTexts] = useState<ImageText[]>([]);
  const [migratedToIndexedDB, setMigratedToIndexedDB] = useState(false);

  const { toast } = useToast();

  // Function to migrate existing image data from localStorage to IndexedDB
  const migrateImagesToIndexedDB = async () => {
    try {
      await migrateFromLocalStorage(IMAGE_STORAGE_KEYS);
      setMigratedToIndexedDB(true);
      console.log('Successfully migrated image data to IndexedDB');
    } catch (error) {
      console.error('Failed to migrate images to IndexedDB:', error);
    }
  };

  // 辅助函数：获取所有角色照片
  const getAllCharacterPhotos = async () => {
    const photos: Record<string, string | null> = {};
    
    // 尝试从IndexedDB加载所有照片
    for (const key of Object.values(PHOTO_KEYS)) {
      try {
        // 先从IndexedDB加载
        const photoFromIDB = await getDataFromStore(key);
        if (photoFromIDB) {
          photos[key] = photoFromIDB;
          continue;
        }
        
        // 回退到localStorage
        const savedPhoto = localStorage.getItem(key);
        if (savedPhoto) {
          photos[key] = savedPhoto;
        }
      } catch (error) {
        console.error(`Error loading photo ${key}:`, error);
      }
    }
    
    // 向后兼容：检查旧的键名
    if (!photos[PHOTO_KEYS.MAIN]) {
      const oldPartnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
      if (oldPartnerPhoto) {
        photos[PHOTO_KEYS.MAIN] = oldPartnerPhoto;
      }
    }
    
    return photos;
  };

  // 辅助函数：准备API调用的照片参数
  const preparePhotoParams = (photos: Record<string, string | null>) => {
    const params: Record<string, string> = {};
    
    // 将照片数据映射到API参数
    Object.entries(photos).forEach(([key, value]) => {
      if (value && API_PHOTO_KEYS[key]) {
        params[API_PHOTO_KEYS[key]] = value;
      }
    });
    
    return params;
  };

  const expandImage = async (imageUrl: string): Promise<string> => {
    try {
      console.log('Starting image expansion for:', imageUrl);
      const { data, error } = await supabase.functions.invoke('expand-image', {
        body: { 
          imageUrl,
          textPrompt: "The expanded area should be: very clean with no objects and shapes; suitable for text placement(clean background); soft gradient background matching the original image tone; seamless transition"
        }
      });
      
      if (error) throw error;
      if (!data?.imageData) {
        throw new Error("No imageData returned from expand-image");
      }
      
      return data.imageData;
    } catch (err) {
      console.error("Error expanding image:", err);
      throw err;
    }
  };

  const handleGenericContentRegeneration = async (index: number, style?: string) => {
    if (index < 1) return;

    const stateSetters = {
      1: setContentImage1,
      2: setContentImage2,
      3: setContentImage3,
      4: setContentImage4,
      5: setContentImage5,
      6: setContentImage6,
      7: setContentImage7,
      8: setContentImage8,
      9: setContentImage9,
      10: setContentImage10
    };

    const loadingSetters = {
      1: setIsGeneratingContent1,
      2: setIsGeneratingContent2,
      3: setIsGeneratingContent3,
      4: setIsGeneratingContent4, 
      5: setIsGeneratingContent5,
      6: setIsGeneratingContent6,
      7: setIsGeneratingContent7,
      8: setIsGeneratingContent8,
      9: setIsGeneratingContent9,
      10: setIsGeneratingContent10
    };

    const setContentFn = stateSetters[index as keyof typeof stateSetters];
    const setIsGenerating = loadingSetters[index as keyof typeof loadingSetters];
    if (!setContentFn || !setIsGenerating) return;

    const lsKey = `loveStoryContentImage${index}`;
    // Remove from IndexedDB instead of localStorage
    await removeData(lsKey);

    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    
    // 获取所有角色照片，而不是仅获取主照片
    const characterPhotos = await getAllCharacterPhotos();
    const mainPhoto = characterPhotos[PHOTO_KEYS.MAIN];
    
    if (!savedPrompts || !mainPhoto) {
      toast({
        title: "Missing info",
        description: "No prompts or character photo found",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prompts = JSON.parse(savedPrompts);
      const promptIndex = index + 1;
      if (!prompts[promptIndex]) {
        throw new Error(`No prompt found for content index ${promptIndex}`);
      }
      
      // Use the provided style or fall back to the stored/default style
      const imageStyle = style || selectedStyle;
      
      // Update the stored style if a new one is provided
      if (style) {
        setSelectedStyle(style);
        localStorage.setItem('loveStoryStyle', style);
      }

      // 准备API调用的照片参数
      const photoParams = preparePhotoParams(characterPhotos);

      // Include style and all available photos in the request
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: { 
          prompt: prompts[promptIndex].prompt,
          ...photoParams,  // 使用展开运算符添加所有照片参数
          style: imageStyle
        }
      });
      if (error) throw error;

      // 后端可能返回 { output: [...]} 或 { contentImageX: [...] }
      const imageUrl = data?.[`contentImage${promptIndex}`]?.[0] || data?.output?.[0];
      if (!imageUrl) {
        throw new Error("No image generated from generate-love-cover");
      }

      // 2) 调用expand-image进行扩展
      const expandedBase64 = await expandImage(imageUrl);

      // 3) 存到state & IndexedDB (而不是localStorage)
      setContentFn(expandedBase64);
      await storeData(lsKey, expandedBase64);

      toast({
        title: "Image regenerated & expanded",
        description: `Content ${index} successfully updated with ${imageStyle} style`,
      });
    } catch (err: any) {
      console.error("Error in handleGenericContentRegeneration:", err);
      toast({
        title: "Error regenerating image",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateContent1 = (style?: string) => handleGenericContentRegeneration(1, style);
  const handleRegenerateContent2 = (style?: string) => handleGenericContentRegeneration(2, style);
  const handleRegenerateContent3 = (style?: string) => handleGenericContentRegeneration(3, style);
  const handleRegenerateContent4 = (style?: string) => handleGenericContentRegeneration(4, style);
  const handleRegenerateContent5 = (style?: string) => handleGenericContentRegeneration(5, style);
  const handleRegenerateContent6 = (style?: string) => handleGenericContentRegeneration(6, style);
  const handleRegenerateContent7 = (style?: string) => handleGenericContentRegeneration(7, style);
  const handleRegenerateContent8 = (style?: string) => handleGenericContentRegeneration(8, style);
  const handleRegenerateContent9 = (style?: string) => handleGenericContentRegeneration(9, style);
  const handleRegenerateContent10 = (style?: string) => handleGenericContentRegeneration(10, style);

  const generateInitialImages = async (prompts: string, characterPhoto: string) => {
    setIsGeneratingCover(true);
    setIsGeneratingIntro(true);
    toast({
      title: "Generating images",
      description: "This may take a minute...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: { 
          prompt: prompts, 
          contentPrompt: prompts,
          content2Prompt: prompts,
          photo: characterPhoto,
          style: selectedStyle
        }
      });

      if (error) throw error;

      if (data?.output?.[0]) {
        setCoverImage(data.output[0]);
        await storeData('loveStoryCoverImage', data.output[0]);
      }

      if (data?.contentImage?.[0]) {
        setIntroImage(data.contentImage[0]);
        await storeData('loveStoryIntroImage', data.contentImage[0]);
      }

      if (data?.contentImage2?.[0]) {
        setContentImage1(data.contentImage2[0]);
        await storeData('loveStoryContentImage1', data.contentImage2[0]);
      }

      toast({
        title: "Images generated",
        description: "Your images are ready!",
      });
    } catch (error) {
      console.error('Error generating images:', error);
      toast({
        title: "Error generating images",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCover(false);
      setIsGeneratingIntro(false);
    }
  };

  useEffect(() => {
    // First, attempt to migrate existing image data from localStorage to IndexedDB
    if (!migratedToIndexedDB) {
      migrateImagesToIndexedDB();
    }

    const loadData = async () => {
      const savedAuthor = localStorage.getItem('loveStoryAuthorName');
      const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
      const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
      const savedMoments = localStorage.getItem('loveStoryMoments');
      const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
      const savedStyle = localStorage.getItem('loveStoryStyle');
      const savedTexts = localStorage.getItem('loveStoryImageTexts');
      
      // Load images from IndexedDB
      const savedCoverImage = await getDataFromStore('loveStoryCoverImage');
      const savedIntroImage = await getDataFromStore('loveStoryIntroImage');
      const savedContentImage1 = await getDataFromStore('loveStoryContentImage1');
      const savedContentImage2 = await getDataFromStore('loveStoryContentImage2');
      const savedContentImage3 = await getDataFromStore('loveStoryContentImage3');
      const savedContentImage4 = await getDataFromStore('loveStoryContentImage4');
      const savedContentImage5 = await getDataFromStore('loveStoryContentImage5');
      const savedContentImage6 = await getDataFromStore('loveStoryContentImage6');
      const savedContentImage7 = await getDataFromStore('loveStoryContentImage7');
      const savedContentImage8 = await getDataFromStore('loveStoryContentImage8');
      const savedContentImage9 = await getDataFromStore('loveStoryContentImage9');
      const savedContentImage10 = await getDataFromStore('loveStoryContentImage10');
      const characterPhoto = localStorage.getItem('loveStoryCharacterPhoto');
      
      // Ensure we have a recipient name stored
      const savedQuestions = localStorage.getItem('loveStoryQuestions');
      if (savedQuestions) {
        try {
          const questions = JSON.parse(savedQuestions);
          const nameQuestion = questions.find((q: any) => 
            q.question.toLowerCase().includes('name') && 
            !q.question.toLowerCase().includes('your name')
          );
          
          if (nameQuestion && nameQuestion.answer) {
            localStorage.setItem('loveStoryRecipientName', nameQuestion.answer);
          }
        } catch (error) {
          console.error('Error parsing questions:', error);
        }
      }

      if (savedAuthor) {
        setAuthorName(savedAuthor);
      }

      if (savedStyle) {
        // Map old style names to new API-compatible style names
        const styleMapping: Record<string, string> = {
          'Comic Book': 'Comic book',
          'Line Art': 'Line art',
          'Fantasy Art': 'Fantasy art',
          'Photographic': 'Photographic (Default)',
          'Cinematic': 'Cinematic'
        };
        
        // Use the mapping or the original value
        const normalizedStyle = styleMapping[savedStyle] || savedStyle;
        setSelectedStyle(normalizedStyle);
        
        // Update localStorage with the normalized style if it changed
        if (normalizedStyle !== savedStyle) {
          localStorage.setItem('loveStoryStyle', normalizedStyle);
        }
      }

      if (savedTexts) {
        try {
          setImageTexts(JSON.parse(savedTexts));
        } catch (error) {
          console.error('Error parsing saved texts:', error);
        }
      }

      if (savedIdeas && savedIdeaIndex) {
        const ideas = JSON.parse(savedIdeas);
        const selectedIdea = ideas[parseInt(savedIdeaIndex)];
        if (selectedIdea) {
          setCoverTitle(selectedIdea.title || '');
          setSubtitle(selectedIdea.description || '');
        }
      }

      if (savedMoments) {
        const moments = JSON.parse(savedMoments);
        const formattedMoments = moments
          .map((moment: string) => `"${moment}"`)
          .join('\n\n');
        setBackCoverText(formattedMoments);
      }

      if (savedCoverImage) {
        setCoverImage(savedCoverImage);
      }
      if (savedIntroImage) {
        setIntroImage(savedIntroImage);
      }
      if (savedContentImage1) {
        setContentImage1(savedContentImage1);
      }
      if (savedContentImage2) {
        setContentImage2(savedContentImage2);
      }
      if (savedContentImage3) {
        setContentImage3(savedContentImage3);
      }
      if (savedContentImage4) {
        setContentImage4(savedContentImage4);
      }
      if (savedContentImage5) {
        setContentImage5(savedContentImage5);
      }
      if (savedContentImage6) {
        setContentImage6(savedContentImage6);
      }
      if (savedContentImage7) {
        setContentImage7(savedContentImage7);
      }
      if (savedContentImage8) {
        setContentImage8(savedContentImage8);
      }
      if (savedContentImage9) {
        setContentImage9(savedContentImage9);
      }
      if (savedContentImage10) {
        setContentImage10(savedContentImage10);
      }

      // Temporarily commented out for testing purposes
      // if ((!savedCoverImage || !savedIntroImage || !savedContentImage1) && savedPrompts && characterPhoto) {
      //   generateInitialImages(savedPrompts, characterPhoto);
      // }
    };
    
    loadData();
  }, [migratedToIndexedDB]);

  const handleEditCover = () => {
    toast({
      title: "Edit Cover",
      description: "Opening cover editor..."
    });
  };

  const handleEditText = () => {
    toast({
      title: "Edit Text",
      description: "Opening text editor..."
    });
  };

  const handleRegenerateCover = async (style?: string) => {
    // Remove from IndexedDB instead of localStorage
    await removeData('loveStoryCoverImage');
    
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    
    // 获取所有角色照片
    const characterPhotos = await getAllCharacterPhotos();
    const mainPhoto = characterPhotos[PHOTO_KEYS.MAIN];
    
    if (savedPrompts && mainPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 0) {
        setIsGeneratingCover(true);
        
        // Use the provided style or fall back to the stored/default style
        const imageStyle = style || selectedStyle;
        
        // Update the stored style if a new one is provided
        if (style) {
          setSelectedStyle(style);
          localStorage.setItem('loveStoryStyle', style);
        }
        
        try {
          // 准备API调用的照片参数
          const photoParams = preparePhotoParams(characterPhotos);
          
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { 
              // coverImage对应prompts中的索引0
              prompt: prompts[0].prompt,
              ...photoParams,  // 使用展开运算符添加所有照片参数
              style: imageStyle
            }
          });
          if (error) throw error;
          
          // Backend might return result in output or coverImage field
          const imageUrl = data?.output?.[0] || data?.coverImage?.[0];
          if (!imageUrl) {
            throw new Error("No image generated from generate-love-cover");
          }
          
          // 调用expand-image进行扩展
          const expandedBase64 = await expandImage(imageUrl);
          
          setCoverImage(expandedBase64);
          await storeData('loveStoryCoverImage', expandedBase64);
          
          toast({
            title: "Cover regenerated",
            description: `Cover updated with ${imageStyle} style`,
          });
        } catch (error) {
          console.error('Error regenerating cover:', error);
          toast({
            title: "Error regenerating cover",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingCover(false);
        }
      }
    }
  };

  const handleRegenerateIntro = async (style?: string) => {
    // Remove from IndexedDB instead of localStorage
    await removeData('loveStoryIntroImage');
    
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    
    // 获取所有角色照片
    const characterPhotos = await getAllCharacterPhotos();
    const mainPhoto = characterPhotos[PHOTO_KEYS.MAIN];
    
    if (savedPrompts && mainPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 1) {
        setIsGeneratingIntro(true);
        
        // Use the provided style or fall back to the stored/default style
        const imageStyle = style || selectedStyle;
        
        // Update the stored style if a new one is provided
        if (style) {
          setSelectedStyle(style);
          localStorage.setItem('loveStoryStyle', style);
        }
        
        try {
          // 准备API调用的照片参数
          const photoParams = preparePhotoParams(characterPhotos);
          
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { 
              // introImage对应prompts中的索引1
              prompt: prompts[1].prompt, 
              ...photoParams,  // 使用展开运算符添加所有照片参数
              style: imageStyle
            }
          });
          if (error) throw error;
          if (data?.contentImage?.[0] || data?.output?.[0]) {
            const imageUrl = data?.contentImage?.[0] || data?.output?.[0];
            // 调用expand-image进行扩展
            const expandedBase64 = await expandImage(imageUrl);
            
            setIntroImage(expandedBase64);
            // Store in IndexedDB instead of localStorage
            await storeData('loveStoryIntroImage', expandedBase64);
            
            toast({
              title: "Image regenerated",
              description: `Introduction image updated with ${imageStyle} style`,
            });
          }
        } catch (error) {
          console.error('Error regenerating intro image:', error);
          toast({
            title: "Error regenerating image",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingIntro(false);
        }
      }
    }
  };

  // Render content images with text inside the canvas
  const renderContentImage = (imageIndex: number) => {
    const imageStateMap: Record<number, string | undefined> = {
      0: introImage,
      1: contentImage1,
      2: contentImage2,
      3: contentImage3,
      4: contentImage4,
      5: contentImage5,
      6: contentImage6,
      7: contentImage7,
      8: contentImage8,
      9: contentImage9,
      10: contentImage10,
    };
    
    const loadingStateMap: Record<number, boolean> = {
      0: isGeneratingIntro,
      1: isGeneratingContent1,
      2: isGeneratingContent2,
      3: isGeneratingContent3,
      4: isGeneratingContent4, 
      5: isGeneratingContent5,
      6: isGeneratingContent6,
      7: isGeneratingContent7,
      8: isGeneratingContent8,
      9: isGeneratingContent9,
      10: isGeneratingContent10,
    };
    
    const handleRegenerateMap: Record<number, (style?: string) => void> = {
      0: handleRegenerateIntro,
      1: handleRegenerateContent1,
      2: handleRegenerateContent2,
      3: handleRegenerateContent3,
      4: handleRegenerateContent4,
      5: handleRegenerateContent5,
      6: handleRegenerateContent6,
      7: handleRegenerateContent7,
      8: handleRegenerateContent8,
      9: handleRegenerateContent9,
      10: handleRegenerateContent10,
    };
    
    const image = imageStateMap[imageIndex];
    const isLoading = loadingStateMap[imageIndex];
    const handleRegenerate = handleRegenerateMap[imageIndex];
    // Get the text for this image, adjusting for zero-based array index
    const imageText = imageTexts && imageTexts.length > imageIndex ? imageTexts[imageIndex] : null;
    
    // 显示标题适配新的命名方式
    let title = imageIndex === 0 ? "Introduction" : `Moment ${imageIndex}`;
    
    return (
      <div className="mb-10">
        <ContentImageCard 
          image={image} 
          isGenerating={isLoading}
          onRegenerate={handleRegenerate}
          index={imageIndex}
          onEditText={() => {}}
          text={imageText?.text}
          title={title}
        />
      </div>
    );
  };

  return (
    <WizardStep
      title="Your Love Story Images"
      description="Here are your personalized love story images with accompanying text."
      previousStep="/create/love/love-story/moments"
      nextStep="/create/love/love-story/preview"
      currentStep={4}
      totalSteps={4}
    >
      <div className="max-w-5xl mx-auto">
        {/* Cover section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Cover</h2>
          <CoverPreviewCard 
            coverImage={coverImage}
            coverTitle={coverTitle}
            subtitle={subtitle}
            authorName={authorName}
            backCoverText={backCoverText}
            isGeneratingCover={isGeneratingCover}
            onRegenerateCover={handleRegenerateCover}
            onEditCover={() => {}}
          />
        </div>
        
        <h2 className="text-2xl font-bold mb-6">Story Images with Text</h2>
        <div className="space-y-8">
          {/* 渲染介绍图片和内容图片 */}
          {renderContentImage(0)} {/* 介绍图片 */}
          {renderContentImage(1)}
          {renderContentImage(2)}
          {renderContentImage(3)}
          {renderContentImage(4)}
          {renderContentImage(5)}
          {renderContentImage(6)}
          {renderContentImage(7)}
          {renderContentImage(8)}
          {renderContentImage(9)}
          {renderContentImage(10)}
        </div>
      </div>
    </WizardStep>
  );
};

export default GenerateStep;
