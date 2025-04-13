
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomInIcon, ZoomOutIcon } from 'lucide-react';

interface ImageControlsProps {
  imageScale: number;
  onScaleChange: (value: number) => void;
  onReset: () => void;
  onCenter: () => void;
}

const ImageControls = ({
  imageScale,
  onScaleChange,
  onReset,
  onCenter
}: ImageControlsProps) => {
  return (
    <div className="space-y-4 p-4 bg-gray-900 rounded-lg">
      <div className="flex items-center justify-between text-white">
        <ZoomOutIcon className="h-4 w-4" />
        <Slider
          value={[imageScale]}
          onValueChange={(value) => onScaleChange(value[0])}
          min={60}
          max={180}
          step={1}
          className="w-full mx-4"
        />
        <ZoomInIcon className="h-4 w-4" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="text-white"
        >
          Reset Zoom
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCenter}
          className="text-white"
        >
          Center Image
        </Button>
      </div>
    </div>
  );
};

export default ImageControls;
