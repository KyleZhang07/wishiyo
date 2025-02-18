
import { Button } from '@/components/ui/button';
import { fontOptions } from './types';

interface FontSelectorProps {
  selectedFont: string;
  onSelectFont: (font: string) => void;
}

const FontSelector = ({ selectedFont, onSelectFont }: FontSelectorProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto py-4">
      {fontOptions.map((font) => (
        <Button
          key={font.id}
          variant={selectedFont === font.id ? 'default' : 'outline'}
          className="min-w-[120px]"
          onClick={() => onSelectFont(font.id)}
        >
          <span className={font.className}>{font.name}</span>
        </Button>
      ))}
    </div>
  );
};

export default FontSelector;
