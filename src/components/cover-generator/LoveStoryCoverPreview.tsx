import { useRef, useEffect } from 'react';
import { useImageLoader } from './hooks/useImageLoader';

interface LoveStoryCoverPreviewProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  recipientName: string;
  coverImage?: string;
  selectedFont?: string;
}

const LoveStoryCoverPreview = ({
  coverTitle,
  subtitle,
  authorName,
  recipientName,
  coverImage,
  selectedFont = 'playfair'
}: LoveStoryCoverPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const image = useImageLoader(coverImage);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions for 1:1 aspect ratio
    canvas.width = 1000;
    canvas.height = 1000;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the cover
    drawLoveStoryCover(ctx, canvas, coverTitle, subtitle, authorName, recipientName, image, selectedFont);
    
  }, [coverTitle, subtitle, authorName, recipientName, image, selectedFont]);

  const drawLoveStoryCover = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement,
    title: string,
    subtitle: string,
    author: string,
    recipient: string,
    image: { element: HTMLImageElement } | null,
    font: string
  ) => {
    const width = canvas.width;
    const height = canvas.height;

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#FF6B6B');
    gradient.addColorStop(1, '#7971EA');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw image if available
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

      // Draw image with a soft filter
      ctx.filter = 'brightness(0.8) contrast(1.1)';
      ctx.globalAlpha = 0.8;
      ctx.drawImage(image.element, x, y, drawWidth, drawHeight);
      ctx.globalAlpha = 1.0;
      ctx.filter = 'none';
    }

    // Add a semi-transparent overlay for better text readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // Draw title
    ctx.font = `bold 60px ${font}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Handle multi-line title
    const titleLines = wrapText(ctx, title, width - 100);
    let titleY = height * 0.35;
    const lineHeight = 70;
    
    titleLines.forEach(line => {
      ctx.fillText(line, width / 2, titleY);
      titleY += lineHeight;
    });

    // Draw subtitle
    ctx.font = `italic 30px ${font}`;
    ctx.fillStyle = '#FFFFFF';
    
    const subtitleLines = wrapText(ctx, subtitle, width - 150);
    let subtitleY = titleY + 40;
    
    subtitleLines.forEach(line => {
      ctx.fillText(line, width / 2, subtitleY);
      subtitleY += 40;
    });

    // Draw "For [recipient]" text
    ctx.font = `bold 36px ${font}`;
    ctx.fillStyle = '#FFD700'; // Gold color
    ctx.fillText(`For ${recipient}`, width / 2, height * 0.8);

    // Draw author name
    ctx.font = `24px ${font}`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`By ${author}`, width / 2, height * 0.85);

    // Draw decorative elements
    drawDecorativeElements(ctx, width, height);
  };

  // Draw decorative elements for the love story cover
  const drawDecorativeElements = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Draw heart in the top right corner
    ctx.fillStyle = '#FF6B6B';
    ctx.save();
    ctx.translate(width - 80, 80);
    ctx.rotate(Math.PI / 10);
    
    const heartSize = 30;
    drawHeart(ctx, 0, 0, heartSize);
    
    ctx.restore();
    
    // Draw small hearts at the bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 5; i++) {
      const x = width * (0.2 + i * 0.15);
      const y = height * 0.92;
      const size = 10 + Math.random() * 5;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.random() * 0.5 - 0.25);
      drawHeart(ctx, 0, 0, size);
      ctx.restore();
    }
  };

  // Helper function to draw a heart shape
  const drawHeart = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(
      x, y, 
      x - size / 2, y, 
      x - size / 2, y + size / 4
    );
    ctx.bezierCurveTo(
      x - size / 2, y + size / 2, 
      x, y + size * 0.75, 
      x, y + size
    );
    ctx.bezierCurveTo(
      x, y + size * 0.75, 
      x + size / 2, y + size / 2, 
      x + size / 2, y + size / 4
    );
    ctx.bezierCurveTo(
      x + size / 2, y, 
      x, y, 
      x, y + size / 4
    );
    ctx.fill();
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
    </div>
  );
};

export default LoveStoryCoverPreview; 