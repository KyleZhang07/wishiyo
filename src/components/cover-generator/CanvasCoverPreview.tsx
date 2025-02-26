import { useRef, useEffect } from 'react';
import { useImageLoader } from './hooks/useImageLoader';
import CoverImageControls from './components/CoverImageControls';
import { coverTemplates, coverLayouts } from './types';

interface CanvasCoverPreviewProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  coverImage?: string;
  selectedFont: string;
  selectedTemplate: string;
  selectedLayout: string;
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
  category = 'friends',
  imagePosition = { x: 0, y: 0 },
  imageScale = 100,
  onImageAdjust
}: CanvasCoverPreviewProps) => {
  const frontCoverRef = useRef<HTMLCanvasElement>(null);
  const spineRef = useRef<HTMLCanvasElement>(null);
  const backCoverRef = useRef<HTMLCanvasElement>(null);
  const image = useImageLoader(coverImage);

  useEffect(() => {
    // Get all canvas elements
    const frontCanvas = frontCoverRef.current;
    const spineCanvas = spineRef.current;
    const backCanvas = backCoverRef.current;
    
    if (!frontCanvas || !spineCanvas || !backCanvas) return;
    
    const frontCtx = frontCanvas.getContext('2d');
    const spineCtx = spineCanvas.getContext('2d');
    const backCtx = backCanvas.getContext('2d');
    
    if (!frontCtx || !spineCtx || !backCtx) return;

    // Set canvas dimensions for each part
    frontCanvas.width = 800;
    frontCanvas.height = 1200;
    
    spineCanvas.width = 60;  // Make spine narrower
    spineCanvas.height = 1200;
    
    backCanvas.width = 800;
    backCanvas.height = 1200;

    const template = coverTemplates[selectedTemplate] || coverTemplates.modern;
    const layout = coverLayouts[selectedLayout] || coverLayouts['classic-centered'];

    // Clear each canvas
    frontCtx.clearRect(0, 0, frontCanvas.width, frontCanvas.height);
    spineCtx.clearRect(0, 0, spineCanvas.width, spineCanvas.height);
    backCtx.clearRect(0, 0, backCanvas.width, backCanvas.height);

    // Draw each part separately
    drawFrontCover(frontCtx, frontCanvas.width, frontCanvas.height, template, layout);
    drawSpine(spineCtx, spineCanvas.width, spineCanvas.height, template);
    drawBackCover(backCtx, backCanvas.width, backCanvas.height, template);
    
  }, [coverTitle, subtitle, authorName, image, selectedFont, selectedTemplate, selectedLayout, category, imagePosition, imageScale]);

  const drawFrontCover = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    template: any, 
    layout: any
  ) => {
    // Draw background
    ctx.fillStyle = template.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw image if available with proper centering and scaling
    if (image?.element) {
      const { width: imgWidth, height: imgHeight } = image.element;
      
      // Calculate aspect ratios
      const canvasAspect = width / height;
      const imageAspect = imgWidth / imgHeight;
      
      let drawWidth = width;
      let drawHeight = height;
      let x = 0;
      let y = 0;

      // Adjust dimensions to maintain aspect ratio while covering the canvas
      if (imageAspect > canvasAspect) {
        drawHeight = width / imageAspect;
        y = (height - drawHeight) / 2;
      } else {
        drawWidth = height * imageAspect;
        x = (width - drawWidth) / 2;
      }

      // Apply user's position and scale adjustments
      const scale = imageScale / 100;
      drawWidth *= scale;
      drawHeight *= scale;
      x -= (drawWidth - width) * imagePosition.x;
      y -= (drawHeight - height) * imagePosition.y;

      // Apply layout container positioning
      if (layout.imageContainerStyle) {
        // Adjust position based on layout settings
        const imgWidth = parseFloat(layout.imageContainerStyle.width) / 100 * width;
        const imgHeight = parseFloat(layout.imageContainerStyle.height) / 100 * height;
        
        // Center horizontally
        x = (width - imgWidth) / 2;
        
        // Position vertically based on layout
        if (layout.imageContainerStyle.position === 'top') {
          y = 0;
        } else if (layout.imageContainerStyle.position === 'center') {
          y = (height - imgHeight) / 2;
        } else if (layout.imageContainerStyle.position === 'bottom') {
          y = height - imgHeight;
        }
        
        // Draw the image with style based on the template
        ctx.filter = template.imageStyle.filter;
        ctx.globalAlpha = parseFloat(template.imageStyle.opacity);
        
        // Apply border radius if specified
        if (layout.imageContainerStyle.borderRadius) {
          const radius = parseFloat(layout.imageContainerStyle.borderRadius);
          
          // Save context for clipping
          ctx.save();
          
          // Create rounded rectangle path for clipping
          const cornerRadius = (radius / 100) * Math.min(imgWidth, imgHeight);
          ctx.beginPath();
          ctx.moveTo(x + cornerRadius, y);
          ctx.lineTo(x + imgWidth - cornerRadius, y);
          ctx.quadraticCurveTo(x + imgWidth, y, x + imgWidth, y + cornerRadius);
          ctx.lineTo(x + imgWidth, y + imgHeight - cornerRadius);
          ctx.quadraticCurveTo(x + imgWidth, y + imgHeight, x + imgWidth - cornerRadius, y + imgHeight);
          ctx.lineTo(x + cornerRadius, y + imgHeight);
          ctx.quadraticCurveTo(x, y + imgHeight, x, y + imgHeight - cornerRadius);
          ctx.lineTo(x, y + cornerRadius);
          ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
          ctx.closePath();
          ctx.clip();
          
          // Draw image
          ctx.drawImage(image.element, x, y, imgWidth, imgHeight);
          
          // Restore context
          ctx.restore();
        } else {
          // Draw without clipping
          ctx.drawImage(image.element, x, y, imgWidth, imgHeight);
        }
        
        ctx.globalAlpha = 1.0;
        ctx.filter = 'none';
      } else {
        // Use default image drawing if no layout container style
        ctx.filter = template.imageStyle.filter;
        ctx.globalAlpha = parseFloat(template.imageStyle.opacity);
        ctx.drawImage(image.element, x, y, drawWidth, drawHeight);
        ctx.globalAlpha = 1.0;
        ctx.filter = 'none';
      }
    }

    // Add a semi-transparent overlay
    ctx.fillStyle = `${template.backgroundColor}33`; // 20% opacity
    ctx.fillRect(0, 0, width, height);

    // Get author initials
    const initials = authorName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase();

    // Draw author initials at the top left
    ctx.font = `bold 48px ${selectedFont}`;
    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.textAlign = 'left';
    ctx.fillText(initials, 40, 80);

    // Draw title at the bottom in green
    ctx.font = `bold 48px ${selectedFont}`;
    ctx.fillStyle = '#7CFC00'; // Bright green
    ctx.textAlign = 'left';
    
    // Split title into lines if needed
    const titleLines = coverTitle.toUpperCase().split(' ');
    const midPoint = Math.ceil(titleLines.length / 2);
    
    const firstLine = titleLines.slice(0, midPoint).join(' ');
    const secondLine = titleLines.slice(midPoint).join(' ');
    
    ctx.fillText(firstLine, 40, height - 140);
    if (secondLine) {
      ctx.fillText(secondLine, 40, height - 80);
    }

    // Draw subtitle below title
    ctx.font = `18px ${selectedFont}`;
    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.textAlign = 'left';
    ctx.fillText(subtitle, 40, height - 40);

    // Draw bestseller badge (like in the reference image)
    if (category === 'friends') {
      // Draw hexagonal badge instead of circle
      const badgeX = width - 120;
      const badgeY = 250;
      const badgeSize = 100;
      
      // Draw hexagon
      ctx.fillStyle = '#7CFC00'; // Bright green
      ctx.beginPath();
      
      // Draw hexagon path
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = badgeX + badgeSize * Math.cos(angle);
        const y = badgeY + badgeSize * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      ctx.fill();
      
      // Draw text in badge
      ctx.fillStyle = '#121212'; // Dark text
      ctx.textAlign = 'center';
      ctx.font = `bold 36px ${selectedFont}`;
      ctx.fillText('#1', badgeX, badgeY - 15);
      ctx.font = `bold 14px ${selectedFont}`;
      ctx.fillText('WORLDWIDE', badgeX, badgeY + 15);
      ctx.fillText('BESTSELLER', badgeX, badgeY + 35);
    }
  };

  const drawSpine = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    template: any
  ) => {
    // Draw spine background
    ctx.fillStyle = template.spineStyle.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Get author initials
    const initials = authorName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase();
    
    // Draw spine text vertically
    ctx.save();
    ctx.translate(width/2, height/2);
    ctx.rotate(-Math.PI/2);
    
    // Draw title text vertically - use shorter text if too long
    ctx.font = `bold 14px ${selectedFont}`;  // Even smaller font
    ctx.fillStyle = '#7CFC00'; // Bright green
    ctx.textAlign = 'center';
    
    // Limit the title length for the spine
    const maxSpineLength = 25; // Characters
    let spineText = coverTitle.toUpperCase();
    if (spineText.length > maxSpineLength) {
      spineText = spineText.substring(0, maxSpineLength - 3) + '...';
    }
    
    // Draw the text in the spine
    ctx.fillText(spineText, 0, 0);
    
    // Draw author initials at the bottom - positioned higher up
    ctx.font = `bold 20px ${selectedFont}`;
    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.textAlign = 'center';
    ctx.fillText(initials, 0, -height/2 + 50);
    
    ctx.restore();
  };

  const drawBackCover = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    template: any
  ) => {
    // Draw background
    ctx.fillStyle = template.backCoverStyle.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw book info at the bottom
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.font = `14px ${selectedFont}`;
    ctx.fillText("Visit bookbyanyone.com", 40, height - 80);
    
    ctx.font = `bold 18px ${selectedFont}`;
    ctx.fillStyle = '#FF6B35'; // Orange for BOOK BY ANYONE
    ctx.fillText("BOOK BY ANYONE", 40, height - 50);

    // Draw barcode at the bottom right
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(width - 180, height - 100, 140, 60);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center items-start gap-10">
        <div className="relative rounded-lg overflow-hidden shadow-xl" style={{ width: '250px', height: '375px' }}>
          <canvas
            ref={frontCoverRef}
            className="w-full h-full object-contain"
          />
        </div>
        
        <div className="relative rounded-lg overflow-hidden shadow-xl" style={{ width: '25px', height: '375px' }}>
          <canvas
            ref={spineRef}
            className="w-full h-full"
          />
        </div>
        
        <div className="relative rounded-lg overflow-hidden shadow-xl" style={{ width: '250px', height: '375px' }}>
          <canvas
            ref={backCoverRef}
            className="w-full h-full object-contain"
          />
        </div>
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
