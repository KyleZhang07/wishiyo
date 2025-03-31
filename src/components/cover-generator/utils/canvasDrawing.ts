
import { TemplateType, coverLayouts } from '../types';

interface DrawFrontCoverProps {
  frontX: number;
  coverWidth: number;
  height: number;
  title: string;
  subtitle: string;
  authorName: string;
  selectedFont: string;
}

interface DrawSpineProps {
  spineX: number;
  spineWidth: number;
  height: number;
  title: string;
  authorName: string;
  selectedFont: string;
}

interface DrawBackCoverProps {
  backX: number;
  coverWidth: number;
  height: number;
  summary: string;
  selectedFont: string;
}

export const drawFrontCover = (
  ctx: CanvasRenderingContext2D,
  template: TemplateType,
  layout: typeof coverLayouts[keyof typeof coverLayouts],
  props: DrawFrontCoverProps
) => {
  const { frontX, coverWidth, height, title, subtitle, authorName, selectedFont } = props;
  
  // Set text alignment based on layout
  ctx.textAlign = layout.titlePosition.textAlign;
  
  // Calculate text positions
  let titleX = frontX + 20;
  if (layout.titlePosition.textAlign === 'center') {
    titleX = frontX + coverWidth / 2;
  } else if (layout.titlePosition.textAlign === 'right') {
    titleX = frontX + coverWidth - 20;
  }
  
  const titleY = layout.titlePosition.offsetY * height;
  
  // Draw title
  ctx.font = `${template.titleStyle.fontWeight} ${template.titleStyle.fontSize} ${selectedFont}`;
  ctx.fillStyle = template.titleStyle.color;
  ctx.fillText(title, titleX, titleY);
  
  // Draw subtitle
  let subtitleX = frontX + 20;
  if (layout.subtitlePosition.textAlign === 'center') {
    subtitleX = frontX + coverWidth / 2;
  } else if (layout.subtitlePosition.textAlign === 'right') {
    subtitleX = frontX + coverWidth - 20;
  }
  
  const subtitleY = layout.subtitlePosition.offsetY * height;
  
  ctx.font = `${template.subtitleStyle.fontWeight} ${template.subtitleStyle.fontSize} ${selectedFont}`;
  ctx.fillStyle = template.subtitleStyle.color;
  ctx.fillText(subtitle, subtitleX, subtitleY);
  
  // Draw author name
  let authorX = frontX + 20;
  if (layout.authorPosition.textAlign === 'center') {
    authorX = frontX + coverWidth / 2;
  } else if (layout.authorPosition.textAlign === 'right') {
    authorX = frontX + coverWidth - 20;
  }
  
  const authorY = layout.authorPosition.offsetY * height;
  
  ctx.font = `${template.authorStyle.fontWeight} ${template.authorStyle.fontSize} ${selectedFont}`;
  ctx.fillStyle = template.authorStyle.color;
  ctx.fillText(`By ${authorName}`, authorX, authorY);
};

export const drawSpine = (
  ctx: CanvasRenderingContext2D,
  template: TemplateType,
  props: DrawSpineProps
) => {
  const { spineX, spineWidth, height, title, authorName, selectedFont } = props;
  
  // Set text properties for spine
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const centerX = spineX + spineWidth / 2;
  
  // Draw author name on spine
  ctx.font = `${template.authorStyle.fontWeight} ${template.spineStyle.authorFontSize || '18px'} ${selectedFont}`;
  ctx.fillStyle = template.spineStyle.authorColor;
  
  // Calculate starting position for author name
  let currentY = template.spineStyle.topMargin || 60;
  
  // Draw each character of the author name vertically
  authorName.split('').forEach(char => {
    ctx.save();
    ctx.translate(centerX, currentY);
    ctx.rotate(Math.PI / 2); // Rotate 90 degrees
    ctx.fillText(char, 0, 0);
    ctx.restore();
    
    currentY += (template.spineStyle.charSpacing || 0.8) * parseInt(template.spineStyle.authorFontSize || '18px');
  });
  
  // Add spacing between author and title
  currentY += template.spineStyle.authorTitleSpacing || 20;
  
  // Draw title on spine
  ctx.font = `${template.titleStyle.fontWeight} ${template.spineStyle.titleFontSize || '18px'} ${selectedFont}`;
  ctx.fillStyle = template.spineStyle.titleColor;
  
  // Draw each character of the title vertically
  title.split('').forEach(char => {
    ctx.save();
    ctx.translate(centerX, currentY);
    ctx.rotate(Math.PI / 2); // Rotate 90 degrees
    ctx.fillText(char, 0, 0);
    ctx.restore();
    
    currentY += (template.spineStyle.charSpacing || 0.8) * parseInt(template.spineStyle.titleFontSize || '18px');
  });
};

export const drawBackCover = (
  ctx: CanvasRenderingContext2D,
  template: TemplateType,
  props: DrawBackCoverProps
) => {
  const { backX, coverWidth, height, summary, selectedFont } = props;
  
  // Set text properties
  ctx.textAlign = template.backCoverStyle.textAlign || 'left';
  ctx.textBaseline = 'top';
  
  // Draw a title for the back cover
  ctx.font = `bold ${template.backCoverStyle.titleFontSize || '24px'} ${selectedFont}`;
  ctx.fillStyle = template.backCoverStyle.textColor;
  
  // Calculate position for text
  const textX = backX + (template.backCoverStyle.marginLeft || 40);
  let currentY = template.backCoverStyle.marginTop || 60;
  
  // Draw "About the Book" title
  ctx.fillText('About the Book', textX, currentY);
  
  // Move down for summary text
  currentY += template.backCoverStyle.titleSpacing || 40;
  
  // Draw summary with wrapping
  ctx.font = `${template.authorStyle.fontWeight} ${template.backCoverStyle.praiseFontSize || '18px'} ${selectedFont}`;
  
  // Simple text wrapping function
  const lineHeight = template.backCoverStyle.lineHeight || 30;
  const maxWidth = coverWidth - 2 * (template.backCoverStyle.marginLeft || 40);
  
  const words = summary.split(' ');
  let line = '';
  
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, textX, currentY);
      line = words[i] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  
  ctx.fillText(line, textX, currentY);
  
  // Draw barcode placeholder at bottom
  const barcodeY = height - 80;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(backX + coverWidth - 160, barcodeY, 120, 50);
  
  // Draw publisher info
  ctx.font = `bold 16px ${selectedFont}`;
  ctx.fillStyle = template.backCoverStyle.textColor;
  ctx.fillText('BOOK BY ANYONE', backX + 40, height - 50);
};
