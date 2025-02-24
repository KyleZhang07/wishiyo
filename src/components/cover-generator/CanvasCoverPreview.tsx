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

  // Get praise words from props or local storage
  const getPraiseWords = (): string => {
    // First, use the backCoverText prop if available
    if (backCoverText) {
      return backCoverText;
    }
    
    // Otherwise, try to get from storage
    try {
      // Check for formatted praises first (already formatted by parent)
      const formattedPraises = localStorage.getItem('funnyBiographyFormattedPraises');
      if (formattedPraises) {
        return formattedPraises;
      }
      
      // Fall back to raw praises data
      const bookType = window.location.pathname.split('/')[3];
      const storageKey = bookType === 'funny-biography' ? 'funnyBiographyPraises' : '';
      
      if (!storageKey) return '';
      
      const savedPraises = localStorage.getItem(storageKey);
      if (!savedPraises) return '';
      
      const praises = JSON.parse(savedPraises);
      if (!Array.isArray(praises)) return '';
      
      return praises
        .map((praise: { quote: string; source: string }) => 
          `"${praise.quote}"\n— ${praise.source}`
        )
        .join('\n\n');
    } catch (error) {
      console.error('Error getting praise words:', error);
      return '';
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions for full book display (front, spine, back)
    canvas.width = 800 * 2.5 + 40; // Increased width to accommodate wider gaps
    canvas.height = 1200;

    const template = coverTemplates[selectedTemplate] || coverTemplates.modern;
    const layout = coverLayouts[selectedLayout] || coverLayouts['classic-centered'];
    const praiseWords = getPraiseWords();

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all three parts
    drawFullBookCover(ctx, canvas, template, layout, praiseWords);
    
  }, [coverTitle, subtitle, authorName, image, selectedFont, selectedTemplate, selectedLayout, category, imagePosition, imageScale, backCoverText]);

  const drawFullBookCover = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    template: any, 
    layout: any,
    praiseWords: string
  ) => {
    const frontCoverWidth = 800;
    const spineWidth = 100;
    const backCoverWidth = 800;
    const gapWidth = 40; // Increased from 20 to 40 for more visible gaps
    const totalWidth = frontCoverWidth + (gapWidth * 2) + spineWidth + backCoverWidth;
    const height = 1200;

    // Fill the entire canvas with white background to make gaps more visible
    ctx.fillStyle = '#FFFFFF'; // White background for gaps
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw front cover (left side)
    ctx.save();
    ctx.translate(0, 0);
    drawFrontCover(ctx, frontCoverWidth, height, template, layout);
    ctx.restore();

    // Draw spine (middle)
    ctx.save();
    ctx.translate(frontCoverWidth + gapWidth, 0);
    drawSpine(ctx, spineWidth, height, template);
    ctx.restore();

    // Draw back cover (right side)
    ctx.save();
    ctx.translate(frontCoverWidth + gapWidth + spineWidth + gapWidth, 0);
    drawBackCover(ctx, backCoverWidth, height, template, praiseWords);
    ctx.restore();
  };

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

    // Draw "SS" author initials at the top left
    ctx.font = `bold 48px ${selectedFont}`;
    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.textAlign = 'left';
    ctx.fillText("SS", 40, 80);

    // Draw title at the bottom in green
    ctx.font = `bold 48px ${selectedFont}`;
    ctx.fillStyle = '#7CFC00'; // Bright green
    ctx.textAlign = 'left';
    ctx.fillText("FAMILY FEUDS", 40, height - 140);
    ctx.fillText("& FOOD FIGHTS", 40, height - 80);

    // Draw subtitle below title
    ctx.font = `18px ${selectedFont}`;
    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.textAlign = 'left';
    ctx.fillText("Navigating Sibling Rivalry and Savage Supper Showdowns, One Meal at a Time", 40, height - 40);

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

    // Draw spine text vertically
    ctx.save();
    ctx.translate(width/2, height/2);
    ctx.rotate(-Math.PI/2);
    
    // Draw "FAMILY FEUDS & FOOD FIGHTS" text vertically
    ctx.font = `bold 24px ${selectedFont}`;
    ctx.fillStyle = '#7CFC00'; // Bright green
    ctx.textAlign = 'center';
    
    // Draw the text in the spine
    const spineText = "FAMILY FEUDS & FOOD FIGHTS";
    ctx.fillText(spineText, 0, 0);
    
    // Draw author initials at the bottom
    ctx.font = `bold 36px ${selectedFont}`;
    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.textAlign = 'center';
    ctx.fillText("SS", 0, -height/2 + 100);
    
    ctx.restore();
  };

  const drawBackCover = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    template: any,
    praiseWords: string
  ) => {
    // Draw background
    ctx.fillStyle = template.backCoverStyle.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw "Praises for Family Feuds & Food Fights" header
    ctx.font = `bold 28px ${selectedFont}`;
    ctx.fillStyle = '#7CFC00'; // Bright green for header
    ctx.textAlign = 'left';
    ctx.fillText("Praises for Family Feuds & Food Fights", 40, 80);

    // Draw praise words
    ctx.font = `16px ${selectedFont}`;
    ctx.fillStyle = '#FFFFFF'; // White text for quotes
    ctx.textAlign = 'left';

    const maxWidth = width - 80;
    const lineHeight = 24; // Fixed line height for better spacing
    
    // Format praise words with proper spacing
    if (praiseWords) {
      const quotes = praiseWords.split('\n\n');
      let y = 140;
      
      quotes.forEach(quote => {
        const parts = quote.split('\n—');
        if (parts.length === 2) {
          // Draw the quote
          const quoteLines = wrapText(ctx, parts[0], maxWidth);
          quoteLines.forEach(line => {
            ctx.fillText(line, 40, y);
            y += lineHeight;
          });
          
          // Add spacing before source
          y += 10;
          
          // Draw the source with dash
          ctx.fillText(`— ${parts[1].trim()}`, 40, y);
          
          // Add spacing between quotes
          y += lineHeight * 2;
        }
      });
    } else {
      ctx.fillText("No praise words available", 40, 140);
    }

    // Draw barcode at the bottom right
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(width - 180, height - 100, 140, 60);
    
    // Draw book info at the bottom
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.font = `14px ${selectedFont}`;
    ctx.fillText("Visit bookbyanyone.com", 40, height - 80);
    
    ctx.font = `bold 18px ${selectedFont}`;
    ctx.fillStyle = '#FF6B35'; // Orange for BOOK BY ANYONE
    ctx.fillText("BOOK BY ANYONE", 40, height - 50);
    
    // Draw price
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.font = `14px ${selectedFont}`;
    ctx.fillText("US $32.00", 780 - 100, height - 80);
    ctx.fillText("UK £25.00", 780 - 100, height - 60);
  };

  // Utility to wrap text
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    
    lines.push(currentLine);
    return lines;
  };

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
