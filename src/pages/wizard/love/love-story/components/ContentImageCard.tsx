import { Button } from '@/components/ui/button';
import { Edit, RefreshCw, ImageIcon, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check } from 'lucide-react';

interface ContentImageCardProps {
  image?: string;
  isGenerating: boolean;
  onEditText: () => void;
  onRegenerate: (style?: string) => void;
  index: number;
  authorName?: string;
  coverTitle?: string;
  showDedicationText?: boolean;
  text?: string;
  title?: string;
}

// Image style options for love story
const STYLE_OPTIONS = [
  'Comic book',
  'Line art',
  'Fantasy art',
  'Photographic (Default)',
  'Cinematic'
];

export const ContentImageCard = ({
  image,
  isGenerating,
  onEditText,
  onRegenerate,
  index,
  authorName,
  coverTitle,
  showDedicationText = false,
  text,
  title
}: ContentImageCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('Photographic (Default)');

  useEffect(() => {
    // Load the current style from localStorage
    const savedStyle = localStorage.getItem('loveStoryStyle');
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
  }, []);

  useEffect(() => {
    if (canvasRef.current && image && !isGenerating) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background
      ctx.fillStyle = '#FFECD1';
      ctx.fillRect(0, 0, width, height);

      // Load and draw the image to fill the entire canvas
      const img = new Image();
      img.onload = () => {
        // Calculate dimensions to cover the entire canvas while maintaining aspect ratio
        const imgRatio = img.width / img.height;
        const canvasRatio = width / height;
        
        let drawWidth = width;
        let drawHeight = height;
        let offsetX = 0;
        let offsetY = 0;
        
        // If image is wider than canvas (landscape image)
        if (imgRatio > canvasRatio) {
          drawHeight = width / imgRatio;
          offsetY = (height - drawHeight) / 2;
        } 
        // If image is taller than canvas (portrait image)
        else {
          drawWidth = height * imgRatio;
          offsetX = (width - drawWidth) / 2;
        }
        
        // Draw the image to fill the canvas
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // 为了让文字更自然悬浮，使用更细微的处理方式
        // 不再添加大面积半透明遮罩，而是使用文字阴影和局部背景增强可读性

        // 文本区域宽度
        const textAreaWidth = width * 0.5; // 文字区域宽度为画布的50%
        
        // 文本包装函数，增加了返回包装后文本宽高的功能
        const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
          const words = text.split(' ');
          let line = '';
          let testLine = '';
          let lineCount = 0;
          let maxLineWidth = 0;
          
          // 预处理所有行，记录最大宽度
          const lines: string[] = [];
          
          for (let n = 0; n < words.length; n++) {
            testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
              lines.push(line);
              maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
              line = words[n] + ' ';
              lineCount++;
            } else {
              line = testLine;
            }
          }
          
          // 添加最后一行
          lines.push(line);
          maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
          lineCount++;
          
          // 绘制文本的半透明背景
          const padding = 20;
          const textBgHeight = (lineCount * lineHeight) + (padding * 2);
          const textBgWidth = maxLineWidth + (padding * 2);
          
          // 文字背景为半透明黑色渐变，增强可读性
          const bgGradient = ctx.createLinearGradient(x - padding, 0, x + textBgWidth, 0);
          bgGradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
          bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          ctx.fillStyle = bgGradient;
          ctx.fillRect(x - padding, y - padding, textBgWidth, textBgHeight);
          
          // 绘制每一行文本，添加文字阴影
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
          ctx.shadowBlur = 3;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          ctx.fillStyle = 'white';
          
          for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x, y + (i * lineHeight));
          }
          
          // 重置阴影设置
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          return {
            width: textBgWidth,
            height: textBgHeight,
            lineCount
          };
        };
        
        // 使用提供的文本或默认文本
        const displayText = text || "A beautiful story captured in an image.";
        
        // 设置文本样式
        ctx.font = '18px Georgia, serif';
        ctx.fillStyle = 'white';
        
        // 计算文本起始位置
        const textStartX = 30; // 左边距
        const textStartY = height * 0.25; // 从上方1/4处开始
        const textLineHeight = 30; // 增加行高
        const maxTextWidth = textAreaWidth - 60; // 文本区域最大宽度
        
        // 绘制文本
        wrapText(displayText, textStartX, textStartY, maxTextWidth, textLineHeight);
        
        // Draw dedication text if needed
        if (showDedicationText && coverTitle) {
          const firstName = coverTitle.split(',')[0];
          
          // Create a semi-transparent overlay for the dedication text
          ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.fillRect(0, 0, width, height);
          
          ctx.fillStyle = 'white';
          ctx.font = '20px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Dear ${firstName},`, width / 2, height / 2 - 60);
          ctx.fillText(`This book is full of the words I have chosen for you.`, width / 2, height / 2 - 30);
          ctx.fillText(`Thank you for making the story of us so beautiful.`, width / 2, height / 2);
          ctx.fillText(`Happy Anniversary!`, width / 2, height / 2 + 30);
          ctx.fillText(`Love,`, width / 2, height / 2 + 60);
          ctx.fillText(`${authorName}`, width / 2, height / 2 + 90);
        }
      };
      
      img.src = image;
      
      // Handle loading errors
      img.onerror = () => {
        console.error('Error loading image');
        // Draw an error placeholder
        ctx.fillStyle = '#ffdddd';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ff0000';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Image failed to load', width / 2, height / 2);
      };
    }
  }, [image, isGenerating, text, index, showDedicationText, coverTitle, authorName, title]);

  const handleStyleSelect = (style: string) => {
    setSelectedStyle(style);
  };

  const handleRegenerateWithStyle = () => {
    // Save the selected style to localStorage
    localStorage.setItem('loveStoryStyle', selectedStyle);
    
    // Close the dialog
    setIsDialogOpen(false);
    
    // Call the onRegenerate function with the selected style
    onRegenerate(selectedStyle);
  };

  return (
    <div className="glass-card rounded-2xl p-8 py-[40px] relative">
      <div className="max-w-xl mx-auto">
        <div className="aspect-[2/1] bg-[#FFECD1] rounded-lg overflow-hidden relative">
          {isGenerating ? (
            <div className="h-full flex flex-col justify-center items-center text-center">
              <RefreshCw className="animate-spin h-8 w-8 mb-4" />
              <p className="text-gray-600">Generating image...</p>
            </div>
          ) : (
            <canvas 
              ref={canvasRef} 
              className="w-full h-full rounded-lg"
              width={800} // Base resolution
              height={400}
            />
          )}
        </div>
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            onClick={onEditText}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit text
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                disabled={isGenerating}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Edit image
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Image Style</DialogTitle>
                <DialogDescription>
                  Select a style for your image and click regenerate to apply it.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  {STYLE_OPTIONS.map((style) => (
                    <div 
                      key={style}
                      onClick={() => handleStyleSelect(style)}
                      className={`
                        flex items-center p-3 rounded-md cursor-pointer transition-all
                        ${selectedStyle === style 
                          ? 'bg-primary/10 border border-primary' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}
                      `}
                    >
                      <div className="flex-shrink-0 mr-3">
                        {selectedStyle === style ? (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{style}</h4>
                        <p className="text-sm text-gray-500">
                          {style === 'Comic book' && 'Bold outlines and vibrant colors'}
                          {style === 'Line art' && 'Elegant, minimalist black and white illustration'}
                          {style === 'Fantasy art' && 'Dreamlike and magical aesthetic'}
                          {style === 'Photographic (Default)' && 'Realistic, photography-like images'}
                          {style === 'Cinematic' && 'Film-like with dramatic lighting and composition'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleRegenerateWithStyle}
                  className="bg-black text-white hover:bg-black/90"
                  disabled={isGenerating}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate with {selectedStyle}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};
