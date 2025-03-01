
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
import { Textarea } from '@/components/ui/textarea';

interface ContentImageCardProps {
  image?: string;
  isGenerating: boolean;
  onEditText: () => void;
  onRegenerate: (style?: string) => void;
  onTextUpdate?: (text: string) => void;
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
  onTextUpdate,
  index,
  authorName,
  coverTitle,
  showDedicationText = false,
  text,
  title
}: ContentImageCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('Photographic (Default)');
  const [displayText, setDisplayText] = useState<string>(text || "A special moment captured in time.");
  const [editableText, setEditableText] = useState<string>(text || "A special moment captured in time.");

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

  // 关键修复: 当text属性改变时更新显示的文本
  useEffect(() => {
    console.log(`ContentImageCard[${index}] text prop changed:`, text);
    if (text) {
      setDisplayText(text);
      setEditableText(text);
    }
  }, [text, index]);

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
        
        // Add semi-transparent overlay at the bottom of the canvas for text readability
        const overlayHeight = height * 0.3; // 30% of canvas height for text overlay
        const gradientStart = height - overlayHeight;
        
        // Create gradient for text background
        const gradient = ctx.createLinearGradient(0, gradientStart, 0, height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, gradientStart, width, overlayHeight);
        
        // Always draw title, even if there's no text
        // Add a title based on the index
        ctx.font = 'bold 22px Georgia, serif';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        ctx.fillText(title || `Moment ${index}`, 25, height - overlayHeight + 40);
        
        // Text wrapping function for use with either provided text or placeholder
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
          return lineCount + 1; // Return the number of lines
        };
        
        // Add text content - either provided text or a generic placeholder
        ctx.font = '18px Georgia, serif';
        ctx.fillStyle = 'white';
        const textStartY = height - overlayHeight + 70;
        const maxWidth = width - 50; // Padding on both sides
        
        // 关键修复: 确保使用最新的displayText
        console.log(`Drawing text on canvas[${index}]:`, displayText);
        wrapText(displayText, 25, textStartY, maxWidth, 24);
        
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
  }, [image, isGenerating, displayText, index, showDedicationText, coverTitle, authorName, title]);

  const handleStyleSelect = (style: string) => {
    setSelectedStyle(style);
  };

  const handleRegenerateWithStyle = () => {
    // Save the selected style to localStorage
    localStorage.setItem('loveStoryStyle', selectedStyle);
    
    // Close the dialog
    setIsDialogOpen(false);
    
    // Call the onRegenerate function with the selected style
    console.log(`Regenerating image ${index} with style ${selectedStyle}`);
    onRegenerate(selectedStyle);
  };

  const handleSaveText = () => {
    console.log(`Saving edited text for image ${index}:`, editableText);
    setDisplayText(editableText);
    if (onTextUpdate) {
      onTextUpdate(editableText);
    }
    setIsTextDialogOpen(false);
  };

  const handleOpenTextDialog = () => {
    setEditableText(displayText);
    setIsTextDialogOpen(true);
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
          <Dialog open={isTextDialogOpen} onOpenChange={setIsTextDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                onClick={handleOpenTextDialog}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit text
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Image Text</DialogTitle>
                <DialogDescription>
                  Update the text that appears with this image.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <Textarea 
                  value={editableText} 
                  onChange={(e) => setEditableText(e.target.value)}
                  className="min-h-[100px]"
                  placeholder="Enter text to display with this image..."
                />
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setIsTextDialogOpen(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveText}
                  className="bg-black text-white hover:bg-black/90"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Text
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
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
