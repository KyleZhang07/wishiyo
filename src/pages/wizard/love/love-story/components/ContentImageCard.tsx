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
        
        // 文字区域，定位在左侧 - 不再使用渐变黑色蒙版
        // 只在左侧占据60%的区域显示文字
        const textAreaWidth = width * 0.6;
        
        // 添加文本显示函数 - 带有描边和阴影以确保可读性
        // 此函数将创建带有文字轮廓的文本
        const drawStrokedText = (text: string, x: number, y: number) => {
          // 添加阴影
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
          
          // 先绘制文字外描边
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.strokeText(text, x, y);
          
          // 再绘制文字内容
          ctx.fillStyle = 'white';
          ctx.fillText(text, x, y);
        };
        
        // 文本换行函数 - 现在使用drawStrokedText以提高可读性
        const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
          const words = text.split(' ');
          let line = '';
          let testLine = '';
          let lineCount = 0;
          
          for (let n = 0; n < words.length; n++) {
            testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
              drawStrokedText(line, x, y + (lineCount * lineHeight));
              line = words[n] + ' ';
              lineCount++;
            } else {
              line = testLine;
            }
          }
          
          drawStrokedText(line, x, y + (lineCount * lineHeight));
          return lineCount + 1; // Return the number of lines
        };
        
        // 添加文本内容 - 在画布的左半边
        ctx.font = '18px Georgia, serif';
        // 文字颜色在drawStrokedText中设置
        const maxWidth = textAreaWidth - 50; // 左边文字区域宽度，留有边距
        
        // 使用提供的文本或默认文本
        const displayText = text || "A beautiful story captured in an image.";
        
        // 垂直居中显示文本
        const textStartY = height * 0.25; // 从上方1/4处开始
        const textLineHeight = 28; // 行高
        wrapText(displayText, 25, textStartY, maxWidth, textLineHeight);
        
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
    <div className="relative mb-4">
      <div className="max-w-xl mx-auto">
        <div className="aspect-[2/1] overflow-hidden relative">
          {isGenerating ? (
            <div className="h-full flex flex-col justify-center items-center text-center bg-gray-100/50 rounded-sm">
              <RefreshCw className="animate-spin h-8 w-8 mb-4" />
              <p className="text-gray-600">Generating image...</p>
            </div>
          ) : (
            <canvas 
              ref={canvasRef} 
              className="w-full h-full rounded-sm"
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
