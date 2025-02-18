
import { useEffect, useRef, useState } from 'react';
import ImageControls from './ImageControls';
import { CanvasSize } from './types';
import { coverTemplates } from './types';
import { useImageLoader } from './hooks/useImageLoader';
import { drawFrontCover, drawSpine, drawBackCover } from './utils/canvasDrawing';

interface CanvasCoverPreviewProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  coverImage?: string;
  selectedFont: string;
  selectedTemplate?: string;
}

const DEFAULT_CANVAS_SIZE: CanvasSize = {
  width: 2000,
  height: 800,
  spine: 80,
  gap: 20
};

const DEFAULT_SUMMARY = "A captivating journey through the pages of this book awaits. Join us on an unforgettable adventure filled with unexpected twists and turns. Every chapter brings new discoveries and insights that will keep you engaged until the very last page.";

const CanvasCoverPreview = ({
  coverTitle,
  subtitle,
  authorName,
  coverImage,
  selectedFont,
  selectedTemplate = 'modern'
}: CanvasCoverPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageScale, setImageScale] = useState(100);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  
  const image = useImageLoader(coverImage, imageScale, imagePosition);
  const template = coverTemplates[selectedTemplate];

  const drawCover = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coverWidth = DEFAULT_CANVAS_SIZE.height * 0.75;
    const spineWidth = DEFAULT_CANVAS_SIZE.spine;
    const gap = DEFAULT_CANVAS_SIZE.gap;

    // Calculate positions
    const frontX = gap;
    const spineX = frontX + coverWidth + gap;
    const backX = spineX + spineWidth + gap;

    // Clear canvas and draw backgrounds
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw front cover
    ctx.fillStyle = template.backgroundColor;
    ctx.fillRect(frontX, 0, coverWidth, canvas.height);

    // Draw spine
    ctx.fillStyle = template.spineStyle.backgroundColor;
    ctx.fillRect(spineX, 0, spineWidth, canvas.height);

    // Draw back cover
    ctx.fillStyle = template.backCoverStyle.backgroundColor;
    ctx.fillRect(backX, 0, coverWidth, canvas.height);

    // Draw cover image if available
    if (image) {
      const scale = imageScale / 100;
      const { width, height } = image.element;
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      
      const x = frontX + (coverWidth - scaledWidth) / 2 + (imagePosition.x * scale);
      const y = (canvas.height - scaledHeight) / 2 + (imagePosition.y * scale);

      ctx.save();
      ctx.filter = template.imageStyle.filter;
      ctx.globalAlpha = parseFloat(template.imageStyle.opacity);
      ctx.drawImage(image.element, x, y, scaledWidth, scaledHeight);
      ctx.restore();
    }

    // Draw cover sections
    drawFrontCover(ctx, template, {
      frontX,
      coverWidth,
      height: canvas.height,
      title: coverTitle,
      subtitle,
      authorName,
      selectedFont
    });

    drawSpine(ctx, template, {
      spineX,
      spineWidth,
      height: canvas.height,
      title: coverTitle,
      authorName,
      selectedFont
    });

    drawBackCover(ctx, template, {
      backX,
      coverWidth,
      height: canvas.height,
      summary: DEFAULT_SUMMARY,
      selectedFont
    });
  };

  useEffect(() => {
    drawCover();
  }, [template, coverTitle, subtitle, authorName, selectedFont, imageScale, imagePosition, image]);

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden shadow-xl">
        <canvas
          ref={canvasRef}
          width={DEFAULT_CANVAS_SIZE.width}
          height={DEFAULT_CANVAS_SIZE.height}
          className="w-full h-full"
        />
      </div>
      
      {coverImage && (
        <ImageControls
          imageScale={imageScale}
          onScaleChange={setImageScale}
          onReset={() => setImageScale(100)}
          onCenter={() => setImagePosition({ x: 0, y: 0 })}
        />
      )}
    </div>
  );
};

export default CanvasCoverPreview;
