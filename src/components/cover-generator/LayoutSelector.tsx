
import { Button } from '@/components/ui/button';
import { coverLayouts } from './types';

interface LayoutSelectorProps {
  selectedLayout: string;
  onSelectLayout: (layout: string) => void;
}

const LayoutSelector = ({ selectedLayout, onSelectLayout }: LayoutSelectorProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto py-4">
      {Object.values(coverLayouts).map((layout) => (
        <Button
          key={layout.id}
          variant={selectedLayout === layout.id ? 'default' : 'outline'}
          className="min-w-[120px]"
          onClick={() => onSelectLayout(layout.id)}
        >
          {layout.name}
        </Button>
      ))}
    </div>
  );
};

export default LayoutSelector;
