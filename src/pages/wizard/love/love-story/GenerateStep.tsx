import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage, getAllImagesFromStorage, deleteImageFromStorage } from '@/integrations/supabase/storage';
import { ContentImageCard } from './components/ContentImageCard';
import { Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRenderContext } from '@/context/RenderContext';

// 导入工具函数
import { handleGenericContentRegeneration as handleContentRegeneration } from './utils/imageProcessingUtils';
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

  // 使用渲染上下文
  const {
    isRenderingCover,
    coverRenderComplete,
    coverImageUrl,
    backCoverImageUrl,
    spineImageUrl
  } = useRenderContext();

  const expandImage = async (imageUrl: string): Promise<string> => {
    try {
      console.log('Starting image expansion for:', imageUrl);
      const { data, error } = await supabase.functions.invoke('expand-image', {
        body: {
          imageUrl,
          textPrompt: "CRITICAL: Expanded area MUST have absolutely NO PEOPLE and NO ANIMALS. 100% no human figures or animals allowed in the expanded region. Create a natural extension of the existing image that maintains the style, mood, and context of the original. Ensure seamless transition from the original image edges. The expanded area should complement the original image while providing suitable space for text overlay if needed."
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

  // 自动渲染内容图片的通用函数
  const autoRenderContentImage = async (imageData: string, index: number) => {
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
      const textIndex = index + 1; // 图像索引对应文本索引
      const text = imageTexts && imageTexts.length > textIndex ? imageTexts[textIndex].text : "";

      // 设置加载状态
      const setLoadingFn = loadingSetters[index];
      if (setLoadingFn) setLoadingFn(true);

      // 移除toast通知，减少用户干扰

      // 渲染并上传图片
      const result = await renderAndUploadContentImage(
        imageData,
        text || "A beautiful moment captured in this image.",
        index,
        selectedStyle,
        supabaseImages
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
      toast({
        title: "Image rendering failed",
        description: "Could not process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      // 重置加载状态
      const setLoadingFn = loadingSetters[index];
      if (setLoadingFn) setLoadingFn(false);
    }
  };

  // generateInitialImages函数已被删除，使用autoGenerateAllImages代替
  // 该函数会自动检测并生成所有未生成的图片

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

  const handleEditCover = () => {
    // 不需要显示成功通知，用户可以看到页面跳转
    // 导航到CoverStep页面
    navigate('/create/love/love-story/cover');
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

            // 不需要显示成功通知，用户可以看到图片已更新
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


  // 使用状态变量直接创建映射
  const imageStateMap: {[key: number]: string} = {
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

  // 检查所有内容图片是否已生成
  const checkAllContentImagesGenerated = () => {
    // 检查intro图片
    const introImageUrl = localStorage.getItem('loveStoryIntroImage_url');

    // 检查所有content图片
    const contentImagesStatus = [];

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
    const generationStatus = checkAllContentImagesGenerated();

    // 获取必要的数据
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const characterPhoto = localStorage.getItem('loveStoryPartnerPhoto');

    if (!savedPrompts || !characterPhoto) {
      console.log('Missing prompts or character photo, cannot generate images');
      return;
    }

    const prompts = JSON.parse(savedPrompts);
    if (!prompts || prompts.length < 11) { // 需要至少11个提示（封面+引导+9个内容）
      console.log('Not enough prompts for image generation');
      return;
    }

    // 创建生成任务数组
    const generationTasks = [];

    // 添加intro图片生成任务（如果需要）
    if (!generationStatus.intro.isGenerated) {
      console.log('Adding intro image generation task...');
      generationTasks.push({
        type: 'intro',
        task: async () => {
          try {
            await handleRegenerateIntro();
            console.log('Intro image generated successfully');
            return true;
          } catch (error) {
            console.error('Error auto-generating intro image:', error);
            return false;
          }
        }
      });
    }

    // 添加所有content图片生成任务（如果需要）
    for (const contentImage of generationStatus.contentImages) {
      if (!contentImage.isGenerated) {
        console.log(`Adding content image ${contentImage.index} generation task...`);
        const regenerateFunction = handleRegenerateMap[contentImage.index];
        if (regenerateFunction) {
          generationTasks.push({
            type: 'content',
            index: contentImage.index,
            task: async () => {
              try {
                await regenerateFunction();
                console.log(`Content image ${contentImage.index} generated successfully`);
                return true;
              } catch (error) {
                console.error(`Error auto-generating content image ${contentImage.index}:`, error);
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

    // 并发执行所有生成任务，每个任务之间有小的延迟以避免请求过快
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
  };

  // 组件加载后检查并自动生成所有未生成的图片
  useEffect(() => {
    // 确保所有图片数据都已加载
    if (!isLoadingImages && imageTexts.length > 0) {
      // 延迟执行，确保所有状态都已更新
      const timer = setTimeout(() => {
        autoGenerateAllImages();
      }, 2000); // 2秒延迟，确保其他操作已完成

      return () => clearTimeout(timer);
    }
  }, [isLoadingImages, imageTexts]);





  // 组件加载后检查并自动生成所有未生成的图片
  useEffect(() => {
    // 确保所有图片数据都已加载
    if (!isLoadingImages && imageTexts.length > 0) {
      // 延迟执行，确保所有状态都已更新
      const timer = setTimeout(() => {
        autoGenerateAllImages();
      }, 2000); // 2秒延迟，确保其他操作已完成

      return () => clearTimeout(timer);
    }
  }, [isLoadingImages, imageTexts]);

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
      description="Here's your special illustrated book."
      previousStep="/create/love/love-story/debug-prompts"
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
            {(coverRenderComplete && coverImageUrl) ? (
              <img
                src={coverImageUrl}
                alt="Love Story Cover"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            ) : coverImage ? (
              <img
                src={coverImage}
                alt="Love Story Cover"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Cover image not available</p>
              </div>
            )}
          </div>
        </div>

        {/* 祝福语部分 - 在Cover和Content之间 */}
        <div className="mb-16">

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

            {/* 删除Create Blessing Page按钮，改为自动渲染 */}
          </div>
        </div>

        {/* 内容部分 */}
        <div className="mb-16 border-t-2 border-gray-200 pt-10">
          <h2 className="text-2xl font-bold mb-8">Content</h2>
          <div className="mb-8">
            <ContentImageCard
              image={introImage}
              leftImageUrl={localStorage.getItem('loveStoryIntroImage_left_url') || undefined}
              rightImageUrl={localStorage.getItem('loveStoryIntroImage_right_url') || undefined}
              isGenerating={isGeneratingIntro}
              onRegenerate={handleRegenerateIntro}
              index={0}

              text={imageTexts && imageTexts.length > 1 ? imageTexts[1]?.text : undefined}
              title=""
            />


          </div>
          <div className="space-y-12 mt-12">
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

                    onRegenerate={onRegenerate}
                    index={index}
                    text={text}
                    title={`Moment ${index}`}
                  />


                </div>
              );
            })}
          </div>
        </div>

        {/* 添加封底预览部分 */}
        <div className="mb-16 border-t-2 border-gray-200 pt-10">
          <h2 className="text-2xl font-bold mb-8">Back Cover</h2>

          {(coverRenderComplete && backCoverImageUrl) ? (
            <div className="max-w-xl mx-auto">
              <img
                src={backCoverImageUrl}
                alt="Love Story Back Cover"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <BackCoverPreviewCard
              authorName={authorName}
              backCoverText={backCoverText}
            />
          )}
        </div>
      </div>
    </WizardStep>
  );
};

export default GenerateStep;
