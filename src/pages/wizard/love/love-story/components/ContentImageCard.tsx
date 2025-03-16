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
  'Disney Character'
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
        // 只在左侧占据50%的区域显示文字
        const textAreaWidth = width * 0.5; // 保持在50%
        
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
        
        // 绘制两端对齐的文本
        const drawJustifiedText = (words: string[], x: number, y: number, maxWidth: number) => {
          if (words.length === 1) {
            // 如果只有一个单词，就居左对齐
            drawStrokedText(words[0], x, y);
            return;
          }
          
          // 计算所有单词的总宽度
          let totalWordsWidth = 0;
          for (let word of words) {
            totalWordsWidth += ctx.measureText(word).width;
          }
          
          // 计算需要分配的额外空间
          const extraSpace = maxWidth - totalWordsWidth;
          // 计算单词间距数量（单词数量-1）
          const spacesCount = words.length - 1;
          // 计算每个间距的宽度
          const spaceWidth = extraSpace / spacesCount;
          
          let currentX = x;
          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            drawStrokedText(word, currentX, y);
            
            // 更新下一个单词的x位置（最后一个单词不需要添加间距）
            if (i < words.length - 1) {
              currentX += ctx.measureText(word).width + spaceWidth;
            }
          }
        };
        
        // 文本换行函数 - 现在使用按句子换行，且增加段落间距
        const wrapTextBySentence = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
          // 按句子分割文本 (句号、问号、感叹号后跟空格，或者在句末)
          const sentences = text.match(/[^.!?]+[.!?]+\s*|\s*[^.!?]+[.!?]+$|\s*[^.!?]+$/g) || [text];
          let lineCount = 0;
          let isParagraphStart = true; // 用于标记段落开始
          
          for (let i = 0; i < sentences.length; i++) {
            let sentence = sentences[i].trim();
            
            // 如果句子为空，跳过
            if (!sentence) continue;
            
            // 为新段落添加额外的行距
            if (!isParagraphStart && i > 0) {
              lineCount += 0.6; // 添加0.6行的额外间距
            }
            isParagraphStart = false;
            
            // 检查句子是否超过最大宽度
            const metrics = ctx.measureText(sentence);
            if (metrics.width > maxWidth) {
              // 如果句子太长，使用单词换行
              const words = sentence.split(' ');
              let line: string[] = [];
              let testWidth = 0;
              
              for (let n = 0; n < words.length; n++) {
                const word = words[n];
                const wordWidth = ctx.measureText(word + ' ').width;
                
                if (testWidth + wordWidth > maxWidth && line.length > 0) {
                  // 绘制两端对齐的文本行
                  drawJustifiedText(line, x, y + (lineCount * lineHeight), maxWidth);
                  line = [word];
                  testWidth = wordWidth;
                  lineCount++;
                } else {
                  line.push(word);
                  testWidth += wordWidth;
                }
              }
              
              if (line.length > 0) {
                // 最后一行不需要两端对齐，使用普通绘制
                drawStrokedText(line.join(' '), x, y + (lineCount * lineHeight));
                lineCount++;
              }
            } else {
              // 如果句子不超过最大宽度，直接绘制
              drawStrokedText(sentence, x, y + (lineCount * lineHeight));
              lineCount++;
            }
          }
          
          return lineCount; // 返回行数
        };
        
        // 添加文本内容 - 在画布的左半边
        ctx.font = '22px Georgia, serif'; // 增加字体大小
        // 文字颜色在drawStrokedText中设置
        const maxWidth = textAreaWidth - 120; // 从60改为100，使文本离左边和中线都更远
        
        // 使用提供的文本或默认文本
        const displayText = text || "A beautiful story captured in an image.";
        
        // 垂直居中显示文本
        const textStartY = height * 0.25; // 从上方1/4处开始
        const textLineHeight = 34; // 增加行高
        wrapTextBySentence(displayText, 90, textStartY, maxWidth, textLineHeight); // 从50改为70，增加左侧边距
        
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
    <div className="relative mb-8">
      <div className="max-w-4xl mx-auto">
        <div className="aspect-[2/1] overflow-hidden relative content-page-card">
          {isGenerating ? (
            <div className="h-full flex flex-col justify-center items-center text-center bg-gray-100/50 rounded-sm">
              <RefreshCw className="animate-spin h-8 w-8 mb-4" />
              <p className="text-gray-600">Generating image...</p>
            </div>
          ) : (
            <canvas 
              ref={canvasRef} 
              className="w-full h-full rounded-sm content-page-canvas"
              width={1200} // 增加分辨率
              height={600}
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
                          {style === 'Disney Charactor' && 'Cartoon-like characters with Disney animation style'}
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
