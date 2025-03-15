import React, { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage, getAllImagesFromStorage, deleteImageFromStorage } from '@/integrations/supabase/storage';
import { CoverPreviewCard } from './components/CoverPreviewCard';
import { ContentImageCard } from './components/ContentImageCard';

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

  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [supabaseImages, setSupabaseImages] = useState<SupabaseImage[]>([]);

  const { toast } = useToast();

  // Add state for tracking Supabase image URLs
  const [imageStorageMap, setImageStorageMap] = useState<ImageStorageMap>({});

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

  const handleGenericContentRegeneration = async (index: number, style?: string) => {
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
    
    // Clear existing localStorage entry
    localStorage.removeItem(lsKey);

    // 获取当前图片的URL，用于后续删除
    const currentImageUrl = localStorage.getItem(`${lsKey}_url`);
    
    // 查找当前图片在Supabase中的路径
    let currentImagePath = '';
    if (currentImageUrl) {
      // 从URL中提取路径
      const currentImageName = currentImageUrl.split('/').pop();
      if (currentImageName) {
        // 找到对应的图片对象
        const currentImage = supabaseImages.find(img => img.name.includes(currentImageName));
        if (currentImage) {
          currentImagePath = currentImage.name;
        }
      }
    }

    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    
    // 获取多张照片
    let characterPhotos: string[] = [];
    try {
      const savedPhotos = localStorage.getItem('loveStoryPartnerPhotos');
      if (savedPhotos) {
        const parsedPhotos = JSON.parse(savedPhotos);
        if (Array.isArray(parsedPhotos) && parsedPhotos.length > 0) {
          characterPhotos = parsedPhotos;
        }
      }
      
      // 向后兼容：如果没有找到多张照片，尝试获取单张照片
      if (characterPhotos.length === 0) {
        const singlePhoto = localStorage.getItem('loveStoryPartnerPhoto');
        if (singlePhoto) {
          characterPhotos = [singlePhoto];
        }
      }
    } catch (error) {
      console.error('Error parsing character photos:', error);
    }
    
    if (!savedPrompts || characterPhotos.length === 0) {
      toast({
        title: "Missing info",
        description: "No prompts or character photos found",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prompts = JSON.parse(savedPrompts);
      // 修复索引问题 - 确保正确访问提示数组
      // 使用index+1因为prompts[0]是封面，prompts[1]是intro，content从prompts[2]开始
      const promptIndex = index + 1 <= prompts.length ? index + 1 : prompts.length - 1;
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

      // 使用更明确的请求格式
      const requestBody = {
        prompt: prompts[promptIndex].prompt,
        photos: characterPhotos,
        style: imageStyle,
        contentIndex: index,  // 明确指定内容索引
        type: 'content'       // 明确内容类型
      };

      console.log(`Content ${index} generation request (using prompt ${promptIndex}):`, JSON.stringify(requestBody));

      // Include style in the request
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: requestBody
      });
      
      if (error) throw error;

      console.log(`Content ${index} generation response:`, data);

      // 后端可能返回 { output: [...]} 或 { contentImageX: [...] }
      const imageUrl = data?.[`contentImage${index}`]?.[0] || data?.output?.[0];
      if (!imageUrl) {
        throw new Error("No image generated from generate-love-cover");
      }

      // 2) 调用expand-image进行扩展
      const expandedBase64 = await expandImage(imageUrl);

      // 使用时间戳确保文件名唯一
      const timestamp = Date.now();

      // 3) Upload to Supabase Storage instead of localStorage - 修复文件名问题
      // 使用明确的数字标识符和时间戳
      const storageUrl = await uploadImageToStorage(
        expandedBase64, 
        'images', 
        `love-story-content-${index}-${timestamp}`
      );

      // 4) Update state and storage map
      setContentFn(expandedBase64);
      setImageStorageMap(prev => ({
        ...prev,
        [lsKey]: {
          localStorageKey: lsKey,
          url: storageUrl
        }
      }));

      // 5) Store only the URL reference in localStorage
      localStorage.setItem(`${lsKey}_url`, storageUrl);

      // 6) 删除旧图片
      if (currentImagePath) {
        try {
          await deleteImageFromStorage(currentImagePath, 'images');
          console.log(`Deleted old image: ${currentImagePath}`);
        } catch (deleteErr) {
          console.error(`Failed to delete old image: ${currentImagePath}`, deleteErr);
          // 继续处理，即使删除失败
        }
      }

      // 7) 延迟刷新图片列表，确保上传完成
      setTimeout(() => {
        loadImagesFromSupabase();
      }, 1000);

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

  const generateInitialImages = async (prompts: string, partnerPhoto: string) => {
    setIsGeneratingCover(true);
    setIsGeneratingIntro(true);
    toast({
      title: "Generating images",
      description: "This may take a minute...",
    });

    try {
      // 获取当前图片的URL，用于后续删除
      const currentCoverImageUrl = localStorage.getItem('loveStoryCoverImage_url');
      const currentIntroImageUrl = localStorage.getItem('loveStoryIntroImage_url');
      
      // 查找当前图片在Supabase中的路径
      let currentCoverImagePath = '';
      let currentIntroImagePath = '';
      
      if (currentCoverImageUrl) {
        const currentCoverImageName = currentCoverImageUrl.split('/').pop();
        if (currentCoverImageName) {
          const currentImage = supabaseImages.find(img => img.name.includes(currentCoverImageName));
          if (currentImage) {
            currentCoverImagePath = currentImage.name;
          }
        }
      }
      
      if (currentIntroImageUrl) {
        const currentIntroImageName = currentIntroImageUrl.split('/').pop();
        if (currentIntroImageName) {
          const currentImage = supabaseImages.find(img => img.name.includes(currentIntroImageName));
          if (currentImage) {
            currentIntroImagePath = currentImage.name;
          }
        }
      }

      // 获取多张照片
      let characterPhotos: string[] = [];
      try {
        const savedPhotos = localStorage.getItem('loveStoryPartnerPhotos');
        if (savedPhotos) {
          const parsedPhotos = JSON.parse(savedPhotos);
          if (Array.isArray(parsedPhotos) && parsedPhotos.length > 0) {
            characterPhotos = parsedPhotos;
          }
        }
        
        // 向后兼容：如果没有找到多张照片，使用传入的单张照片
        if (characterPhotos.length === 0 && partnerPhoto) {
          characterPhotos = [partnerPhoto];
        }
      } catch (error) {
        console.error('Error parsing character photos:', error);
        // 向后兼容：如果解析失败，使用传入的单张照片
        if (partnerPhoto) {
          characterPhotos = [partnerPhoto];
        }
      }
      
      if (characterPhotos.length === 0) {
        throw new Error("No character photos found");
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
          prompt: promptsObj[0].prompt,          // 封面使用prompts[0]
          contentPrompt: promptsObj[1].prompt,   // intro使用prompts[1]
          content2Prompt: promptsObj[2].prompt,  // Moment 1使用prompts[2]
          photos: characterPhotos,
          style: selectedStyle
        }
      });

      if (error) throw error;

      if (data?.output?.[0]) {
        const coverImageData = data.output[0];
        setCoverImage(coverImageData);
        
        // 使用时间戳确保文件名唯一
        const timestamp = Date.now();
        
        // Upload to Supabase Storage
        const storageUrl = await uploadImageToStorage(
          coverImageData, 
          'images', 
          `love-story-cover-${timestamp}`
        );
        
        // Update storage map
        setImageStorageMap(prev => ({
          ...prev,
          ['loveStoryCoverImage']: {
            localStorageKey: 'loveStoryCoverImage',
            url: storageUrl
          }
        }));
        
        // Store only the URL reference in localStorage
        localStorage.setItem('loveStoryCoverImage_url', storageUrl);
        
        // 删除旧封面图片
        if (currentCoverImagePath) {
          try {
            await deleteImageFromStorage(currentCoverImagePath, 'images');
            console.log(`Deleted old cover image: ${currentCoverImagePath}`);
          } catch (deleteErr) {
            console.error(`Failed to delete old cover image: ${currentCoverImagePath}`, deleteErr);
            // 继续处理，即使删除失败
          }
        }
      }

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
        loadImagesFromSupabase();
      }, 1000);
    } catch (err: any) {
      console.error("Error generating images:", err);
      toast({
        title: "Error generating images",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCover(false);
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
          setCoverImage(img.url);
          newImageMap['loveStoryCoverImage'] = {
            localStorageKey: 'loveStoryCoverImage',
            url: img.url
          };
          localStorage.setItem('loveStoryCoverImage_url', img.url);
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
    
    // 直接从Supabase加载所有图片，不再使用localStorage
    loadImagesFromSupabase();

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
    localStorage.removeItem('loveStoryCoverImage_url');
    
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const characterPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && characterPhoto) {
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
          // 修复JSON循环引用错误 - 简化请求对象
          const requestBody = { 
            prompt: prompts[0].prompt, 
            photo: characterPhoto,
            style: imageStyle,
            type: 'cover'  // 使用明确的type标识
          };

          console.log('Cover generation request:', JSON.stringify(requestBody));
          
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: requestBody
          });
          
          if (error) throw error;

          console.log('Cover generation response:', data);

          // 更详细地检查和处理响应数据
          let coverImageData = '';
          if (data?.output && data.output.length > 0) {
            coverImageData = data.output[0];
          } else if (data?.coverImage && data.coverImage.length > 0) {
            coverImageData = data.coverImage[0];
          } else {
            throw new Error("No cover image data in response");
          }
          
          if (coverImageData) {
            // 尝试扩展图片
            try {
              const expandedBase64 = await expandImage(coverImageData);
              coverImageData = expandedBase64;
            } catch (expandError) {
              console.error("Error expanding cover image:", expandError);
              // 即使扩展失败，继续使用原始图片
            }
            
            setCoverImage(coverImageData);
            
            // 使用时间戳确保文件名唯一
            const timestamp = Date.now();
            
            // Upload to Supabase Storage
            const storageUrl = await uploadImageToStorage(
              coverImageData, 
              'images', 
              `love-story-cover-${timestamp}`
            );
            
            // Update storage map
            setImageStorageMap(prev => ({
              ...prev,
              ['loveStoryCoverImage']: {
                localStorageKey: 'loveStoryCoverImage',
                url: storageUrl
              }
            }));
            
            // Store only the URL reference in localStorage
            localStorage.setItem('loveStoryCoverImage_url', storageUrl);

            // 延迟刷新图片列表，确保上传完成
            setTimeout(() => {
              loadImagesFromSupabase();
            }, 1000);
            
            toast({
              title: "Cover regenerated",
              description: `Cover updated with ${imageStyle} style`,
            });
          } else {
            throw new Error("Failed to generate cover image");
          }
        } catch (error: any) {
          console.error('Error regenerating cover:', error);
          toast({
            title: "Error regenerating cover image",
            description: error.message || "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingCover(false);
        }
      }
    }
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
              loadImagesFromSupabase();
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
    
    // 修正：图像索引与文本索引对应关系
    // 根据新逻辑，图像索引1-10对应文本索引2-11(moment3-12重命名为moment1-10)
    const textIndex = imageIndex + 1; // +1是因为text[0]是cover，text[1]是intro
    const imageText = imageTexts && imageTexts.length > textIndex ? imageTexts[textIndex] : null;
    
    // 显示标题适配新的命名方式 - 显示为Moment 1-10
    let title = "";  // 不再显示标题
    
    return (
      <div>
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

  // 添加刷新图片的函数
  const refreshImages = () => {
    loadImagesFromSupabase();
    toast({
      title: "Refreshing images",
      description: "Loading latest images from Supabase Storage",
    });
  };

  return (
    <WizardStep
      title="Your Love Story Images"
      description="Here are your personalized love story images with accompanying text."
      previousStep="/create/love/love-story/debug-prompts"
      nextStep="/create/love/love-story/format"
      currentStep={7}
      totalSteps={9}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* 添加刷新按钮 */}
        <div className="mb-8 flex justify-end">
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
      
        {/* Cover section - 保持原来大小 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-8">Cover</h2>
          <div className="max-w-xl mx-auto">
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
        </div>
        
        {/* 介绍部分 - 将Intro与其他Content分开 */}
        <div className="mb-16 border-t-2 border-gray-200 pt-10">
          <h2 className="text-2xl font-bold mb-8">Introduction</h2>
          <div className="mb-8">
            <ContentImageCard 
              image={introImage} 
              isGenerating={isGeneratingIntro}
              onRegenerate={handleRegenerateIntro}
              index={0}
              onEditText={() => {}}
              text={imageTexts && imageTexts.length > 1 ? imageTexts[1]?.text : undefined}
              title=""
            />
          </div>
        </div>
        
        {/* 内容部分 */}
        <div className="border-t-2 border-gray-200 pt-10">
          <h2 className="text-2xl font-bold mb-8">Story Content</h2>
          <div className="space-y-12">
            {/* 只渲染内容图片，跳过介绍图片 */}
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
      </div>
    </WizardStep>
  );
};

export default GenerateStep;
