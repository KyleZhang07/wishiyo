
import { TemplateType, CanvasSize } from '../types';

export const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) => {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth) {
      ctx.fillText(line, x, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY;
};

export const drawFrontCover = (
  ctx: CanvasRenderingContext2D,
  template: TemplateType,
  {
    frontX,
    coverWidth,
    height,
    title,
    subtitle,
    authorName,
    selectedFont
  }: {
    frontX: number;
    coverWidth: number;
    height: number;
    title: string;
    subtitle: string;
    authorName: string;
    selectedFont: string;
  }
) => {
  const frontCenterX = frontX + (coverWidth / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw title
  ctx.font = `${template.titleStyle.fontWeight} ${template.titleStyle.fontSize} ${selectedFont}`;
  ctx.fillStyle = template.titleStyle.color;
  const titleY = height * template.titleStyle.offsetY;
  wrapText(ctx, title, frontX + coverWidth * 0.1, titleY, coverWidth * 0.8, 60);

  // Draw subtitle
  ctx.font = `${template.subtitleStyle.fontWeight} ${template.subtitleStyle.fontSize} ${selectedFont}`;
  ctx.fillStyle = template.subtitleStyle.color;
  wrapText(ctx, subtitle, frontX + coverWidth * 0.1, height * 0.5, coverWidth * 0.8, 40);

  // Draw author name
  ctx.font = `normal ${template.authorStyle.fontSize} ${selectedFont}`;
  ctx.fillStyle = template.authorStyle.color;
  ctx.fillText(`By ${authorName}`, frontCenterX, height * 0.85);
};

export const drawSpine = (
  ctx: CanvasRenderingContext2D,
  template: TemplateType,
  {
    spineX,
    spineWidth,
    height,
    title,
    authorName,
    selectedFont
  }: {
    spineX: number;
    spineWidth: number;
    height: number;
    title: string;
    authorName: string;
    selectedFont: string;
  }
) => {
  ctx.save();
  ctx.translate(spineX + (spineWidth / 2), height * 0.5);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.font = `bold 1rem ${selectedFont}`;
  ctx.fillStyle = template.spineStyle.titleColor;
  ctx.fillText(title, 0, 0);
  ctx.font = `normal 0.8rem ${selectedFont}`;
  ctx.fillStyle = template.spineStyle.authorColor;
  ctx.fillText(authorName, 0, spineWidth * 0.6);
  ctx.restore();
};

export const drawBackCover = (
  ctx: CanvasRenderingContext2D,
  template: TemplateType,
  {
    backX,
    coverWidth,
    height,
    summary,
    selectedFont
  }: {
    backX: number;
    coverWidth: number;
    height: number;
    summary: string;
    selectedFont: string;
  }
) => {
  ctx.textAlign = 'left';
  ctx.font = `normal ${template.backCoverStyle.summaryFontSize} ${selectedFont}`;
  ctx.fillStyle = template.backCoverStyle.textColor;
  wrapText(ctx, summary, backX + 40, height * 0.2, coverWidth - 80, 30);
};
