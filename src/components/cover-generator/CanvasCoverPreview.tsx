
import { useRef, useState } from 'react';
import { useImageLoader } from './hooks/useImageLoader';
import { useCanvasDrawing } from './hooks/useCanvasDrawing';
import { DEFAULT_CANVAS_SIZE } from './types/canvas';
import CoverImageControls from './components/CoverImageControls';

interface CanvasCoverPreviewProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  coverImage?: string;
  selectedFont: string;
  selectedTemplate?: string;
  selectedLayout?: string;
  isProcessingImage?: boolean;
  backCoverText?: string;
}

const CanvasCoverPreview = ({
  coverTitle,
  subtitle,
  authorName,
  coverImage,
  selectedFont,
  selectedTemplate = 'modern',
  selectedLayout = 'centered',
  isProcessingImage = false,
  backCoverText = ''
}: CanvasCoverPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageScale, setImageScale] = useState(100);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  
  const image = useImageLoader(coverImage, imageScale, imagePosition);
  
  useCanvasDrawing({
    canvasRef,
    coverTitle,
    subtitle,
    authorName,
    image,
    selectedFont,
    selectedTemplate,
    selectedLayout,
    imageScale,
    imagePosition,
    isProcessingImage,
    backCoverText
  });

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden shadow-xl max-h-[80vh]">
        <canvas
          ref={canvasRef}
          width={DEFAULT_CANVAS_SIZE.width}
          height={DEFAULT_CANVAS_SIZE.height}
          className="w-full h-full object-contain"
        />
      </div>
      
      {coverImage && (
        <CoverImageControls
          coverImage={coverImage}
          imagePosition={imagePosition}
          imageScale={imageScale}
          onImageAdjust={(position, scale) => {
            setImagePosition(position);
            setImageScale(scale);
          }}
        />
      )}
    </div>
  );
};

export default CanvasCoverPreview;
