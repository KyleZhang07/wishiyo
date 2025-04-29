import { TemplateType, CoverLayout } from '../types';

export const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: 'left' | 'center' | 'right'
) => {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  ctx.textAlign = align;
  const alignX = align === 'center' ? x + maxWidth/2 :
                 align === 'right' ? x + maxWidth : x;

  for (let word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth) {
      ctx.fillText(line, alignX, currentY);
      line = word + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, alignX, currentY);
  return currentY;
};

export const drawFrontCover = (
  ctx: CanvasRenderingContext2D,
  template: TemplateType,
  layout: CoverLayout,
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
  // Draw title with larger font size
  ctx.font = `${template.titleStyle.fontWeight} 4rem ${selectedFont}`; // Increased from 2.5rem
  ctx.fillStyle = template.titleStyle.color;
  const titleY = height * layout.titlePosition.offsetY;
  wrapText(
    ctx, 
    title, 
    frontX + coverWidth * 0.1, 
    titleY, 
    coverWidth * 0.8, 
    120, // Increased line height from 60
    layout.titlePosition.textAlign
  );

  // Draw subtitle with larger font
  ctx.font = `${template.subtitleStyle.fontWeight} 2rem ${selectedFont}`; // Increased from 1.25rem
  ctx.fillStyle = template.subtitleStyle.color;
  const subtitleY = height * (layout.titlePosition.offsetY + 0.15);
  wrapText(
    ctx, 
    subtitle, 
    frontX + coverWidth * 0.1, 
    subtitleY, 
    coverWidth * 0.8, 
    70, // Increased from 35
    layout.subtitlePosition.textAlign
  );

  // Draw larger author name
  ctx.font = `normal 2rem ${selectedFont}`; // Increased from 1.5rem
  ctx.fillStyle = template.authorStyle.color;
  const authorY = height * layout.authorPosition.offsetY;
  const authorX = frontX + coverWidth * 0.1;
  ctx.textAlign = layout.authorPosition.textAlign;
  const authorAlignX = layout.authorPosition.textAlign === 'center' ? frontX + coverWidth/2 :
                      layout.authorPosition.textAlign === 'right' ? frontX + coverWidth * 0.9 : 
                      authorX;
  ctx.fillText(`By ${authorName}`, authorAlignX, authorY);
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
  ctx.font = `bold 1.5rem 'Merriweather', 'Montserrat', 'Inter', 'Times New Roman', serif`;
  ctx.fillStyle = template.spineStyle.titleColor;
  ctx.fillText(title, 0, 0);
  ctx.font = `normal 1.2rem 'Merriweather', 'Montserrat', 'Inter', 'Times New Roman', serif`;
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
  ctx.font = `normal 1.5rem ${selectedFont}`; // Increased font size for summary
  ctx.fillStyle = template.backCoverStyle.textColor;
  wrapText(ctx, summary, backX + 80, height * 0.2, coverWidth - 160, 60, 'left'); // Increased padding and line height
};