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

    // 检查是否为Sweet Pink主题
    const isSweetPink = template.id === 'pastel-beige';
    
    // 对于Sweet Pink主题，我们将在后面自定义处理图片，所以这里跳过默认图片处理
    if (image?.element && !isSweetPink) {
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
          ctx.fillRect(0, 0, width, containerHeight);
        }
        
        ctx.filter = template.imageStyle.filter;
        ctx.globalAlpha = parseFloat(template.imageStyle.opacity);
        
        // 如果布局指定了borderRadius，应用圆角裁剪
        if (layout.imageContainerStyle.borderRadius && layout.imageContainerStyle.borderRadius !== '0%') {
          ctx.save();
          
          // 创建圆形裁剪路径
          const radius = parseInt(layout.imageContainerStyle.borderRadius) / 100 * Math.min(containerWidth, containerHeight);
          const centerX = width / 2;
          const centerY = y + containerHeight / 2;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.clip();
          
          // Draw image
          ctx.drawImage(image.element, x, y, drawWidth, drawHeight);
          
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

    // 如果是bestseller模板
    if (template.id === 'bestseller') {
      // 上部添加畅销书宣传语
      ctx.fillStyle = '#FFC300';
      ctx.font = `bold 18px ${selectedFont}`;
      ctx.textAlign = 'center';
      ctx.fillText('Sold Over 5 Million Copies Worldwide | "Changed My Life"', width / 2, 35);
      
      // 添加作者名字在宣传语下方
      ctx.font = `bold 30px ${selectedFont}`; // 放大作者名字
      ctx.fillStyle = '#FFFFFF'; // 白色文字
      ctx.textAlign = 'center';
      ctx.fillText(`${authorName}`, width / 2, 70); // 去掉"by"
      
      // 在底部绘制蓝色描述区域 - 缩小蓝色区域高度
      const blueHeight = height * 0.2; // 从0.25减小到0.2
      ctx.fillStyle = '#4361EE';
      ctx.fillRect(0, height - blueHeight, width, blueHeight);
      
      // 辅助函数：文本自动换行
      const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        const lines: string[] = [];
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = context.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        
        lines.push(line);
        return lines;
      };
      
      // 绘制黄色标题在黑色背景区域 - 缩小标题字号
      ctx.font = `bold 66px ${selectedFont}`; // 从76px减小到66px
      ctx.fillStyle = '#FFC300';
      ctx.textAlign = 'center';
      
      // 计算标题位置 - 向下移动一些
      const titleY = Math.round(height * 0.62); // 从0.58增加到0.62
      
      // 将标题分成适当的行
      const titleWords = coverTitle.split(' ');
      const titleLines = [];
      let currentLine = '';
      
      // 组织标题成适当长度的行
      for (let i = 0; i < titleWords.length; i++) {
        if (currentLine.length + titleWords[i].length > 18) { // 根据经验设置合理的行长度
          titleLines.push(currentLine.trim());
          currentLine = titleWords[i] + ' ';
        } else {
          currentLine += titleWords[i] + ' ';
        }
      }
      
      if (currentLine.trim() !== '') {
        titleLines.push(currentLine.trim());
      }
      
      // 绘制标题行
      for (let i = 0; i < titleLines.length; i++) {
        ctx.fillText(titleLines[i].toUpperCase(), width / 2, titleY + i * 60); // 行间距从70调整到60
      }
      
      // 绘制描述性副标题在蓝色区域 - 再次增大描述文字字号
      ctx.font = `bold 28px ${selectedFont}`; // 从24px增大到28px
      ctx.fillStyle = '#FFC300';
      ctx.textAlign = 'center';
      
      // 计算可用宽度，留出边距
      const availableWidth = width * 0.85;
      const lines = wrapText(ctx, subtitle, width / 2, height - blueHeight/2, availableWidth, 34);
      
      // 绘制每一行文字
      let yPos = height - blueHeight/2 - (lines.length - 1) * 34 / 2;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], width / 2, yPos);
        yPos += 34; // 行高
      }
    } else if (template.id === 'classic') {
      // 背景已在外部设置为黑色
      
      // 在顶部绘制作者名字
      ctx.font = `bold 30px ${selectedFont}`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(authorName, width / 2, 50);
      
      // 绘制白色标题，位于中央
      ctx.font = `bold 60px ${selectedFont}`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      
      // 将标题分成多行显示
      const titleLines = coverTitle.split(' ');
      const upperLines = titleLines.slice(0, Math.ceil(titleLines.length / 2));
      const lowerLines = titleLines.slice(Math.ceil(titleLines.length / 2));
      
      // 计算标题位置
      const titleY = Math.round(height * 0.45);
      
      // 绘制顶部标题行
      ctx.fillText(upperLines.join(' ').toUpperCase(), width / 2, titleY);
      
      // 绘制底部标题行（红色）
      ctx.font = `bold 80px ${selectedFont}`;
      ctx.fillStyle = '#9B0000';
      ctx.fillText(lowerLines.join(' ').toUpperCase(), width / 2, titleY + 90); // 减小行间距
      
      // 绘制红色底部区域
      const bottomHeight = height * (template.bottomAreaHeight || 0.15);
      ctx.fillStyle = template.bottomAreaColor || '#9B0000';
      ctx.fillRect(0, height - bottomHeight, width, bottomHeight);
      
      // 在红色区域绘制白色描述文字
      ctx.font = `normal 24px ${selectedFont}`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      
      // 文本自动换行
      const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        const lines: string[] = [];
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = context.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        
        lines.push(line);
        return lines;
      };
      
      // 计算可用宽度，留出边距
      const availableWidth = width * 0.85;
      const lines = wrapText(ctx, subtitle, width / 2, height - bottomHeight/2, availableWidth, 28);
      
      // 绘制每一行文字
      let yPos = height - bottomHeight/2 - (lines.length - 1) * 28 / 2;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], width / 2, yPos);
        yPos += 28;
      }
    } else if (template.id === 'modern' || template.id === 'vibrant-green') {
      // 为奶油色肖像风格重写渲染逻辑
      
      // 图片已在外部绘制，整页背景为奶油色
      
      // 顶部绘制作者名字
      ctx.font = `normal 42px ${selectedFont}`; // 从24px放大到42px
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(authorName.toUpperCase(), width / 2, 70); // Y位置从50调整到70
      
      // 封面中央绘制大号金色标题
      ctx.font = `bold 80px ${selectedFont}`;
      ctx.fillStyle = '#D4AF37'; // 金色
      ctx.textAlign = 'center';
      
      // 将标题分成多行显示
      const titleY = Math.round(height * 0.65);
      const titleWords = coverTitle.split(' ');
      const titleLines = [];
      let currentLine = '';
      
      // 组织标题成适当长度的行
      for (let i = 0; i < titleWords.length; i++) {
        if (currentLine.length + titleWords[i].length > 12) { // 根据经验设置合理的行长度
          titleLines.push(currentLine.trim());
          currentLine = titleWords[i] + ' ';
        } else {
          currentLine += titleWords[i] + ' ';
        }
      }
      
      if (currentLine.trim() !== '') {
        titleLines.push(currentLine.trim());
      }
      
      // 绘制标题行
      for (let i = 0; i < titleLines.length; i++) {
        ctx.fillText(titleLines[i].toUpperCase(), width / 2, titleY + i * 90);
      }
      
      // 在底部绘制白色副标题（添加自动换行）
      ctx.font = `normal 32px ${selectedFont}`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      
      // 文本自动换行
      const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        const lines: string[] = [];
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = context.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        
        lines.push(line);
        return lines;
      };
      
      // 计算可用宽度，留出边距
      const availableWidth = width * 0.85;
      const lines = wrapText(ctx, subtitle, width / 2, height - 120, availableWidth, 38);
      
      // 绘制每一行文字
      let yPos = height - 120 - (lines.length - 1) * 38 / 2;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], width / 2, yPos);
        yPos += 38; // 行高
      }
    } else if (template.id === 'minimal') {
      // 简约灰色风格的布局
      // 背景已在外部设置为灰色
      
      // 左上角绘制作者名字（简短名字，如Kyle）
      ctx.font = `bold 60px 'Arial', sans-serif`;  // 使用Arial字体
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.fillText(authorName, 50, 130); // 位于左上角
      
      // 图片已在外部绘制（带灰度滤镜）
      
      // 居中绘制标题
      ctx.font = `bold 80px 'Arial', sans-serif`;  // 使用Arial字体并放大
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      
      // 将标题分成多行显示
      const titleY = Math.round(height * 0.7); // 标题位于下方
      const titleWords = coverTitle.split(' ');
      const titleLines = [];
      let currentLine = '';
      
      // 组织标题成适当长度的行
      for (let i = 0; i < titleWords.length; i++) {
        if (currentLine.length + titleWords[i].length > 18) { // 根据经验设置合理的行长度
          titleLines.push(currentLine.trim());
          currentLine = titleWords[i] + ' ';
        } else {
          currentLine += titleWords[i] + ' ';
        }
      }
      
      if (currentLine.trim() !== '') {
        titleLines.push(currentLine.trim());
      }
      
      // 绘制标题行
      for (let i = 0; i < titleLines.length; i++) {
        ctx.fillText(titleLines[i], width / 2, titleY + i * 80); // 居中绘制
      }
      
      // 文本自动换行函数
      const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        const lines: string[] = [];
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = context.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        
        lines.push(line);
        return lines;
      };
      
      // 居中绘制描述文字（在标题下方，带自动换行）
      ctx.font = `normal 36px 'Arial', sans-serif`;  // 使用Arial字体并放大
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      
      // 计算可用宽度，留出边距
      const availableWidth = width * 0.85; // 较宽的宽度，居中对齐
      const descriptionLines = wrapText(ctx, subtitle, width / 2, titleY + titleLines.length * 80 + 40, availableWidth, 40);
      
      // 绘制每一行描述文字
      let yPos = titleY + titleLines.length * 80 + 40;
      for (let i = 0; i < descriptionLines.length; i++) {
        ctx.fillText(descriptionLines[i], width / 2, yPos);
        yPos += 40; // 增大行高
      }
    } else if (template.id === 'pastel-beige') {
      // 可爱粉色风格布局
      // 背景已在外部设置为粉色
      
      // 绘制装饰性云朵或星星
      ctx.fillStyle = '#FFDBEE'; // 浅粉色装饰
      
      // 顶部左侧小云朵
      drawCloud(ctx, 100, 100, 50);
      
      // 顶部右侧小云朵
      drawCloud(ctx, width - 100, 120, 40);
      
      // 底部小星星
      drawStar(ctx, 150, height - 150, 20);
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
      
      // 上部绘制标题 - 位置向上移动
      ctx.font = `bold 65px 'Comic Sans MS', cursive`; // 使用更可爱的字体
      ctx.fillStyle = '#8A2BE2'; // 紫色标题
      ctx.textAlign = 'center';
      
      // 将标题分成多行显示 - 位置调整为更上方
      const titleY = Math.round(height * 0.15); // 标题位置再上移一点
      const titleWords = coverTitle.split(' ');
      const titleLines = [];
      let currentLine = '';
      
      // 组织标题成适当长度的行
      for (let i = 0; i < titleWords.length; i++) {
        if (currentLine.length + titleWords[i].length > 12) { // 根据经验设置合理的行长度
          titleLines.push(currentLine.trim());
          currentLine = titleWords[i] + ' ';
        } else {
          currentLine += titleWords[i] + ' ';
        }
      }
      
      if (currentLine.trim() !== '') {
        titleLines.push(currentLine.trim());
      }
      
      // 绘制标题行
      for (let i = 0; i < titleLines.length; i++) {
        ctx.fillText(titleLines[i], width / 2, titleY + i * 70);
      }
      
      // 文本自动换行函数
      const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        const lines: string[] = [];
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = context.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        
        lines.push(line);
        return lines;
      };
      
      // 标题下方描述 - 也向上移动
      ctx.font = `normal 32px 'Comic Sans MS', cursive`;
      ctx.fillStyle = '#9400D3'; // 深紫色文字
      
      // 计算可用宽度，留出边距
      const availableWidth = width * 0.8;
      const descriptionLines = wrapText(ctx, subtitle, width / 2, titleY + titleLines.length * 70 + 40, availableWidth, 35);
      
      // 绘制每一行描述文字
      let yPos = titleY + titleLines.length * 70 + 40;
      for (let i = 0; i < descriptionLines.length; i++) {
        ctx.fillText(descriptionLines[i], width / 2, yPos);
        yPos += 35;
      }
      
      // 判断是否有图片 - 将图片位置移至更下方
      if (image?.element) {
        // 计算图片位置并向下移动
        const imgY = Math.round(height * 0.62); // 图片位置向下移动到62%
        
        // 不考虑用户的图片调整，直接计算显示位置
        const aspectRatio = image.element.width / image.element.height;
        const imgWidth = Math.min(width * 0.65, height * 0.45 * aspectRatio); // 放大图片尺寸
        const imgHeight = imgWidth / aspectRatio;
        
        const drawX = (width - imgWidth) / 2; // 水平居中
        const drawY = imgY - imgHeight / 2; // 垂直居中在imgY位置
        
        // 只绘制一次图像
        ctx.drawImage(
          image.element,
          0, 0, image.element.width, image.element.height, // 源图像的完整区域
          drawX, drawY, imgWidth, imgHeight // 目标区域
        );
      }
      
      // 底部作者名
      ctx.font = `bold 35px 'Comic Sans MS', cursive`;
      ctx.fillStyle = '#8A2BE2'; // 紫色文字
      ctx.textAlign = 'center';
      ctx.fillText(authorName, width / 2, height - 70);
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
    
    // 使用模板中的底部边距配置，如果没有则使用默认值
    const bottomMargin = template.spineStyle.bottomMargin || 60;
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
      
      // 使用模板中的边距配置，如果没有则使用默认值
      const marginLeft = template.backCoverStyle.marginLeft || 40;
      const marginTop = template.backCoverStyle.marginTop || 60;
      
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
        ctx.font = `italic ${template.backCoverStyle.praiseFontSize || 28}px ${fontFamily}`;
        
        // 使用文本换行函数
        const wrappedText = wrapTextWithHeight(
          ctx, 
          `"${praise.text}"`, 
          x, 
          Math.round(yPosition), 
          width - marginLeft * 2, 
          template.backCoverStyle.lineHeight || 36
        );
        
        // 使用模板中的赞美语间距配置，如果没有则使用默认值
        const praiseSpacing = template.backCoverStyle.praiseSpacing || 24;
        yPosition += wrappedText.height + Math.round(praiseSpacing * 1.5);
        
        // 赞美来源，在作者名称前添加"-"符号
        ctx.font = `bold ${template.backCoverStyle.sourceFontSize || 30}px ${fontFamily}`;
        ctx.fillText(`- ${praise.source}`, x, Math.round(yPosition));
        
        // 使用模板中的来源间距配置，如果没有则使用默认值
        yPosition += template.backCoverStyle.sourceSpacing || 60;
      });
    }

    // Draw book info at the bottom - 确保使用整数坐标
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF'; // White text
    ctx.font = `14px ${fontFamily}`;
    ctx.fillText("Visit bookbyanyone.com", Math.round(40), Math.round(height - 80));
    
    ctx.font = `bold 18px ${fontFamily}`;
    ctx.fillStyle = '#FF6B35'; // Orange for BOOK BY ANYONE
    ctx.fillText("BOOK BY ANYONE", Math.round(40), Math.round(height - 50));

    // Draw barcode at the bottom right
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(Math.round(width - 180), Math.round(height - 100), 140, 60);
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