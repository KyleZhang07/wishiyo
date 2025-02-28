
import { useState, useEffect, useCallback } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CoverPreviewCard } from './components/CoverPreviewCard';
import { ContentImageCard } from './components/ContentImageCard';
import { uploadImage, getImageUrl, deleteImage } from '@/utils/supabaseStorage';

interface ImageText {
  text: string;
  tone: string;
}

// 定义图片键
const IMAGE_KEYS = [
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
  'loveStoryContentImage10',
  'loveStoryInputImage2',
  'loveStoryInputImage3',
  'loveStoryInputImage4'
];

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

  // 额外的输入图片（从 MomentsStep）
  const [inputImage2, setInputImage2] = useState<string>();
  const [inputImage3, setInputImage3] = useState<string>();
  const [inputImage4, setInputImage4] = useState<string>();

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
  const [dataInitialized, setDataInitialized] = useState(false);

  const { toast } = useToast();

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

  // 保存图片到 Supabase 存储
  const saveImageToStorage = useCallback(async (key: string, imageData: string): Promise<string | null> => {
    try {
      console.log(`Saving image with key ${key} to Supabase...`);
      const imageUrl = await uploadImage(key, imageData);
      console.log(`Successfully saved image with key ${key} to Supabase: ${imageUrl}`);
      return imageUrl;
    } catch (error) {
      console.error(`Error saving image with key ${key} to Supabase:`, error);
      toast({
        title: "Storage Error",
        description: "Unable to save generated image to storage.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  // 从 Supabase 存储加载图片
  const loadImageFromStorage = useCallback(async (key: string): Promise<string | undefined> => {
    try {
      console.log(`Loading image with key ${key} from Supabase...`);
      const imageUrl = await getImageUrl(key);
      
      if (imageUrl) {
        console.log(`Found image with key ${key} in Supabase: ${imageUrl}`);
        return imageUrl;
      }
      
      console.log(`No image found with key ${key} in Supabase`);
      return undefined;
    } catch (error) {
      console.error(`Error loading image with key ${key} from Supabase:`, error);
      return undefined;
    }
  }, []);

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

    const imageKey = `loveStoryContentImage${index}`;
    
    // 删除旧图片
    try {
      await deleteImage(imageKey);
    } catch (error) {
      console.error(`Error removing old image with key ${imageKey}:`, error);
      // 继续执行，因为我们会替换它
    }

    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const characterPhoto = localStorage.getItem('loveStoryCharacterPhoto');
    if (!savedPrompts || !characterPhoto) {
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
      
      // 使用提供的样式或回退到存储的默认样式
      const imageStyle = style || selectedStyle;
      
      // 如果提供了新样式，则更新存储的样式
      if (style) {
        setSelectedStyle(style);
        localStorage.setItem('loveStoryStyle', style);
      }

      // 准备请求体，包含额外的图片（如果有）
      const requestBody: any = { 
        prompt: prompts[promptIndex].prompt,
        photo: characterPhoto,
        style: imageStyle
      };
      
      // 添加额外的输入图片（如果有）
      if (inputImage2) requestBody.input_image2 = inputImage2;
      if (inputImage3) requestBody.input_image3 = inputImage3;
      if (inputImage4) requestBody.input_image4 = inputImage4;

      // 包含样式在请求中
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: requestBody
      });
      if (error) throw error;

      // 后端可能返回不同的输出格式
      const imageUrl = data?.[`contentImage${promptIndex}`]?.[0] || data?.output?.[0];
      if (!imageUrl) {
        throw new Error("No image generated from generate-love-cover");
      }

      // 扩展图片
      const expandedBase64 = await expandImage(imageUrl);

      // 设置状态以立即显示
      setContentFn(expandedBase64);
      
      // 存储到 Supabase
      await saveImageToStorage(imageKey, expandedBase64);

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
      // 准备请求体，包含额外的图片（如果有）
      const requestBody: any = { 
        prompt: prompts, 
        contentPrompt: prompts,
        content2Prompt: prompts,
        photo: characterPhoto,
        style: selectedStyle
      };
      
      // 添加额外的输入图片（如果有）
      if (inputImage2) requestBody.input_image2 = inputImage2;
      if (inputImage3) requestBody.input_image3 = inputImage3;
      if (inputImage4) requestBody.input_image4 = inputImage4;

      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: requestBody
      });

      if (error) throw error;

      if (data?.output?.[0]) {
        setCoverImage(data.output[0]);
        await saveImageToStorage('loveStoryCoverImage', data.output[0]);
      }

      if (data?.contentImage?.[0]) {
        setIntroImage(data.contentImage[0]);
        await saveImageToStorage('loveStoryIntroImage', data.contentImage[0]);
      }

      if (data?.contentImage2?.[0]) {
        setContentImage1(data.contentImage2[0]);
        await saveImageToStorage('loveStoryContentImage1', data.contentImage2[0]);
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

  // 组件挂载时加载所有数据
  useEffect(() => {
    const loadData = async () => {
      console.log("Loading love story data...");
      
      const savedAuthor = localStorage.getItem('loveStoryAuthorName');
      const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
      const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
      const savedMoments = localStorage.getItem('loveStoryMoments');
      const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
      const savedStyle = localStorage.getItem('loveStoryStyle');
      const savedTexts = localStorage.getItem('loveStoryImageTexts');
      
      // 从 Supabase 存储加载图片
      const savedCoverImage = await loadImageFromStorage('loveStoryCoverImage');
      const savedIntroImage = await loadImageFromStorage('loveStoryIntroImage');
      const savedContentImage1 = await loadImageFromStorage('loveStoryContentImage1');
      const savedContentImage2 = await loadImageFromStorage('loveStoryContentImage2');
      const savedContentImage3 = await loadImageFromStorage('loveStoryContentImage3');
      const savedContentImage4 = await loadImageFromStorage('loveStoryContentImage4');
      const savedContentImage5 = await loadImageFromStorage('loveStoryContentImage5');
      const savedContentImage6 = await loadImageFromStorage('loveStoryContentImage6');
      const savedContentImage7 = await loadImageFromStorage('loveStoryContentImage7');
      const savedContentImage8 = await loadImageFromStorage('loveStoryContentImage8');
      const savedContentImage9 = await loadImageFromStorage('loveStoryContentImage9');
      const savedContentImage10 = await loadImageFromStorage('loveStoryContentImage10');
      
      // 加载额外的输入图片
      const savedInputImage2 = await loadImageFromStorage('loveStoryInputImage2');
      const savedInputImage3 = await loadImageFromStorage('loveStoryInputImage3');
      const savedInputImage4 = await loadImageFromStorage('loveStoryInputImage4');
      
      const characterPhoto = localStorage.getItem('loveStoryCharacterPhoto');
      
      // 确保我们有存储的收件人姓名
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
        // 将旧样式名称映射到新的 API 兼容样式名称
        const styleMapping: Record<string, string> = {
          'Comic Book': 'Comic book',
          'Line Art': 'Line art',
          'Fantasy Art': 'Fantasy art',
          'Photographic': 'Photographic (Default)',
          'Cinematic': 'Cinematic'
        };
        
        // 使用映射或原始值
        const normalizedStyle = styleMapping[savedStyle as string] || savedStyle;
        setSelectedStyle(normalizedStyle);
        
        // 如果样式有变化，则更新 localStorage
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
        try {
          const ideas = JSON.parse(savedIdeas);
          const selectedIdea = ideas[parseInt(savedIdeaIndex)];
          if (selectedIdea) {
            setCoverTitle(selectedIdea.title || '');
            setSubtitle(selectedIdea.description || '');
          }
        } catch (error) {
          console.error('Error parsing saved ideas:', error);
        }
      }

      if (savedMoments) {
        try {
          const moments = JSON.parse(savedMoments);
          const formattedMoments = moments
            .map((moment: string) => `"${moment}"`)
            .join('\n\n');
          setBackCoverText(formattedMoments);
        } catch (error) {
          console.error('Error parsing saved moments:', error);
        }
      }

      // 设置主要内容图片
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

      // 设置额外的输入图片
      if (savedInputImage2) {
        setInputImage2(savedInputImage2);
      }
      if (savedInputImage3) {
        setInputImage3(savedInputImage3);
      }
      if (savedInputImage4) {
        setInputImage4(savedInputImage4);
      }

      // 如果需要，生成初始图片
      if ((!savedCoverImage || !savedIntroImage || !savedContentImage1) && savedPrompts && characterPhoto) {
        generateInitialImages(savedPrompts, characterPhoto);
      }

      setDataInitialized(true);
    };
    
    loadData();
  }, [loadImageFromStorage, saveImageToStorage]);

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
    // 删除旧图片
    try {
      await deleteImage('loveStoryCoverImage');
    } catch (error) {
      console.error("Error removing cover image:", error);
      // 继续执行，因为我们会替换它
    }
    
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const characterPhoto = localStorage.getItem('loveStoryCharacterPhoto');
    if (savedPrompts && characterPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 0) {
        setIsGeneratingCover(true);
        
        // 使用提供的样式或回退到存储的默认样式
        const imageStyle = style || selectedStyle;
        
        // 如果提供了新样式，则更新存储的样式
        if (style) {
          setSelectedStyle(style);
          localStorage.setItem('loveStoryStyle', style);
        }
        
        try {
          // 准备请求体，包含额外的图片（如果有）
          const requestBody: any = { 
            // coverImage 对应 prompts 中的索引 0
            prompt: prompts[0].prompt,
            photo: characterPhoto,
            style: imageStyle
          };
          
          // 添加额外的输入图片（如果有）
          if (inputImage2) requestBody.input_image2 = inputImage2;
          if (inputImage3) requestBody.input_image3 = inputImage3;
          if (inputImage4) requestBody.input_image4 = inputImage4;

          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: requestBody
          });
          if (error) throw error;
          
          // 后端可能在 output 或 coverImage 字段中返回结果
          const imageUrl = data?.output?.[0] || data?.coverImage?.[0];
          if (!imageUrl) {
            throw new Error("No image generated from generate-love-cover");
          }
          
          // 扩展图片
          const expandedBase64 = await expandImage(imageUrl);
          
          // 设置状态以立即显示
          setCoverImage(expandedBase64);
          
          // 持久存储
          await saveImageToStorage('loveStoryCoverImage', expandedBase64);
          
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
    // 删除旧图片
    try {
      await deleteImage('loveStoryIntroImage');
    } catch (error) {
      console.error("Error removing intro image:", error);
      // 继续执行，因为我们会替换它
    }
    
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const characterPhoto = localStorage.getItem('loveStoryCharacterPhoto');
    if (savedPrompts && characterPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 1) {
        setIsGeneratingIntro(true);
        
        // 使用提供的样式或回退到存储的默认样式
        const imageStyle = style || selectedStyle;
        
        // 如果提供了新样式，则更新存储的样式
        if (style) {
          setSelectedStyle(style);
          localStorage.setItem('loveStoryStyle', style);
        }
        
        try {
          // 准备请求体，包含额外的图片（如果有）
          const requestBody: any = { 
            // introImage 对应 prompts 中的索引 1
            prompt: prompts[1].prompt, 
            photo: characterPhoto,
            style: imageStyle
          };
          
          // 添加额外的输入图片（如果有）
          if (inputImage2) requestBody.input_image2 = inputImage2;
          if (inputImage3) requestBody.input_image3 = inputImage3;
          if (inputImage4) requestBody.input_image4 = inputImage4;

          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: requestBody
          });
          if (error) throw error;
          
          // 后端可能在不同字段中返回数据
          const imageUrl = data?.contentImage?.[0] || data?.output?.[0];
          if (!imageUrl) {
            throw new Error("No image generated from generate-love-cover");
          }
          
          // 扩展图片
          const expandedBase64 = await expandImage(imageUrl);
          
          // 设置状态以立即显示
          setIntroImage(expandedBase64);
          
          // 持久存储
          await saveImageToStorage('loveStoryIntroImage', expandedBase64);
          
          toast({
            title: "Image regenerated",
            description: `Introduction image updated with ${imageStyle} style`,
          });
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

  // 渲染带有文本的内容图片到画布
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
    // 获取此图片的文本，调整为基于零的数组索引
    const imageText = imageTexts && imageTexts.length > imageIndex ? imageTexts[imageIndex] : null;
    
    // 显示标题适配不同的命名约定
    let title = imageIndex === 0 ? "Introduction" : `Moment ${imageIndex}`;
    
    return (
      <div className="mb-10">
        <ContentImageCard 
          image={image} 
          isGenerating={isLoading}
          onRegenerate={handleRegenerate}
          index={imageIndex}
          onEditText={handleEditText}
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
            onEditCover={handleEditCover}
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
