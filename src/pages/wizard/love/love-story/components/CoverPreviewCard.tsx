import { Button } from '@/components/ui/button';
import { Edit, RefreshCw } from 'lucide-react';
import LoveStoryCoverPreview, { LoveStoryCoverPreviewRef } from '@/components/cover-generator/LoveStoryCoverPreview';
import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { uploadImageToStorage } from '@/integrations/supabase/storage';
import { supabase } from '@/integrations/supabase/client';

// 样式接口定义
interface CoverStyle {
  id: string;
  name: string;
  background: string;
  titleColor: string;
  subtitleColor: string;
  authorColor: string;
  font: string;
  borderColor?: string;
}

// 预定义的封面样式
const coverStyles: CoverStyle[] = [
  {
    id: 'classic',
    name: '经典',
    background: '#f5f5f0',
    titleColor: '#5a5a5a',
    subtitleColor: '#633d63',
    authorColor: '#333333',
    font: 'playfair'
  },
  {
    id: 'modern',
    name: '现代',
    background: '#e8f4f8',
    titleColor: '#2c3e50',
    subtitleColor: '#16a085',
    authorColor: '#34495e',
    font: 'montserrat'
  },
  {
    id: 'elegant',
    name: '优雅',
    background: '#f9f3f0',
    titleColor: '#8e44ad',
    subtitleColor: '#d35400',
    authorColor: '#7f8c8d',
    font: 'didot'
  },
  {
    id: 'playful',
    name: '活泼',
    background: '#f0f9e8',
    titleColor: '#27ae60',
    subtitleColor: '#e74c3c',
    authorColor: '#3498db',
    font: 'comic-sans'
  },
  {
    id: 'vintage',
    name: '复古',
    background: '#f5e8d0',
    titleColor: '#c0392b',
    subtitleColor: '#8e44ad',
    authorColor: '#2c3e50',
    font: 'georgia'
  }
];

interface CoverPreviewCardProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  coverImage?: string;
  backCoverText: string;
  isGeneratingCover: boolean;
}

export interface CoverPreviewCardRef {
  generateAndUploadCoverPdf: () => Promise<string | null>;
  getCoverCanvasImage: () => Promise<string>;
}

// 创建一个引用来存储 LoveStoryCoverPreview 组件的 canvas 引用
let canvasRef: HTMLCanvasElement | null = null;

// 导出一个函数，用于获取 canvas 的数据 URL
export const getCoverCanvasImage = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!canvasRef) {
      reject(new Error('Canvas reference not found'));
      return;
    }
    
    // 将 canvas 内容转换为 data URL
    try {
      const dataUrl = canvasRef.toDataURL('image/jpeg', 0.95);
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
};

// 导出一个函数，用于将 data URL 转换为 Blob
export const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};

export const CoverPreviewCard = forwardRef<CoverPreviewCardRef, CoverPreviewCardProps>(({
  coverTitle,
  subtitle,
  authorName,
  coverImage,
  backCoverText,
  isGeneratingCover
}, ref) => {
  // Get recipient name from localStorage
  const recipientName = localStorage.getItem('loveStoryPersonName') || 'My Love';
  
  // 获取用户选择的样式
  const [selectedStyle, setSelectedStyle] = useState<CoverStyle | undefined>(coverStyles[0]);
  const [coverPdfUrl, setCoverPdfUrl] = useState<string | null>(null);
  const coverPreviewRef = useRef<LoveStoryCoverPreviewRef>(null);
  
  useEffect(() => {
    // 从 localStorage 读取用户选择的样式
    const savedStyleId = localStorage.getItem('loveStoryCoverStyle');
    if (savedStyleId) {
      const style = coverStyles.find(style => style.id === savedStyleId);
      if (style) {
        setSelectedStyle(style);
      }
    }
  }, []);
  
  // 生成并上传封面图片
  const generateAndUploadCoverPdf = async (): Promise<string | null> => {
    try {
      // 确保存储桶存在
      await ensureBucketExists('images');
      
      // 获取 canvas 图片数据
      const imageData = coverPreviewRef.current?.getCanvasImage();
      if (!imageData) {
        console.error('Failed to get canvas image data');
        return null;
      }
      
      // 生成时间戳和文件名
      const timestamp = Date.now();
      const personName = localStorage.getItem('loveStoryPersonName') || 'user';
      const orderId = localStorage.getItem('currentOrderId') || `order-${timestamp}`;
      
      // 确保文件名与现有系统的命名约定兼容
      // 注意：CoverStep.tsx 中使用 img.name.includes('love-story-cover') 来筛选封面图片
      const coverFileName = `love-story-cover-${timestamp}.jpg`;
      const imagePath = `love-story/${orderId}/${coverFileName}`;
      
      // 只上传到 images 存储桶，让 generate-love-story-pdfs 函数处理 PDF 生成
      const imageUrl = await uploadImageToStorage(
        imageData,
        'images',
        imagePath
      );
      
      // 保存 URL 到状态和 localStorage
      setCoverPdfUrl(imageUrl);
      localStorage.setItem('loveStoryCoverImage_url', imageUrl);
      localStorage.setItem('loveStoryCoverImagePath', imagePath);
      
      console.log('Cover image uploaded:', imageUrl);
      console.log('PDF generation will be handled by the generate-love-story-pdfs function');
      
      return imageUrl;
    } catch (error) {
      console.error('Error generating and uploading cover image:', error);
      return null;
    }
  };
  
  // 设置 canvas 引用的回调函数
  const setCanvasRef = (canvas: HTMLCanvasElement | null) => {
    canvasRef = canvas;
  };

  // 获取 Canvas 图像
  const getCoverCanvasImage = async (): Promise<string> => {
    try {
      const imageData = coverPreviewRef.current?.getCanvasImage();
      if (!imageData) {
        throw new Error('Failed to get canvas image data');
      }
      return imageData;
    } catch (error) {
      console.error('Error getting canvas image:', error);
      throw error;
    }
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    generateAndUploadCoverPdf,
    getCoverCanvasImage
  }));

  return (
    <div className="relative">
      <div className="max-w-xl mx-auto">
        <LoveStoryCoverPreview
          ref={coverPreviewRef}
          coverTitle={coverTitle}
          subtitle={subtitle}
          authorName={authorName}
          recipientName={recipientName}
          coverImage={coverImage}
          selectedFont={selectedStyle?.font || "playfair"}
          style={selectedStyle}
          canvasRefCallback={setCanvasRef}
        />
      </div>
    </div>
  );
});

// 确保存储桶存在的辅助函数
const ensureBucketExists = async (bucket: string): Promise<boolean> => {
  try {
    // 检查存储桶是否存在
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw error;
    }
    
    // 如果存储桶不存在，创建它
    if (!buckets.find(b => b.name === bucket)) {
      console.log(`Bucket '${bucket}' does not exist, creating it...`);
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true
      });
      
      if (createError) {
        throw createError;
      }
      
      console.log(`Bucket '${bucket}' created successfully`);
    } else {
      console.log(`Bucket '${bucket}' already exists`);
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
};
