
import { useRef, useEffect } from 'react';
import { useImageLoader } from './hooks/useImageLoader';

interface CanvasCoverPreviewProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  coverImage?: string;
  selectedFont: string;
  selectedTemplate: string;
  selectedLayout: string;
  backCoverText?: string;
}

const CanvasCoverPreview = ({
  coverTitle,
  subtitle,
  authorName,
  coverImage,
  selectedFont,
  selectedTemplate,
  selectedLayout,
  backCoverText = ''
}: CanvasCoverPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const image = useImageLoader(coverImage);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 1200;

    // Draw background
    ctx.fillStyle = '#FFECD1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw image if available
    if (image?.element) {
      const { width: imgWidth, height: imgHeight } = image.element;
      const scale = Math.min(canvas.width / imgWidth, canvas.height / imgHeight);
      const x = (canvas.width - imgWidth * scale) / 2;
      const y = (canvas.height - imgHeight * scale) / 2;
      
      ctx.drawImage(image.element, x, y, imgWidth * scale, imgHeight * scale);
    }

    // Draw title
    ctx.font = `bold 60px ${selectedFont}`;
    ctx.fillStyle = '#C41E3A';
    ctx.textAlign = 'center';
    
    const titleParts = coverTitle.split(',');
    ctx.fillText(titleParts[0], canvas.width/2, 200);
    if (titleParts[1]) {
      ctx.fillText(titleParts[1].trim(), canvas.width/2, 280);
    }

    // Draw author
    ctx.font = `italic 36px ${selectedFont}`;
    ctx.fillText(`by ${authorName}`, canvas.width/2, 350);

    // Draw subtitle banner
    ctx.font = `32px ${selectedFont}`;
    ctx.fillText(subtitle, canvas.width/2, 900);

  }, [coverTitle, subtitle, authorName, image, selectedFont, selectedTemplate, selectedLayout]);

  return (
    <div className="relative rounded-lg overflow-hidden shadow-xl">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default CanvasCoverPreview;
