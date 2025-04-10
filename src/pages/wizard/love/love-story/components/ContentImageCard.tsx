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
  leftImageUrl?: string;
  rightImageUrl?: string;
  isGenerating: boolean;
  onEditText?: () => void;
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
  leftImageUrl,
  rightImageUrl,
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('Photographic (Default)');
  const [leftImageLoaded, setLeftImageLoaded] = useState(false);
  const [rightImageLoaded, setRightImageLoaded] = useState(false);

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

  const handleLeftImageLoad = () => {
    setLeftImageLoaded(true);
  };

  const handleRightImageLoad = () => {
    setRightImageLoaded(true);
  };

  return (
    <div className="relative mb-8">
      <div className="max-w-4xl mx-auto">
        <div className="aspect-[2/1] overflow-hidden relative">
          {isGenerating ? (
            <div className="h-full flex flex-col justify-center items-center text-center bg-gray-100/50 rounded-sm">
              <RefreshCw className="animate-spin h-8 w-8 mb-4" />
              <p className="text-gray-600">Generating image...</p>
            </div>
          ) : (
            <div className="w-full h-full rounded-sm overflow-hidden">
              {leftImageUrl && rightImageUrl ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="flex w-full h-full relative shadow-lg">
                    <div className="w-1/2 h-full relative overflow-hidden">
                      <img
                        src={leftImageUrl}
                        alt={`${title || `Content ${index}`} (left page)`}
                        className="w-full h-full object-cover"
                        onLoad={handleLeftImageLoad}
                        style={{ opacity: leftImageLoaded ? 1 : 0 }}
                      />
                      <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-black/30 to-transparent"></div>
                    </div>

                    <div className="w-1/2 h-full relative overflow-hidden">
                      <img
                        src={rightImageUrl}
                        alt={`${title || `Content ${index}`} (right page)`}
                        className="w-full h-full object-cover"
                        onLoad={handleRightImageLoad}
                        style={{ opacity: rightImageLoaded ? 1 : 0 }}
                      />
                      <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-black/25 to-transparent"></div>
                    </div>

                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[1px] h-full z-10 bg-transparent shadow-[0_0_8px_2px_rgba(0,0,0,0.4)]"></div>
                  </div>
                </div>
              ) : image ? (
                <img
                  src={image}
                  alt={title || `Content ${index}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center bg-gray-100 rounded-sm">
                  <ImageIcon className="h-8 w-8 mb-4 text-gray-400" />
                  <p className="text-gray-600">No image available</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-[#FF7F50] hover:bg-[#FF7F50]/90 text-white"
                disabled={isGenerating}
              >
                Regenerate image
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Regenerate Image</DialogTitle>
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
                  className="bg-[#FF7F50] text-white hover:bg-[#FF7F50]/90"
                  disabled={isGenerating}
                >
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
