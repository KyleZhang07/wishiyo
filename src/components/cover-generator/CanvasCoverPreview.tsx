
import { useEffect, useRef, useState } from 'react';
import ImageControls from './ImageControls';
import { TemplateType, CanvasSize, CanvasImage } from './types';
import { coverTemplates } from './types';

interface CanvasCoverPreviewProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  coverImage?: string;
  selectedFont: string;
  selectedTemplate?: string;
}

const DEFAULT_CANVAS_SIZE: CanvasSize = {
  width: 600,
  height: 800
};

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
  const [image, setImage] = useState<CanvasImage | null>(null);
  const template = coverTemplates[selectedTemplate];

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const drawCover = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas and draw background
    ctx.fillStyle = template.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw cover image if available
    if (image) {
      const scale = imageScale / 100;
      const { width, height } = image.element;
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      
      const x = (canvas.width - scaledWidth) / 2 + (imagePosition.x * scale);
      const y = (canvas.height - scaledHeight) / 2 + (imagePosition.y * scale);

      ctx.save();
      ctx.filter = template.imageStyle.filter;
      ctx.globalAlpha = parseFloat(template.imageStyle.opacity);
      ctx.drawImage(image.element, x, y, scaledWidth, scaledHeight);
      ctx.restore();
    }

    // Draw text content
    ctx.textAlign = template.titleStyle.textAlign;
    ctx.textBaseline = 'middle';

    // Draw title
    ctx.font = `${template.titleStyle.fontWeight} ${template.titleStyle.fontSize} ${selectedFont}`;
    ctx.fillStyle = template.titleStyle.color;
    ctx.fillText(coverTitle, canvas.width / 2, canvas.height * 0.3);

    // Draw subtitle
    ctx.font = `${template.subtitleStyle.fontWeight} ${template.subtitleStyle.fontSize} ${selectedFont}`;
    ctx.fillStyle = template.subtitleStyle.color;
    ctx.fillText(subtitle, canvas.width / 2, canvas.height * 0.45);

    // Draw author
    ctx.font = `normal ${template.authorStyle.fontSize} ${selectedFont}`;
    ctx.fillStyle = template.authorStyle.color;
    ctx.fillText(`By ${authorName}`, canvas.width / 2, canvas.height * 0.85);
  };

  useEffect(() => {
    const initCanvas = async () => {
      if (coverImage) {
        try {
          const img = await loadImage(coverImage);
          setImage({
            element: img,
            scale: imageScale,
            position: imagePosition
          });
        } catch (error) {
          console.error('Failed to load image:', error);
        }
      }
    };

    initCanvas();
  }, [coverImage]);

  useEffect(() => {
    drawCover();
  }, [template, coverTitle, subtitle, authorName, selectedFont, imageScale, imagePosition, image]);

  return (
    <div className="space-y-4">
      <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-xl">
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
