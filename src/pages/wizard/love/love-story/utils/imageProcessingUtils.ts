import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage, deleteImageFromStorage } from '@/integrations/supabase/storage';

// 图像扩展功能
export const expandImage = async (imageUrl: string): Promise<string> => {
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

// 通用内容重新生成函数
export const handleGenericContentRegeneration = async (
  index: number,
  style: string | undefined,
  stateSetters: {[key: number]: (image: string | undefined) => void},
  loadingSetters: {[key: number]: (loading: boolean) => void},
  supabaseImages: any[],
  selectedStyle: string,
  setSelectedStyle: (style: string) => void,
  toast: any,
  refreshImages: () => void,
  autoRenderImage?: (imageData: string, index: number) => Promise<void>
) => {
  const setContentFn = stateSetters[index];
  const setIsGenerating = loadingSetters[index];
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
  const characterPhoto = localStorage.getItem('loveStoryPartnerPhoto');
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
      photo: characterPhoto,
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

    // 7) 如果提供了自动渲染函数，则调用它
    if (autoRenderImage) {
      try {
        toast({
          title: "Auto-rendering image",
          description: `Rendering content ${index} with text...`,
        });

        await autoRenderImage(expandedBase64, index);

        toast({
          title: "Image rendered",
          description: `Content ${index} successfully rendered with text`,
        });
      } catch (renderError) {
        console.error(`Error auto-rendering content image ${index}:`, renderError);
        // 继续处理，即使渲染失败
      }
    }

    // 8) 延迟刷新图片列表，确保上传完成
    setTimeout(() => {
      refreshImages();
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