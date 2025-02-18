
import { Button } from '@/components/ui/button';

interface FontSelectorProps {
  selectedFont: string;
  onSelectFont: (font: string) => void;
}

const FontSelector = ({ selectedFont, onSelectFont }: FontSelectorProps) => {
  const fonts = [
    { name: 'Classic', class: 'font-serif' },
    { name: 'Modern', class: 'font-sans' },
    { name: 'Elegant', class: 'font-display' },
    { name: 'Bold', class: 'font-bold' },
    { name: 'Script', class: 'font-playfair' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto py-4">
      {fonts.map((font) => (
        <Button
          key={font.name}
          variant={selectedFont === font.class ? 'default' : 'outline'}
          className={`${font.class} min-w-[80px]`}
          onClick={() => onSelectFont(font.class)}
        >
          Aa
        </Button>
      ))}
    </div>
  );
};

export default FontSelector;
