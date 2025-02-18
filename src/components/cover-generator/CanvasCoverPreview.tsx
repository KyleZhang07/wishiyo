import { useEffect, useRef, useState } from 'react';
import ImageControls from './ImageControls';
import { CanvasSize, coverLayouts } from './types';
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
  selectedLayout?: string;
}

const DEFAULT_CANVAS_SIZE: CanvasSize = {
  width: 2400,
  height: 1000,
  spine: 100,
  gap: 30
};

const DEFAULT_SUMMARY = "A captivating journey through the pages of this book awaits. Join us on an unforgettable adventure filled with unexpected twists and turns. Every chapter brings new discoveries and insights that will keep you engaged until the very last page.";

const CanvasCoverPreview = ({
  coverTitle,
  subtitle,
  authorName,
  coverImage,
  selectedFont,
  selectedTemplate = 'modern',
  selectedLayout = 'centered'
}: CanvasCoverPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageScale, setImageScale] = useState(100);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  
  const image = useImageLoader(coverImage, imageScale, imagePosition);
  const template = coverTemplates[selectedTemplate];
  const layout = coverLayouts[selectedLayout];

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

    // Draw cover image if available with container constraints
    if (image && layout.imageContainerStyle) {
      const containerWidth = parseFloat(layout.imageContainerStyle.width) / 100 * coverWidth;
      const containerHeight = parseFloat(layout.imageContainerStyle.height) / 100 * canvas.height;
      
      // Calculate image dimensions while maintaining aspect ratio
      const scale = imageScale / 100;
      const { width: imgWidth, height: imgHeight } = image.element;
      const imgAspectRatio = imgWidth / imgHeight;
      const containerAspectRatio = containerWidth / containerHeight;
      
      let scaledWidth, scaledHeight;
      if (imgAspectRatio > containerAspectRatio) {
        scaledWidth = containerWidth;
        scaledHeight = containerWidth / imgAspectRatio;
      } else {
        scaledHeight = containerHeight;
        scaledWidth = containerHeight * imgAspectRatio;
      }

      // Calculate position based on layout configuration
      let y;
      switch (layout.imageContainerStyle.position) {
        case 'top':
          y = 0;
          break;
        case 'bottom':
          y = canvas.height - scaledHeight;
          break;
        default: // center
          y = (canvas.height - scaledHeight) / 2;
      }

      const x = frontX + (coverWidth - scaledWidth) / 2;

      // Apply container constraints
      ctx.save();
      if (layout.imageContainerStyle.borderRadius) {
        ctx.beginPath();
        const radius = parseFloat(layout.imageContainerStyle.borderRadius) / 100 * Math.min(containerWidth, containerHeight);
        ctx.arc(x + scaledWidth/2, y + scaledHeight/2, radius, 0, Math.PI * 2);
        ctx.clip();
      }
      
      ctx.filter = template.imageStyle.filter;
      ctx.globalAlpha = parseFloat(template.imageStyle.opacity);
      ctx.drawImage(image.element, x, y, scaledWidth, scaledHeight);
      ctx.restore();
    }

    // Draw text content
    drawFrontCover(ctx, template, layout, {
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
  }, [template, layout, coverTitle, subtitle, authorName, selectedFont, imageScale, imagePosition, image]);

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
