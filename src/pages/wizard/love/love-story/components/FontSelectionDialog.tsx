import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

// 为插画书定义五种适合的字体
export const PICTURE_BOOK_FONTS = [
  {
    id: 'comic-sans',
    name: 'Comic Sans',
    description: 'Playful and friendly, perfect for children\'s books',
    className: 'font-comic-sans',
    fontFamily: "'Comic Sans MS', cursive"
  },
  {
    id: 'patrick-hand',
    name: 'Patrick Hand',
    description: 'Handwritten style with a casual feel',
    className: 'font-patrick-hand',
    fontFamily: "'Patrick Hand', cursive"
  },
  {
    id: 'amatic-sc',
    name: 'Amatic SC',
    description: 'Whimsical and light, great for titles',
    className: 'font-amatic-sc',
    fontFamily: "'Amatic SC', cursive"
  },
  {
    id: 'caveat',
    name: 'Caveat',
    description: 'Flowing handwritten style with natural look',
    className: 'font-caveat',
    fontFamily: "'Caveat', cursive"
  },
  {
    id: 'lora',
    name: 'Lora',
    description: 'Elegant serif font with good readability',
    className: 'font-lora',
    fontFamily: "'Lora', serif"
  }
];

interface FontSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFont: (fontId: string) => void;
  selectedFont: string;
}

const FontSelectionDialog = ({
  open,
  onOpenChange,
  onSelectFont,
  selectedFont
}: FontSelectionDialogProps) => {
  const [tempSelectedFont, setTempSelectedFont] = useState<string>(selectedFont || PICTURE_BOOK_FONTS[0].id);

  const handleFontSelect = (fontId: string) => {
    setTempSelectedFont(fontId);
  };

  const handleApply = () => {
    onSelectFont(tempSelectedFont);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Text Font</DialogTitle>
          <DialogDescription>
            Choose a font style for your picture book text
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            {PICTURE_BOOK_FONTS.map((font) => (
              <div
                key={font.id}
                onClick={() => handleFontSelect(font.id)}
                className={`
                  border rounded-lg cursor-pointer transition-all p-4
                  ${tempSelectedFont === font.id
                    ? 'border-2 border-[#FF7F50]'
                    : 'border border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{font.name}</h4>
                    <p className="text-sm text-gray-500">{font.description}</p>
                  </div>
                  {tempSelectedFont === font.id && (
                    <div className="w-6 h-6 rounded-full bg-[#FF7F50] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div 
                  className="mt-3 p-2 bg-gray-50 rounded"
                  style={{ fontFamily: font.fontFamily }}
                >
                  <p className="text-lg">The quick brown fox jumps over the lazy dog</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="bg-[#FF7F50] text-white hover:bg-[#FF7F50]/90"
          >
            Apply Font
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FontSelectionDialog;
