import { Button } from '@/components/ui/button';
import { Edit, RefreshCw, ImageIcon, X, Type } from 'lucide-react';
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
import FontSelectionDialog from './FontSelectionDialog';

interface ContentImageCardProps {
  image?: string;
  leftImageUrl?: string;
  rightImageUrl?: string;
  isGenerating: boolean;
  onEditText?: () => void;
  onRegenerate: (style?: string) => void;
  onFontChange?: (fontId: string) => Promise<void>;
  index: number;
  authorName?: string;
  coverTitle?: string;
  showDedicationText?: boolean;
  text?: string;
  title?: string;
  selectedFont?: string;
}

// Image style options for love story
const STYLE_OPTIONS = [
  {
    id: 'Comic book',
    name: 'Comic Book',
    description: 'Bold outlines and vibrant colors',
    image: '/images/art-styles/comic-book.png'
  },
  {
    id: 'Line art',
    name: 'Line Art',
    description: 'Elegant, minimalist and black and white illustration',
    image: '/images/art-styles/line-art.png'
  },
  {
    id: 'Fantasy art',
    name: 'Fantasy Art',
    description: 'Dreamlike and magical aesthetic',
    image: '/images/art-styles/fantasy-art.png'
  },
  {
    id: 'Photographic (Default)',
    name: 'Photographic',
    description: 'Realistic, photography-like images',
    image: '/images/art-styles/photographic.png'
  },
  {
    id: 'Disney Charactor',
    name: 'Disney Character',
    description: 'Cartoon-like characters with Disney animation style',
    image: '/images/art-styles/disney-character.png'
  }
];

export const ContentImageCard = ({
  image,
  leftImageUrl,
  rightImageUrl,
  isGenerating,
  onEditText,
  onRegenerate,
  onFontChange,
  index,
  authorName,
  coverTitle,
  showDedicationText = false,
  text,
  title,
  selectedFont = 'comic-sans'
}: ContentImageCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFontDialogOpen, setIsFontDialogOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('Photographic (Default)');
  const [currentFont, setCurrentFont] = useState<string>(selectedFont);
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

    // Load the saved font from localStorage
    const savedFont = localStorage.getItem(`loveStoryFont_${index}`);
    if (savedFont) {
      setCurrentFont(savedFont);
    }
  }, [index]);

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

  const handleFontSelect = async (fontId: string) => {
    setCurrentFont(fontId);

    // 保存选择的字体到localStorage
    localStorage.setItem(`loveStoryFont_${index}`, fontId);

    // 如果提供了字体更改回调，则调用它
    if (onFontChange) {
      await onFontChange(fontId);
    }
  };

  return (
    <div className="relative mb-8">
      <div className="max-w-4xl mx-auto">
        <div className="aspect-[2/1] overflow-hidden relative">
          {isGenerating ? (
            <div className="h-full flex flex-col justify-center items-center text-center bg-white rounded-sm shadow-lg">
              <div className="relative w-8 h-8 mb-2">
                <div className="absolute inset-0 rounded-full border-t-2 border-[#FF7F50] animate-spin"></div>
              </div>
              <p className="text-sm font-medium text-[#FF7F50]">Generating image...</p>
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
          {/* Edit Text Button */}
          <Button
            className="bg-[#FF7F50] hover:bg-[#FF7F50]/90 text-white"
            disabled={isGenerating}
            onClick={() => setIsFontDialogOpen(true)}
          >
            <Type className="w-4 h-4 mr-2" />
            Edit text
          </Button>

          {/* Font Selection Dialog */}
          <FontSelectionDialog
            open={isFontDialogOpen}
            onOpenChange={setIsFontDialogOpen}
            onSelectFont={handleFontSelect}
            selectedFont={currentFont}
          />

          {/* Regenerate Image Dialog */}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {STYLE_OPTIONS.map((style) => (
                    <div
                      key={style.id}
                      onClick={() => handleStyleSelect(style.id)}
                      className={`
                        border rounded-lg cursor-pointer transition-all p-4
                        ${selectedStyle === style.id
                          ? 'border-2 border-[#FF7F50]'
                          : 'border border-gray-200 hover:border-gray-300'}
                      `}
                    >
                      <div className="text-center mb-4 relative">
                        <img
                          src={style.image}
                          alt={style.name}
                          className="w-16 h-16 object-cover mx-auto"
                        />
                        {selectedStyle === style.id && (
                          <div className="absolute top-0 right-0 w-6 h-6 rounded-full bg-[#FF7F50] flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <h4 className="font-medium text-gray-900">{style.name}</h4>
                        <p className="text-sm text-gray-500">{style.description}</p>
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
                  Regenerate with {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.name || selectedStyle}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};
