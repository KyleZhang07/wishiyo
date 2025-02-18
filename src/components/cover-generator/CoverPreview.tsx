
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ImageIcon, ZoomInIcon, ZoomOutIcon } from 'lucide-react';

interface CoverPreviewProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  coverImage?: string;
  selectedFont: string;
}

const CoverPreview = ({
  coverTitle,
  subtitle,
  authorName,
  coverImage,
  selectedFont,
}: CoverPreviewProps) => {
  const [imageScale, setImageScale] = useState(100);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  return (
    <div className="space-y-4">
      <div className="relative bg-black aspect-[3/4] rounded-lg overflow-hidden shadow-xl">
        {coverImage && (
          <div 
            className="absolute inset-0 bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${coverImage})`,
              backgroundSize: `${imageScale}%`,
              backgroundPosition: `${50 + imagePosition.x}% ${50 + imagePosition.y}%`,
              filter: 'brightness(0.7)',
            }}
          />
        )}
        <div className="relative z-10 h-full flex flex-col justify-between p-8">
          <div className="space-y-2 text-center">
            <h1 className={`text-4xl font-bold text-white ${selectedFont}`}>{coverTitle}</h1>
            <p className={`text-xl text-gray-300 ${selectedFont}`}>{subtitle}</p>
          </div>
          <div className="text-center">
            <p className={`text-lg text-white ${selectedFont}`}>By {authorName}</p>
          </div>
        </div>
      </div>
      
      {coverImage && (
        <div className="space-y-4 p-4 bg-gray-900 rounded-lg">
          <div className="flex items-center justify-between text-white">
            <ZoomOutIcon className="h-4 w-4" />
            <Slider
              value={[imageScale]}
              onValueChange={(value) => setImageScale(value[0])}
              min={50}
              max={150}
              step={1}
              className="w-full mx-4"
            />
            <ZoomInIcon className="h-4 w-4" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImageScale(100)}
              className="text-white"
            >
              Reset Zoom
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImagePosition({ x: 0, y: 0 })}
              className="text-white"
            >
              Center Image
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverPreview;
