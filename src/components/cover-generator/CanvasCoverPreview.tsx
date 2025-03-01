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
  previewMode?: boolean;
  scaleFactor?: number;
  praises?: Array<{source: string, text: string}>;
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
  onImageAdjust,
  previewMode = false,
  scaleFactor = 0.5,
  praises = []
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
    
    if (!frontCanvas) return;
    
    const frontCtx = frontCanvas.getContext('2d');
    if (!frontCtx) return;

    // Base dimensions
    const baseWidth = 800;
    const baseHeight = 1200;
    
    // Apply scale factor to dimensions
    const scaledWidth = Math.floor(baseWidth * scaleFactor);
    const scaledHeight = Math.floor(baseHeight * scaleFactor);

    // Set canvas dimensions for front cover with scaling
    frontCanvas.width = scaledWidth;
    frontCanvas.height = scaledHeight;
    
    // Scale the context to maintain correct drawing proportions
    frontCtx.scale(scaleFactor, scaleFactor);
    
    // Clear and draw front canvas (at base size, context scaling will handle the rest)
    frontCtx.clearRect(0, 0, baseWidth, baseHeight);
    
    const template = coverTemplates[selectedTemplate] || coverTemplates.modern;
    const layout = coverLayouts[selectedLayout] || coverLayouts['classic-centered'];
    
    drawFrontCover(frontCtx, baseWidth, baseHeight, template, layout);
    
    // Only draw spine and back cover if not in preview mode and if the refs exist
    if (!previewMode && spineCanvas && backCanvas) {
      const spineCtx = spineCanvas.getContext('2d');
      const backCtx = backCanvas.getContext('2d');
      
      if (spineCtx && backCtx) {
        // Base spine width
        const baseSpineWidth = 60;
        
        // Set canvas dimensions for spine and back with scaling
        spineCanvas.width = Math.floor(baseSpineWidth * scaleFactor);
        spineCanvas.height = scaledHeight;
        
        backCanvas.width = scaledWidth;
        backCanvas.height = scaledHeight;
        
        // Scale the contexts
        spineCtx.scale(scaleFactor, scaleFactor);
        backCtx.scale(scaleFactor, scaleFactor);
        
        // Clear and draw spine and back canvases
        spineCtx.clearRect(0, 0, baseSpineWidth, baseHeight);
        backCtx.clearRect(0, 0, baseWidth, baseHeight);
        
        drawSpine(spineCtx, baseSpineWidth, baseHeight, template);
        drawBackCover(backCtx, baseWidth, baseHeight, template);
      }
    }
  }, [coverTitle, subtitle, authorName, image, selectedFont, selectedTemplate, selectedLayout, category, imagePosition, imageScale, previewMode, scaleFactor, praises]);

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

    // 绘制赞美语，如果有的话
    if (praises && praises.length > 0) {
      const availablePraises = praises.slice(0, 4); // 限制最多显示4条赞美语
      
      // 设置标题
      ctx.textAlign = 'left';
      ctx.fillStyle = template.backCoverStyle.textColor || '#FFFFFF';
      ctx.font = `bold 20px ${selectedFont}`;
      ctx.fillText(`Praises for ${coverTitle}`, 40, 60);
      
      let yPosition = 100;
      
      // 绘制每条赞美语
      availablePraises.forEach(praise => {
        // 赞美文本内容
        ctx.font = `italic 14px ${selectedFont}`;
        
        // 使用文本换行函数
        const wrappedText = wrapTextWithHeight(ctx, `"${praise.text}"`, 40, yPosition, width - 80, 18);
        yPosition += wrappedText.height + 10;
        
        // 赞美来源
        ctx.font = `bold 14px ${selectedFont}`;
        ctx.fillText(praise.source, 40, yPosition);
        
        yPosition += 40; // 为下一条赞美语留出空间
      });
    }

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

  // 添加文本换行并计算高度的辅助函数
  const wrapTextWithHeight = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineCount = 0;
    
    for (let n = 0; n < words.length; n++) {
      testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y + (lineCount * lineHeight));
        line = words[n] + ' ';
        lineCount++;
      } else {
        line = testLine;
      }
    }
    
    ctx.fillText(line, x, y + (lineCount * lineHeight));
    
    return {
      height: lineCount * lineHeight + lineHeight // 总高度
    };
  };

  return (
    <div className="w-full">
      <div className="relative flex justify-center">
        <div className="flex">
          {/* Front Cover is always visible */}
          <canvas 
            ref={frontCoverRef}
            className="border border-gray-300 shadow-lg"
            style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
          ></canvas>
          
          {/* Spine and Back Cover only visible when not in preview mode */}
          {!previewMode && (
            <>
              <canvas 
                ref={spineRef}
                className="border-t border-b border-r border-gray-300 shadow-lg"
                style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
              ></canvas>
              <canvas 
                ref={backCoverRef}
                className="border-t border-b border-r border-gray-300 shadow-lg"
                style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
              ></canvas>
            </>
          )}
        </div>
        
        {onImageAdjust && coverImage && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4">
            <CoverImageControls 
              coverImage={coverImage}
              imagePosition={imagePosition}
              imageScale={imageScale}
              onImageAdjust={onImageAdjust}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasCoverPreview;