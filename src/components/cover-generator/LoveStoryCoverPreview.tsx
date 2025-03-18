import { useRef, useEffect, useState } from 'react';
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
  titleData: {
    mainTitle: string;
    subTitle: string;
    fullTitle: string;
  };
  subtitle?: string;
  authorName: string;
  recipientName?: string;
  coverImage?: string;
  selectedFont?: string;
  style?: CoverStyle;
}

const LoveStoryCoverPreview = ({
  titleData,
  subtitle = '',
  authorName,
  recipientName = '',
  coverImage,
  selectedFont = 'playfair',
  style
}: LoveStoryCoverPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const image = useImageLoader(coverImage);
  const blueTexture = useImageLoader(blueTextureBackground);
  const greenLeaf = useImageLoader(greenLeafBackground);
  const rainbow = useImageLoader(rainbowBackground);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸为 1:1 比例
    canvas.width = 2400;
    canvas.height = 2400;

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
          titleData, 
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
          titleData, 
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
  }, [titleData, subtitle, authorName, recipientName, image, selectedFont, style]);

  const drawLoveStoryCover = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement,
    titleData: { mainTitle: string; subTitle: string; fullTitle: string },
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
    const authorColor = style?.authorColor || '#333333';
    
    // Draw background first
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // 根据样式设置字体家族
    let fontFamily = getFontFamily(style?.font || font);

    // 根据样式选择和应用背景
    // 为 modern 样式添加背景图片
    if (style?.id === 'modern') {
      if (blueTexture && blueTexture.element) {
        // 使用加载的图片作为背景
        ctx.drawImage(blueTexture.element, 0, 0, width, height);
        
        // 添加深蓝色半透明叠加层，使图片更暗
        ctx.fillStyle = 'rgba(10, 26, 63, 0.3)';
        ctx.fillRect(0, 0, width, height);
        
        // 添加雪花效果
        const snowflakeCount = 100;
        ctx.fillStyle = '#FFFFFF';
        
        for (let i = 0; i < snowflakeCount; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 5 + 1;
          
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // 如果无法加载modern背景图片，使用深蓝色
        ctx.fillStyle = '#0a1a3f';
        ctx.fillRect(0, 0, width, height);
      }
    } 
    // 为 playful 样式添加绿叶背景
    else if (style?.id === 'playful') {
      if (greenLeaf && greenLeaf.element) {
        // 使用加载的图片作为背景
        ctx.drawImage(greenLeaf.element, 0, 0, width, height);
        
        // 添加蓝色半透明叠加层
        ctx.fillStyle = 'rgba(74, 137, 220, 0.2)';
        ctx.fillRect(0, 0, width, height);
      } else {
        // 如果无法加载playful背景图片，使用蓝色
        ctx.fillStyle = '#4A89DC';
        ctx.fillRect(0, 0, width, height);
      }
    } 
    // 为 elegant 样式添加彩虹背景
    else if (style?.id === 'elegant') {
      if (rainbow && rainbow.element) {
        // 使用加载的图片作为背景
        ctx.drawImage(rainbow.element, 0, 0, width, height);
      } else {
        // 如果无法加载彩虹背景图片，使用白色
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }
    }
    // classic 和 vintage 样式使用纯色背景
    else if (style?.id === 'classic' || style?.id === 'vintage') {
      ctx.fillStyle = style.background;
      ctx.fillRect(0, 0, width, height);
    }
    // 默认白色背景
    else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw image if available
    if (image?.element) {
      // 计算图像尺寸，保持比例
      const imgRatio = image.element.width / image.element.height;
      let drawWidth = width * 0.7;  // 图片占70%的宽度
      let drawHeight = drawWidth / imgRatio;
      
      // 如果高度太大，按高度计算
      if (drawHeight > height * 0.6) {
        drawHeight = height * 0.6;
        drawWidth = drawHeight * imgRatio;
      }
      
      // 计算居中位置
      const x = (width - drawWidth) / 2;
      const y = height * 0.4;  // 图片位置偏上
      
      // 绘制人物图像
      ctx.drawImage(image.element, x, y, drawWidth, drawHeight);
    }

    // 绘制标题文本
    ctx.textAlign = 'center';
    
    // 主标题
    ctx.fillStyle = titleColor;
    const titleFontSize = width * 0.06;
    
    // 从titleData获取标题信息
    const { mainTitle, subTitle, fullTitle } = titleData;
    
    console.log('绘制标题:', { mainTitle, subTitle, fullTitle });
    
    // 如果有主副标题，则绘制两行
    if (mainTitle && subTitle) {
      // 为Playful样式特别处理字体
      if (style?.id === 'playful') {
        // 放大字体并绘制主标题
        const mainTitleFontSize = titleFontSize * 1.2; // 增大主标题字体
        ctx.font = `bold ${mainTitleFontSize}px cursive`; // 确保使用手写体
        ctx.fillText(mainTitle, width / 2, height * 0.25); // 上移主标题位置
        
        // 绘制副标题（保持字体稍小，增加间距）
        const subTitleFontSize = titleFontSize * 1.1; // 增大副标题字体
        ctx.font = `bold ${subTitleFontSize}px cursive`;
        ctx.fillText(subTitle, width / 2, height * 0.33); // 保持间距，但整体上移
      } else {
        // 其他样式使用标准字体族但仍保持两行布局
        ctx.font = `bold ${titleFontSize}px ${fontFamily}`;
        ctx.fillText(mainTitle, width / 2, height * 0.13);
        
        ctx.font = `bold ${titleFontSize * 0.9}px ${fontFamily}`;
        ctx.fillText(subTitle, width / 2, height * 0.21);
      }
    } else {
      // 如果没有分开的标题，则使用完整标题
      ctx.font = `bold ${titleFontSize}px ${fontFamily}`;
      ctx.fillText(fullTitle, width / 2, height * 0.15);
    }
    
    // 作者名
    ctx.fillStyle = authorColor;
    const authorFontSize = width * 0.035;
    ctx.font = `italic ${authorFontSize}px ${fontFamily}`;
    
    // 如果是Playful样式，则将作者名放在右下角
    if (style?.id === 'playful') {
      ctx.fillText(`Written by ${author}`, width * 0.85, height * 0.95);
    } else {
      ctx.fillText(`Written by ${author}`, width * 0.75, height * 0.9);
    }
  };

  // Helper function to get the font family based on the selected font
  const getFontFamily = (selectedFont?: string): string => {
    switch (selectedFont) {
      case 'montserrat':
        return 'sans-serif';
      case 'comic-sans':
        return 'cursive';
      case 'didot':
      case 'playfair':
        return 'serif';
      default:
        return 'serif';
    }
  };

  // Helper to draw snowflakes
  const drawSnowflakes = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const count = 100;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 4 + 1;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
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
      <div className="relative rounded-lg overflow-hidden shadow-xl" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};

export default LoveStoryCoverPreview; 