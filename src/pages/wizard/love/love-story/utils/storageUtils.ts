import { getAllImagesFromStorage } from '@/integrations/supabase/storage';

interface SupabaseImage {
  name: string;
  url: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  id: string;
}

interface ImageStorageMap {
  [key: string]: {
    localStorageKey: string;
    url?: string;  // Supabase Storage URL
  };
}

// 从 Supabase 加载图片
export const loadImagesFromSupabase = async (
  setIsLoadingImages: (loading: boolean) => void,
  setSupabaseImages: (images: SupabaseImage[]) => void,
  setImageStorageMap: (map: ImageStorageMap) => void,
  setCoverImage: (image: string | undefined) => void,
  setIntroImage: (image: string | undefined) => void,
  setContentImage1: (image: string | undefined) => void,
  setContentImage2: (image: string | undefined) => void,
  setContentImage3: (image: string | undefined) => void,
  setContentImage4: (image: string | undefined) => void,
  setContentImage5: (image: string | undefined) => void,
  setContentImage6: (image: string | undefined) => void,
  setContentImage7: (image: string | undefined) => void,
  setContentImage8: (image: string | undefined) => void,
  setContentImage9: (image: string | undefined) => void,
  setContentImage10: (image: string | undefined) => void,
  toast: any
) => {
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
      if ((/^love-cover/.test(fileName) || /^love-story-cover/.test(fileName)) && !processedTypes['cover']) {
        // 优先使用love-cover开头的图片作为封面
        if (/^love-cover/.test(fileName)) {
          setCoverImage(img.url);
          newImageMap['loveStoryCoverImage'] = {
            localStorageKey: 'loveStoryCoverImage',
            url: img.url
          };
          localStorage.setItem('loveStoryCoverImage_url', img.url);
          processedTypes['cover'] = true;
        } else if (!processedTypes['cover'] && /^love-story-cover/.test(fileName)) {
          // 如果没有love-cover图片，才使用love-story-cover图片
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
        }
      } else if ((/^intro-/.test(fileName) || /^love-story-intro/.test(fileName)) && !processedTypes['intro']) {
        // 优先使用intro-开头的图片（渲染后的图片）
        setIntroImage(img.url);
        newImageMap['loveStoryIntroImage'] = {
          localStorageKey: 'loveStoryIntroImage',
          url: img.url
        };
        localStorage.setItem('loveStoryIntroImage_url', img.url);
        processedTypes['intro'] = true;
      } else if ((/^content-1-/.test(fileName) || /^love-story-content-1($|-)/.test(fileName)) && !processedTypes['content1']) {
        // 优先使用content-1-开头的图片（渲染后的图片）
        setContentImage1(img.url);
        newImageMap['loveStoryContentImage1'] = {
          localStorageKey: 'loveStoryContentImage1',
          url: img.url
        };
        localStorage.setItem('loveStoryContentImage1_url', img.url);
        processedTypes['content1'] = true;
      } else if ((/^content-2-/.test(fileName) || /^love-story-content-2($|-)/.test(fileName)) && !processedTypes['content2']) {
        setContentImage2(img.url);
        newImageMap['loveStoryContentImage2'] = {
          localStorageKey: 'loveStoryContentImage2',
          url: img.url
        };
        localStorage.setItem('loveStoryContentImage2_url', img.url);
        processedTypes['content2'] = true;
      } else if ((/^content-3-/.test(fileName) || /^love-story-content-3($|-)/.test(fileName)) && !processedTypes['content3']) {
        setContentImage3(img.url);
        newImageMap['loveStoryContentImage3'] = {
          localStorageKey: 'loveStoryContentImage3',
          url: img.url
        };
        localStorage.setItem('loveStoryContentImage3_url', img.url);
        processedTypes['content3'] = true;
      } else if ((/^content-4-/.test(fileName) || /^love-story-content-4($|-)/.test(fileName)) && !processedTypes['content4']) {
        setContentImage4(img.url);
        newImageMap['loveStoryContentImage4'] = {
          localStorageKey: 'loveStoryContentImage4',
          url: img.url
        };
        localStorage.setItem('loveStoryContentImage4_url', img.url);
        processedTypes['content4'] = true;
      } else if ((/^content-5-/.test(fileName) || /^love-story-content-5($|-)/.test(fileName)) && !processedTypes['content5']) {
        setContentImage5(img.url);
        newImageMap['loveStoryContentImage5'] = {
          localStorageKey: 'loveStoryContentImage5',
          url: img.url
        };
        localStorage.setItem('loveStoryContentImage5_url', img.url);
        processedTypes['content5'] = true;
      } else if ((/^content-6-/.test(fileName) || /^love-story-content-6($|-)/.test(fileName)) && !processedTypes['content6']) {
        setContentImage6(img.url);
        newImageMap['loveStoryContentImage6'] = {
          localStorageKey: 'loveStoryContentImage6',
          url: img.url
        };
        localStorage.setItem('loveStoryContentImage6_url', img.url);
        processedTypes['content6'] = true;
      } else if ((/^content-7-/.test(fileName) || /^love-story-content-7($|-)/.test(fileName)) && !processedTypes['content7']) {
        setContentImage7(img.url);
        newImageMap['loveStoryContentImage7'] = {
          localStorageKey: 'loveStoryContentImage7',
          url: img.url
        };
        localStorage.setItem('loveStoryContentImage7_url', img.url);
        processedTypes['content7'] = true;
      } else if ((/^content-8-/.test(fileName) || /^love-story-content-8($|-)/.test(fileName)) && !processedTypes['content8']) {
        setContentImage8(img.url);
        newImageMap['loveStoryContentImage8'] = {
          localStorageKey: 'loveStoryContentImage8',
          url: img.url
        };
        localStorage.setItem('loveStoryContentImage8_url', img.url);
        processedTypes['content8'] = true;
      } else if ((/^content-9-/.test(fileName) || /^love-story-content-9($|-)/.test(fileName)) && !processedTypes['content9']) {
        setContentImage9(img.url);
        newImageMap['loveStoryContentImage9'] = {
          localStorageKey: 'loveStoryContentImage9',
          url: img.url
        };
        localStorage.setItem('loveStoryContentImage9_url', img.url);
        processedTypes['content9'] = true;
      } else if ((/^content-10-/.test(fileName) || /^love-story-content-10($|-)/.test(fileName)) && !processedTypes['content10']) {
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
export const getImageType = (imageName: string): string => {
  if (imageName.includes('love-story-cover')) return 'cover';
  if (imageName.includes('love-story-intro')) return 'intro';
  if (imageName.includes('love-story-content')) return 'content';
  return 'other';
};

// 辅助函数：获取内容图片的索引
export const getContentIndex = (imageName: string): number => {
  const match = imageName.match(/love-story-content-(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 999; // 默认值，确保未识别的内容排在最后
}; 