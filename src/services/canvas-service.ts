import { uploadToCompletePages } from '@/integrations/supabase/storage';
import { getCanvasFromDOM, mergeCanvases } from '@/utils/canvas-utils';

/**
 * 从 DOM 中捕获指定的 canvas 元素
 * @returns 捕获的 canvas 元素数组
 */
export const captureLoveStoryCanvases = (): {
  cover: HTMLCanvasElement | null;
  intro: HTMLCanvasElement | null;
  content: HTMLCanvasElement[];
} => {
  // 获取封面 canvas
  const coverCanvas = getCanvasFromDOM('.cover-preview-canvas');
  
  // 获取介绍页 canvas
  const introCanvas = getCanvasFromDOM('.intro-content-canvas');
  
  // 获取所有内容页 canvas
  const contentCanvases: HTMLCanvasElement[] = [];
  const contentCanvasElements = document.querySelectorAll('.content-page-canvas');
  contentCanvasElements.forEach((canvas) => {
    if (canvas instanceof HTMLCanvasElement) {
      contentCanvases.push(canvas);
    }
  });
  
  return {
    cover: coverCanvas,
    intro: introCanvas,
    content: contentCanvases
  };
};

/**
 * 将爱情故事的所有页面合并并上传到 complete-pages 存储桶
 * @param orderId 订单 ID
 * @returns 上传的图像 URL 数组
 */
export const mergeAndUploadLoveStoryPages = async (orderId: string): Promise<string[]> => {
  try {
    const timestamp = Date.now();
    const uploadedUrls: string[] = [];
    
    // 捕获所有 canvas
    const { cover, intro, content } = captureLoveStoryCanvases();
    
    // 上传封面
    if (cover) {
      const coverDataUrl = cover.toDataURL('image/png', 1.0);
      const coverUrl = await uploadToCompletePages(
        coverDataUrl,
        `love-story-complete-cover-${orderId}-${timestamp}`
      );
      uploadedUrls.push(coverUrl);
    }
    
    // 上传介绍页
    if (intro) {
      const introDataUrl = intro.toDataURL('image/png', 1.0);
      const introUrl = await uploadToCompletePages(
        introDataUrl,
        `love-story-complete-intro-${orderId}-${timestamp}`
      );
      uploadedUrls.push(introUrl);
    }
    
    // 上传内容页
    for (let i = 0; i < content.length; i++) {
      const contentDataUrl = content[i].toDataURL('image/png', 1.0);
      const contentUrl = await uploadToCompletePages(
        contentDataUrl,
        `love-story-complete-content-${i}-${orderId}-${timestamp}`
      );
      uploadedUrls.push(contentUrl);
    }
    
    // 合并所有页面并上传完整版本
    const allCanvases = [
      ...(cover ? [cover] : []),
      ...(intro ? [intro] : []),
      ...content
    ];
    
    if (allCanvases.length > 0) {
      const mergedCanvas = mergeCanvases(allCanvases, 0);
      const mergedDataUrl = mergedCanvas.toDataURL('image/png', 1.0);
      const mergedUrl = await uploadToCompletePages(
        mergedDataUrl,
        `love-story-complete-all-${orderId}-${timestamp}`
      );
      uploadedUrls.push(mergedUrl);
    }
    
    return uploadedUrls;
  } catch (error) {
    console.error('Error merging and uploading love story pages:', error);
    return [];
  }
};
