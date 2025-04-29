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

// 为插画书定义四种适合的字体
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
  // 确保选择的字体在当前可用的字体列表中
  const [tempSelectedFont, setTempSelectedFont] = useState<string>(() => {
    // 检查selectedFont是否在当前字体列表中
    const isValidFont = PICTURE_BOOK_FONTS.some(font => font.id === selectedFont);
    return isValidFont ? selectedFont : PICTURE_BOOK_FONTS[0].id;
  });

  const handleFontSelect = (fontId: string) => {
    setTempSelectedFont(fontId);
  };

  const handleApply = () => {
    onSelectFont(tempSelectedFont);
    setTimeout(() => {
      onOpenChange(false);
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Text Font</DialogTitle>
          <DialogDescription>
            Choose a font style for your picture book text
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <div className="grid grid-cols-1 gap-2">
            {PICTURE_BOOK_FONTS.map((font) => (
              <div
                key={font.id}
                onClick={() => handleFontSelect(font.id)}
                className={`
                  border rounded-lg cursor-pointer transition-all p-3
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
                  className="mt-2 p-2 bg-gray-50 rounded"
                  style={{ fontFamily: font.fontFamily }}
                >
                  <p className="text-lg">The quick brown fox jumps over the lazy dog</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
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
