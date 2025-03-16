import { Button } from '@/components/ui/button';
import { Edit, RefreshCw } from 'lucide-react';
import LoveStoryCoverPreview from '@/components/cover-generator/LoveStoryCoverPreview';
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
}

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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

  // 生成并上传封面PDF的函数
  const generateAndUploadCoverPdf = async (): Promise<string | null> => {
    try {
      if (!canvasRef.current) {
        console.error('Canvas reference not available');
        return null;
      }

      // 获取canvas数据
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      // 上传到Supabase
      const timestamp = Date.now();
      const pdfUrl = await uploadImageToStorage(
        dataUrl,
        'pdfs',
        `love-story-cover-pdf-${timestamp}`
      );
      
      setCoverPdfUrl(pdfUrl);
      return pdfUrl;
    } catch (error) {
      console.error('Error generating or uploading cover PDF:', error);
      return null;
    }
  };
  
  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    generateAndUploadCoverPdf
  }));

  return (
    <div className="relative">
      <div className="max-w-xl mx-auto">
        <LoveStoryCoverPreview
          coverTitle={coverTitle}
          subtitle={subtitle}
          authorName={authorName}
          recipientName={recipientName}
          coverImage={coverImage}
          selectedFont={selectedStyle?.font || "playfair"}
          style={selectedStyle}
        />
      </div>
    </div>
  );
});
