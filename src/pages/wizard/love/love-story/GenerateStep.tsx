import React, { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage, getAllImagesFromStorage, deleteImageFromStorage } from '@/integrations/supabase/storage';
import { CoverPreviewCard } from './components/CoverPreviewCard';
import { ContentImageCard } from './components/ContentImageCard';
import { Edit, Wand2, MessageSquareText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';

// 导入工具函数
import { expandImage, handleGenericContentRegeneration as handleContentRegeneration } from './utils/imageProcessingUtils';
import { renderContentImage, createImageStateMaps } from './utils/renderUtils';
import { loadImagesFromSupabase as fetchImagesFromSupabase } from './utils/storageUtils';
import { renderAndUploadContentImage, renderAndUploadIntroImage, renderAndUploadBlessingImage } from './utils/canvasUtils';

// 导入新增的BackCoverPreviewCard组件
import { BackCoverPreviewCard } from './components/BackCoverPreviewCard';

interface ImageText {
  text: string;
  tone: string;
}

// Interface to track image storage locations
interface ImageStorageMap {
  [key: string]: {
    localStorageKey: string;
    url?: string;  // Supabase Storage URL
    leftUrl?: string;
    rightUrl?: string;
  };
}

// Interface for Supabase image objects
interface SupabaseImage {
  name: string;
  url: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  id: string;
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

  // 生成状态
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

  // 样式和内容
  const [selectedStyle, setSelectedStyle] = useState<string>('Photographic (Default)');
  const [imageTexts, setImageTexts] = useState<ImageText[]>([]);

  // 存储状态
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [supabaseImages, setSupabaseImages] = useState<SupabaseImage[]>([]);
  const [imageStorageMap, setImageStorageMap] = useState<ImageStorageMap>({});

  // 添加祝福语相关状态
  const [blessingImage, setBlessingImage] = useState<string>();
  const [blessingText, setBlessingText] = useState<string>('');
  const [isGeneratingBlessing, setIsGeneratingBlessing] = useState(false);
  const [recipientName, setRecipientName] = useState<string>('');
  const [textTone, setTextTone] = useState<string>('Heartfelt');

  const { toast } = useToast();
  const navigate = useNavigate();

  const expandImage = async (imageUrl: string): Promise<string> => {
    try {
      console.log('Starting image expansion for:', imageUrl);
      const { data, error } = await supabase.functions.invoke('expand-image', {
        body: { 
          imageUrl,
          textPrompt: "The expanded area MUST be: absolutely 100% empty with ZERO people, ZERO objects, ZERO shapes, ZERO text, and ZERO animals; create ONLY a perfectly clean, solid or simple gradient background; ensure the background is suitable for text placement; create a smooth color gradient matching the edge colors of the original image; ensure seamless and invisible transition from original image; the expanded region MUST be completely plain, uniform, and uncluttered with NO DETAILS whatsoever; treat this expansion like creating empty space around the original image"
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

  // 刷新 Supabase 图片
  const refreshSupabaseImages = async () => {
    try {
      await fetchImagesFromSupabase(
        setIsLoadingImages,
        setSupabaseImages,
        setImageStorageMap,
        setCoverImage,
        setIntroImage,
        setContentImage1,
        setContentImage2,
        setContentImage3,
        setContentImage4,
        setContentImage5,
        setContentImage6,
        setContentImage7,
        setContentImage8,
        setContentImage9,
        setContentImage10,
        toast
      );
    } catch (error) {
      console.error('Error refreshing images:', error);
      toast({
        title: "Error refreshing images",
        description: "Failed to load images from storage",
        variant: "destructive",
      });
    }
  };
  
  // 创建一个无参数的回调函数，用于传递给其他函数
  const refreshImagesCallback = () => {
    refreshSupabaseImages();
  };

  // 内容重新生成函数封装
  const handleGenericContentRegeneration = async (index: number, style?: string) => {
    const stateSetters = {
      1: setContentImage1, 2: setContentImage2, 3: setContentImage3, 4: setContentImage4, 
      5: setContentImage5, 6: setContentImage6, 7: setContentImage7, 8: setContentImage8, 
      9: setContentImage9, 10: setContentImage10
    };
    
    const loadingSetters = {
      1: setIsGeneratingContent1, 2: setIsGeneratingContent2, 3: setIsGeneratingContent3, 
      4: setIsGeneratingContent4, 5: setIsGeneratingContent5, 6: setIsGeneratingContent6,
      7: setIsGeneratingContent7, 8: setIsGeneratingContent8, 9: setIsGeneratingContent9,
      10: setIsGeneratingContent10
    };
    
    // 调用工具函数中的handleGenericContentRegeneration
    await handleContentRegeneration(
      index,
      style,
      stateSetters,
      loadingSetters,
      supabaseImages,
      selectedStyle,
      setSelectedStyle,
      toast,
      refreshImagesCallback  // 使用无参数的回调函数
    );
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
    setIsGeneratingIntro(true);
    toast({
      title: "Generating images",
      description: "This may take a minute...",
    });

    try {
      // 获取当前图片的URL，用于后续删除
      const currentIntroImageUrl = localStorage.getItem('loveStoryIntroImage_url');
      
      // 查找当前图片在Supabase中的路径
      let currentIntroImagePath = '';
      
      if (currentIntroImageUrl) {
        const currentIntroImageName = currentIntroImageUrl.split('/').pop();
        if (currentIntroImageName) {
          const currentImage = supabaseImages.find(img => img.name.includes(currentIntroImageName));
          if (currentImage) {
            currentIntroImagePath = currentImage.name;
          }
        }
      }

      // 我们现在解析完整的prompts对象，而不是使用传入的字符串
      // 这样我们可以正确访问每个图像对应的提示
      const promptsObj = JSON.parse(localStorage.getItem('loveStoryImagePrompts') || '[]');
      if (!promptsObj || promptsObj.length < 3) {
        throw new Error("Not enough prompts for image generation");
      }

      // 为每个图像类型使用专门的提示
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: { 
          contentPrompt: promptsObj[1].prompt,   // intro使用prompts[1]
          content2Prompt: promptsObj[2].prompt,  // Moment 1使用prompts[2]
          content3Prompt: promptsObj[3].prompt,  // Moment 2使用prompts[3]
          content4Prompt: promptsObj[4].prompt,  // Moment 3使用prompts[4]
          content5Prompt: promptsObj[5].prompt,  // Moment 4使用prompts[5]
          content6Prompt: promptsObj[6].prompt,  // Moment 5使用prompts[6]
          content7Prompt: promptsObj[7].prompt,  // Moment 6使用prompts[7]
          content8Prompt: promptsObj[8].prompt,  // Moment 7使用prompts[8]
          content9Prompt: promptsObj[9].prompt,  // Moment 8使用prompts[9]
          content10Prompt: promptsObj[10].prompt, // Moment 9使用prompts[10]
          photo: partnerPhoto,
          style: selectedStyle,
          type: 'all'
        }
      });

      if (error) throw error;

      // 处理介绍图片
      if (data?.contentImage?.[0]) {
        const introImageData = data.contentImage[0];
        setIntroImage(introImageData);
        
        // 使用时间戳确保文件名唯一
        const timestamp = Date.now();
        
        // Upload to Supabase Storage
        const storageUrl = await uploadImageToStorage(
          introImageData, 
          'images', 
          `love-story-intro-${timestamp}`
        );
        
        // Update storage map
        setImageStorageMap(prev => ({
          ...prev,
          ['loveStoryIntroImage']: {
            localStorageKey: 'loveStoryIntroImage',
            url: storageUrl
          }
        }));
        
        // Store only the URL reference in localStorage
        localStorage.setItem('loveStoryIntroImage_url', storageUrl);
        
        // 删除旧介绍图片
        if (currentIntroImagePath) {
          try {
            await deleteImageFromStorage(currentIntroImagePath, 'images');
            console.log(`Deleted old intro image: ${currentIntroImagePath}`);
          } catch (deleteErr) {
            console.error(`Failed to delete old intro image: ${currentIntroImagePath}`, deleteErr);
            // 继续处理，即使删除失败
          }
        }
      }

      if (data?.contentImage2?.[0]) {
        const contentImage1Data = data.contentImage2[0];
        setContentImage1(contentImage1Data);
        
        // 获取当前内容图片的URL，用于后续删除
        const currentContentImageUrl = localStorage.getItem('loveStoryContentImage1_url');
        let currentContentImagePath = '';
        
        if (currentContentImageUrl) {
          const currentContentImageName = currentContentImageUrl.split('/').pop();
          if (currentContentImageName) {
            const currentImage = supabaseImages.find(img => img.name.includes(currentContentImageName));
            if (currentImage) {
              currentContentImagePath = currentImage.name;
            }
          }
        }
        
        // 使用时间戳确保文件名唯一
        const timestamp = Date.now();
        
        // Upload to Supabase Storage
        const storageUrl = await uploadImageToStorage(
          contentImage1Data, 
          'images', 
          `love-story-content-1-${timestamp}`
        );
        
        // Update storage map
        setImageStorageMap(prev => ({
          ...prev,
          ['loveStoryContentImage1']: {
            localStorageKey: 'loveStoryContentImage1',
            url: storageUrl
          }
        }));
        
        // Store only the URL reference in localStorage
        localStorage.setItem('loveStoryContentImage1_url', storageUrl);
        
        // 删除旧内容图片
        if (currentContentImagePath) {
          try {
            await deleteImageFromStorage(currentContentImagePath, 'images');
            console.log(`Deleted old content image: ${currentContentImagePath}`);
          } catch (deleteErr) {
            console.error(`Failed to delete old content image: ${currentContentImagePath}`, deleteErr);
            // 继续处理，即使删除失败
          }
        }
      }

      toast({
        title: "Images generated",
        description: "Your love story images are ready!",
      });
      
      // 刷新图片列表
      setTimeout(() => {
        refreshImagesCallback();
      }, 1000);
    } catch (err: any) {
      console.error("Error generating images:", err);
      toast({
        title: "Error generating images",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingIntro(false);
    }
  };

  // 新增加：从Supabase加载所有图片
  const loadImagesFromSupabase = async () => {
    setIsLoadingImages(true);
    try {
      // 获取所有Supabase中的图片
      const images = await getAllImagesFromStorage('images');
      
      // 按照创建时间排序图片，确保最新的图片显示在前面
      const sortedImages = [...images].sort((a, b) => {
        // 首先按照图片类型排序
        const typeA = getImageType(a.name);
        const typeB = getImageType(b.name);
        
        if (typeA !== typeB) {
          // 优先显示封面、介绍页和内容页
          const typeOrder = {
            'cover': 1,
            'intro': 2,
            'content': 3,
            'other': 4
          };
          return (typeOrder[typeA as keyof typeof typeOrder] || 4) - (typeOrder[typeB as keyof typeof typeOrder] || 4);
        }
        
        // 如果是内容图片，按照内容编号排序
        if (typeA === 'content' && typeB === 'content') {
          const indexA = getContentIndex(a.name);
          const indexB = getContentIndex(b.name);
          if (indexA !== indexB) {
            return indexA - indexB;
          }
        }
        
        // 最后按照创建时间排序，最新的在前面
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setSupabaseImages(sortedImages);
      
      // 创建一个新的Map用于存储图片引用
      const newImageMap: ImageStorageMap = {};
      
      // 用于跟踪已处理的图片类型
      const processedTypes: Record<string, boolean> = {};
      
      // 遍历所有图片，更新映射 - 修复命名识别问题
      for (const img of sortedImages) {
        // 从完整路径中提取文件名
        const pathParts = img.name.split('/');
        const fileName = pathParts[pathParts.length - 1];
        
        // 使用正则表达式精确匹配文件名，防止10匹配到1的内容
        if (/^love-story-cover/.test(fileName) && !processedTypes['cover']) {
          // 检查用户是否在 CoverStep 中选择了特定的封面图片
          const selectedCoverImageUrl = localStorage.getItem('loveStorySelectedCoverImage_url');
          
          if (selectedCoverImageUrl) {
            // 如果用户选择了特定的封面图片，使用该图片
            setCoverImage(selectedCoverImageUrl);
            newImageMap['loveStoryCoverImage'] = {
              localStorageKey: 'loveStoryCoverImage',
              url: selectedCoverImageUrl
            };
            localStorage.setItem('loveStoryCoverImage_url', selectedCoverImageUrl);
          } else {
            // 否则使用最新的封面图片
            setCoverImage(img.url);
            newImageMap['loveStoryCoverImage'] = {
              localStorageKey: 'loveStoryCoverImage',
              url: img.url
            };
            localStorage.setItem('loveStoryCoverImage_url', img.url);
          }
          
          processedTypes['cover'] = true;
        } else if (/^love-story-intro/.test(fileName) && !processedTypes['intro']) {
          setIntroImage(img.url);
          newImageMap['loveStoryIntroImage'] = {
            localStorageKey: 'loveStoryIntroImage',
            url: img.url
          };
          localStorage.setItem('loveStoryIntroImage_url', img.url);
          processedTypes['intro'] = true;
        } else if (/^love-story-content-1($|-)/.test(fileName) && !processedTypes['content1']) {
          // 确保只匹配content-1，而不匹配content-10等
          setContentImage1(img.url);
          newImageMap['loveStoryContentImage1'] = {
            localStorageKey: 'loveStoryContentImage1',
            url: img.url
          };
          localStorage.setItem('loveStoryContentImage1_url', img.url);
          processedTypes['content1'] = true;
        } else if (/^love-story-content-2($|-)/.test(fileName) && !processedTypes['content2']) {
          setContentImage2(img.url);
          newImageMap['loveStoryContentImage2'] = {
            localStorageKey: 'loveStoryContentImage2',
            url: img.url
          };
          localStorage.setItem('loveStoryContentImage2_url', img.url);
          processedTypes['content2'] = true;
        } else if (/^love-story-content-3($|-)/.test(fileName) && !processedTypes['content3']) {
          setContentImage3(img.url);
          newImageMap['loveStoryContentImage3'] = {
            localStorageKey: 'loveStoryContentImage3',
            url: img.url
          };
          localStorage.setItem('loveStoryContentImage3_url', img.url);
          processedTypes['content3'] = true;
        } else if (/^love-story-content-4($|-)/.test(fileName) && !processedTypes['content4']) {
          setContentImage4(img.url);
          newImageMap['loveStoryContentImage4'] = {
            localStorageKey: 'loveStoryContentImage4',
            url: img.url
          };
          localStorage.setItem('loveStoryContentImage4_url', img.url);
          processedTypes['content4'] = true;
        } else if (/^love-story-content-5($|-)/.test(fileName) && !processedTypes['content5']) {
          setContentImage5(img.url);
          newImageMap['loveStoryContentImage5'] = {
            localStorageKey: 'loveStoryContentImage5',
            url: img.url
          };
          localStorage.setItem('loveStoryContentImage5_url', img.url);
          processedTypes['content5'] = true;
        } else if (/^love-story-content-6($|-)/.test(fileName) && !processedTypes['content6']) {
          setContentImage6(img.url);
          newImageMap['loveStoryContentImage6'] = {
            localStorageKey: 'loveStoryContentImage6',
            url: img.url
          };
          localStorage.setItem('loveStoryContentImage6_url', img.url);
          processedTypes['content6'] = true;
        } else if (/^love-story-content-7($|-)/.test(fileName) && !processedTypes['content7']) {
          setContentImage7(img.url);
          newImageMap['loveStoryContentImage7'] = {
            localStorageKey: 'loveStoryContentImage7',
            url: img.url
          };
          localStorage.setItem('loveStoryContentImage7_url', img.url);
          processedTypes['content7'] = true;
        } else if (/^love-story-content-8($|-)/.test(fileName) && !processedTypes['content8']) {
          setContentImage8(img.url);
          newImageMap['loveStoryContentImage8'] = {
            localStorageKey: 'loveStoryContentImage8',
            url: img.url
          };
          localStorage.setItem('loveStoryContentImage8_url', img.url);
          processedTypes['content8'] = true;
        } else if (/^love-story-content-9($|-)/.test(fileName) && !processedTypes['content9']) {
          setContentImage9(img.url);
          newImageMap['loveStoryContentImage9'] = {
            localStorageKey: 'loveStoryContentImage9',
            url: img.url
          };
          localStorage.setItem('loveStoryContentImage9_url', img.url);
          processedTypes['content9'] = true;
        } else if (/^love-story-content-10($|-)/.test(fileName) && !processedTypes['content10']) {
          setContentImage10(img.url);
          newImageMap['loveStoryContentImage10'] = {
            localStorageKey: 'loveStoryContentImage10',
            url: img.url
          };
          localStorage.setItem('loveStoryContentImage10_url', img.url);
          processedTypes['content10'] = true;
        }
      }
      
      // 更新图片存储映射
      setImageStorageMap(newImageMap);
      
    } catch (error) {
      console.error('Error loading images from Supabase:', error);
      toast({
        title: "Error loading images",
        description: "Could not load your saved images",
        variant: "destructive",
      });
    } finally {
      setIsLoadingImages(false);
    }
  };
  
  // 辅助函数：获取图片类型
  const getImageType = (imageName: string): string => {
    if (imageName.includes('love-story-cover')) return 'cover';
    if (imageName.includes('love-story-intro')) return 'intro';
    if (imageName.includes('love-story-content')) return 'content';
    return 'other';
  };
  
  // 辅助函数：获取内容图片的索引
  const getContentIndex = (imageName: string): number => {
    const match = imageName.match(/love-story-content-(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return 999; // 默认值，确保未识别的内容排在最后
  };

  useEffect(() => {
    // 加载文本内容和设置
    const savedAuthor = localStorage.getItem('loveStoryAuthorName');
    const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
    const savedMoments = localStorage.getItem('loveStoryMoments');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const savedStyle = localStorage.getItem('loveStoryStyle');
    const savedTexts = localStorage.getItem('loveStoryImageTexts');
    
    // 加载封面样式和文本
    const savedCoverTitle = localStorage.getItem('loveStoryCoverTitle');
    const savedSubtitle = localStorage.getItem('loveStoryCoverSubtitle');
    const savedBackCoverText = localStorage.getItem('loveStoryBackCoverText');
    const savedRecipientName = localStorage.getItem('loveStoryPersonName');
    const savedTextTone = localStorage.getItem('loveStoryTone');
    
    // 加载祝福语相关数据
    const savedBlessingText = localStorage.getItem('loveStoryBlessingText');
    const savedBlessingImage = localStorage.getItem('loveStoryBlessingImage_url');
    
    // 直接从Supabase加载所有图片
    refreshImagesCallback();

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
        'Disney Character': 'Disney Charactor'
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
        // 保持主标题为"THE MAGIC IN"
        setCoverTitle('THE MAGIC IN');
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

    // 设置封面样式和文本
    if (savedCoverTitle && savedSubtitle) {
      setCoverTitle(savedCoverTitle);
      setSubtitle(savedSubtitle);
    }

    // 设置祝福语数据
    if (savedBlessingText) setBlessingText(savedBlessingText);
    if (savedBlessingImage) setBlessingImage(savedBlessingImage);
    if (savedRecipientName) setRecipientName(savedRecipientName);
    if (savedTextTone) setTextTone(savedTextTone);
  }, []);

  const handleEditCover = () => {
    toast({
      title: "Edit Cover",
      description: "Opening cover editor..."
    });
    // 导航到CoverStep页面
    navigate('/create/love/love-story/cover');
  };

  const handleEditText = () => {
    toast({
      title: "Edit Text",
      description: "Opening text editor..."
    });
  };

  const handleRegenerateIntro = async (style?: string) => {
    localStorage.removeItem('loveStoryIntroImage');
    localStorage.removeItem('loveStoryIntroImage_url');
    
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const characterPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && characterPhoto) {
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
          // 修复请求结构，使用prompts[1]而非prompts[0]（prompts[0]是封面）
          const requestBody = {
            contentPrompt: prompts[1].prompt, 
            photo: characterPhoto,
            style: imageStyle,
            type: 'intro'
          };

          console.log('Intro generation request (using prompt 1):', JSON.stringify(requestBody));
          
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: requestBody
          });
          
          if (error) throw error;
          
          console.log('Intro generation response:', data);
          
          // 检查各种可能的响应格式
          let introImageData = '';
          if (data?.contentImage && data.contentImage.length > 0) {
            introImageData = data.contentImage[0];
          } else if (data?.output && data.output.length > 0) {
            introImageData = data.output[0];
          } else if (data?.introImage && data.introImage.length > 0) {
            introImageData = data.introImage[0];
          } else {
            throw new Error("No intro image data in response");
          }
          
          if (introImageData) {
            // 尝试扩展图片
            try {
              const expandedBase64 = await expandImage(introImageData);
              introImageData = expandedBase64;
            } catch (expandError) {
              console.error("Error expanding intro image:", expandError);
              // 即使扩展失败，继续使用原始图片
            }
            
            setIntroImage(introImageData);
            
            // 使用时间戳确保文件名唯一
            const timestamp = Date.now();
            
            // Upload to Supabase Storage
            const storageUrl = await uploadImageToStorage(
              introImageData, 
              'images', 
              `love-story-intro-${timestamp}`
            );
            
            // Update storage map
            setImageStorageMap(prev => ({
              ...prev,
              ['loveStoryIntroImage']: {
                localStorageKey: 'loveStoryIntroImage',
                url: storageUrl
              }
            }));
            
            // Store only the URL reference in localStorage
            localStorage.setItem('loveStoryIntroImage_url', storageUrl);
            
            // 延迟刷新图片列表，确保上传完成
            setTimeout(() => {
              refreshImagesCallback();
            }, 1000);
            
            toast({
              title: "Introduction image regenerated",
              description: `Intro image updated with ${imageStyle} style`,
            });
          } else {
            throw new Error("Failed to generate intro image");
          }
        } catch (error: any) {
          console.error('Error regenerating intro image:', error);
          toast({
            title: "Error regenerating intro image",
            description: error.message || "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingIntro(false);
        }
      }
    }
  };

  // 处理函数定义
  const refreshImages = async () => {
    toast({
      title: "Refreshing images",
      description: "Loading latest images from Supabase Storage",
    });
    
    await refreshImagesCallback();
  };

  // 渲染介绍图片到Canvas并上传
  const handleRenderIntroImage = async () => {
    try {
      if (!introImage) {
        toast({
          title: "No intro image",
          description: "Please generate an intro image first",
          variant: "destructive",
        });
        return;
      }
      
      // 获取介绍文本
      const introText = imageTexts && imageTexts.length > 1 ? imageTexts[1].text : "";
      
      setIsGeneratingIntro(true);
      
      toast({
        title: "Rendering intro image",
        description: "Processing intro with text...",
      });
      
      // 渲染并上传图片
      const result = await renderAndUploadIntroImage(
        introImage,
        introText || "Welcome to our love story.",
        selectedStyle,
        supabaseImages
      );
      
      // 更新localStorage - 只存储分割后的左右两部分URL
      localStorage.setItem('loveStoryIntroImage_left_url', result.leftImageUrl);
      localStorage.setItem('loveStoryIntroImage_right_url', result.rightImageUrl);
      
      // 更新imageStorageMap
      setImageStorageMap(prev => ({
        ...prev,
        ['loveStoryIntroImage']: {
          localStorageKey: 'loveStoryIntroImage',
          leftUrl: result.leftImageUrl,
          rightUrl: result.rightImageUrl
        }
      }));
      
      // 清除原始介绍图片（love-story-intro 等）
      try {
        // 查找所有包含原始介绍图片名称的图片
        const originalIntroImages = supabaseImages.filter(img => {
          // 匹配 love-story-intro-数字-时间戳 模式，但不匹配 intro-数字-数字 模式
          const isOriginalImage = img.name.includes('love-story-intro-');
          const isProcessedImage = /intro-\d+-\d+/.test(img.name);
          return isOriginalImage && !isProcessedImage;
        });
        
        if (originalIntroImages.length > 0) {
          console.log(`Found ${originalIntroImages.length} original intro images to delete`);
          
          // 并行删除所有原始图片
          const deletePromises = originalIntroImages.map(img => {
            // 从完整路径中提取文件名
            const pathParts = img.name.split('/');
            const filename = pathParts[pathParts.length - 1];
            console.log(`Deleting original intro image: ${filename}`);
            return deleteImageFromStorage(filename, 'images');
          });
          
          // 等待所有删除操作完成
          await Promise.all(deletePromises);
          console.log('Successfully deleted original intro images');
        }
      } catch (deleteError) {
        console.error('Error deleting original intro images:', deleteError);
        // 继续处理，即使删除失败
      }
      
      toast({
        title: "Intro image rendered",
        description: "Introduction successfully rendered with text and split into two parts",
      });
    } catch (error: any) {
      console.error("Error rendering intro image:", error);
      toast({
        title: "Error rendering intro image",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingIntro(false);
    }
  };

  // 渲染内容图片到Canvas并上传
  const handleRenderContentImage = async (index: number) => {
    try {
      // 获取对应的图片和文本
      const image = imageStateMap[index];
      // 图像索引1-10对应文本索引2-11
      const textIndex = index + 1;
      const text = imageTexts && imageTexts.length > textIndex ? imageTexts[textIndex].text : "";
      
      if (!image) {
        toast({
          title: "Error",
          description: `No image found for content ${index}`,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Rendering content image",
        description: `Processing content ${index} with text...`,
      });
      
      // 设置加载状态
      const setLoadingFn = loadingStateMap[index] !== undefined ? 
        (value: boolean) => {
          const setters = {
            1: setIsGeneratingContent1,
            2: setIsGeneratingContent2,
            3: setIsGeneratingContent3,
            4: setIsGeneratingContent4,
            5: setIsGeneratingContent5,
            6: setIsGeneratingContent6,
            7: setIsGeneratingContent7,
            8: setIsGeneratingContent8,
            9: setIsGeneratingContent9,
            10: setIsGeneratingContent10,
          };
          const setter = setters[index as keyof typeof setters];
          if (setter) setter(value);
        } : 
        () => {};
      
      setLoadingFn(true);
      
      // 渲染并上传图片
      const result = await renderAndUploadContentImage(
        image,
        text || "A beautiful moment captured in this image.",
        index,
        selectedStyle,
        supabaseImages
      );
      
      // 更新localStorage - 只存储分割后的左右两部分URL
      localStorage.setItem(`loveStoryContentImage${index}_left_url`, result.leftImageUrl);
      localStorage.setItem(`loveStoryContentImage${index}_right_url`, result.rightImageUrl);
      
      // 更新imageStorageMap
      setImageStorageMap(prev => ({
        ...prev,
        [`loveStoryContentImage${index}`]: {
          localStorageKey: `loveStoryContentImage${index}`,
          leftUrl: result.leftImageUrl,
          rightUrl: result.rightImageUrl
        }
      }));
      
      // 清除原始图片（love-story-content-3 等）
      try {
        // 查找所有包含原始内容图片名称的图片
        const originalContentImages = supabaseImages.filter(img => {
          // 匹配 love-story-content-数字-时间戳 模式，但不匹配 content-数字-数字 模式
          const isOriginalImage = img.name.includes(`love-story-content-${index}`);
          const isProcessedImage = /content-\d+-\d+/.test(img.name);
          return isOriginalImage && !isProcessedImage;
        });
        
        if (originalContentImages.length > 0) {
          console.log(`Found ${originalContentImages.length} original content images to delete for content ${index}`);
          
          // 并行删除所有原始图片
          const deletePromises = originalContentImages.map(img => {
            // 从完整路径中提取文件名
            const pathParts = img.name.split('/');
            const filename = pathParts[pathParts.length - 1];
            console.log(`Deleting original content image: ${filename}`);
            return deleteImageFromStorage(filename, 'images');
          });
          
          // 等待所有删除操作完成
          await Promise.all(deletePromises);
          console.log(`Successfully deleted original content images for content ${index}`);
        }
      } catch (deleteError) {
        console.error(`Error deleting original content images for content ${index}:`, deleteError);
        // 继续处理，即使删除失败
      }
      
      toast({
        title: "Content image rendered",
        description: `Content ${index} successfully rendered with text and split into two parts`,
      });
    } catch (error: any) {
      console.error(`Error rendering content image ${index}:`, error);
      toast({
        title: "Error rendering image",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      // 重置加载状态
      const setLoadingFn = {
        1: setIsGeneratingContent1,
        2: setIsGeneratingContent2,
        3: setIsGeneratingContent3,
        4: setIsGeneratingContent4,
        5: setIsGeneratingContent5,
        6: setIsGeneratingContent6,
        7: setIsGeneratingContent7,
        8: setIsGeneratingContent8,
        9: setIsGeneratingContent9,
        10: setIsGeneratingContent10,
      }[index];
      
      if (setLoadingFn) {
        setLoadingFn(false);
      }
    }
  };

  // 创建图像状态映射
  const { imageStateMap, loadingStateMap, handleRegenerateMap } = createImageStateMaps(
    introImage, contentImage1, contentImage2, contentImage3, contentImage4,
    contentImage5, contentImage6, contentImage7, contentImage8, contentImage9, contentImage10,
    isGeneratingIntro, isGeneratingContent1, isGeneratingContent2, isGeneratingContent3, isGeneratingContent4,
    isGeneratingContent5, isGeneratingContent6, isGeneratingContent7, isGeneratingContent8, 
    isGeneratingContent9, isGeneratingContent10,
    handleRegenerateIntro, handleRegenerateContent1, handleRegenerateContent2, handleRegenerateContent3,
    handleRegenerateContent4, handleRegenerateContent5, handleRegenerateContent6, handleRegenerateContent7,
    handleRegenerateContent8, handleRegenerateContent9, handleRegenerateContent10
  );

  // 批量渲染所有内容图片
  const handleRenderAllContentImages = async () => {
    try {
      // 首先，确保有介绍图片
      if (!introImage) {
        toast({
          title: "No intro image",
          description: "Please generate the intro image first",
          variant: "destructive",
        });
        return;
      }
      
      // 设置介绍为加载状态
      setIsGeneratingIntro(true);
      
      toast({
        title: "Rendering all images",
        description: "This may take a few moments...",
      });
      
      // 查找当前有哪些内容图片
      const contentIndices = [];
      for (let i = 1; i <= 10; i++) {
        const imageUrl = imageStateMap[i];
        if (imageUrl) {
          contentIndices.push(i);
        }
      }
      
      if (contentIndices.length === 0) {
        toast({
          title: "No content images",
          description: "Please generate content images first",
          variant: "destructive",
        });
        setIsGeneratingIntro(false);
        return;
      }
      
      // 设置所有内容为加载状态
      contentIndices.forEach(index => {
        const setLoadingFn = {
          1: setIsGeneratingContent1,
          2: setIsGeneratingContent2,
          3: setIsGeneratingContent3,
          4: setIsGeneratingContent4,
          5: setIsGeneratingContent5,
          6: setIsGeneratingContent6,
          7: setIsGeneratingContent7,
          8: setIsGeneratingContent8,
          9: setIsGeneratingContent9,
          10: setIsGeneratingContent10,
        }[index];
        
        if (setLoadingFn) setLoadingFn(true);
      });

      // 首先渲染介绍图片，如果存在
      if (introImage) {
        const introText = imageTexts && imageTexts.length > 1 ? imageTexts[1].text : "";
        
        // 渲染并上传介绍图片
        const introResult = await renderAndUploadIntroImage(
          introImage,
          introText || "Welcome to our love story.",
          selectedStyle,
          supabaseImages
        );
        
        // 更新localStorage - 只存储分割后的图片URL
        localStorage.setItem('loveStoryIntroImage_left_url', introResult.leftImageUrl);
        localStorage.setItem('loveStoryIntroImage_right_url', introResult.rightImageUrl);
        
        // 更新imageStorageMap
        setImageStorageMap(prev => ({
          ...prev,
          ['loveStoryIntroImage']: {
            localStorageKey: 'loveStoryIntroImage',
            leftUrl: introResult.leftImageUrl,
            rightUrl: introResult.rightImageUrl
          }
        }));
        
        // 清除原始介绍图片
        try {
          // 查找所有包含原始介绍图片名称的图片
          const originalIntroImages = supabaseImages.filter(img => {
            // 匹配 love-story-intro-数字-时间戳 模式，但不匹配 intro-数字-数字 模式
            const isOriginalImage = img.name.includes('love-story-intro-');
            const isProcessedImage = /intro-\d+-\d+/.test(img.name);
            return isOriginalImage && !isProcessedImage;
          });
          
          if (originalIntroImages.length > 0) {
            console.log(`Found ${originalIntroImages.length} original intro images to delete`);
            
            // 并行删除所有原始图片
            const deletePromises = originalIntroImages.map(img => {
              // 从完整路径中提取文件名
              const pathParts = img.name.split('/');
              const filename = pathParts[pathParts.length - 1];
              console.log(`Deleting original intro image: ${filename}`);
              return deleteImageFromStorage(filename, 'images');
            });
            
            // 等待所有删除操作完成
            await Promise.all(deletePromises);
            console.log('Successfully deleted original intro images');
          }
        } catch (deleteError) {
          console.error('Error deleting original intro images:', deleteError);
          // 继续处理，即使删除失败
        }
        
        console.log('Intro image rendered and split successfully');
      }

      // 依次渲染每个内容图片
      for (const index of contentIndices) {
        try {
          const image = imageStateMap[index];
          const textIndex = index + 1;
          const text = imageTexts && imageTexts.length > textIndex ? imageTexts[textIndex].text : "";
          
          if (!image) {
            console.error(`No image found for content ${index}, skipping`);
            continue;
          }
          
          // 渲染并上传内容图片
          const contentResult = await renderAndUploadContentImage(
            image,
            text || "A beautiful moment captured in this image.",
            index,
            selectedStyle,
            supabaseImages
          );
          
          // 更新localStorage - 只存储分割后的图片URL
          localStorage.setItem(`loveStoryContentImage${index}_left_url`, contentResult.leftImageUrl);
          localStorage.setItem(`loveStoryContentImage${index}_right_url`, contentResult.rightImageUrl);
          
          // 更新imageStorageMap
          setImageStorageMap(prev => ({
            ...prev,
            [`loveStoryContentImage${index}`]: {
              localStorageKey: `loveStoryContentImage${index}`,
              leftUrl: contentResult.leftImageUrl,
              rightUrl: contentResult.rightImageUrl
            }
          }));
          
          // 清除原始图片（love-story-content-3 等）
          try {
            // 查找所有包含原始内容图片名称的图片
            const originalContentImages = supabaseImages.filter(img => {
              // 匹配 love-story-content-数字-时间戳 模式，但不匹配 content-数字-数字 模式
              const isOriginalImage = img.name.includes(`love-story-content-${index}`);
              const isProcessedImage = /content-\d+-\d+/.test(img.name);
              return isOriginalImage && !isProcessedImage;
            });
            
            if (originalContentImages.length > 0) {
              console.log(`Found ${originalContentImages.length} original content images to delete for content ${index}`);
              
              // 并行删除所有原始图片
              const deletePromises = originalContentImages.map(img => {
                // 从完整路径中提取文件名
                const pathParts = img.name.split('/');
                const filename = pathParts[pathParts.length - 1];
                console.log(`Deleting original content image: ${filename}`);
                return deleteImageFromStorage(filename, 'images');
              });
              
              // 等待所有删除操作完成
              await Promise.all(deletePromises);
              console.log(`Successfully deleted original content images for content ${index}`);
            }
          } catch (deleteError) {
            console.error(`Error deleting original content images for content ${index}:`, deleteError);
            // 继续处理，即使删除失败
          }
          
          console.log(`Content image ${index} rendered and split successfully`);
        } catch (error) {
          console.error(`Error rendering content image ${index}:`, error);
          // 继续处理其他图片
        }
      }
      
      toast({
        title: "All images rendered",
        description: `Successfully rendered intro and ${contentIndices.length} content images with text and split them into parts`,
      });
    } catch (error: any) {
      console.error("Error rendering all images:", error);
      toast({
        title: "Error rendering images",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      // 重置所有加载状态
      setIsGeneratingIntro(false);
      for (let i = 1; i <= 10; i++) {
        const setLoadingFn = {
          1: setIsGeneratingContent1,
          2: setIsGeneratingContent2,
          3: setIsGeneratingContent3,
          4: setIsGeneratingContent4,
          5: setIsGeneratingContent5,
          6: setIsGeneratingContent6,
          7: setIsGeneratingContent7,
          8: setIsGeneratingContent8,
          9: setIsGeneratingContent9,
          10: setIsGeneratingContent10,
        }[i];
        
        if (setLoadingFn) setLoadingFn(false);
      }
    }
  };

  // 处理祝福语文本变更
  const handleBlessingTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setBlessingText(newText);
    localStorage.setItem('loveStoryBlessingText', newText);
  };
  
  // 渲染祝福语图片
  const handleRenderBlessingImage = async () => {
    try {
      setIsGeneratingBlessing(true);
      
    toast({
        title: "Rendering blessing message",
        description: "Creating a beautiful blessing message...",
      });
      
      // 确保获取最新的数据
      const currentAuthorName = localStorage.getItem('loveStoryAuthorName') || authorName;
      const currentRecipientName = localStorage.getItem('loveStoryPersonName') || recipientName;
      const currentTextTone = localStorage.getItem('loveStoryTone') || textTone;
      
      // 设置预设的祝福语文本 - 不允许用户编辑
      let predefinedBlessingText = '';
      if (currentTextTone === 'Heartfelt') {
        predefinedBlessingText = `Dear ${currentRecipientName},\n\nIn the quiet moments of reflection, I find my heart filled with gratitude for the beautiful journey we've shared. Each memory we've created together is a treasure I hold dear.\n\nWith all my love,\n${currentAuthorName}`;
      } else if (currentTextTone === 'Playful') {
        predefinedBlessingText = `Hey ${currentRecipientName}!\n\nGuess what? You're absolutely amazing! Every adventure with you turns into an epic story, and I can't wait to see what fun we'll have next! Here's to more laughter and silly moments!\n\nCheers,\n${currentAuthorName}`;
      } else if (currentTextTone === 'Inspirational') {
        predefinedBlessingText = `To ${currentRecipientName},\n\nMay your path be filled with light, your heart with courage, and your spirit with joy. Remember that you have the strength to overcome any challenge life presents.\n\nBelieving in you always,\n${currentAuthorName}`;
      } else {
        predefinedBlessingText = `Dear ${currentRecipientName},\n\nSending you warm wishes and fond memories. May this book remind you of all the special moments we've shared.\n\nWith affection,\n${currentAuthorName}`;
      }
      
      // 更新祝福语文本状态（不使用用户输入的文本）
      setBlessingText(predefinedBlessingText);
      localStorage.setItem('loveStoryBlessingText', predefinedBlessingText);
      
      // 渲染并上传祝福语图片
      const storageUrl = await renderAndUploadBlessingImage(
        predefinedBlessingText,
        currentAuthorName,
        currentRecipientName,
        currentTextTone,
        supabaseImages
      );
      
      // 更新状态和localStorage
      setBlessingImage(storageUrl);
      localStorage.setItem('loveStoryBlessingImage_url', storageUrl);
      
      toast({
        title: "Blessing message created",
        description: "Your blessing message has been rendered successfully!",
      });
      
      // 刷新图片列表
      setTimeout(() => {
        refreshImagesCallback();
      }, 1000);
    } catch (error: any) {
      console.error('Error rendering blessing image:', error);
      toast({
        title: "Error creating blessing",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBlessing(false);
    }
  };

  return (
    <WizardStep
      title="Your Love Story Images"
      description="Here are your personalized love story images with accompanying text."
      previousStep="/create/love/love-story/debug-prompts"
      nextStep="/create/love/love-story/format"
      currentStep={7}
      totalSteps={8}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* 添加 Refresh Images 按钮 */}
        <div className="mb-8 flex justify-end gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRenderAllContentImages}
            disabled={isLoadingImages}
            className="bg-[#8e44ad]/10 text-[#8e44ad] hover:bg-[#8e44ad]/20 border-[#8e44ad]/30 mr-2"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Render All Content
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshImages}
            disabled={isLoadingImages}
            className="bg-[#FF7F50]/10 text-[#FF7F50] hover:bg-[#FF7F50]/20 border-[#FF7F50]/30"
          >
            {isLoadingImages ? 'Loading...' : 'Refresh Images'}
          </Button>
        </div>
      
        {/* Cover section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-8">Cover</h2>
          <div className="max-w-xl mx-auto">
            {coverImage && (
              <img 
                src={coverImage} 
                alt="Love Story Cover" 
                className="w-full h-auto rounded-lg shadow-lg"
              />
            )}
            {!coverImage && (
              <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Cover image not available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 祝福语部分 - 在Cover和Intro之间 */}
        <div className="mb-16 border-t-2 border-gray-200 pt-10">
          <h2 className="text-2xl font-bold mb-8">Special Blessing</h2>
          
          <div className="max-w-xl mx-auto">
            {/* 祝福语预览 */}
            {isGeneratingBlessing && (
              <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Wand2 className="w-8 h-8 mx-auto mb-2 animate-spin text-[#FF7F50]" />
                  <p className="text-gray-500">Creating your blessing...</p>
                </div>
              </div>
            )}
            
            {!isGeneratingBlessing && blessingImage && (
              <img 
                src={blessingImage} 
                alt="Blessing Message" 
                className="w-full h-auto rounded-lg shadow-lg" 
              />
            )}
            
            {!isGeneratingBlessing && !blessingImage && (
              <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 text-center px-8">
                  Your blessing will appear here after creation.
                </p>
              </div>
            )}
            
            <div className="mt-4 flex justify-center">
              <Button
                onClick={handleRenderBlessingImage}
                disabled={isGeneratingBlessing}
                className="bg-[#FF7F50] hover:bg-[#FF7F50]/90"
              >
                {isGeneratingBlessing ? 'Creating...' : 'Create Blessing Page'}
              </Button>
            </div>
          </div>
        </div>
        
        {/* 介绍部分 - 将Intro与其他Content分开 */}
        <div className="mb-16 border-t-2 border-gray-200 pt-10">
          <h2 className="text-2xl font-bold mb-8">Introduction</h2>
          <div className="mb-8">
            <ContentImageCard 
              image={introImage} 
              leftImageUrl={localStorage.getItem('loveStoryIntroImage_left_url') || undefined}
              rightImageUrl={localStorage.getItem('loveStoryIntroImage_right_url') || undefined}
              isGenerating={isGeneratingIntro}
              onRegenerate={handleRegenerateIntro}
              index={0}
              onEditText={() => {}}
              text={imageTexts && imageTexts.length > 1 ? imageTexts[1]?.text : undefined}
              title=""
            />
            
            {/* 添加渲染按钮 */}
            {introImage && imageTexts && imageTexts.length > 1 && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRenderIntroImage}
                  disabled={isGeneratingIntro}
                  className="bg-[#FF7F50]/10 text-[#FF7F50] hover:bg-[#FF7F50]/20 border-[#FF7F50]/30"
                >
                  {isGeneratingIntro ? 'Rendering...' : 'Render with Text'}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* 内容部分 */}
        <div className="border-t-2 border-gray-200 pt-10">
          <h2 className="text-2xl font-bold mb-8">Story Content</h2>
          <div className="space-y-12">
            {/* 渲染内容图片 - 修改为传递左右图片URL */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) => {
              const image = imageStateMap[index];
              const isLoading = loadingStateMap[index];
              const onRegenerate = handleRegenerateMap[index];
              const textIndex = index + 1;
              const text = imageTexts && imageTexts.length > textIndex ? imageTexts[textIndex]?.text : undefined;
              
              return (
                <div key={index}>
                  <ContentImageCard
                    image={image}
                    leftImageUrl={localStorage.getItem(`loveStoryContentImage${index}_left_url`) || undefined}
                    rightImageUrl={localStorage.getItem(`loveStoryContentImage${index}_right_url`) || undefined}
                    isGenerating={isLoading || false}
                    onEditText={() => {}}
                    onRegenerate={onRegenerate}
                    index={index}
                    text={text}
                    title={`Moment ${index}`}
                  />
                  
                  {/* 添加渲染按钮 */}
                  {image && imageTexts && imageTexts.length > textIndex && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRenderContentImage(index)}
                        disabled={isLoading || false}
                        className="bg-[#FF7F50]/10 text-[#FF7F50] hover:bg-[#FF7F50]/20 border-[#FF7F50]/30"
                      >
                        {isLoading ? 'Rendering...' : 'Render with Text'}
                      </Button>
          </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 添加封底预览部分 */}
        <div className="mb-16 border-t-2 border-gray-200 pt-10">
          <h2 className="text-2xl font-bold mb-4">Back Cover Preview</h2>
          <p className="text-gray-500 mb-8">This is how your back cover will appear in the final book.</p>
          
          <BackCoverPreviewCard 
            authorName={authorName}
            backCoverText={backCoverText}
          />
        </div>
      </div>
    </WizardStep>
  );
};

export default GenerateStep;
