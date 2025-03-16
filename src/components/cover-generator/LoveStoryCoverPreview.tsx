import { useRef, useEffect } from 'react';
import { useImageLoader } from './hooks/useImageLoader';
import drawTexturedBackground from './TexturedBackground';
import drawSnowNightBackground from './SnowNightBackground';
import blueTextureBackground from '../../assets/Generated Image March 15, 2025 - 3_12PM_LE_upscale_balanced_x4.jpg';
import greenLeafBackground from '../../assets/leaves.jpg';
import rainbowBackground from '../../assets/rainbow2.jpg';

// 样式接口定义
interface CoverStyle {
  id: string;
  name: string;
  background: string;
  titleColor: string;
  subtitleColor: string;
  authorColor: string;
  font: string;
  borderColor?: string;
}

interface LoveStoryCoverPreviewProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  recipientName: string;
  coverImage?: string;
  selectedFont?: string;
  style?: CoverStyle;
  canvasRefCallback?: (canvas: HTMLCanvasElement | null) => void;
}

const LoveStoryCoverPreview = ({
  coverTitle,
  subtitle,
  authorName,
  recipientName,
  coverImage,
  selectedFont = 'playfair',
  style,
  canvasRefCallback
}: LoveStoryCoverPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const image = useImageLoader(coverImage);
  const blueTexture = useImageLoader(blueTextureBackground);
  const greenLeaf = useImageLoader(greenLeafBackground);
  const rainbow = useImageLoader(rainbowBackground);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 如果提供了回调函数，则传递 canvas 引用
    if (canvasRefCallback) {
      canvasRefCallback(canvas);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸为 1:1 比例
    canvas.width = 1000;
    canvas.height = 1000;

    // 预加载所有图片，确保在绘制前已加载完成
    const preloadImages = async () => {
      try {
        // 等待所有图片加载完成
        await Promise.all([
          blueTexture?.loaded,
          greenLeaf?.loaded,
          rainbow?.loaded,
          image?.loaded
        ].filter(Boolean));
        
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 所有图片加载完成后再绘制
        drawLoveStoryCover(
          ctx, 
          canvas,
          coverTitle, 
          subtitle, 
          authorName, 
          recipientName, 
          image, 
          selectedFont,
          style
        );
      } catch (error) {
        console.error('Error loading images:', error);
        
        // 如果图片加载失败，仍然尝试绘制
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawLoveStoryCover(
          ctx, 
          canvas,
          coverTitle, 
          subtitle, 
          authorName, 
          recipientName, 
          image, 
          selectedFont,
          style
        );
      }
    };

    preloadImages();
  }, [coverTitle, subtitle, authorName, recipientName, image, selectedFont, style]);

  const drawLoveStoryCover = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement,
    title: string,
    subtitle: string,
    author: string,
    recipient: string,
    image: { element: HTMLImageElement } | null,
    font: string,
    style?: CoverStyle
  ) => {
    const width = canvas.width;
    const height = canvas.height;

    // 使用样式或默认值
    const backgroundColor = style?.background || '#f5f5f0';
    const titleColor = style?.titleColor || '#5a5a5a';
    const subtitleColor = style?.subtitleColor || '#633d63';
    const authorColor = style?.authorColor || '#333333';
    
    // 根据样式调整文字位置
    const titleY = style?.id === 'modern' ? height * 0.15 : height * 0.1;
    const subtitleY = style?.id === 'modern' ? height * 0.3 : height * 0.25;
    const authorY = style?.id === 'playful' ? height * 0.85 : height * 0.92;
    const authorX = style?.id === 'elegant' ? width * 0.5 : width * 0.9;
    
    // 根据样式设置字体家族
    let fontFamily = 'serif'; // 默认为衬线字体
    if (font === 'montserrat' || (style?.font === 'montserrat')) {
      fontFamily = 'sans-serif';
    } else if (font === 'comic-sans' || (style?.font === 'comic-sans')) {
      fontFamily = 'cursive';
    } else if (font === 'didot' || (style?.font === 'didot')) {
      fontFamily = 'serif';
    } else if (font === 'georgia' || (style?.font === 'georgia')) {
      fontFamily = 'serif';
    }

    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // 为 classic 样式添加纹理背景
    if (style?.id === 'classic') {
      drawTexturedBackground({
        ctx,
        width,
        height,
        baseColor: backgroundColor,
        textureOpacity: 0.8
      });
    }
    
    // 为 modern 样式添加背景图片
    if (style?.id === 'modern') {
      if (blueTexture && blueTexture.element) {
        // 使用加载的图片作为背景
        ctx.drawImage(blueTexture.element, 0, 0, width, height);
        
        // 添加一些雪花
        drawSnowflakes(ctx, width, height);
      } else {
        // 如果图片未加载，使用纯色背景
        ctx.fillStyle = '#0a1a3f';
        ctx.fillRect(0, 0, width, height);
      }
    }
    
    // 为第三个样式添加绿叶背景
    if (style?.id === 'playful') {
      if (greenLeaf && greenLeaf.element) {
        // 使用加载的图片作为背景
        ctx.drawImage(greenLeaf.element, 0, 0, width, height);
      } else {
        // 如果图片未加载，使用纯色背景
        ctx.fillStyle = '#4A89DC'; // 回退到原始的蓝色背景
        ctx.fillRect(0, 0, width, height);
      }
    }
    
    // 为第四个样式添加彩虹背景
    if (style?.id === 'elegant') {
      if (rainbow && rainbow.element) {
        // 使用加载的图片作为背景
        ctx.drawImage(rainbow.element, 0, 0, width, height);
      } else {
        // 如果图片未加载，使用纯色背景
        ctx.fillStyle = '#5B4B49'; // 回退到原始的棕色背景
        ctx.fillRect(0, 0, width, height);
      }
    }
    
    // 为某些风格添加特殊装饰
    if (style?.id === 'elegant') {
      // 移除金色边框装饰
    } else if (style?.id === 'pastel') {
      // 移除柔和条纹装饰
    }

    // Draw main title at the top
    ctx.font = `bold 50px ${fontFamily}`;
    ctx.fillStyle = titleColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 根据样式ID修改标题
    let displayTitle = title;
    
    // 对第一个样式(classic)使用特殊的三行式标题格式
    if (style?.id === 'classic') {
      // 第一行：作者名
      ctx.font = `bold 70px ${fontFamily}`;
      ctx.fillStyle = authorColor;
      ctx.fillText(`${author}'s`, width / 2, height * 0.1);
      
      // 第二行：wonderful
      ctx.font = `bold 50px ${fontFamily}`;
      ctx.fillStyle = titleColor;
      ctx.fillText(`wonderful`, width / 2, height * 0.2);
      
      // 第三行：角色名称
      ctx.font = `bold 90px ${fontFamily}`;
      ctx.fillStyle = subtitleColor;
      ctx.fillText(recipient, width / 2, height * 0.3);
    } else {
      // 其他样式保持原来的格式
      ctx.fillText(displayTitle, width / 2, titleY);
      
      // Draw subtitle (character name) - larger and more prominent
      ctx.font = `bold 90px ${fontFamily}`;
      ctx.fillStyle = subtitleColor;
      const recipientUpper = recipient.toUpperCase();
      
      // Modern风格使用斜体
      if (style?.id === 'modern') {
        ctx.font = `bold italic 90px ${fontFamily}`;
      } else if (style?.id === 'playful') {
        // Playful风格使用更大字体
        ctx.font = `bold 110px ${fontFamily}`;
      }
      
      ctx.fillText(recipientUpper + "!", width / 2, subtitleY);
    }

    // Draw image in the center if available
    if (image?.element) {
      const { width: imgWidth, height: imgHeight } = image.element;
      
      // Calculate aspect ratios
      const canvasAspect = width / height;
      const imageAspect = imgWidth / imgHeight;
      
      // 根据样式调整图片大小和位置
      let drawWidth = width * 0.7; // 默认宽度70%
      let drawHeight = height * 0.5; // 默认高度50%
      let x = (width - drawWidth) / 2;
      let y = height * 0.35; // 默认位置在中间
      
      if (style?.id === 'modern') {
        // Modern样式图片更大，居中
        drawWidth = width * 0.8;
        drawHeight = height * 0.5;
        y = height * 0.4;
      } else if (style?.id === 'playful') {
        // Playful样式图片更小，向上移动
        drawWidth = width * 0.6;
        drawHeight = height * 0.4;
        y = height * 0.45;
      } else if (style?.id === 'elegant') {
        // Elegant样式图片稍小，位置更居中
        drawWidth = width * 0.65;
        drawHeight = height * 0.5;
        y = height * 0.37;
      }
      
      // Maintain aspect ratio while fitting in the designated space
      if (imageAspect > 1) {
        // Landscape image
        drawHeight = drawWidth / imageAspect;
      } else {
        // Portrait image
        drawWidth = drawHeight * imageAspect;
        x = (width - drawWidth) / 2;
      }

      // 为特定样式添加图片效果
      if (style?.id === 'modern') {
        // 为Modern风格添加黑白滤镜
        ctx.filter = 'grayscale(100%)';
      } else if (style?.id === 'elegant') {
        // 为Elegant风格添加复古滤镜
        ctx.filter = 'sepia(30%)';
      } else if (style?.id === 'pastel') {
        // 为Pastel风格添加柔和滤镜
        ctx.filter = 'brightness(1.1) contrast(0.9)';
      }

      // Draw image 
      ctx.drawImage(image.element, x, y, drawWidth, drawHeight);
      ctx.filter = 'none'; // 重置滤镜
    }

    // Draw author name 
    ctx.font = `normal 30px ${fontFamily}`;
    ctx.fillStyle = authorColor;
    
    // 根据样式调整作者名称样式和位置
    if (style?.id === 'elegant') {
      // Elegant样式作者名居中
      ctx.textAlign = 'center';
      ctx.font = `italic 30px ${fontFamily}`;
    } else if (style?.id === 'modern') {
      // Modern样式使用更小字体
      ctx.textAlign = 'right';
      ctx.font = `bold 24px ${fontFamily}`;
    } else {
      ctx.textAlign = 'right';
    }
    
    ctx.fillText(`Written by ${author}`, authorX, authorY);
    
    // 只有Classic和Pastel样式显示出版商标志
    if (style?.id === 'classic' || style?.id === 'pastel') {
      let logoColor = '#1e7e7e'; // 默认颜色
      if (style.id === 'pastel') {
        logoColor = '#6A7B8B'; // Pastel样式使用不同颜色
      }
      drawPublisherLogo(ctx, width / 2, height * 0.92, 40, logoColor);
    }
  };

  // 绘制雪花函数
  const drawSnowflakes = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    
    // 小雪花 - 增加数量
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 1 + Math.random() * 2;
      
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 中雪花 - 增加数量
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 3 + Math.random() * 3;
      
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 大雪花 - 增加数量
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 5 + Math.random() * 4;
      
      // 为大雪花添加发光效果
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
      glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      glowGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
      glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      
      // 雪花中心
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 添加一些雪花结晶 - 新增
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = 8 + Math.random() * 6;
      
      // 绘制雪花结晶
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1;
      
      // 中心点
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.beginPath();
      ctx.arc(x, y, size / 8, 0, Math.PI * 2);
      ctx.fill();
      
      // 六个分支
      for (let j = 0; j < 6; j++) {
        const angle = (Math.PI / 3) * j;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
          x + Math.cos(angle) * size,
          y + Math.sin(angle) * size
        );
        ctx.stroke();
        
        // 每个分支上的小分支
        const branchLength = size * 0.6;
        const midX = x + Math.cos(angle) * (size / 2);
        const midY = y + Math.sin(angle) * (size / 2);
        
        // 左侧小分支
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(
          midX + Math.cos(angle + Math.PI / 4) * branchLength / 2,
          midY + Math.sin(angle + Math.PI / 4) * branchLength / 2
        );
        ctx.stroke();
        
        // 右侧小分支
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(
          midX + Math.cos(angle - Math.PI / 4) * branchLength / 2,
          midY + Math.sin(angle - Math.PI / 4) * branchLength / 2
        );
        ctx.stroke();
      }
    }
  };

  // Draw a simple publisher logo similar to the example
  const drawPublisherLogo = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string = '#1e7e7e'
  ) => {
    ctx.fillStyle = color;
    
    // Draw a simple crown-like shape
    ctx.beginPath();
    ctx.moveTo(x - size/2, y);
    ctx.lineTo(x - size/4, y - size/2);
    ctx.lineTo(x, y - size/4);
    ctx.lineTo(x + size/4, y - size/2);
    ctx.lineTo(x + size/2, y);
    ctx.closePath();
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