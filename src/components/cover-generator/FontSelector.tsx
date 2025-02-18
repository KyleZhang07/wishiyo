
import { Button } from '@/components/ui/button';

interface FontSelectorProps {
  selectedFont: string;
  onSelectFont: (font: string) => void;
}

const FontSelector = ({ selectedFont, onSelectFont }: FontSelectorProps) => {
  const layouts = [
    { name: 'Centered', class: 'text-center' },
    { name: 'Classic', class: 'text-left' },
    { name: 'Modern Split', class: 'text-right' },
    { name: 'Dynamic', class: 'font-bold' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto py-4">
      {layouts.map((layout) => (
        <Button
          key={layout.name}
          variant={selectedFont === layout.class ? 'default' : 'outline'}
          className={`${layout.class} min-w-[80px]`}
          onClick={() => onSelectFont(layout.class)}
        >
          {layout.name}
        </Button>
      ))}
    </div>
  );
};

export default FontSelector;
