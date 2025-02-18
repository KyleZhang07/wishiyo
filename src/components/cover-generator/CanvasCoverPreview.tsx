
import { useEffect, useRef, useState } from 'react';
import ImageControls from './ImageControls';
import { FullCoverTemplate, CanvasSize, CanvasImage } from './types';
import { fullCoverTemplates } from './types';

interface CanvasCoverPreviewProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  coverImage?: string;
  selectedFont: string;
  selectedTemplate?: string;
}

const DEFAULT_CANVAS_SIZE: CanvasSize = {
  width: 1800, // Increased width to accommodate front, spine, and back
  height: 800,
  spine: 100 // Standard spine width
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
  const template = fullCoverTemplates[selectedTemplate];

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

    const frontWidth = DEFAULT_CANVAS_SIZE.height * 0.75; // Keep aspect ratio 3:4
    const backWidth = frontWidth;
    const spineWidth = DEFAULT_CANVAS_SIZE.spine;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw back cover
    ctx.fillStyle = template.backCoverStyle.backgroundColor;
    ctx.fillRect(0, 0, backWidth, canvas.height);

    // Draw spine
    ctx.fillStyle = template.spineStyle.backgroundColor;
    ctx.fillRect(backWidth, 0, spineWidth, canvas.height);

    // Draw front cover
    ctx.fillStyle = template.backgroundColor;
    ctx.fillRect(backWidth + spineWidth, 0, frontWidth, canvas.height);

    // Draw cover image if available
    if (image) {
      const scale = imageScale / 100;
      const { width, height } = image.element;
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      
      const x = backWidth + spineWidth + (frontWidth - scaledWidth) / 2 + (imagePosition.x * scale);
      const y = (canvas.height - scaledHeight) / 2 + (imagePosition.y * scale);

      ctx.save();
      ctx.filter = template.imageStyle.filter;
      ctx.globalAlpha = parseFloat(template.imageStyle.opacity);
      ctx.drawImage(image.element, x, y, scaledWidth, scaledHeight);
      ctx.restore();
    }

    // Draw front cover text
    ctx.textAlign = template.titleStyle.textAlign;
    ctx.textBaseline = 'middle';

    // Front title
    ctx.font = `${template.titleStyle.fontWeight} ${template.titleStyle.fontSize} ${selectedFont}`;
    ctx.fillStyle = template.titleStyle.color;
    const frontCenterX = backWidth + spineWidth + (frontWidth / 2);
    ctx.fillText(coverTitle, frontCenterX, canvas.height * 0.3);

    // Front subtitle
    ctx.font = `${template.subtitleStyle.fontWeight} ${template.subtitleStyle.fontSize} ${selectedFont}`;
    ctx.fillStyle = template.subtitleStyle.color;
    ctx.fillText(subtitle, frontCenterX, canvas.height * 0.45);

    // Front author
    ctx.font = `normal ${template.authorStyle.fontSize} ${selectedFont}`;
    ctx.fillStyle = template.authorStyle.color;
    ctx.fillText(`By ${authorName}`, frontCenterX, canvas.height * 0.85);

    // Draw spine text
    ctx.save();
    ctx.translate(backWidth + (spineWidth / 2), canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = `bold 1rem ${selectedFont}`;
    ctx.fillStyle = template.spineStyle.titleColor;
    ctx.fillText(coverTitle, 0, 0);
    ctx.fillStyle = template.spineStyle.authorColor;
    ctx.font = `normal 0.8rem ${selectedFont}`;
    ctx.fillText(authorName, 0, spineWidth * 0.6);
    ctx.restore();

    // Draw back cover text
    ctx.textAlign = 'left';
    ctx.font = `normal ${template.backCoverStyle.summaryFontSize} ${selectedFont}`;
    ctx.fillStyle = template.backCoverStyle.textColor;
    const summary = "A captivating journey through the pages of this book awaits...";
    const backMargin = 40;
    const maxWidth = backWidth - (backMargin * 2);
    
    // Wrap text for back cover
    const words = summary.split(' ');
    let line = '';
    let y = canvas.height * 0.2;
    
    for (let word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth) {
        ctx.fillText(line, backMargin, y);
        line = word + ' ';
        y += 30;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, backMargin, y);
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
