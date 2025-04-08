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
  imagePosition = { x: 0.5, y: 0.5 },
  imageScale = 1,
  onImageAdjust,
  previewMode = false,
  scaleFactor = 0.45, // 调整默认缩放因子，使封面整体变小一些
  praises = []
}: CanvasCoverPreviewProps) => {
  const frontCoverRef = useRef<HTMLCanvasElement>(null);
  const spineRef = useRef<HTMLCanvasElement>(null);
  const backCoverRef = useRef<HTMLCanvasElement>(null);
  
  // 使用 useImageLoader hook 加载封面图片
  const image = useImageLoader(coverImage);
  // 加载书脊 logo
  const spineLogo = useImageLoader('/assets/logos/spine-logo.png');
  // 加载条形码图像 - 更新路径
  const barcode = useImageLoader('/assets/logos/bar-code.png');

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
    
    // 获取设备像素比，用于高清屏幕渲染
    const pixelRatio = window.devicePixelRatio || 1;
    
    // Apply scale factor to dimensions
    const scaledWidth = Math.floor(baseWidth * scaleFactor);
    const scaledHeight = Math.floor(baseHeight * scaleFactor);

    // 设置Canvas的物理像素大小
    frontCanvas.width = scaledWidth * pixelRatio;
    frontCanvas.height = scaledHeight * pixelRatio;
    
    // 设置Canvas的CSS显示大小
    frontCanvas.style.width = `${scaledWidth}px`;
    frontCanvas.style.height = `${scaledHeight}px`;
    
    // 根据设备像素比缩放绘图上下文
    frontCtx.scale(scaleFactor * pixelRatio, scaleFactor * pixelRatio);
    
    // Clear and draw front canvas (at base size, context scaling will handle the rest)
    frontCtx.clearRect(0, 0, baseWidth, baseHeight);
    
    // 确保模板是从我们的模板库中正确获取的
    let template;
    if (selectedTemplate === 'pastel-beige') {
      template = coverTemplates['pastel-beige'];
    } else {
      template = coverTemplates[selectedTemplate] || coverTemplates.modern;
    }
    
    const layout = coverLayouts[selectedLayout] || coverLayouts['classic-centered'];
    
    drawFrontCover(frontCtx, baseWidth, baseHeight, template, layout);
    
    // Only draw spine and back cover if not in preview mode and if the refs exist
    if (!previewMode && spineCanvas && backCanvas) {
      const spineCtx = spineCanvas.getContext('2d');
      const backCtx = backCanvas.getContext('2d');
      
      if (spineCtx && backCtx) {
        // Base spine width
        const baseSpineWidth = 80;
        
        // 同样应用高清屏幕渲染
        spineCanvas.width = Math.floor(baseSpineWidth * scaleFactor) * pixelRatio;
        spineCanvas.height = scaledHeight * pixelRatio;
        spineCanvas.style.width = `${Math.floor(baseSpineWidth * scaleFactor)}px`;
        spineCanvas.style.height = `${scaledHeight}px`;
        
        backCanvas.width = scaledWidth * pixelRatio;
        backCanvas.height = scaledHeight * pixelRatio;
        backCanvas.style.width = `${scaledWidth}px`;
        backCanvas.style.height = `${scaledHeight}px`;
        
        // 缩放上下文
        spineCtx.scale(scaleFactor * pixelRatio, scaleFactor * pixelRatio);
        backCtx.scale(scaleFactor * pixelRatio, scaleFactor * pixelRatio);
        
        // Clear and draw spine and back canvases
        spineCtx.clearRect(0, 0, baseSpineWidth, baseHeight);
        backCtx.clearRect(0, 0, baseWidth, baseHeight);
        
        drawSpine(spineCtx, baseSpineWidth, baseHeight, template);
        drawBackCover(backCtx, baseWidth, baseHeight, template);
      }
    }
  }, [coverTitle, subtitle, authorName, image, selectedFont, selectedTemplate, selectedLayout, category, imagePosition, imageScale, previewMode, scaleFactor, praises]);

  // Helper function to draw text centered vertically within a defined area
  function drawTextInArea(
    ctx: CanvasRenderingContext2D,
    lines: string[],
    area: { x: number; y: number; width: number; height: number },
    font: string,
    color: string,
    lineHeight: number,
    textAlign: 'left' | 'center' | 'right' = 'center'
  ) {
    if (!lines || lines.length === 0) return;

    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = textAlign;
    ctx.textBaseline = 'top'; // Align text from the top for predictable positioning

    // Estimate text block height using line count * lineHeight for simpler centering
    const textBlockHeight = lines.length * lineHeight; 
    let startY = area.y + (area.height - textBlockHeight) / 2; // Calculate centered start Y

    // Ensure text doesn't start above the area
    startY = Math.max(area.y, startY);

    let drawX: number;
    if (textAlign === 'center') {
      drawX = area.x + area.width / 2;
    } else if (textAlign === 'right') {
      drawX = area.x + area.width;
    } else {
      drawX = area.x;
    }

    for (let i = 0; i < lines.length; i++) {
      const currentY = startY + i * lineHeight;
      // Only draw if the line starts within or just below the area
      if (currentY < area.y + area.height) {
          ctx.fillText(lines[i], drawX, currentY);
      }
    }
  }

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

    // Define wrapText function here to be available for all styles
    const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split(' ');
      let line = '';
      const lines: string[] = [];
      
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
          lines.push(line.trim());
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      
      if (line.trim() !== '') {
          lines.push(line.trim());
      }
      return lines;
    };

    // 检查是否为Sweet Pink主题
    const isSweetPink = template.id === 'pastel-beige';
    
    // 对于Sweet Pink主题，我们将在后面自定义处理图片，所以这里跳过默认图片处理
    if (image?.element && !isSweetPink) {
      // 对于modern/vibrant-green，也跳过常规图片处理，使用专门的自定义处理
      if (template.id === 'modern' || template.id === 'vibrant-green') {
        // 不进行任何图片处理，专门的处理在下面进行
      } else {
        const { width: imgWidth, height: imgHeight } = image.element;
        
        // Calculate aspect ratios
        const canvasAspect = width / height;
        const imageAspect = imgWidth / imgHeight;
        
        let drawWidth = width;
        let drawHeight = height;
        let x = 0;
        let y = 0;
        
        // If layout has image container style, use it for positioning
        if (layout.imageContainerStyle) {
          const containerWidth = parseInt(layout.imageContainerStyle.width) / 100 * width;
          const containerHeight = parseInt(layout.imageContainerStyle.height) / 100 * height;
          
          // 计算图像相对于容器的位置
          const aspectRatio = image.element.width / image.element.height;
          
          // 确保图像完全覆盖容器
          if (containerWidth / containerHeight > aspectRatio) {
            drawWidth = containerWidth;
            drawHeight = drawWidth / aspectRatio;
          } else {
            drawHeight = containerHeight;
            drawWidth = drawHeight * aspectRatio;
          }
          
          // 计算图像在容器中的位置
          x = width / 2 - containerWidth / 2 + (containerWidth - drawWidth) / 2;
          
          // 根据layout中指定的位置来确定Y坐标
          if (layout.imageContainerStyle.position === 'top') {
            y = 0; // 在顶部
          } else if (layout.imageContainerStyle.position === 'bottom') {
            y = height - containerHeight; // 在底部
          } else {
            y = height / 2 - containerHeight / 2; // 默认在中间
          }
          
          // 调整位置让图像正确显示
          const posX = imagePosition.x || 0;
          const posY = imagePosition.y || 0;
          x += posX;
          y += posY;
          
          // 根据缩放比例调整大小
          const scale = imageScale / 100;
          const originalWidth = drawWidth;
          const originalHeight = drawHeight;
          drawWidth *= scale;
          drawHeight *= scale;
          
          // 重新计算位置以保持图像中心不变
          x -= (drawWidth - originalWidth) / 2;
          y -= (drawHeight - originalHeight) / 2;
          
          // 如果是bestseller模板，在图片之前绘制黑色背景
          if (template.id === 'bestseller') {
            ctx.fillStyle = '#000000';
            // 调整黑色背景区域高度，使其略微向下移
            const containerAdjustedHeight = containerHeight * 1.1; // 增加10%的高度
            const containerAdjustedY = y + 60; // 从20像素增加到40像素
            ctx.fillRect(0, containerAdjustedY, width, containerAdjustedHeight);
            
            // 对于bestseller风格，调整图片位置
            if (template.id === 'bestseller') {
              y += 60; // 从20像素增加到60像素
            }
          }
          
          ctx.filter = template.imageStyle.filter;
          ctx.globalAlpha = parseFloat(template.imageStyle.opacity);
          
          // 如果布局指定了borderRadius，应用圆角裁剪
          if (layout.imageContainerStyle.borderRadius && layout.imageContainerStyle.borderRadius !== '0%') {
            ctx.save();
            
            // 创建圆形裁剪路径
            const radius = parseInt(layout.imageContainerStyle.borderRadius) / 100 * Math.min(containerWidth, containerHeight);
            const centerX = width / 2;
            
            // 对于经典风格或Modern风格，移动图像中心位置
            let centerY = y + containerHeight / 2;
            if (template.id === 'classic') {
              centerY += 40; // 向下移动40像素
            } else if (template.id === 'modern' || template.id === 'vibrant-green') {
              centerY += 160; // 从100增加到160像素，大幅下移
              // 对于Modern/Green风格，直接跳过这里的图片处理，因为在后面有专门的图片处理
              ctx.restore();
              return;
            } else if (template.id === 'minimal') {
              centerY -= 150; // 从-80上移到-150，使照片大幅上移
            }
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.clip();
            
            // 同样调整绘制位置
            let drawY_adjusted = y;
            if (template.id === 'classic') {
              drawY_adjusted += 40; // 向下移动40像素
            } else if (template.id === 'modern' || template.id === 'vibrant-green') {
              drawY_adjusted += 160; // 从100增加到160像素，大幅下移
            } else if (template.id === 'minimal') {
              drawY_adjusted -= 150; // 从-40上移到-150，使照片大幅上移
            }
            
            // Draw image
            ctx.drawImage(image.element, x, drawY_adjusted, drawWidth, drawHeight);
            
            // Restore context
            ctx.restore();
          } else {
            // Draw without clipping
            ctx.drawImage(image.element, x, y, drawWidth, drawHeight);
          }
          
          ctx.globalAlpha = 1.0;
          ctx.filter = 'none';
        } else {
          // Use default image drawing if no layout container style
          ctx.filter = template.imageStyle.filter;
          ctx.globalAlpha = parseFloat(template.imageStyle.opacity);
          x = 0;
          y = 0;
          drawWidth = width;
          drawHeight = height;
          ctx.drawImage(image.element, x, y, drawWidth, drawHeight);
          ctx.globalAlpha = 1.0;
          ctx.filter = 'none';
        }
      }
    }

    // 专门为Modern/Green风格添加自定义图片处理
    if (image?.element && (template.id === 'modern' || template.id === 'vibrant-green')) {
      // 计算图片区域
      const imgSize = width * 0.7; // 图片大小为宽度的70%
      const centerX = width / 2;
      const centerY = height * 0.35; // 将图片中心点放在页面35%的位置
      
      // 创建方形裁剪区域
      ctx.save();
      
      // 创建圆形裁剪路径
      ctx.beginPath();
      ctx.rect(centerX - imgSize/2, centerY - imgSize/2, imgSize, imgSize);
      ctx.clip();
      
      // 计算图片尺寸
      const imgAspect = image.element.width / image.element.height;
      let drawWidth, drawHeight;
      
      if (imgAspect > 1) {
        // 横向图片
        drawHeight = imgSize;
        drawWidth = drawHeight * imgAspect;
      } else {
        // 纵向图片 
        drawWidth = imgSize;
        drawHeight = drawWidth / imgAspect;
      }
      
      // 计算居中位置
      const x = centerX - drawWidth / 2;
      const y = centerY - drawHeight / 2;
      
      // 应用滤镜和透明度
      ctx.filter = template.imageStyle.filter;
      ctx.globalAlpha = parseFloat(template.imageStyle.opacity);
      
      // 绘制图片
      ctx.drawImage(image.element, x, y, drawWidth, drawHeight);
      
      // 恢复上下文
      ctx.restore();
      ctx.globalAlpha = 1.0;
      ctx.filter = 'none';
    }

    // 如果是bestseller模板
    if (template.id === 'bestseller') {
      // 上部添加畅销书宣传语
      ctx.fillStyle = '#FFC300';
      ctx.font = `bold 18px ${selectedFont}`;
      ctx.textAlign = 'center';
      ctx.fillText('Sold Over 5 Million Copies Worldwide | "Changed My Life"', width / 2, 45);
      
      // 添加作者名字在宣传语下方
      ctx.font = `bold 30px ${selectedFont}`;
      ctx.fillStyle = '#FFFFFF'; // 白色文字
      ctx.textAlign = 'center';
      ctx.fillText(`${authorName}`, width / 2, 85);
      
      // 在底部绘制蓝色描述区域 - 再次缩小蓝色区域高度
      const blueHeight = height * 0.15; // 从0.2缩小到0.15
      ctx.fillStyle = '#4361EE';
      ctx.fillRect(0, height - blueHeight, width, blueHeight);

      // 文本自动换行函数
      const titleFont = `bold 66px ${selectedFont}`;
      const titleColor = '#FFC300';
      const titleLineHeight = 60;
      const titleArea = { x: width * 0.1, y: height * 0.55, width: width * 0.8, height: height * 0.3 }; // Define title area

      // Split title into lines (existing logic)
      const titleWords = coverTitle.split(' ');
      const titleLines = [];
      let currentLine = '';
      ctx.font = titleFont; // Set font for measurement
      for (let i = 0; i < titleWords.length; i++) {
        if (currentLine.length + titleWords[i].length > 16) { // 从12个字符增加到16个字符
          titleLines.push(currentLine.trim());
          currentLine = titleWords[i] + ' ';
        } else {
          currentLine += titleWords[i] + ' ';
        }
      }
      if (currentLine.trim() !== '') {
        titleLines.push(currentLine.trim());
      }

      // Draw title using helper function
      drawTextInArea(ctx, titleLines.map(l => l.toUpperCase()), titleArea, titleFont, titleColor, titleLineHeight, 'center');

      // 绘制描述性副标题在蓝色区域
      const subtitleFont = `bold 28px ${selectedFont}`;
      const subtitleColor = '#FFC300';
      const subtitleLineHeight = 34;
      // Ensure subtitleArea uses the updated blueHeight
      const subtitleArea = { x: width * 0.075, y: height - blueHeight, width: width * 0.85, height: blueHeight };

      // Wrap subtitle text (existing logic)
      ctx.font = subtitleFont; // Set font for measurement
      const availableWidth = subtitleArea.width;
      const lines = wrapText(ctx, subtitle, 0, 0, availableWidth, subtitleLineHeight);

      // Draw subtitle using helper function
      drawTextInArea(ctx, lines, subtitleArea, subtitleFont, subtitleColor, subtitleLineHeight, 'center');
    } else if (template.id === 'classic') {
      // 背景已在外部设置为黑色
      
      // 绘制白色标题，位于中央 - 向上移动
      const titleFont = `bold 52px ${selectedFont}`; // Base font for measurement
      const titleColor = '#FFFFFF';
      const normalLineHeight = 70; // 缩小白色部分的行距
      const largeLineHeight = 90; // 保持与红色部分的行距
      const titleArea = { x: width * 0.1, y: height * 0.02, width: width * 0.8, height: height * 0.4 }; // 再次上移标题区域

      // Split title into lines (existing logic)
      const titleWords = coverTitle.split(' ');
      const maxLineWidth = titleArea.width;
      const titleLines = [];
      let currentLine = '';
      ctx.font = titleFont; // Use base font for initial measurement
      for (let i = 0; i < titleWords.length; i++) {
        const word = titleWords[i];
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        // Use the potentially larger font for measurement here if needed, or adjust logic
        ctx.font = `bold 80px ${selectedFont}`; // Use largest possible font for width check
        const metrics = ctx.measureText(testLine.toUpperCase());
        ctx.font = titleFont; // Reset to base font for next check

        if (metrics.width > maxLineWidth && currentLine !== '') {
          titleLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        titleLines.push(currentLine);
      }

      // Draw title using a custom loop because font/color/lineHeight changes per line
      const midpoint = Math.ceil(titleLines.length / 2);
      const whiteLinesHeight = (midpoint > 0 ? (midpoint - 1) * normalLineHeight : 0);
      const redLinesHeight = (titleLines.length - midpoint > 0 ? (titleLines.length - midpoint) * largeLineHeight : 0);
      // Adjust total height calculation for mixed line heights
      const textBlockHeight = whiteLinesHeight + redLinesHeight + (midpoint > 0 && titleLines.length - midpoint > 0 ? largeLineHeight : 0); // Add transition gap
      
      let startY = titleArea.y + (titleArea.height - textBlockHeight) / 2;
      startY = Math.max(titleArea.y, startY);
      ctx.textAlign = 'center';
      let currentY = startY;
      for (let i = 0; i < titleLines.length; i++) {
          const lineText = titleLines[i].toUpperCase();
          let effectiveLineHeight = largeLineHeight; // Default to large

          if (i < midpoint) {
              ctx.fillStyle = '#FFFFFF';
              ctx.font = `bold 54px ${selectedFont}`;
              if (i < midpoint - 1) { // Use smaller lineHeight for lines before the last white one
                effectiveLineHeight = normalLineHeight;
              }
              // The transition from white to red uses largeLineHeight
          } else {
              ctx.fillStyle = '#9B0000';
              ctx.font = `bold 80px ${selectedFont}`;
              // All red lines use largeLineHeight
          }
          
          if (currentY < titleArea.y + titleArea.height) {
            ctx.fillText(lineText, titleArea.x + titleArea.width / 2, currentY);
          }
          // Increment Y based on the line height used *before* this line
          if (i < titleLines.length - 1) {
            currentY += (i < midpoint -1) ? normalLineHeight : largeLineHeight;
          }
      }

      // 绘制红色底部区域
      const bottomHeight = height * (template.bottomAreaHeight || 0.15);
      ctx.fillStyle = template.bottomAreaColor || '#9B0000';
      ctx.fillRect(0, height - bottomHeight, width, bottomHeight);

      // 在红色区域绘制白色描述文字
      const subtitleFont = `normal 28px ${selectedFont}`;
      const subtitleColor = '#FFFFFF';
      const subtitleLineHeight = 34;
      const subtitleArea = { x: width * 0.075, y: height - bottomHeight, width: width * 0.85, height: bottomHeight };
      ctx.font = subtitleFont;
      const availableWidth = subtitleArea.width;
      const lines = wrapText(ctx, subtitle, 0, 0, availableWidth, subtitleLineHeight);
      drawTextInArea(ctx, lines, subtitleArea, subtitleFont, subtitleColor, subtitleLineHeight, 'center');
      
      // 在右下角红色区域上方绘制作者名
      ctx.font = `bold 30px ${selectedFont}`; // Smaller font for author
      ctx.fillStyle = '#FFFFFF'; // White color
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom'; // Align to the bottom
      ctx.fillText(authorName, width - (width * 0.075), height - bottomHeight - 10); // Position right-aligned, 10px above red area
    } else if (template.id === 'modern' || template.id === 'vibrant-green') {
      // 为奶油色肖像风格重写渲染逻辑
      
      // 顶部绘制作者名字
      ctx.font = `normal 42px ${selectedFont}`; // 从24px放大到42px
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(authorName.toUpperCase(), width / 2, 70); // Y位置从50调整到70
      
      // 封面中央绘制大号金色标题
      const titleFont = `bold 70px ${selectedFont}`;
      const titleColor = '#D4AF37';
      const titleLineHeight = 90;
      const titleArea = { x: width * 0.1, y: height * 0.6, width: width * 0.8, height: height * 0.25 }; // 下移标题区域 (y from 0.5 to 0.6, height adjusted)

      // Wrap title text
      ctx.font = titleFont; // Set font for measurement
      const titleWords = coverTitle.split(' ');
      const titleLines = [];
      let currentLine = '';
      for (let i = 0; i < titleWords.length; i++) {
        if (currentLine.length + titleWords[i].length > 18) { // 18 char limit
          titleLines.push(currentLine.trim());
          currentLine = titleWords[i] + ' ';
        } else {
          currentLine += titleWords[i] + ' ';
        }
      }
      if (currentLine.trim() !== '') {
        titleLines.push(currentLine.trim());
      }

      // Draw title using helper function
      drawTextInArea(ctx, titleLines.map(l => l.toUpperCase()), titleArea, titleFont, titleColor, titleLineHeight, 'center');

      // 在底部绘制白色副标题
      const subtitleFont = `normal 28px ${selectedFont}`;
      const subtitleColor = '#FFFFFF';
      const subtitleLineHeight = 38;
      const subtitleArea = { x: width * 0.075, y: height * 0.8, width: width * 0.85, height: height * 0.15 }; // Define subtitle area near bottom

      // Wrap subtitle text
      ctx.font = subtitleFont; // Set font for measurement
      const availableWidth = subtitleArea.width;
      const lines = wrapText(ctx, subtitle, 0, 0, availableWidth, subtitleLineHeight);

      // Draw subtitle using helper function
      drawTextInArea(ctx, lines, subtitleArea, subtitleFont, subtitleColor, subtitleLineHeight, 'center');
    } else if (template.id === 'minimal') {
      // 简约灰色风格的布局
      // 背景已在外部设置为灰色
      
      // 左上角绘制作者名字
      ctx.font = `bold 60px 'Arial', sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.fillText(authorName, 50, 100);

      // 左对齐绘制标题
      const titleFont = `bold 70px 'Arial', sans-serif`;
      const titleColor = '#FFFFFF';
      const titleLineHeight = 80;
      const titleArea = { x: 50, y: height * 0.62, width: width - 100, height: height * 0.25 }; // 标题区域再下移一点 (y from 0.6 to 0.62)

      // Wrap title text
      ctx.font = titleFont; // Set font for measurement
      const titleWords = coverTitle.split(' ');
      const maxLineWidth = titleArea.width;
      const titleLines = [];
      let currentLine = '';
      for (let i = 0; i < titleWords.length; i++) {
        if (currentLine.length + titleWords[i].length > 18) { // 18 char limit
          titleLines.push(currentLine.trim());
          currentLine = titleWords[i] + ' ';
        } else {
          currentLine += titleWords[i] + ' ';
        }
      }
      if (currentLine.trim() !== '') {
        titleLines.push(currentLine.trim());
      }

      // Draw title using helper function, left-aligned
      drawTextInArea(ctx, titleLines, titleArea, titleFont, titleColor, titleLineHeight, 'left');

      // 左对齐绘制描述文字
      const subtitleFont = `normal 28px 'Arial', sans-serif`;
      const subtitleColor = '#FFFFFF';
      const subtitleLineHeight = 40;
      const subtitleArea = { x: 50, y: height * 0.85, width: width - 100, height: height * 0.1 }; // Define subtitle area near bottom, left-aligned

      // Wrap subtitle text
      ctx.font = subtitleFont; // Set font for measurement
      const availableWidth = subtitleArea.width;
      const lines = wrapText(ctx, subtitle, 0, 0, availableWidth, subtitleLineHeight);

      // Draw subtitle using helper function, left-aligned
      drawTextInArea(ctx, lines, subtitleArea, subtitleFont, subtitleColor, subtitleLineHeight, 'left');
    } else if (template.id === 'pastel-beige') {
      // 可爱粉色风格布局

      // Draw decorative elements
      ctx.fillStyle = '#FFDBEE'; // Light pink for decorations
      drawCloud(ctx, 100, 100, 50); // Top-left small cloud
      drawCloud(ctx, width - 100, 120, 40); // Top-right small cloud
      drawStar(ctx, 150, height - 150, 20); // Bottom small stars
      drawStar(ctx, width - 150, height - 200, 25);
      function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.6, y - size * 0.3, size * 0.7, 0, Math.PI * 2);
        ctx.arc(x + size * 1.1, y, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const outerX = x + size * Math.cos(angle);
          const outerY = y + size * Math.sin(angle);
          if (i === 0) {
            ctx.moveTo(outerX, outerY);
          } else {
            ctx.lineTo(outerX, outerY);
          }
          const innerAngle = angle + Math.PI / 5;
          const innerX = x + size * 0.4 * Math.cos(innerAngle);
          const innerY = y + size * 0.4 * Math.sin(innerAngle);
          ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
      }

      // 上部绘制标题
      const titleFont = `bold 65px 'Comic Sans MS', cursive`;
      const titleColor = '#8A2BE2'; // Purple title
      const titleLineHeight = 70;
      const titleArea = { x: width * 0.1, y: height * 0.05, width: width * 0.8, height: height * 0.25 }; // 上移标题区域 (y from 0.1 to 0.05, height adjusted)

      // Wrap title text
      ctx.font = titleFont; // Set font for measurement
      const titleWords = coverTitle.split(' ');
      const titleLines = [];
      let currentLine = '';
      for (let i = 0; i < titleWords.length; i++) {
        if (currentLine.length + titleWords[i].length > 16) { // 16 char limit
          titleLines.push(currentLine.trim());
          currentLine = titleWords[i] + ' ';
        } else {
          currentLine += titleWords[i] + ' ';
        }
      }
      if (currentLine.trim() !== '') {
        titleLines.push(currentLine.trim());
      }

      // Draw title using helper function
      drawTextInArea(ctx, titleLines, titleArea, titleFont, titleColor, titleLineHeight, 'center');

      // 标题下方描述
      const subtitleFont = `normal 28px 'Comic Sans MS', cursive`;
      const subtitleColor = '#9400D3'; // Dark purple text
      const subtitleLineHeight = 35;
      const subtitleArea = { x: width * 0.1, y: height * 0.28, width: width * 0.8, height: height * 0.15 }; // 副标题区域再上移一点 (y from 0.3 to 0.28)

      // Wrap subtitle text
      ctx.font = subtitleFont; // Set font for measurement
      const availableWidth = subtitleArea.width;
      const lines = wrapText(ctx, subtitle, 0, 0, availableWidth, subtitleLineHeight);

      // Draw subtitle using helper function
      drawTextInArea(ctx, lines, subtitleArea, subtitleFont, subtitleColor, subtitleLineHeight, 'center');

      // Draw image (existing logic)
      if (image?.element) {
        const imgY = Math.round(height * 0.65);
        const aspectRatio = image.element.width / image.element.height;
        const imgWidth = Math.min(width * 0.65, height * 0.45 * aspectRatio);
        const imgHeight = imgWidth / aspectRatio;
        const drawX = (width - imgWidth) / 2;
        const drawY = imgY - imgHeight / 2;
        ctx.drawImage(image.element, 0, 0, image.element.width, image.element.height, drawX, drawY, imgWidth, imgHeight);
      }
      // Draw author name (slightly move up)
      ctx.font = `bold 35px 'Comic Sans MS', cursive`;
      ctx.fillStyle = '#8A2BE2'; // Purple text
      ctx.textAlign = 'center';
      ctx.fillText(authorName, width / 2, height - 90); // 略微上移 (from height - 70 to height - 80)
    } else {
      // 原有的标准封面绘制逻辑
      // Add a semi-transparent overlay
      ctx.fillStyle = `${template.backgroundColor}33`; // 20% opacity
      ctx.fillRect(0, 0, width, height);
  
      // Draw author name using layout configuration
      ctx.font = `bold 48px ${selectedFont}`;
      ctx.fillStyle = template.authorStyle?.color || '#FFFFFF'; // Use template color if available
      
      // Use layout for author text alignment
      ctx.textAlign = layout.authorPosition.textAlign;
      
      // Calculate author position based on layout
      let authorX = 40; // Default left margin
      if (layout.authorPosition.textAlign === 'center') {
        authorX = width / 2;
      } else if (layout.authorPosition.textAlign === 'right') {
        authorX = width - 40;
      }
      
      // Calculate Y position based on layout offsetY
      const authorY = Math.round(height * layout.authorPosition.offsetY);
      
      // Draw author text
      ctx.fillText(authorName.toUpperCase(), authorX, authorY);
  
      // Draw title using layout configuration
      ctx.font = `bold 48px ${selectedFont}`;
      ctx.fillStyle = template.titleStyle?.color || '#7CFC00'; // Use template color if available
      
      // Use layout for title text alignment
      ctx.textAlign = layout.titlePosition.textAlign;
      
      // Calculate title position based on layout
      let titleX = 40; // Default left margin
      if (layout.titlePosition.textAlign === 'center') {
        titleX = width / 2;
      } else if (layout.titlePosition.textAlign === 'right') {
        titleX = width - 40;
      }
      
      // Calculate Y position based on layout offsetY
      const titleY = Math.round(height * layout.titlePosition.offsetY);
      
      // Split title into lines if needed
      const titleLines = coverTitle.toUpperCase().split(' ');
      const midPoint = Math.ceil(titleLines.length / 2);
      
      const firstLine = titleLines.slice(0, midPoint).join(' ');
      const secondLine = titleLines.slice(midPoint).join(' ');
      
      // Draw first line of title
      ctx.fillText(firstLine, titleX, titleY);
      
      // Draw second line of title if exists
      if (secondLine) {
        ctx.fillText(secondLine, titleX, titleY + 60);
      }
  
      // Draw subtitle using layout configuration
      ctx.font = `18px ${selectedFont}`;
      ctx.fillStyle = template.subtitleStyle?.color || '#FFFFFF'; // Use template color if available
      
      // Use layout for subtitle text alignment
      ctx.textAlign = layout.subtitlePosition.textAlign;
      
      // Calculate subtitle position based on layout
      let subtitleX = 40; // Default left margin
      if (layout.subtitlePosition.textAlign === 'center') {
        subtitleX = width / 2;
      } else if (layout.subtitlePosition.textAlign === 'right') {
        subtitleX = width - 40;
      }
      
      // Calculate Y position based on layout offsetY
      const subtitleY = Math.round(height * layout.subtitlePosition.offsetY);
      
      // Draw subtitle
      ctx.fillText(subtitle, subtitleX, subtitleY);
    }
  };

  const drawSpine = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    template: any
  ) => {
    // 绘制背景
    ctx.fillStyle = template.spineStyle?.backgroundColor || template.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // 设置文本属性
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Position for vertical text (centered horizontally, starting from top)
    const centerX = width / 2;
    
    // 使用模板中的顶部边距配置，如果没有则使用默认值
    let currentY = template.spineStyle.topMargin || 60;
    
    // 根据模板ID选择字体，只有Sweet Pink主题使用Comic Sans MS
    const fontFamily = template.id === 'pastel-beige' ? "'Comic Sans MS', cursive" : selectedFont;
    
    // Draw author name vertically, with each character rotated 90 degrees
    ctx.font = `bold ${template.spineStyle.authorFontSize || 30}px ${fontFamily}`;
    ctx.fillStyle = template.spineStyle.authorColor || '#FFFFFF';
    
    const authorChars = authorName.toUpperCase().split('');
    authorChars.forEach(char => {
      ctx.save();
      ctx.translate(centerX, currentY);
      ctx.rotate(Math.PI / 2); // Rotate 90 degrees clockwise
      ctx.fillText(char, 0, 0);
      ctx.restore();
      
      // 使用模板中的字符间距配置，如果没有则使用默认值
      currentY += Math.round((template.spineStyle.authorFontSize || 30) * (template.spineStyle.charSpacing || 0.75)); 
    });
    
    // 使用模板中的作者与标题间距配置，如果没有则使用默认值
    currentY += template.spineStyle.authorTitleSpacing || 20;
    
    // Draw title vertically, with each character rotated 90 degrees
    ctx.font = `bold ${template.spineStyle.titleFontSize || 28}px ${fontFamily}`;
    ctx.fillStyle = template.spineStyle.titleColor || '#7CFC00';
    
    // Calculate how many characters can fit
    const titleChars = coverTitle.toUpperCase().split('');
    
    // 使用模板中的字符间距配置，如果没有则使用默认值
    const charSpacing = Math.round((template.spineStyle.titleFontSize || 28) * (template.spineStyle.charSpacing || 0.75));
    
    // 为 logo 预留空间 - 增加底部边距
    const logoHeight = 50; // logo 高度从 40 增加到 50
    const logoMargin = 15; // logo 上下边距从 10 增加到 15
    const bottomMargin = (template.spineStyle.bottomMargin || 60) + logoHeight + (logoMargin * 2);
    
    const availableHeight = height - currentY - bottomMargin;
    const estimatedTitleHeight = titleChars.length * charSpacing;
    
    // If title is too long, we need to truncate it
    let charsToShow = titleChars;
    if (estimatedTitleHeight > availableHeight) {
      // Calculate how many characters can fit
      const maxChars = Math.floor(availableHeight / charSpacing);
      charsToShow = titleChars.slice(0, maxChars);
    }
    
    // Draw each character of the title vertically with rotation
    charsToShow.forEach(char => {
      ctx.save();
      ctx.translate(centerX, currentY);
      ctx.rotate(Math.PI / 2); // Rotate 90 degrees clockwise
      ctx.fillText(char, 0, 0);
      ctx.restore();
      
      currentY += charSpacing;
    });
    
    // 在底部绘制 logo
    if (spineLogo?.element) {
      // 计算 logo 位置
      const logoY = height - logoHeight - logoMargin; // 距离底部 15 像素
      const logoWidth = Math.min(width - 4, 60); // 限制 logo 宽度，从 50 增加到 60，边距从 6 减少到 4
      const logoAspectRatio = spineLogo.element.width / spineLogo.element.height;
      const calculatedLogoHeight = logoWidth / logoAspectRatio;
      
      // 居中绘制 logo
      const logoX = (width - logoWidth) / 2;
      
      // 绘制 logo
      ctx.drawImage(
        spineLogo.element, 
        0, 
        0, 
        spineLogo.element.width, 
        spineLogo.element.height, 
        logoX, 
        logoY, 
        logoWidth, 
        calculatedLogoHeight
      );
    }
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

    // 根据模板ID选择字体，只有Sweet Pink主题使用Comic Sans MS
    const fontFamily = template.id === 'pastel-beige' ? "'Comic Sans MS', cursive" : selectedFont;

    // 绘制赞美语，如果有的话
    if (praises && praises.length > 0) {
      const availablePraises = praises.slice(0, 4); // 限制最多显示4条赞美语
      
      // 使用模板中的边距配置，如果没有则使用默认值 - 向下移动
      const marginLeft = template.backCoverStyle.marginLeft || 40;
      const marginTop = template.backCoverStyle.marginTop || 80; // 从60向下移动到80
      
      // 设置标题
      ctx.textAlign = template.backCoverStyle.textAlign || 'left';
      ctx.fillStyle = template.backCoverStyle.textColor || '#FFFFFF';
      ctx.font = `bold ${template.backCoverStyle.titleFontSize || 34}px ${fontFamily}`;
      
      const x = Math.round(marginLeft);
      const y = Math.round(marginTop);
      ctx.fillText(`Praises for ${coverTitle}`, x, y);
      
      // 使用模板中的行间距配置，如果没有则使用默认值
      let yPosition = marginTop + (template.backCoverStyle.titleSpacing || 40);
      
      // 绘制每条赞美语
      availablePraises.forEach(praise => {
        // 赞美文本内容
        ctx.font = `italic ${template.backCoverStyle.praiseFontSize || 26}px ${fontFamily}`; // 从28px轻微减小到26px
        
        // 使用文本换行函数
        const wrappedText = wrapTextWithHeight(
          ctx, 
          `"${praise.text}"`, 
          x, 
          Math.round(yPosition), 
          width - marginLeft * 2, 
          template.backCoverStyle.lineHeight || 33 // 从36轻微减小到33
        );
        
        // 使用模板中的赞美语间距配置，如果没有则使用默认值
        const praiseSpacing = template.backCoverStyle.praiseSpacing || 20; // 从24轻微减小到20
        yPosition += wrappedText.height + Math.round(praiseSpacing * 1.4); // 从1.5轻微减小到1.4
        
        // 赞美来源，在作者名称前添加"-"符号
        ctx.font = `bold ${template.backCoverStyle.sourceFontSize || 28}px ${fontFamily}`; // 从30px轻微减小到28px
        ctx.fillText(`- ${praise.source}`, x, Math.round(yPosition));
        
        // 使用模板中的来源间距配置，如果没有则使用默认值
        yPosition += template.backCoverStyle.sourceSpacing || 52; // 从60轻微减小到52
      });
    }

    // Draw book info at the bottom - 确保使用整数坐标
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.font = `14px ${fontFamily}`;
    ctx.fillText("Visit wishiyo.com", Math.round(40), Math.round(height - 80));
    
    // 使用 Futura 字体
    ctx.font = `bold 18px "Futura", sans-serif`;
    ctx.fillStyle = '#FF6B35'; // Orange for WISHIYO
    ctx.fillText("WISHIYO", Math.round(40), Math.round(height - 50));

    // 绘制条形码在右下角 - 向左上移动
    if (barcode?.element) {
      // 设置条形码尺寸 - 增大到 200x100
      const barcodeWidth = 200;
      const barcodeHeight = 100;
      
      // 调整位置，向左上移动
      const barcodeX = Math.round(width - barcodeWidth - 40); // 距离右边缘 40 像素
      const barcodeY = Math.round(height - barcodeHeight - 40); // 距离底部边缘 40 像素
      
      // 绘制条形码图像，使用其原始比例
      ctx.drawImage(
        barcode.element,
        0,
        0,
        barcode.element.width,
        barcode.element.height,
        barcodeX,
        barcodeY,
        barcodeWidth,
        barcodeHeight
      );
    } else {
      // 如果条形码图像未加载，绘制一个占位区域
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(Math.round(width - 240), Math.round(height - 140), 200, 100);
    }
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
    
    // 设置文本渲染属性 - 保证清晰度
    ctx.textBaseline = 'middle'; // 使文本垂直居中，增加清晰度
    
    // 应用适当的字符间距，增加可读性
    ctx.letterSpacing = '0.5px';
    
    for (let n = 0; n < words.length; n++) {
      testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && n > 0) {
        // 绘制当前行，使用描边增加清晰度
        ctx.fillText(line, x, y + (lineCount * lineHeight) + lineHeight/2);
        
        line = words[n] + ' ';
        lineCount++;
      } else {
        line = testLine;
      }
    }
    
    // 绘制最后一行，使用描边增加清晰度
    ctx.fillText(line, x, y + (lineCount * lineHeight) + lineHeight/2);
    
    // 返回文本块的总高度
    return {
      height: lineCount * lineHeight + lineHeight // 总高度
    };
  };

  return (
    <div className="relative">
      {/* 预览模式下只显示封面 */}
      {previewMode ? (
        <div className="relative">
          <canvas ref={frontCoverRef} className="block" />
        </div>
      ) : (
        <div className="flex items-start">
          {/* 调整封面之间的间距 */}
          <div className="mr-6">
            <canvas ref={frontCoverRef} className="block" />
          </div>
          <div className="mr-6">
            <canvas ref={spineRef} className="block" />
          </div>
          <div>
            <canvas ref={backCoverRef} className="block" />
          </div>
        </div>
      )}
      
      {/* 调整图片按钮 */}
      {image && !previewMode && (
        <div className="absolute bottom-[-40px] left-1/2 transform -translate-x-1/2">
          <CoverImageControls 
            coverImage={coverImage}
            imagePosition={imagePosition}
            imageScale={imageScale}
            onImageAdjust={onImageAdjust}
          />
        </div>
      )}
    </div>
  );
};

export default CanvasCoverPreview;