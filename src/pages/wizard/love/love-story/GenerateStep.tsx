import React, { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage, getAllImagesFromStorage, deleteImageFromStorage } from '@/integrations/supabase/storage';
import { CoverPreviewCard } from './components/CoverPreviewCard';
import { ContentImageCard } from './components/ContentImageCard';
import { Edit, Wand2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// 导入工具函数
import { expandImage, handleGenericContentRegeneration as handleContentRegeneration } from './utils/imageProcessingUtils';
import { renderContentImage, createImageStateMaps } from './utils/renderUtils';
import { loadImagesFromSupabase as fetchImagesFromSupabase } from './utils/storageUtils';
import { renderAndUploadContentImage, renderAndUploadIntroImage } from './utils/canvasUtils';
import { generateBlessing, renderAndUploadBlessing } from './utils/blessingUtils';

interface ImageText {
  text: string;
  tone: string;
}

// Interface to track image storage locations
interface ImageStorageMap {
  [key: string]: {
    localStorageKey: string;
    url?: string;  // Supabase Storage URL
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

  // New state for blessing
  const [blessing, setBlessing] = useState<string>('');
  const [isGeneratingBlessing, setIsGeneratingBlessing] = useState(false);

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

  // Generate blessing function
  const handleGenerateBlessing = async () => {
    setIsGeneratingBlessing(true);
    
    try {
      // Get data from localStorage
      const characterName = localStorage.getItem('loveStoryCharacterName') || '';
      const partnerName = localStorage.getItem('loveStoryPartnerName') || '';
      const style = localStorage.getItem('loveStoryStyle') || 'Photographic (Default)';
      
      toast({
        title: "Generating blessing",
        description: "Creating a personalized blessing...",
      });
      
      // Generate blessing text
      const generatedBlessing = await generateBlessing(characterName, partnerName, style);
      setBlessing(generatedBlessing);
      
      // Store blessing in localStorage
      localStorage.setItem('loveStoryBlessing', generatedBlessing);
      
      // Render and upload blessing image
      const blessingImageUrl = await renderAndUploadBlessing(generatedBlessing);
      
      // Set this as the intro image
      setIntroImage(blessingImageUrl);
      
      // Update localStorage and imageStorageMap
      localStorage.setItem('loveStoryIntroImage_url', blessingImageUrl);
      setImageStorageMap(prev => ({
        ...prev,
        ['loveStoryIntroImage']: {
          localStorageKey: 'loveStoryIntroImage',
          url: blessingImageUrl
        }
      }));
      
      toast({
        title: "Blessing generated",
        description: "Your personalized blessing is ready!",
      });
      
      // Refresh images to show the new blessing image
      setTimeout(() => {
        refreshImagesCallback();
      }, 1000);
    } catch (error: any) {
      console.error("Error generating blessing:", error);
      toast({
        title: "Error generating blessing",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBlessing(false);
    }
  };

  // Generate initial images function - modified to include blessing
  const generateInitialImages = async (prompts: string, partnerPhoto: string) => {
    setIsGeneratingIntro(true);
    toast({
      title: "Generating images",
      description: "This may take a minute...",
    });

    try {
      // Generate blessing if it doesn't exist yet
      if (!blessing) {
        const characterName = localStorage.getItem('loveStoryCharacterName') || '';
        const partnerName = localStorage.getItem('loveStoryPartnerName') || '';
        const style = localStorage.getItem('loveStoryStyle') || 'Photographic (Default)';
        
        const generatedBlessing = await generateBlessing(characterName, partnerName, style);
        setBlessing(generatedBlessing);
        localStorage.setItem('loveStoryBlessing', generatedBlessing);
        
        // Render and upload blessing image
        const blessingImageUrl = await renderAndUploadBlessing(generatedBlessing);
        setIntroImage(blessingImageUrl);
        localStorage.setItem('loveStoryIntroImage_url', blessingImageUrl);
        setImageStorageMap(prev => ({
          ...prev,
          ['loveStoryIntroImage']: {
            localStorageKey: 'loveStoryIntroImage',
            url: blessingImageUrl
          }
        }));
      }
      
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
    
    // Load blessing from localStorage if it exists
    const savedBlessing = localStorage.getItem('loveStoryBlessing');
    if (savedBlessing) {
      setBlessing(savedBlessing);
    }
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

  // Handle regenerate intro - modified to use blessing
  const handleRegenerateIntro = async () => {
    setIsGeneratingBlessing(true);
    
    try {
      // Get data from localStorage
      const characterName = localStorage.getItem('loveStoryCharacterName') || '';
      const partnerName = localStorage.getItem('loveStoryPartnerName') || '';
      const style = localStorage.getItem('loveStoryStyle') || 'Photographic (Default)';
      
      toast({
        title: "Regenerating blessing",
        description: "Creating a new personalized blessing...",
      });
      
      // Generate new blessing text
      const generatedBlessing = await generateBlessing(characterName, partnerName, style);
      setBlessing(generatedBlessing);
      
      // Store blessing in localStorage
      localStorage.setItem('loveStoryBlessing', generatedBlessing);
      
      // Render and upload blessing image
      const blessingImageUrl = await renderAndUploadBlessing(generatedBlessing);
      
      // Set this as the intro image
      setIntroImage(blessingImageUrl);
      
      // Update localStorage and imageStorageMap
      localStorage.setItem('loveStoryIntroImage_url', blessingImageUrl);
      setImageStorageMap(prev => ({
        ...prev,
        ['loveStoryIntroImage']: {
          localStorageKey: 'loveStoryIntroImage',
          url: blessingImageUrl
        }
      }));
      
      toast({
        title: "Blessing regenerated",
        description: "Your new personalized blessing is ready!",
      });
      
      // Refresh images to show the new blessing image
      setTimeout(() => {
        refreshImagesCallback();
      }, 1000);
    } catch (error: any) {
      console.error("Error regenerating blessing:", error);
      toast({
        title: "Error regenerating blessing",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBlessing(false);
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
      // 获取介绍图片和文本
      if (!introImage) {
        toast({
          title: "Error",
          description: "No intro image found",
          variant: "destructive",
        });
        return;
      }
      
      // 获取介绍文本 - 索引1对应intro
      const introText = imageTexts && imageTexts.length > 1 ? imageTexts[1].text : "";
      
      toast({
        title: "Rendering intro image",
        description: "Processing introduction with text...",
      });
      
      // 设置加载状态
      setIsGeneratingIntro(true);
      
      // 渲染并上传图片
      const storageUrl = await renderAndUploadIntroImage(
        introImage,
        introText || "Welcome to our love story.",
        selectedStyle,
        supabaseImages
      );
      
      // 更新状态 - 直接使用渲染后的图片URL
      setIntroImage(storageUrl);
      
      // 更新localStorage
      localStorage.setItem('loveStoryIntroImage_url', storageUrl);
      
      // 更新imageStorageMap
      setImageStorageMap(prev => ({
        ...prev,
