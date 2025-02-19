
import { useEffect, RefObject } from 'react';
import { DEFAULT_CANVAS_SIZE } from '../types/canvas';
import { coverTemplates, coverLayouts } from '../types';
import { CanvasImage } from '../types/canvas';
import { drawFrontCover, drawSpine, drawBackCover } from '../utils/canvasDrawing';

interface UseCanvasDrawingProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  coverTitle: string;
  subtitle: string;
  authorName: string;
  image: CanvasImage | null;
  selectedFont: string;
  selectedTemplate: string;
  selectedLayout: string;
  imageScale: number;
  imagePosition: { x: number; y: number };
  isProcessingImage: boolean;
}

export const useCanvasDrawing = ({
  canvasRef,
  coverTitle,
  subtitle,
  authorName,
  image,
  selectedFont,
  selectedTemplate,
  selectedLayout,
  imageScale,
  imagePosition,
  isProcessingImage
}: UseCanvasDrawingProps) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const template = coverTemplates[selectedTemplate];
    const layout = coverLayouts[selectedLayout];

    const coverWidth = DEFAULT_CANVAS_SIZE.height * 0.75;
    const spineWidth = DEFAULT_CANVAS_SIZE.spine;
    const gap = DEFAULT_CANVAS_SIZE.gap;

    // Calculate positions
    const frontX = gap;
    const spineX = frontX + coverWidth + gap;
    const backX = spineX + spineWidth + gap;

    // Clear canvas and draw backgrounds
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

    if (isProcessingImage) {
      drawLoadingState(ctx, frontX, coverWidth, canvas.height);
      return;
    }

    if (image && layout.imageContainerStyle) {
      drawCoverImage(ctx, image, layout, frontX, coverWidth, canvas.height, imageScale, imagePosition, template);
    }

    // Draw text content
    drawFrontCover(ctx, template, layout, {
      frontX,
      coverWidth,
      height: canvas.height,
      title: coverTitle,
      subtitle,
      authorName,
      selectedFont
    });

    drawSpine(ctx, template, {
      spineX,
      spineWidth,
      height: canvas.height,
      title: coverTitle,
      authorName,
      selectedFont
    });

    drawBackCover(ctx, template, {
      backX,
      coverWidth,
      height: canvas.height,
      summary: "A captivating journey through the pages of this book awaits. Join us on an unforgettable adventure filled with unexpected twists and turns. Every chapter brings new discoveries and insights that will keep you engaged until the very last page.",
      selectedFont
    });
  }, [canvasRef, coverTitle, subtitle, authorName, image, selectedFont, selectedTemplate, selectedLayout, imageScale, imagePosition, isProcessingImage]);
};

const drawLoadingState = (
  ctx: CanvasRenderingContext2D,
  frontX: number,
  coverWidth: number,
  height: number
) => {
  const centerX = frontX + coverWidth / 2;
  const centerY = height / 2;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(frontX, 0, coverWidth, height);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Processing image...', centerX, centerY);
};

const drawCoverImage = (
  ctx: CanvasRenderingContext2D,
  image: CanvasImage,
  layout: typeof coverLayouts[keyof typeof coverLayouts],
  frontX: number,
  coverWidth: number,
  height: number,
  imageScale: number,
  imagePosition: { x: number; y: number },
  template: typeof coverTemplates[keyof typeof coverTemplates]
) => {
  const containerWidth = parseFloat(layout.imageContainerStyle!.width) / 100 * coverWidth;
  const containerHeight = parseFloat(layout.imageContainerStyle!.height) / 100 * height;
  
  const { width: imgWidth, height: imgHeight } = image.element;
  const imgAspectRatio = imgWidth / imgHeight;
  const containerAspectRatio = containerWidth / containerHeight;
  
  const scale = imageScale / 100;
  let scaledWidth, scaledHeight;
  
  if (imgAspectRatio > containerAspectRatio) {
    scaledWidth = containerWidth * scale;
    scaledHeight = (containerWidth / imgAspectRatio) * scale;
  } else {
    scaledHeight = containerHeight * scale;
    scaledWidth = (containerHeight * imgAspectRatio) * scale;
  }

  const maxTranslateX = (scaledWidth - containerWidth) / 2;
  const maxTranslateY = (scaledHeight - containerHeight) / 2;

  ctx.save();
  ctx.beginPath();
  const clipX = frontX + (coverWidth - containerWidth) / 2;
  const clipY = (height - containerHeight) / 2;
  
  if (layout.imageContainerStyle!.borderRadius) {
    const radius = parseFloat(layout.imageContainerStyle!.borderRadius) / 100 * Math.min(containerWidth, containerHeight);
    ctx.arc(clipX + containerWidth/2, clipY + containerHeight/2, radius, 0, Math.PI * 2);
  } else {
    ctx.rect(clipX, clipY, containerWidth, containerHeight);
  }
  ctx.clip();
  
  const translateX = imagePosition.x * maxTranslateX;
  const translateY = imagePosition.y * maxTranslateY;
  
  const x = clipX + (containerWidth - scaledWidth) / 2 - translateX;
  const y = clipY + (containerHeight - scaledHeight) / 2 - translateY;

  ctx.filter = template.imageStyle.filter;
  ctx.globalAlpha = parseFloat(template.imageStyle.opacity);
  ctx.drawImage(image.element, x, y, scaledWidth, scaledHeight);
  ctx.restore();
};
