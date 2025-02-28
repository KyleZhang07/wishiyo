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

  const { toast } = useToast();

  const expandImage = async (imageUrl: string): Promise<string> => {
    try {
      console.log('🔄 开始扩展图片，原图URL长度:', imageUrl.length);
      console.log('🔍 原图URL前缀:', imageUrl.substring(0, 50) + '...');
      
      const { data, error } = await supabase.functions.invoke('expand-image', {
        body: { 
          imageUrl,
          textPrompt: "The expanded area should be: very clean with no objects and shapes; suitable for text placement(clean background); soft gradient background matching the original image tone; seamless transition"
        }
      });
      
      if (error) {
        console.error('❌ 扩展图片API错误:', error);
        throw error;
      }
      
      if (!data?.imageData) {
        console.error('❌ 扩展API没有返回imageData');
        throw new Error("No imageData returned from expand-image");
      }
      
      const expandedImageSize = data.imageData.length;
      console.log(`✅ 扩展图片成功，新图片大小: ${Math.round(expandedImageSize / 1024)} KB`);
      console.log('🔍 扩展图片前缀:', data.imageData.substring(0, 50) + '...');
      
      // 验证是否是有效的Base64图片
      const isValidBase64 = data.imageData.startsWith('data:image');
      console.log(`🔍 扩展后图片是否有效Base64: ${isValidBase64}`);
      
      if (!isValidBase64) {
        console.warn('⚠️ 扩展后的图片不是有效的Base64格式，可能导致显示问题');
        // 如果缺少前缀，尝试添加
        if (!data.imageData.startsWith('data:')) {
          console.log('🔧 尝试修复Base64前缀...');
          return 'data:image/jpeg;base64,' + data.imageData;
        }
      }
      
      return data.imageData;
    } catch (err) {
      console.error("❌ 扩展图片过程中出错:", err);
      throw err;
    }
  };

  // 统一的localStorage键名常量，避免拼写错误
  const LS_KEYS = {
    COVER_IMAGE: 'loveStoryCoverImage',
    INTRO_IMAGE: 'loveStoryIntroImage',
    CONTENT_IMAGE_PREFIX: 'loveStoryContentImage',
    AUTHOR_NAME: 'loveStoryAuthorName',
    STYLE: 'loveStoryStyle',
    PROMPTS: 'loveStoryImagePrompts',
    PARTNER_PHOTO: 'loveStoryPartnerPhoto',
    IMAGE_TEXTS: 'loveStoryImageTexts'
  };

  // 简化的保存图片到localStorage的函数
  const saveImageToStorage = (key: string, imageData: string) => {
    try {
      // 检查图片数据大小
      const sizeInKB = Math.round(imageData.length / 1024);
      console.log(`💾 尝试保存图片到localStorage: ${key}, 大小: ${sizeInKB} KB`);
      
      // 检查是否是有效的Base64图片
      const isValidBase64 = imageData.startsWith('data:image');
      console.log(`🔍 是否有效的Base64图片: ${isValidBase64}`);
      
      if (!isValidBase64) {
        console.warn('❌ 无效的Base64图片数据，缺少data:image前缀');
      }
      
      // 保存前计算当前localStorage使用情况
      const totalStorageUsed = calculateStorageUsage();
      console.log(`📊 当前localStorage使用: ${totalStorageUsed.totalKB} KB, 项目数: ${totalStorageUsed.itemCount}`);
      
      localStorage.setItem(key, imageData);
      console.log(`✅ 已保存图片到localStorage: ${key}`);
      
      // 验证保存是否成功
      const savedItem = localStorage.getItem(key);
      if (savedItem) {
        console.log(`✅ 验证成功: 已找到保存的图片，大小: ${Math.round(savedItem.length / 1024)} KB`);
      } else {
        console.error(`❌ 验证失败: 图片似乎未成功保存`);
      }
    } catch (error) {
      console.error(`❌ 保存图片到localStorage失败: ${key}`, error);
      // 如果是配额错误，输出更多信息
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('💥 localStorage配额已满! 尝试清理一些数据');
        
        // 输出所有localStorage项及其大小
        const storageInfo = Object.keys(localStorage).map(k => ({
          key: k,
          size: Math.round((localStorage.getItem(k)?.length || 0) / 1024),
          preview: (localStorage.getItem(k)?.substring(0, 50) || '') + '...'
        }));
        console.table(storageInfo);
      }
    }
  };

  // 从localStorage加载图片的函数
  const loadImageFromStorage = (key: string): string | null => {
    try {
      console.log(`🔍 尝试加载图片: ${key}`);
      const image = localStorage.getItem(key);
      
      if (image) {
        const sizeInKB = Math.round(image.length / 1024);
        console.log(`✅ 已加载图片: ${key}, 大小: ${sizeInKB} KB`);
        
        // 检查是否是有效的Base64图片
        const isValidBase64 = image.startsWith('data:image');
        console.log(`🔍 ${key} 是否有效的Base64图片: ${isValidBase64}`);
        
        if (!isValidBase64) {
          console.warn(`❌ ${key} 数据无效，缺少data:image前缀，前50个字符: ${image.substring(0, 50)}...`);
        }
        
        return image;
      }
      
      console.log(`ℹ️ localStorage中没有图片: ${key}`);
      return null;
    } catch (error) {
      console.error(`❌ 加载图片失败: ${key}`, error);
      return null;
    }
  };
  
  // 计算localStorage使用情况
  const calculateStorageUsage = () => {
    try {
      let totalSize = 0;
      let itemCount = 0;
      let loveStorySize = 0;
      
      Object.keys(localStorage).forEach(key => {
        const value = localStorage.getItem(key);
        const size = value ? value.length : 0;
        totalSize += size;
        itemCount++;
        
        if (key.startsWith('loveStory')) {
          loveStorySize += size;
        }
      });
      
      return {
        totalBytes: totalSize,
        totalKB: Math.round(totalSize / 1024),
        totalMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
        loveStoryKB: Math.round(loveStorySize / 1024),
        itemCount
      };
    } catch (error) {
      console.error('计算localStorage使用情况失败', error);
      return { totalBytes: 0, totalKB: 0, totalMB: 0, loveStoryKB: 0, itemCount: 0 };
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

    // 使用常量定义的键名
    const lsKey = `${LS_KEYS.CONTENT_IMAGE_PREFIX}${index}`;
    
    // 删除现有的图片
    localStorage.removeItem(lsKey);

    const savedPrompts = localStorage.getItem(LS_KEYS.PROMPTS);
    const partnerPhoto = localStorage.getItem(LS_KEYS.PARTNER_PHOTO);
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
      if (!prompts[index+1]) {
        throw new Error(`No prompt found for content index ${index+1}`);
      }
      
      // Use the provided style or fall back to the stored/default style
      const imageStyle = style || selectedStyle;
      
      // Update the stored style if a new one is provided
      if (style) {
        setSelectedStyle(style);
        localStorage.setItem(LS_KEYS.STYLE, style);
      }

      // 简化的API请求
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: { 
          prompt: prompts[index+1].prompt,
          photo: partnerPhoto,
          style: imageStyle,
          contentIndex: index
        }
      });
      if (error) throw error;

      // 查找图片URL，尝试所有可能的响应格式
      let imageUrl = null;
      // 1. 检查output字段
      if (data?.output?.[0]) {
        imageUrl = data.output[0];
      } 
      // 2. 检查contentImage字段
      else if (data?.[`contentImage${index}`]?.[0]) {
        imageUrl = data[`contentImage${index}`][0];
      }
      // 3. 检查contentImage{index+1}字段
      else if (data?.[`contentImage${index+1}`]?.[0]) {
        imageUrl = data[`contentImage${index+1}`][0];
      }
      
      if (!imageUrl) {
        throw new Error("No image generated from API");
      }

      // Content images需要扩展处理
      console.log(`Expanding content image ${index}...`);
      const expandedBase64 = await expandImage(imageUrl);
      
      // 1. 更新状态
      setContentFn(expandedBase64);
      
      // 2. 保存到localStorage
      saveImageToStorage(lsKey, expandedBase64);

      toast({
        title: "Image regenerated & expanded",
        description: `Moment ${index} successfully updated with ${imageStyle} style`,
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

  const generateInitialImages = async (prompts: string, partnerPhoto: string) => {
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
          photo: partnerPhoto,
          style: selectedStyle
        }
      });

      if (error) throw error;

      // 处理Cover Image - 直接保存，不需要扩展
      if (data?.output?.[0]) {
        const coverImg = data.output[0];
        setCoverImage(coverImg);
        saveImageToStorage(LS_KEYS.COVER_IMAGE, coverImg);
      }

      // 处理Intro Image - 直接保存，不需要扩展
      if (data?.contentImage?.[0]) {
        const introImg = data.contentImage[0];
        setIntroImage(introImg);
        saveImageToStorage(LS_KEYS.INTRO_IMAGE, introImg);
      }

      // 处理Content Image 1 - 需要扩展
      if (data?.contentImage2?.[0]) {
        console.log('Expanding content image 1...');
        try {
          const expandedImg = await expandImage(data.contentImage2[0]);
          setContentImage1(expandedImg);
          saveImageToStorage(`${LS_KEYS.CONTENT_IMAGE_PREFIX}1`, expandedImg);
        } catch (expandError) {
          console.error('Failed to expand content image 1:', expandError);
        }
      }

      // 注意：初始生成只包含封面、介绍页和第一个内容页
      // 其余内容页(2-10)需要通过"Edit image"按钮单独生成

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

  const handleRegenerateCover = async (style?: string) => {
    // 删除现有的封面图片
    localStorage.removeItem(LS_KEYS.COVER_IMAGE);
    
    const savedPrompts = localStorage.getItem(LS_KEYS.PROMPTS);
    const partnerPhoto = localStorage.getItem(LS_KEYS.PARTNER_PHOTO);
    if (!savedPrompts || !partnerPhoto) {
      toast({
        title: "Missing info",
        description: "No prompts or partner photo found",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingCover(true);
    try {
      const prompts = JSON.parse(savedPrompts);
      if (!prompts || prompts.length === 0) {
        throw new Error("No prompts found");
      }
      
      // Use the provided style or fall back to the stored/default style
      const imageStyle = style || selectedStyle;
      
      // Update the stored style if a new one is provided
      if (style) {
        setSelectedStyle(style);
        localStorage.setItem(LS_KEYS.STYLE, style);
      }
      
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: { 
          prompt: prompts[0].prompt, 
          photo: partnerPhoto,
          style: imageStyle
        }
      });
      
      if (error) throw error;
      
      // Cover image直接保存，不需要扩展
      if (data?.output?.[0]) {
        const coverImg = data.output[0];
        setCoverImage(coverImg);
        saveImageToStorage(LS_KEYS.COVER_IMAGE, coverImg);
        
        toast({
          title: "Cover image regenerated",
          description: `Cover updated with ${imageStyle} style`,
        });
      } else {
        throw new Error("No cover image returned from API");
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
  };

  const handleRegenerateIntro = async (style?: string) => {
    // 删除现有的介绍图片
    localStorage.removeItem(LS_KEYS.INTRO_IMAGE);
    
    const savedPrompts = localStorage.getItem(LS_KEYS.PROMPTS);
    const partnerPhoto = localStorage.getItem(LS_KEYS.PARTNER_PHOTO);
    if (!savedPrompts || !partnerPhoto) {
      toast({
        title: "Missing info",
        description: "No prompts or partner photo found",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingIntro(true);
    try {
      const prompts = JSON.parse(savedPrompts);
      if (!prompts || prompts.length < 2) {
        throw new Error("No intro prompt found");
      }
      
      // Use the provided style or fall back to the stored/default style
      const imageStyle = style || selectedStyle;
      
      // Update the stored style if a new one is provided
      if (style) {
        setSelectedStyle(style);
        localStorage.setItem(LS_KEYS.STYLE, style);
      }
      
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: { 
          contentPrompt: prompts[1].prompt, 
          photo: partnerPhoto,
          style: imageStyle
        }
      });
      
      if (error) throw error;
      
      // Intro image直接保存，不需要扩展
      if (data?.contentImage?.[0]) {
        const introImg = data.contentImage[0];
        setIntroImage(introImg);
        saveImageToStorage(LS_KEYS.INTRO_IMAGE, introImg);
        
        toast({
          title: "Intro image regenerated",
          description: `Introduction updated with ${imageStyle} style`,
        });
      } else {
        throw new Error("No intro image returned from API");
      }
    } catch (error) {
      console.error('Error regenerating intro image:', error);
      toast({
        title: "Error regenerating intro",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingIntro(false);
    }
  };

  useEffect(() => {
    // 启动时检查localStorage总体使用情况
    const storageUsage = calculateStorageUsage();
    console.log('📊 localStorage状态:', storageUsage);
    console.log(`📊 总存储: ${storageUsage.totalMB}MB, loveStory数据: ${storageUsage.loveStoryKB}KB`);
    
    // 列出所有loveStory相关的键
    const loveStoryKeys = Object.keys(localStorage).filter(key => key.startsWith('loveStory'));
    console.log('📋 所有loveStory键:', loveStoryKeys);
    
    console.log('🔄 开始从localStorage加载数据...');
    
    // 加载保存的文本内容和设置
    const savedAuthor = localStorage.getItem(LS_KEYS.AUTHOR_NAME);
    const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
    const savedMoments = localStorage.getItem('loveStoryMoments');
    const savedStyle = localStorage.getItem(LS_KEYS.STYLE);
    const savedTexts = localStorage.getItem(LS_KEYS.IMAGE_TEXTS);
    
    // 加载保存的图片
    console.log('🖼️ 开始加载图片...');
    const savedCoverImage = loadImageFromStorage(LS_KEYS.COVER_IMAGE);
    const savedIntroImage = loadImageFromStorage(LS_KEYS.INTRO_IMAGE);
    
    // 加载content images 1-10
    console.log('🖼️ 开始加载内容图片 1-10...');
    const contentImages = [];
    for (let i = 1; i <= 10; i++) {
      const key = `${LS_KEYS.CONTENT_IMAGE_PREFIX}${i}`;
      const image = loadImageFromStorage(key);
      contentImages.push(image);
    }
    
    // 特别关注Moment 9
    console.log(`🔍 Moment 9状态: ${contentImages[8] ? '✅ 已加载' : '❌ 未找到'}`);
    
    // 设置作者名
    if (savedAuthor) {
      setAuthorName(savedAuthor);
    }

    // 设置样式
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
        localStorage.setItem(LS_KEYS.STYLE, normalizedStyle);
      }
    }

    // 设置文本内容
    if (savedTexts) {
      try {
        setImageTexts(JSON.parse(savedTexts));
      } catch (error) {
        console.error('Error parsing saved texts:', error);
      }
    }

    // 设置idea内容
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

    // 设置背面文本
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

    // 设置图片状态
    if (savedCoverImage) setCoverImage(savedCoverImage);
    if (savedIntroImage) setIntroImage(savedIntroImage);
    if (contentImages[0]) setContentImage1(contentImages[0]);
    if (contentImages[1]) setContentImage2(contentImages[1]);
    if (contentImages[2]) setContentImage3(contentImages[2]);
    if (contentImages[3]) setContentImage4(contentImages[3]);
    if (contentImages[4]) setContentImage5(contentImages[4]);
    if (contentImages[5]) setContentImage6(contentImages[5]);
    if (contentImages[6]) setContentImage7(contentImages[6]);
    if (contentImages[7]) setContentImage8(contentImages[7]);
    if (contentImages[8]) setContentImage9(contentImages[8]);
    if (contentImages[9]) setContentImage10(contentImages[9]);

    // 初始化图片生成逻辑
    const savedPrompts = localStorage.getItem(LS_KEYS.PROMPTS);
    const partnerPhoto = localStorage.getItem(LS_KEYS.PARTNER_PHOTO);
    
    // Temporarily commented out for testing purposes
    // if ((!savedCoverImage || !savedIntroImage || contentImages[0] === null) && savedPrompts && partnerPhoto) {
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

  // 添加一个检查特定图片的调试函数
  const debugLocalStorage = (index?: number) => {
    console.group('🔍 localStorage调试信息');
    
    // 计算localStorage使用情况
    const usage = calculateStorageUsage();
    console.log('📊 localStorage使用情况:', usage);
    
    // 列出所有loveStory相关的键
    const loveStoryKeys = Object.keys(localStorage).filter(key => key.startsWith('loveStory'));
    console.log('📋 所有loveStory键:', loveStoryKeys);
    
    // 如果指定了索引，检查该索引的图片
    if (index !== undefined) {
      const imageKey = `${LS_KEYS.CONTENT_IMAGE_PREFIX}${index}`;
      const imageData = localStorage.getItem(imageKey);
      
      console.log(`🖼️ 图片 ${index} 状态:`);
      if (imageData) {
        const sizeInKB = Math.round(imageData.length / 1024);
        console.log(`✅ 找到图片 ${index}, 大小: ${sizeInKB} KB`);
        console.log('🔍 前缀:', imageData.substring(0, 50) + '...');
        
        const isValidBase64 = imageData.startsWith('data:image');
        console.log(`🔍 是否有效Base64: ${isValidBase64}`);
        
        if (!isValidBase64) {
          console.warn(`⚠️ 图片 ${index} 不是有效的Base64格式，可能导致显示问题`);
          
          // 尝试修复
          if (confirm(`图片 ${index} 格式可能有问题。要尝试修复吗？`)) {
            try {
              const fixedData = 'data:image/jpeg;base64,' + imageData.replace(/^data:image\/[^;]+;base64,/, '');
              localStorage.setItem(imageKey, fixedData);
              console.log('🔧 已尝试修复图片格式');
              alert('已尝试修复。请刷新页面查看结果。');
            } catch (error) {
              console.error('❌ 修复失败:', error);
              alert('修复失败: ' + error);
            }
          }
        }
      } else {
        console.warn(`❌ 未找到图片 ${index}`);
      }
    }
    
    console.groupEnd();
  };

  return (
    <div className="px-4 md:px-6">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold">Your Love Story</h1>
          <p className="text-muted-foreground">
            Personalized images for your love story
          </p>
          
          {/* 添加调试按钮 - 仅开发环境显示 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 bg-yellow-50 rounded border border-yellow-200">
              <p className="text-sm text-yellow-800 mb-2">调试工具</p>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => debugLocalStorage()}
                  className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs rounded"
                >
                  检查localStorage
                </button>
                <button 
                  onClick={() => debugLocalStorage(9)}
                  className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs rounded"
                >
                  检查Moment 9
                </button>
                <button 
                  onClick={() => {
                    const result = confirm("确定要继续吗？这将清除Moment 9的数据");
                    if (result) {
                      localStorage.removeItem(`${LS_KEYS.CONTENT_IMAGE_PREFIX}9`);
                      alert("已清除Moment 9数据，请重新生成");
                    }
                  }}
                  className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs rounded"
                >
                  清除Moment 9
                </button>
              </div>
            </div>
          )}
        </div>
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
      </div>
    </div>
  );
};

export default GenerateStep;
