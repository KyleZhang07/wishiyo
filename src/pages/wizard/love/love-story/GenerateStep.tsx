import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage, getAllImagesFromStorage, deleteImageFromStorage } from '@/integrations/supabase/storage';
import { ContentImageCard } from './components/ContentImageCard';
import { useNavigate } from 'react-router-dom';
import { useRenderContext } from '@/context/RenderContext';

// 导入工具函数
import { handleGenericContentRegeneration as handleContentRegeneration, expandImage } from './utils/imageProcessingUtils';
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

  // 添加数据准备状态
  const [isWaitingForData, setIsWaitingForData] = useState(true);
  const [dataCheckInterval, setDataCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // 样式和内容
  const [selectedStyle, setSelectedStyle] = useState<string>(() => {
    // 从 localStorage 读取风格或使用默认值
    const savedStyle = localStorage.getItem('loveStoryStyle');
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
      return styleMapping[savedStyle] || savedStyle;
    }
    return 'Photographic (Default)';
  });
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

  // 使用渲染上下文
  const {
    isRenderingCover,
    coverRenderComplete,
    coverImageUrl,
    backCoverImageUrl,
    spineImageUrl
  } = useRenderContext();


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
      () => {}, // 移除refreshImagesCallback
      autoRenderContentImage  // 传入自动渲染函数
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

  // 自动渲染intro图片函数
  const autoRenderIntroImage = async (imageData: string, fontId?: string) => {
    try {
      // 获取对应的文本 - intro图片对应文本索引1
      // 从 localStorage 直接读取 imageTexts，确保有最新数据
      let text = "";
      const savedTexts = localStorage.getItem('loveStoryImageTexts');
      if (savedTexts) {
        try {
          const parsedTexts = JSON.parse(savedTexts);
          if (parsedTexts && Array.isArray(parsedTexts) && parsedTexts.length > 1) {
            text = parsedTexts[1].text || "";
          }
        } catch (error) {
          console.error('Error parsing saved texts in autoRenderIntroImage:', error);
        }
      }

      // 如果从 localStorage 读取失败，则尝试使用状态变量
      if (!text && imageTexts && imageTexts.length > 1) {
        text = imageTexts[1].text || "";
      }

      // 设置加载状态
      setIsGeneratingIntro(true);

      // 获取字体ID，如果没有提供则从localStorage获取
      const currentFontId = fontId || localStorage.getItem('loveStoryFont_0') || 'patrick-hand';

      // 渲染并上传图片
      const result = await renderAndUploadIntroImage(
        imageData,
        text || "A beautiful moment captured in this image.",
        selectedStyle,
        supabaseImages,
        currentFontId
      );

      // 更新localStorage
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

      console.log('Intro image rendered successfully with text:', text);
    } catch (renderError: any) {
      console.error('Error auto-rendering intro image:', renderError);
      // 移除toast通知，减少用户干扰
    } finally {
      // 重置加载状态
      setIsGeneratingIntro(false);
    }
  };

  // 自动渲染内容图片的通用函数
  const autoRenderContentImage = async (imageData: string, index: number, fontId?: string) => {
    // 定义加载状态设置函数的映射
    const loadingSetters: {[key: number]: (loading: boolean) => void} = {
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

    try {
      // 获取对应的文本
      // 根据注释，图像索引1-10对应文本索引2-11，因为text[0]是cover，text[1]是intro
      const textIndex = index + 1; // 图像索引对应文本索引

      // 从 localStorage 直接读取 imageTexts，确保有最新数据
      let text = "";
      const savedTexts = localStorage.getItem('loveStoryImageTexts');
      if (savedTexts) {
        try {
          const parsedTexts = JSON.parse(savedTexts);
          if (parsedTexts && Array.isArray(parsedTexts) && parsedTexts.length > textIndex) {
            text = parsedTexts[textIndex].text || "";
          }
        } catch (error) {
          console.error('Error parsing saved texts in autoRenderContentImage:', error);
        }
      }

      // 如果从 localStorage 读取失败，则尝试使用状态变量
      if (!text && imageTexts && imageTexts.length > textIndex) {
        text = imageTexts[textIndex].text || "";
      }

      // 设置加载状态
      const setLoadingFn = loadingSetters[index];
      if (setLoadingFn) setLoadingFn(true);

      // 获取字体ID，如果没有提供则从localStorage获取
      const currentFontId = fontId || localStorage.getItem(`loveStoryFont_${index}`) || 'patrick-hand';

      // 移除toast通知，减少用户干扰

      // 渲染并上传图片
      const result = await renderAndUploadContentImage(
        imageData,
        text || "A beautiful moment captured in this image.",
        index,
        selectedStyle,
        supabaseImages,
        currentFontId
      );

      // 更新localStorage
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

      // 清除原始图片（love-story-content-X 等）
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

      // 移除toast通知，减少用户干扰
    } catch (renderError: any) {
      console.error(`Error auto-rendering content image ${index}:`, renderError);
      // 移除toast通知，减少用户干扰
    } finally {
      // 重置加载状态
      const setLoadingFn = loadingSetters[index];
      if (setLoadingFn) setLoadingFn(false);
    }
  };

  // 新增加：从Supabase加载所有图片
  const loadImagesFromSupabase = async () => {
    setIsLoadingImages(true);
    try {
      // 获取当前会话ID
      const currentSessionId = localStorage.getItem('current_session_id');

      // 获取所有Supabase中的图片, 明确传递会话ID
      const images = await getAllImagesFromStorage('images', currentSessionId || undefined);

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



  const handleRegenerateIntro = async (style?: string) => {
    // 清除localStorage中的引用
    localStorage.removeItem('loveStoryIntroImage');

    // 获取当前图片的URL，用于后续删除
    const currentImageUrl = localStorage.getItem('loveStoryIntroImage_url');
    localStorage.removeItem('loveStoryIntroImage_url');

    // 查找当前图片在Supabase中的路径
    let currentImagePath = '';
    if (currentImageUrl) {
      // 从 URL 中提取文件名
      const currentImageName = currentImageUrl.split('/').pop();
      if (currentImageName) {
        // 在 supabaseImages 中查找包含该文件名的图片
        const currentImage = supabaseImages.find(img => img.name.includes(currentImageName));
        if (currentImage) {
          currentImagePath = currentImage.name;
        }
      }
    }

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
            prompt: prompts[1].prompt,
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
            // 尝试扩展图片 - 使用从 imageProcessingUtils 导入的 expandImage 函数
            try {
              console.log('Using imported expandImage function from imageProcessingUtils');
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

            // 删除旧图片
            if (currentImagePath) {
              try {
                await deleteImageFromStorage(currentImagePath, 'images');
                console.log(`Deleted old image: ${currentImagePath}`);
              } catch (deleteErr) {
                console.error(`Failed to delete old image: ${currentImagePath}`, deleteErr);
                // 继续处理，即使删除失败
              }
            }

            // 自动渲染intro图片
            try {
              await autoRenderIntroImage(introImageData);
              console.log('Intro image rendered successfully');
            } catch (renderError) {
              console.error('Error auto-rendering intro image:', renderError);
              // 继续处理，即使渲染失败
            }

            // 延迟刷新图片列表，确保上传完成
            setTimeout(() => {
              loadImagesFromSupabase();
            }, 1000);

            // 不需要显示成功通知，用户可以看到图片已更新
          } else {
            throw new Error("Failed to generate intro image");
          }
        } catch (error: any) {
          console.error('Error generating intro image:', error);
          toast({
            title: "Error generating intro image",
            description: error.message || "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingIntro(false);
        }
      }
    }
  };


  // 处理intro图片的字体变更
  const handleRenderIntroImage = async (fontId?: string) => {
    // 获取当前图片
    if (!introImage) {
      console.error('No intro image found');
      return;
    }

    try {
      // 获取旧的左右图片URL
      const oldLeftUrl = localStorage.getItem('loveStoryIntroImage_left_url');
      const oldRightUrl = localStorage.getItem('loveStoryIntroImage_right_url');

      // 使用autoRenderIntroImage函数渲染图片
      await autoRenderIntroImage(introImage, fontId);

      // 删除旧的左右图片
      if (oldLeftUrl || oldRightUrl) {
        try {
          // 查找所有包含旧URL的图片
          const oldImages = supabaseImages.filter(img => {
            // 从完整路径中提取文件名
            const pathParts = img.name.split('/');
            const fileName = pathParts[pathParts.length - 1];

            // 检查是否是旧的左右图片
            if (oldLeftUrl && oldLeftUrl.includes(fileName)) return true;
            if (oldRightUrl && oldRightUrl.includes(fileName)) return true;
            return false;
          });

          if (oldImages.length > 0) {
            console.log(`Found ${oldImages.length} old intro images to delete`);

            // 并行删除所有旧图片
            const deletePromises = oldImages.map(img => {
              // 从完整路径中提取文件名
              const pathParts = img.name.split('/');
              const filename = pathParts[pathParts.length - 1];
              console.log(`Deleting old intro image: ${filename}`);
              return deleteImageFromStorage(filename, 'images');
            });

            // 等待所有删除操作完成
            await Promise.all(deletePromises);
            console.log('Successfully deleted old intro images');
          }
        } catch (deleteError) {
          console.error('Error deleting old intro images:', deleteError);
          // 继续处理，即使删除失败
        }
      }

      // 移除toast通知，减少用户干扰

      // 刷新图片列表
      setTimeout(() => {
        loadImagesFromSupabase();
      }, 1000);
    } catch (error) {
      console.error('Error rendering intro image with font:', error);
      // 移除toast通知，减少用户干扰
    }
  };

  // 处理字体变更和内容图片重新渲染
  const handleRenderContentImage = async (index: number, fontId?: string) => {
    // 获取当前图片
    const currentImage = imageStateMap[index];
    if (!currentImage) {
      console.error(`No image found for index ${index}`);
      toast({
        title: "Rendering failed",
        description: "No image found to render with text",
        variant: "destructive",
      });
      return;
    }

    try {
      // 获取旧的左右图片URL
      const oldLeftUrl = localStorage.getItem(`loveStoryContentImage${index}_left_url`);
      const oldRightUrl = localStorage.getItem(`loveStoryContentImage${index}_right_url`);

      // 使用autoRenderContentImage函数渲染图片
      await autoRenderContentImage(currentImage, index, fontId);

      // 删除旧的左右图片
      if (oldLeftUrl || oldRightUrl) {
        try {
          // 查找所有包含旧URL的图片
          const oldImages = supabaseImages.filter(img => {
            // 从完整路径中提取文件名
            const pathParts = img.name.split('/');
            const fileName = pathParts[pathParts.length - 1];

            // 检查是否是旧的左右图片
            if (oldLeftUrl && oldLeftUrl.includes(fileName)) return true;
            if (oldRightUrl && oldRightUrl.includes(fileName)) return true;
            return false;
          });

          if (oldImages.length > 0) {
            console.log(`Found ${oldImages.length} old content images to delete for index ${index}`);

            // 并行删除所有旧图片
            const deletePromises = oldImages.map(img => {
              // 从完整路径中提取文件名
              const pathParts = img.name.split('/');
              const filename = pathParts[pathParts.length - 1];
              console.log(`Deleting old content image: ${filename}`);
              return deleteImageFromStorage(filename, 'images');
            });

            // 等待所有删除操作完成
            await Promise.all(deletePromises);
            console.log(`Successfully deleted old content images for index ${index}`);
          }
        } catch (deleteError) {
          console.error(`Error deleting old content images for index ${index}:`, deleteError);
          // 继续处理，即使删除失败
        }
      }

      // 移除toast通知，减少用户干扰

      // 刷新图片列表
      setTimeout(() => {
        loadImagesFromSupabase();
      }, 1000);
    } catch (error) {
      console.error(`Error rendering content image ${index} with font:`, error);
      toast({
        title: "Font update failed",
        description: "Could not apply the selected font. Please try again.",
        variant: "destructive",
      });
    }
  };

  // 使用状态变量直接创建映射，包含intro(index=0)
  const imageStateMap: {[key: number]: string} = {
    0: introImage || '',
    1: contentImage1 || '',
    2: contentImage2 || '',
    3: contentImage3 || '',
    4: contentImage4 || '',
    5: contentImage5 || '',
    6: contentImage6 || '',
    7: contentImage7 || '',
    8: contentImage8 || '',
    9: contentImage9 || '',
    10: contentImage10 || ''
  };
  const loadingStateMap: {[key: number]: boolean} = {
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
    10: isGeneratingContent10
  };
  const handleRegenerateMap: {[key: number]: (style?: string) => void} = {
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
    10: handleRegenerateContent10
  };

  // 检查封面是否需要重新渲染的函数
  const checkIfCoverNeedsRerender = () => {
    // 获取上次渲染时的封面信息
    const lastRenderedTitle = localStorage.getItem('lastRenderedCoverTitle');
    const lastRenderedSubtitle = localStorage.getItem('lastRenderedCoverSubtitle');
    const lastRenderedStyle = localStorage.getItem('lastRenderedCoverStyle');
    const lastRenderedAuthor = localStorage.getItem('lastRenderedAuthorName');
    const lastRenderedRecipient = localStorage.getItem('lastRenderedRecipientName');
    const lastRenderedImageIndex = localStorage.getItem('lastRenderedCoverImageIndex');

    // 获取当前封面信息
    const currentTitle = localStorage.getItem('loveStoryCoverTitle');
    const currentSubtitle = localStorage.getItem('loveStoryCoverSubtitle');
    const currentStyle = localStorage.getItem('loveStoryCoverStyle');
    const currentAuthor = localStorage.getItem('loveStoryAuthorName');
    const currentRecipient = localStorage.getItem('loveStoryPersonName');
    const currentImageIndex = localStorage.getItem('loveStorySelectedCoverIndex');

    // 如果任何一项发生变化，则需要重新渲染
    if (lastRenderedTitle !== currentTitle ||
        lastRenderedSubtitle !== currentSubtitle ||
        lastRenderedStyle !== currentStyle ||
        lastRenderedAuthor !== currentAuthor ||
        lastRenderedRecipient !== currentRecipient ||
        lastRenderedImageIndex !== currentImageIndex) {
      return true;
    }

    return false;
  };

  // 检查渲染状态
  useEffect(() => {
    if (coverRenderComplete && coverImageUrl) {
      setCoverImage(coverImageUrl);

      // 从 localStorage 加载祝福页面图片
      const savedBlessingImage = localStorage.getItem('loveStoryBlessingImage_url');
      if (savedBlessingImage) {
        setBlessingImage(savedBlessingImage);
      }

      // 保存当前封面信息作为最后渲染的状态
      localStorage.setItem('lastRenderedCoverTitle', localStorage.getItem('loveStoryCoverTitle') || '');
      localStorage.setItem('lastRenderedCoverSubtitle', localStorage.getItem('loveStoryCoverSubtitle') || '');
      localStorage.setItem('lastRenderedCoverStyle', localStorage.getItem('loveStoryCoverStyle') || '');
      localStorage.setItem('lastRenderedAuthorName', localStorage.getItem('loveStoryAuthorName') || '');
      localStorage.setItem('lastRenderedRecipientName', localStorage.getItem('loveStoryPersonName') || '');
      localStorage.setItem('lastRenderedCoverImageIndex', localStorage.getItem('loveStorySelectedCoverIndex') || '');
    }
  }, [coverRenderComplete, coverImageUrl]);

  // 检查是否已生成所有内容图片（包括intro作为content[0]和常规content图片）
  // 封面和祝福语有自己的处理逻辑，不在这里检查
  const checkIfAllImagesGenerated = () => {
    // 检查intro图片(作为content[0])
    const introImageUrl = localStorage.getItem('loveStoryIntroImage_url');
    if (!introImageUrl) {
      return false;
    }

    // 检查所有常规内容图片(index=1-10)
    for (let i = 1; i <= 10; i++) {
      const contentImageUrl = localStorage.getItem(`loveStoryContentImage${i}_url`);
      if (!contentImageUrl) {
        return false;
      }
    }

    // 如果intro和所有content图片都已生成，返回 true
    return true;
  };

  // 检查所有内容图片是否已生成
  const checkAllContentImagesGenerated = () => {
    // 检查intro图片(作为content[0])
    const introImageUrl = localStorage.getItem('loveStoryIntroImage_url');

    // 检查所有content图片，包括intro(index=0)和常规content(index=1-10)
    const contentImagesStatus = [];

    // 添加intro作为content[0]
    contentImagesStatus.push({
      index: 0,
      isGenerated: !!introImageUrl,
      imageState: introImage
    });

    // 添加常规content图片(index=1-10)
    for (let i = 1; i <= 10; i++) {
      const imageUrl = localStorage.getItem(`loveStoryContentImage${i}_url`);

      contentImagesStatus.push({
        index: i,
        isGenerated: !!imageUrl,
        imageState: imageStateMap[i]
      });
    }

    return {
      intro: {
        isGenerated: !!introImageUrl,
        imageState: introImage
      },
      contentImages: contentImagesStatus
    };
  };

  // 自动生成所有未生成的图片 - 使用Promise.all并发生成
  const autoGenerateAllImages = async () => {
    console.log('Checking for ungenerated images...');

    // 首先检查数据是否准备好
    const isDataReady = checkIfDataReady();
    if (!isDataReady) {
      console.log('Data is not ready yet, cannot generate images');
      // 设置等待状态，这将在UI中显示生成中的状态
      setIsWaitingForData(true);
      return;
    }

    // 数据准备好后，继续生成过程
    setIsWaitingForData(false);

    // 检查是否正在加载图片
    if (isLoadingImages) {
      console.log('Images are currently loading, skipping generation');
      return;
    }

    // 再次检查是否已生成所有图片
    if (checkIfAllImagesGenerated()) {
      console.log('All images are already generated, no need to generate again');
      return;
    }

    const generationStatus = checkAllContentImagesGenerated();

    // 输出详细的生成状态信息
    console.log('Generation status:', JSON.stringify(generationStatus, null, 2));

    // 获取必要的数据
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const characterPhoto = localStorage.getItem('loveStoryPartnerPhoto');

    console.log('savedPrompts exists:', !!savedPrompts);
    console.log('characterPhoto exists:', !!characterPhoto);

    if (savedPrompts) {
      try {
        const parsedPrompts = JSON.parse(savedPrompts);
        console.log('Parsed prompts length:', parsedPrompts.length);
        console.log('First few prompts:', parsedPrompts.slice(0, 3));
      } catch (error) {
        console.error('Error parsing prompts:', error);
      }
    }

    // 这些检查在checkIfDataReady中已经做过，这里是额外的安全检查
    if (!savedPrompts || !characterPhoto) {
      console.log('Missing prompts or character photo, cannot generate images');
      return;
    }

    const prompts = JSON.parse(savedPrompts);
    if (!prompts || prompts.length < 11) { // 需要至少11个提示（封面+引导+9个内容）
      console.log('Not enough prompts for image generation, found:', prompts ? prompts.length : 0);
      return;
    }

    // 创建生成任务数组
    const generationTasks = [];

    // 将intro图片(index=0)作为content图片的一部分处理
    // 检查intro图片是否需要生成
    const isIntroGenerating = localStorage.getItem('loveStoryContent0Generating'); // 使用统一的命名方式
    const introGeneratingTimestamp = isIntroGenerating ? parseInt(isIntroGenerating) : 0;
    const currentTime = Date.now();
    const isIntroGeneratingExpired = currentTime - introGeneratingTimestamp > 5 * 60 * 1000; // 5分钟过期

    // 添加intro图片生成任务（如果需要且没有正在生成）
    if (!generationStatus.intro.isGenerated && (!isIntroGenerating || isIntroGeneratingExpired)) {
      console.log('Adding intro image generation task (as content[0])...');
      generationTasks.push({
        type: 'content',
        index: 0, // 将intro作为index=0的content处理
        task: async () => {
          try {
            // 设置正在生成标记，使用统一的命名方式
            localStorage.setItem('loveStoryContent0Generating', Date.now().toString());

            await handleRegenerateIntro();
            console.log('Content image 0 (intro) generated successfully');

            // 清除生成标记
            localStorage.removeItem('loveStoryContent0Generating');

            return true;
          } catch (error) {
            console.error('Error auto-generating content image 0 (intro):', error);
            // 即使出错也清除生成标记
            localStorage.removeItem('loveStoryContent0Generating');
            return false;
          }
        }
      });
    }

    // 添加所有content图片生成任务（如果需要）
    for (const contentImage of generationStatus.contentImages) {
      // Skip index 0 (intro image) as it's handled separately above
      if (contentImage.index === 0) {
        continue;
      }

      // 检查是否有正在生成的标记
      const isContentGenerating = localStorage.getItem(`loveStoryContent${contentImage.index}Generating`);
      const contentGeneratingTimestamp = isContentGenerating ? parseInt(isContentGenerating) : 0;
      const currentTime = Date.now();
      const isContentGeneratingExpired = currentTime - contentGeneratingTimestamp > 5 * 60 * 1000; // 5分钟过期

      if (!contentImage.isGenerated && (!isContentGenerating || isContentGeneratingExpired)) {
        console.log(`Adding content image ${contentImage.index} generation task...`);
        const regenerateFunction = handleRegenerateMap[contentImage.index];
        if (regenerateFunction) {
          generationTasks.push({
            type: 'content',
            index: contentImage.index,
            task: async () => {
              try {
                // 设置正在生成标记
                localStorage.setItem(`loveStoryContent${contentImage.index}Generating`, Date.now().toString());

                await regenerateFunction();
                console.log(`Content image ${contentImage.index} generated successfully`);

                // 清除生成标记
                localStorage.removeItem(`loveStoryContent${contentImage.index}Generating`);

                return true;
              } catch (error) {
                console.error(`Error auto-generating content image ${contentImage.index}:`, error);
                // 即使出错也清除生成标记
                localStorage.removeItem(`loveStoryContent${contentImage.index}Generating`);
                return false;
              }
            }
          });
        }
      }
    }

    // 如果没有需要生成的图片，直接返回
    if (generationTasks.length === 0) {
      console.log('All images already generated');
      return;
    }

    console.log(`Starting parallel generation of ${generationTasks.length} images...`);

    // 设置正在生成状态，防止重复生成
    setIsLoadingImages(true);

    // 并发执行所有生成任务，每个任务之间有小的延迟以避免请求过快
    try {
      const results = await Promise.all(
        generationTasks.map(async (task, index) => {
          // 添加随机延迟，避免所有请求同时发出
          await new Promise(resolve => setTimeout(resolve, index * 200));
          return task.task();
        })
      );

      // 统计生成结果
      const successCount = results.filter(result => result).length;
      console.log(`Image generation completed: ${successCount}/${generationTasks.length} successful`);

      // 生成完成后加载最新图片
      await loadImagesFromSupabase();
    } catch (error) {
      console.error('Error during parallel image generation:', error);
      // 出错时也重置加载状态
      setIsLoadingImages(false);
    }
  };

  // 检查数据是否准备完成
  const checkIfDataReady = () => {
    // 检查imageTexts是否已加载 - 直接从localStorage读取，而不是依赖状态变量
    const savedTexts = localStorage.getItem('loveStoryImageTexts');
    let hasImageTexts = false;
    let parsedTexts = null;

    if (savedTexts) {
      try {
        parsedTexts = JSON.parse(savedTexts);
        hasImageTexts = parsedTexts && Array.isArray(parsedTexts) && parsedTexts.length > 0;

        // 如果有数据但状态变量为空，更新状态变量
        if (hasImageTexts && (!imageTexts || imageTexts.length === 0)) {
          setImageTexts(parsedTexts);
          console.log('Updated imageTexts state from localStorage');
        }
      } catch (error) {
        console.error('Error parsing saved texts:', error);
      }
    }

    // 检查imagePrompts是否已生成
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    let hasImagePrompts = false;

    if (savedPrompts) {
      try {
        const parsedPrompts = JSON.parse(savedPrompts);
        hasImagePrompts = parsedPrompts && parsedPrompts.length >= 11; // 需要至少11个提示
      } catch (error) {
        console.error('Error parsing prompts:', error);
      }
    }

    // 检查角色照片是否存在
    const characterPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    const hasCharacterPhoto = !!characterPhoto;

    // 输出详细日志
    console.log('Data readiness check:');
    console.log('- Has imageTexts (from localStorage):', hasImageTexts, parsedTexts ? `(${parsedTexts.length} items)` : '(0 items)');
    console.log('- Has imageTexts (from state):', imageTexts.length > 0, `(${imageTexts.length} items)`);
    console.log('- Has imagePrompts:', hasImagePrompts);
    console.log('- Has characterPhoto:', hasCharacterPhoto);

    // 所有数据都准备好时返回true
    return hasImageTexts && hasImagePrompts && hasCharacterPhoto;
  };

  // 组件加载后首先检查是否已生成所有图片，如果是则直接加载显示
  useEffect(() => {
    console.log('GenerateStep component mounted, checking if all images are already generated');

    // 首先检查是否已生成所有图片
    const checkAndLoadImages = async () => {
      // 检查是否已生成所有图片
      const allImagesGenerated = checkIfAllImagesGenerated();

      if (allImagesGenerated) {
        console.log('All images are already generated, loading from Supabase...');
        // 直接从 Supabase 加载图片
        await loadImagesFromSupabase();
        // 不需要进一步检查和生成
        setIsWaitingForData(false);
        return;
      }

      // 如果未生成所有图片，检查数据是否准备好
      checkDataAndGenerateImages();
    };

    // 检查数据是否准备好并生成图片
    const checkDataAndGenerateImages = () => {
      const isDataReady = checkIfDataReady();

      if (isDataReady) {
        console.log('Data is ready, starting image generation...');
        setIsWaitingForData(false);

        // 开始生成图片
        if (!isLoadingImages) {
          console.log('Executing autoGenerateAllImages...');
          autoGenerateAllImages();
        }
      } else {
        console.log('Data is not ready yet, will check again in 2 seconds');
        setIsWaitingForData(true);

        // 如果数据还没准备好，设置一个一次性的定时器再次检查
        const timeout = setTimeout(() => {
          checkDataAndGenerateImages();
        }, 2000);

        // 保存定时器ID以便清除
        setDataCheckInterval(timeout);
      }
    };

    // 立即执行检查
    checkAndLoadImages();

    // 组件卸载时清除定时器
    return () => {
      if (dataCheckInterval) {
        clearTimeout(dataCheckInterval);
      }
    };
  }, []); // 只在组件加载时执行一次

  // 渲染祝福语图片
  const handleRenderBlessingImage = async () => {
    try {
      setIsGeneratingBlessing(true);

      // 不需要显示渲染开始的通知，用户可以看到UI变化

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

      // 移除toast通知，减少用户干扰

      // 刷新图片列表
      setTimeout(() => {
        loadImagesFromSupabase();
      }, 1000);
    } catch (error: any) {
      console.error('Error rendering blessing image:', error);
      toast({
        title: "Blessing creation failed",
        description: "Could not create your blessing message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBlessing(false);
    }
  };

  return (
    <WizardStep
      title="Create Your Story"
      description="We're crafting your picture book and will be ready in minutes."
      previousStep="/create/love/love-story/cover"
      nextStep="/create/love/love-story/format"
      currentStep={7}
      totalSteps={8}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* 删除渲染中的加载状态提示 */}

        {/* Cover section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-8">Cover</h2>
          <div className="max-w-xl mx-auto">
            {isRenderingCover ? (
              <div className="max-w-[640px] mx-auto aspect-[1/1] bg-white rounded-lg shadow-lg flex flex-col items-center justify-center">
                <div className="relative w-8 h-8 mb-2">
                  <div className="absolute inset-0 rounded-full border-t-2 border-[#FF7F50] animate-spin"></div>
                </div>
                <p className="text-sm font-medium text-[#FF7F50]">
                  Generating cover
                </p>
              </div>
            ) : (coverRenderComplete && coverImageUrl) ? (
              <img
                src={coverImageUrl}
                alt="Love Story Cover"
                className="max-w-[640px] mx-auto w-full h-auto rounded-lg shadow-lg"
              />
            ) : coverImage ? (
              <img
                src={coverImage}
                alt="Love Story Cover"
                className="max-w-[640px] mx-auto w-full h-auto rounded-lg shadow-lg"
              />
            ) : (
              <div className="max-w-[640px] mx-auto aspect-[1/1] bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Cover image not available</p>
              </div>
            )}
          </div>
        </div>

        {/* 祝福语部分 - 在Cover和Content之间 */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8">Blessing</h2>
          <div className="max-w-xl mx-auto">
            {/* 祝福语预览 - 与cover加载状态保持一致 */}
            {isRenderingCover || isGeneratingBlessing ? (
              <div className="max-w-[640px] mx-auto aspect-[1/1] bg-white rounded-lg shadow-lg flex flex-col items-center justify-center">
                <div className="relative w-8 h-8 mb-2">
                  <div className="absolute inset-0 rounded-full border-t-2 border-[#FF7F50] animate-spin"></div>
                </div>
                <p className="text-sm font-medium text-[#FF7F50]">
                  Generating blessing
                </p>
              </div>
            ) : blessingImage ? (
              <img
                src={blessingImage}
                alt="Blessing Message"
                className="max-w-[640px] mx-auto w-full h-auto rounded-lg shadow-lg"
              />
            ) : (
              <div className="max-w-[640px] mx-auto aspect-[1/1] bg-white rounded-lg shadow-lg flex flex-col items-center justify-center">
                <div className="relative w-8 h-8 mb-2">
                  <div className="absolute inset-0 rounded-full border-t-2 border-[#FF7F50] animate-spin"></div>
                </div>
                <p className="text-sm font-medium text-[#FF7F50]">
                  Generating blessing
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 内容部分 */}
        <div className="mb-16 border-t-2 border-gray-200 pt-10">
          <h2 className="text-2xl font-bold mb-8">Content</h2>
          <div className="space-y-12">
            {/* 渲染内容图片 - 包括intro图片(index=0)和其他内容图片 */}
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) => {
              // 处理intro图片(index=0)和常规内容图片(index=1-10)
              const image = index === 0 ? introImage : imageStateMap[index];
              const isLoading = index === 0 ? isGeneratingIntro : loadingStateMap[index];
              const onRegenerate = index === 0 ? handleRegenerateIntro : handleRegenerateMap[index];
              // 文本索引: index=0(intro)对应text[1], index=1-10对应text[2-11]
              const textIndex = index + 1;

              // 从 localStorage 直接读取 imageTexts，确保有最新数据
              let text = undefined;
              const savedTexts = localStorage.getItem('loveStoryImageTexts');
              if (savedTexts) {
                try {
                  const parsedTexts = JSON.parse(savedTexts);
                  if (parsedTexts && Array.isArray(parsedTexts) && parsedTexts.length > textIndex) {
                    text = parsedTexts[textIndex]?.text;
                  }
                } catch (error) {
                  console.error('Error parsing saved texts in ContentImageCard:', error);
                }
              }

              // 如果从 localStorage 读取失败，则尝试使用状态变量
              if (!text && imageTexts && imageTexts.length > textIndex) {
                text = imageTexts[textIndex]?.text;
              }

              // 获取保存的字体ID
              const savedFont = localStorage.getItem(`loveStoryFont_${index}`) || 'patrick-hand';

              return (
                <div key={index}>
                  <ContentImageCard
                    image={image}
                    leftImageUrl={localStorage.getItem(index === 0 ? 'loveStoryIntroImage_left_url' : `loveStoryContentImage${index}_left_url`) || undefined}
                    rightImageUrl={localStorage.getItem(index === 0 ? 'loveStoryIntroImage_right_url' : `loveStoryContentImage${index}_right_url`) || undefined}
                    isGenerating={isLoading || isWaitingForData || false}
                    onRegenerate={onRegenerate}
                    onFontChange={(fontId) => index === 0 ? handleRenderIntroImage(fontId) : handleRenderContentImage(index, fontId)}
                    index={index}
                    text={text}
                    title={index === 0 ? "Introduction" : `Moment ${index}`}
                    selectedFont={savedFont}
                  />


                </div>
              );
            })}
          </div>
        </div>

        {/* 添加封底预览部分 */}
        <div className="mb-16 border-t-2 border-gray-200 pt-10">
          <h2 className="text-2xl font-bold mb-8">Back Cover</h2>

          <div className="max-w-xl mx-auto">
            {isRenderingCover ? (
              <div className="max-w-[640px] mx-auto aspect-[1/1] bg-white rounded-lg shadow-lg flex flex-col items-center justify-center">
                <div className="relative w-8 h-8 mb-2">
                  <div className="absolute inset-0 rounded-full border-t-2 border-[#FF7F50] animate-spin"></div>
                </div>
                <p className="text-sm font-medium text-[#FF7F50]">
                  Generating back cover
                </p>
              </div>
            ) : (coverRenderComplete && backCoverImageUrl) ? (
              <img
                src={backCoverImageUrl}
                alt="Love Story Back Cover"
                className="max-w-[640px] mx-auto w-full h-auto rounded-lg shadow-lg"
              />
            ) : (
              <BackCoverPreviewCard
                authorName={authorName}
                backCoverText={backCoverText}
                isGeneratingBackCover={false}
              />
            )}
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default GenerateStep;
