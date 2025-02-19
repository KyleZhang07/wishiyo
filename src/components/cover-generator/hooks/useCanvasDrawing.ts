
import { useEffect } from 'react';
import { DEFAULT_CANVAS_SIZE, CanvasImage } from '../types/canvas';
import { drawFrontCover, drawSpine, drawBackCover } from '../utils/canvasDrawing';
import { getTemplateByName } from '../types/templates';
import { getLayoutByName } from '../types/layouts';

interface UseCanvasDrawingProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  coverTitle: string;
  subtitle: string;
  authorName: string;
  image?: CanvasImage;
  selectedFont: string;
  selectedTemplate: string;
  selectedLayout: string;
  imageScale: number;
  imagePosition: { x: number; y: number };
  isProcessingImage?: boolean;
  backCoverText?: string; // Add the new prop
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
  isProcessingImage,
  backCoverText = '' // Add default value
}: UseCanvasDrawingProps) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const template = getTemplateByName(selectedTemplate);
    const layout = getLayoutByName(selectedLayout);

    // Clear canvas
    ctx.fillStyle = template.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const coverWidth = (DEFAULT_CANVAS_SIZE.width - DEFAULT_CANVAS_SIZE.spine - DEFAULT_CANVAS_SIZE.gap * 2) / 2;
    const backX = DEFAULT_CANVAS_SIZE.gap;
    const spineX = backX + coverWidth;
    const frontX = spineX + DEFAULT_CANVAS_SIZE.spine + DEFAULT_CANVAS_SIZE.gap;

    // Draw back cover
    drawBackCover(ctx, template, {
      backX,
      coverWidth,
      height: DEFAULT_CANVAS_SIZE.height,
      summary: backCoverText,
      selectedFont
    });

    // Draw spine
    drawSpine(ctx, template, {
      spineX,
      spineWidth: DEFAULT_CANVAS_SIZE.spine,
      height: DEFAULT_CANVAS_SIZE.height,
      title: coverTitle,
      authorName,
      selectedFont
    });

    // Draw front cover
    drawFrontCover(ctx, template, layout, {
      frontX,
      coverWidth,
      height: DEFAULT_CANVAS_SIZE.height,
      title: coverTitle,
      subtitle,
      authorName,
      selectedFont
    });

    // Draw image if available
    if (image?.element && !isProcessingImage) {
      const scaledWidth = image.element.width * (imageScale / 100);
      const scaledHeight = image.element.height * (imageScale / 100);
      ctx.drawImage(
        image.element,
        frontX + imagePosition.x,
        imagePosition.y,
        scaledWidth,
        scaledHeight
      );
    }
  }, [
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
    isProcessingImage,
    backCoverText // Add to dependencies
  ]);
};
