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
      
      // Calculate base image dimensions to fit container
      const { width: imgWidth, height: imgHeight } = image.element;
      const imgAspectRatio = imgWidth / imgHeight;
      const containerAspectRatio = containerWidth / containerHeight;
      
      // Calculate scaled dimensions based on zoom level
      const scale = imageScale / 100;
      let scaledWidth, scaledHeight;
      
      if (imgAspectRatio > containerAspectRatio) {
        scaledWidth = containerWidth * scale;
        scaledHeight = (containerWidth / imgAspectRatio) * scale;
      } else {
        scaledHeight = containerHeight * scale;
        scaledWidth = (containerHeight * imgAspectRatio) * scale;
      }

      // Center the image in container and apply position offset
      let y = (canvas.height - scaledHeight) / 2;
      let x = frontX + (coverWidth - scaledWidth) / 2;

      // Limit image position to stay within container
      const maxOffsetX = (scaledWidth - containerWidth) / 2;
      const maxOffsetY = (scaledHeight - containerHeight) / 2;
      
      const offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, imagePosition.x * scale));
      const offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, imagePosition.y * scale));
      
      x -= offsetX;
      y -= offsetY;

      // Apply container constraints
      ctx.save();
      ctx.beginPath();
      const clipX = frontX + (coverWidth - containerWidth) / 2;
      const clipY = (canvas.height - containerHeight) / 2;
      
      if (layout.imageContainerStyle.borderRadius) {
        const radius = parseFloat(layout.imageContainerStyle.borderRadius) / 100 * Math.min(containerWidth, containerHeight);
        ctx.arc(clipX + containerWidth/2, clipY + containerHeight/2, radius, 0, Math.PI * 2);
      } else {
        ctx.rect(clipX, clipY, containerWidth, containerHeight);
      }
      ctx.clip();
      
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
