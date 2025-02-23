
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

    // Draw image if available with proper centering and scaling
    if (image?.element) {
      const { width: imgWidth, height: imgHeight } = image.element;
      
      // Calculate aspect ratios
      const canvasAspect = canvas.width / canvas.height;
      const imageAspect = imgWidth / imgHeight;
      
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let x = 0;
      let y = 0;

      // Adjust dimensions to maintain aspect ratio while covering the canvas
      if (imageAspect > canvasAspect) {
        drawHeight = canvas.width / imageAspect;
        y = (canvas.height - drawHeight) / 2;
      } else {
        drawWidth = canvas.height * imageAspect;
        x = (canvas.width - drawWidth) / 2;
      }

      // Draw the image
      ctx.drawImage(image.element, x, y, drawWidth, drawHeight);
    }

    // Add a semi-transparent overlay
    ctx.fillStyle = 'rgba(255, 236, 209, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.font = `bold 60px ${selectedFont}`;
    ctx.fillStyle = '#C41E3A';
    ctx.textAlign = 'center';
    
    const titleParts = coverTitle.split(',');
    ctx.fillText(titleParts[0], canvas.width/2, 200);
    if (titleParts[1]) {
      ctx.fillText(titleParts[1].trim(), canvas.width/2, 280);
    }

    // Reset shadow for other text
    ctx.shadowColor = 'rgba(0, 0, 0, 0)';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

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
