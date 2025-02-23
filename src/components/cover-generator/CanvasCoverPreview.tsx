import { useRef, useEffect } from 'react';
import { useImageLoader } from './hooks/useImageLoader';
import CoverImageControls from './components/CoverImageControls';

interface CanvasCoverPreviewProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  coverImage?: string;
  selectedFont: string;
  selectedTemplate: string;
  selectedLayout: string;
  backCoverText?: string;
  category?: 'friends' | 'love';
  imagePosition?: { x: number; y: number };
  imageScale?: number;
  onImageAdjust?: (position: { x: number; y: number }, scale: number) => void;
}

const CanvasCoverPreview = ({
  coverTitle,
  subtitle,
  authorName,
  coverImage,
  selectedFont,
  selectedTemplate,
  selectedLayout,
  backCoverText = '',
  category = 'friends',
  imagePosition = { x: 0, y: 0 },
  imageScale = 100,
  onImageAdjust
}: CanvasCoverPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const image = useImageLoader(coverImage);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (category === 'love') {
      // For love stories, show front, spine, and back covers
      canvas.width = 800 * 2.5; // Space for front, spine, and back
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
    } else {
      // For funny biography, only show front cover
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

        // Apply user's position and scale adjustments
        const scale = imageScale / 100;
        drawWidth *= scale;
        drawHeight *= scale;
        x -= (drawWidth - canvas.width) * imagePosition.x;
        y -= (drawHeight - canvas.height) * imagePosition.y;

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
    }
  }, [coverTitle, subtitle, authorName, image, selectedFont, selectedTemplate, selectedLayout, category, imagePosition, imageScale, backCoverText]);

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden shadow-xl">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
        />
      </div>
      
      {category === 'friends' && coverImage && onImageAdjust && (
        <CoverImageControls
          coverImage={coverImage}
          imagePosition={imagePosition}
          imageScale={imageScale}
          onImageAdjust={onImageAdjust}
        />
      )}
    </div>
  );
};

export default CanvasCoverPreview;
