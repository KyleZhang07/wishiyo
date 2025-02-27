import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CoverPreviewCard } from './components/CoverPreviewCard';
import { ContentImageCard } from './components/ContentImageCard';

interface ImageText {
  text: string;
  tone: string;
}

const GenerateStep = () => {
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [backCoverText, setBackCoverText] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  
  // 更改名称 - 将 contentImage 改为 dedicationImage(献词页)
  const [dedicationImage, setDedicationImage] = useState<string>();
  
  // 重命名 contentImage2~11 为 contentImage1~10
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
  
  // 重命名 loading 状态变量
  const [isGeneratingDedication, setIsGeneratingDedication] = useState(false);
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

  // 修改通用内容重生成方法，调整索引映射逻辑
  const handleGenericContentRegeneration = async (index: number, style?: string) => {
    if (index < 1 || index > 10) return; // 现在索引1-10对应contentImage1-10

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

    // 更新localStorage键名，使用contentImage1-10
    const lsKey = `loveStoryContentImage${index}`;
    localStorage.removeItem(lsKey);

    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (!savedPrompts || !partnerPhoto) {
      toast({
        title: "Missing info",
        description: "No prompts or partner photo found",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prompts = JSON.parse(savedPrompts);
      // 调整索引映射，prompts索引需要加2，因为0是封面、1是献词页
      const promptIndex = index + 2;
      if (!prompts[promptIndex]) {
        throw new Error(`No prompt found for content index ${index} (prompt index ${promptIndex})`);
      }
      
      // Use the provided style or fall back to the stored/default style
      const imageStyle = style || selectedStyle;
      
      // Update the stored style if a new one is provided
      if (style) {
        setSelectedStyle(style);
        localStorage.setItem('loveStoryStyle', style);
      }

      // Include style in the request
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: { 
          prompt: prompts[promptIndex].prompt, 
          photo: partnerPhoto,
          style: imageStyle
        }
      });
      if (error) throw error;

      // 适配后端返回数据的键名
      // 注意：后端可能仍使用旧的命名约定(contentImage2-11)，需相应调整
      const oldIndex = index + 2; // 将新索引(1-10)转换为旧索引(3-12)用于API请求
      const imageUrl = data?.[`contentImage${oldIndex}`]?.[0] || data?.output?.[0];
      
      if (!imageUrl) {
        throw new Error("No image generated from generate-love-cover");
      }

      // 临时保存原始图片用于显示加载状态，但不保存到localStorage
      // 这确保了在扩展过程中有图片显示
      setContentFn(imageUrl);

      // 内容图片1-10需要执行扩展(对应旧的content2-11)
      try {
        // 调用expand-image进行扩展
        const expandedBase64 = await expandImage(imageUrl);

        // 将扩展后的图片更新到state & localStorage
        setContentFn(expandedBase64);
        localStorage.setItem(lsKey, expandedBase64);
        
        console.log(`Successfully saved expanded image for content${index} to localStorage`);
      } catch (expandError) {
        console.error(`Error expanding content image ${index}:`, expandError);
        // 如果扩展失败，移除原始图片的状态设置，确保不显示未扩展的图片
        localStorage.removeItem(lsKey);
        toast({
          title: "Image expansion failed",
          description: `Unable to expand content image ${index}. Please try regenerating.`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Image regenerated",
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

  // 更新重生成方法的名称和调用
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

  const generateInitialImages = async (prompts: string, partnerPhoto: string) => {
    setIsGeneratingCover(true);
    setIsGeneratingDedication(true);
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
          photo: partnerPhoto,
          style: selectedStyle
        }
      });

      if (error) throw error;

      if (data?.output?.[0]) {
        // 获取封面图片URL - 封面图片不需要扩展，直接保存
        const coverImageUrl = data.output[0];
        setCoverImage(coverImageUrl);
        localStorage.setItem('loveStoryCoverImage', coverImageUrl);
        console.log('Saved cover image to localStorage (no expansion needed)');
      }

      if (data?.contentImage?.[0]) {
        // 获取献词页图片URL - 献词页不需要扩展，直接保存
        const dedicationImageUrl = data.contentImage[0];
        setDedicationImage(dedicationImageUrl);
        localStorage.setItem('loveStoryDedicationImage', dedicationImageUrl);
        console.log('Saved dedication page image to localStorage (no expansion needed)');
      }

      if (data?.contentImage2?.[0]) {
        // 获取内容图片1 URL - 需要扩展(对应旧的content2)
        const contentImage1Url = data.contentImage2[0];
        
        // 临时显示原始图片以指示正在加载中
        setContentImage1(contentImage1Url);
        
        // 扩展内容图片1
        try {
          const expandedBase64 = await expandImage(contentImage1Url);
          // 更新状态和localStorage为扩展后的图片
          setContentImage1(expandedBase64);
          localStorage.setItem('loveStoryContentImage1', expandedBase64);
          console.log('Saved expanded content image 1 to localStorage');
        } catch (expandError) {
          console.error('Error expanding content image 1:', expandError);
          // 如果扩展失败，清除状态和localStorage，确保不显示原始图片
          setContentImage1(undefined);
          localStorage.removeItem('loveStoryContentImage1');
          toast({
            title: "Image expansion failed",
            description: "Unable to expand content image 1. Please try regenerating.",
            variant: "destructive",
          });
        }
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
      setIsGeneratingDedication(false);
    }
  };

  useEffect(() => {
    const savedAuthor = localStorage.getItem('loveStoryAuthorName');
    const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
    const savedMoments = localStorage.getItem('loveStoryMoments');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const savedStyle = localStorage.getItem('loveStoryStyle');
    const savedTexts = localStorage.getItem('loveStoryImageTexts');
    
    // 加载图片 - 使用新的键名命名方式
    const savedCoverImage = localStorage.getItem('loveStoryCoverImage');
    
    // 检查新旧localStorage键，确保兼容性
    const savedDedicationImage = localStorage.getItem('loveStoryDedicationImage') || 
                               localStorage.getItem('loveStoryContentImage'); // 兼容旧键名

    // 使用新键名，但保持与旧键名的兼容性
    const savedContentImage1 = localStorage.getItem('loveStoryContentImage1') || 
                              localStorage.getItem('loveStoryContentImage2');
    const savedContentImage2 = localStorage.getItem('loveStoryContentImage2') || 
                              localStorage.getItem('loveStoryContentImage3');
    const savedContentImage3 = localStorage.getItem('loveStoryContentImage3') || 
                              localStorage.getItem('loveStoryContentImage4');
    const savedContentImage4 = localStorage.getItem('loveStoryContentImage4') || 
                              localStorage.getItem('loveStoryContentImage5');
    const savedContentImage5 = localStorage.getItem('loveStoryContentImage5') || 
                              localStorage.getItem('loveStoryContentImage6');
    const savedContentImage6 = localStorage.getItem('loveStoryContentImage6') || 
                              localStorage.getItem('loveStoryContentImage7');
    const savedContentImage7 = localStorage.getItem('loveStoryContentImage7') || 
                              localStorage.getItem('loveStoryContentImage8');
    const savedContentImage8 = localStorage.getItem('loveStoryContentImage8') || 
                              localStorage.getItem('loveStoryContentImage9');
    const savedContentImage9 = localStorage.getItem('loveStoryContentImage9') || 
                              localStorage.getItem('loveStoryContentImage10');
    const savedContentImage10 = localStorage.getItem('loveStoryContentImage10') || 
                               localStorage.getItem('loveStoryContentImage11');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    
    console.log('Loading images from localStorage...');
    console.log('Cover image exists:', !!savedCoverImage);
    console.log('Dedication image exists:', !!savedDedicationImage);
    console.log('Content image 1 exists:', !!savedContentImage1);
    console.log('Content image 2 exists:', !!savedContentImage2);
    console.log('Content image 3 exists:', !!savedContentImage3);
    console.log('Content image 4 exists:', !!savedContentImage4);
    console.log('Content image 5 exists:', !!savedContentImage5);
    console.log('Content image 6 exists:', !!savedContentImage6);
    console.log('Content image 7 exists:', !!savedContentImage7);
    console.log('Content image 8 exists:', !!savedContentImage8);
    console.log('Content image 9 exists:', !!savedContentImage9);
    console.log('Content image 10 exists:', !!savedContentImage10);
    
    // 确保我们存储了收件人姓名
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
      console.log('Loaded cover image from localStorage, length:', savedCoverImage.length);
    }
    if (savedDedicationImage) {
      setDedicationImage(savedDedicationImage);
      console.log('Loaded dedication image from localStorage, length:', savedDedicationImage.length);
      
      // 如果使用的是旧键名，迁移到新键名
      if(!localStorage.getItem('loveStoryDedicationImage') && localStorage.getItem('loveStoryContentImage')) {
        localStorage.setItem('loveStoryDedicationImage', savedDedicationImage);
      }
    }
    if (savedContentImage1) {
      setContentImage1(savedContentImage1);
      console.log('Loaded content image 1 from localStorage, length:', savedContentImage1.length);
      
      // 迁移数据
      if(!localStorage.getItem('loveStoryContentImage1') && localStorage.getItem('loveStoryContentImage2')) {
        localStorage.setItem('loveStoryContentImage1', savedContentImage1);
      }
    }
    if (savedContentImage2) {
      setContentImage2(savedContentImage2);
      console.log('Loaded content image 2 from localStorage, length:', savedContentImage2.length);
      
      // 迁移数据
      if(!localStorage.getItem('loveStoryContentImage2') && localStorage.getItem('loveStoryContentImage3')) {
        localStorage.setItem('loveStoryContentImage2', savedContentImage2);
      }
    }
    if (savedContentImage3) {
      setContentImage3(savedContentImage3);
      console.log('Loaded content image 3 from localStorage, length:', savedContentImage3.length);
      
      // 迁移数据
      if(!localStorage.getItem('loveStoryContentImage3') && localStorage.getItem('loveStoryContentImage4')) {
        localStorage.setItem('loveStoryContentImage3', savedContentImage3);
      }
    }
    if (savedContentImage4) {
      setContentImage4(savedContentImage4);
      console.log('Loaded content image 4 from localStorage, length:', savedContentImage4.length);
      
      // 迁移数据
      if(!localStorage.getItem('loveStoryContentImage4') && localStorage.getItem('loveStoryContentImage5')) {
        localStorage.setItem('loveStoryContentImage4', savedContentImage4);
      }
    }
    if (savedContentImage5) {
      setContentImage5(savedContentImage5);
      console.log('Loaded content image 5 from localStorage, length:', savedContentImage5.length);
      
      // 迁移数据
      if(!localStorage.getItem('loveStoryContentImage5') && localStorage.getItem('loveStoryContentImage6')) {
        localStorage.setItem('loveStoryContentImage5', savedContentImage5);
      }
    }
    if (savedContentImage6) {
      setContentImage6(savedContentImage6);
      console.log('Loaded content image 6 from localStorage, length:', savedContentImage6.length);
      
      // 迁移数据
      if(!localStorage.getItem('loveStoryContentImage6') && localStorage.getItem('loveStoryContentImage7')) {
        localStorage.setItem('loveStoryContentImage6', savedContentImage6);
      }
    }
    if (savedContentImage7) {
      setContentImage7(savedContentImage7);
      console.log('Loaded content image 7 from localStorage, length:', savedContentImage7.length);
      
      // 迁移数据
      if(!localStorage.getItem('loveStoryContentImage7') && localStorage.getItem('loveStoryContentImage8')) {
        localStorage.setItem('loveStoryContentImage7', savedContentImage7);
      }
    }
    if (savedContentImage8) {
      setContentImage8(savedContentImage8);
      console.log('Loaded content image 8 from localStorage, length:', savedContentImage8.length);
      
      // 迁移数据
      if(!localStorage.getItem('loveStoryContentImage8') && localStorage.getItem('loveStoryContentImage9')) {
        localStorage.setItem('loveStoryContentImage8', savedContentImage8);
      }
    }
    if (savedContentImage9) {
      setContentImage9(savedContentImage9);
      console.log('Loaded content image 9 from localStorage, length:', savedContentImage9.length);
      
      // 迁移数据
      if(!localStorage.getItem('loveStoryContentImage9') && localStorage.getItem('loveStoryContentImage10')) {
        localStorage.setItem('loveStoryContentImage9', savedContentImage9);
      }
    }
    if (savedContentImage10) {
      setContentImage10(savedContentImage10);
      console.log('Loaded content image 10 from localStorage, length:', savedContentImage10.length);
      
      // 迁移数据
      if(!localStorage.getItem('loveStoryContentImage10') && localStorage.getItem('loveStoryContentImage11')) {
        localStorage.setItem('loveStoryContentImage10', savedContentImage10);
      }
    }

    // Temporarily commented out for testing purposes
    // if ((!savedCoverImage || !savedDedicationImage || !savedContentImage1) && savedPrompts && partnerPhoto) {
    //   generateInitialImages(savedPrompts, partnerPhoto);
    // }
  }, []);

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
    localStorage.removeItem('loveStoryCoverImage');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
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
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { 
              prompt: prompts[0].prompt, 
              photo: partnerPhoto,
              style: imageStyle
            }
          });
          if (error) throw error;
          if (data?.output?.[0]) {
            setCoverImage(data.output[0]);
            localStorage.setItem('loveStoryCoverImage', data.output[0]);
            
            toast({
              title: "Cover image regenerated",
              description: `Cover updated with ${imageStyle} style`,
            });
          }
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

  // 更新为新的函数名 handleRegenerateDedication
  const handleRegenerateDedication = async (style?: string) => {
    localStorage.removeItem('loveStoryDedicationImage');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 1) {
        setIsGeneratingDedication(true);
        
        // Use the provided style or fall back to the stored/default style
        const imageStyle = style || selectedStyle;
        
        // Update the stored style if a new one is provided
        if (style) {
          setSelectedStyle(style);
          localStorage.setItem('loveStoryStyle', style);
        }
        
        try {
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { 
              contentPrompt: prompts[1].prompt, 
              photo: partnerPhoto,
              style: imageStyle
            }
          });
          if (error) throw error;
          if (data?.contentImage?.[0]) {
            // 获取图片URL - 献词页不需要扩展，直接保存
            const imageUrl = data.contentImage[0];
            setDedicationImage(imageUrl);
            localStorage.setItem('loveStoryDedicationImage', imageUrl);
            console.log('Saved dedication image to localStorage (no expansion needed)');
            
            toast({
              title: "Image regenerated",
              description: `Dedication page updated with ${imageStyle} style`,
            });
          }
        } catch (error) {
          console.error('Error regenerating dedication image:', error);
          toast({
            title: "Error regenerating image",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingDedication(false);
        }
      }
    }
  };

  // 更新渲染图片的方法
  const renderImages = () => {
    return (
      <>
        {/* 献词页 */}
        <div className="mb-10">
          <h3 className="text-xl font-semibold mb-2">Dedication Page</h3>
          <ContentImageCard 
            image={dedicationImage} 
            isGenerating={isGeneratingDedication}
            onRegenerate={handleRegenerateDedication}
            index={0} // 使用特殊索引0表示献词页
            onEditText={() => {}}
            text={imageTexts && imageTexts.length > 0 ? imageTexts[0]?.text : null}
          />
        </div>

        {/* 内容图片1-10 */}
        {Array.from({ length: 10 }).map((_, idx) => {
          const imageIndex = idx + 1; // 从1开始
          const imageStateMap: Record<number, string | undefined> = {
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
          // 获取此图片的文本，调整索引以匹配
          const imageText = imageTexts && imageTexts.length > imageIndex ? imageTexts[imageIndex] : null;
          
          return (
            <div key={imageIndex} className="mb-10">
              <h3 className="text-xl font-semibold mb-2">Story Page {imageIndex}</h3>
              <ContentImageCard 
                image={image} 
                isGenerating={isLoading}
                onRegenerate={handleRegenerate}
                index={imageIndex}
                onEditText={() => {}}
                text={imageText?.text}
              />
            </div>
          );
        })}
      </>
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
        {/* 生成所有图片的按钮 */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Image Generation</h2>
          <p className="text-sm text-gray-500 mb-4">If your images are missing after refresh, click the button below to generate all images.</p>
          <Button 
            variant="default" 
            className="w-full"
            onClick={() => {
              const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
              const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
              if (savedPrompts && partnerPhoto) {
                // 生成封面和献词页
                generateInitialImages(savedPrompts, partnerPhoto);
                
                // 生成内容图片1-10
                for(let i = 1; i <= 10; i++) {
                  handleGenericContentRegeneration(i);
                }
                
                toast({
                  title: "Generating all images",
                  description: "This may take a minute...",
                });
              } else {
                toast({
                  title: "Missing info",
                  description: "No prompts or partner photo found",
                  variant: "destructive",
                });
              }
            }}
          >
            Generate All Missing Images
          </Button>
        </div>

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
          {/* 渲染所有图片 */}
          {renderImages()}
        </div>
      </div>
    </WizardStep>
  );
};

export default GenerateStep;
