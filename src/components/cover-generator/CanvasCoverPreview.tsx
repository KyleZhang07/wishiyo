
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

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth) {
        ctx.fillText(line, x, currentY);
        line = word + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    return currentY;
  };

  const drawCover = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coverWidth = DEFAULT_CANVAS_SIZE.height * 0.75; // 3:4 aspect ratio
    const spineWidth = DEFAULT_CANVAS_SIZE.spine;
    const gap = DEFAULT_CANVAS_SIZE.gap;

    // Calculate positions
    const frontX = gap;
    const spineX = frontX + coverWidth + gap;
    const backX = spineX + spineWidth + gap;

    // Clear canvas
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

    // Draw front cover text
    const frontCenterX = frontX + (coverWidth / 2);
    ctx.textAlign = template.titleStyle.textAlign;
    ctx.textBaseline = 'middle';

    // Front title with text wrapping
    ctx.font = `${template.titleStyle.fontWeight} ${template.titleStyle.fontSize} ${selectedFont}`;
    ctx.fillStyle = template.titleStyle.color;
    wrapText(ctx, coverTitle, frontX + 40, canvas.height * 0.3, coverWidth - 80, 60);

    // Front subtitle
    ctx.font = `${template.subtitleStyle.fontWeight} ${template.subtitleStyle.fontSize} ${selectedFont}`;
    ctx.fillStyle = template.subtitleStyle.color;
    wrapText(ctx, subtitle, frontX + 40, canvas.height * 0.5, coverWidth - 80, 40);

    // Front author
    ctx.font = `normal ${template.authorStyle.fontSize} ${selectedFont}`;
    ctx.fillStyle = template.authorStyle.color;
    ctx.fillText(`By ${authorName}`, frontCenterX, canvas.height * 0.85);

    // Draw spine text
    ctx.save();
    ctx.translate(spineX + (spineWidth / 2), canvas.height * 0.5);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = `bold 1rem ${selectedFont}`;
    ctx.fillStyle = template.spineStyle.titleColor;
    ctx.fillText(coverTitle, 0, 0);
    ctx.font = `normal 0.8rem ${selectedFont}`;
    ctx.fillStyle = template.spineStyle.authorColor;
    ctx.fillText(authorName, 0, spineWidth * 0.6);
    ctx.restore();

    // Draw back cover text
    ctx.textAlign = 'left';
    ctx.font = `normal ${template.backCoverStyle.summaryFontSize} ${selectedFont}`;
    ctx.fillStyle = template.backCoverStyle.textColor;
    wrapText(ctx, DEFAULT_SUMMARY, backX + 40, canvas.height * 0.2, coverWidth - 80, 30);
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
