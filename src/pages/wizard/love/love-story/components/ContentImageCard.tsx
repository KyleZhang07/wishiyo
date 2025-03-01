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
        
        // 创建半透明文本区域（在图像左侧）
        const textAreaWidth = width * 0.5; // 占据左半部分
        const textPadding = 20; // 内边距
        
        // 创建半透明渐变背景，从左到右
        const gradient = ctx.createLinearGradient(0, 0, textAreaWidth, 0);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, textAreaWidth, height);
        
        // 文本换行函数
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
              ctx.fillText(line, x, y + (lineCount * lineHeight));
              line = words[n] + ' ';
              lineCount++;
            } else {
              line = testLine;
            }
          }
          
          ctx.fillText(line, x, y + (lineCount * lineHeight));
          return lineCount + 1; // 返回行数
        };
        
        // 添加文本内容
        const textStartX = textPadding;
        const textStartY = height * 0.2; // 从画布的上部20%开始
        const maxWidth = textAreaWidth - (textPadding * 2);
        
        // 使用文本或占位符
        const displayText = text || "A special moment captured in time.";
        
        // 绘制文本
        ctx.font = '18px Georgia, serif';
        ctx.fillStyle = 'white';
        wrapText(displayText, textStartX, textStartY, maxWidth, 26);
        
        // 如果需要显示献词文本
        if (showDedicationText && coverTitle) {
          const firstName = coverTitle.split(',')[0];
          
          // 创建半透明覆盖层
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
