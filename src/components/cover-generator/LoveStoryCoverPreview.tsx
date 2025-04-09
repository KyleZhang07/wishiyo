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
  titleData?: {
    mainTitle: string;
    subTitle: string;
    thirdLine: string;
    fullTitle: string;
  };
  coverTitle?: string;
  subtitle?: string;
  authorName: string;
  recipientName?: string;
  coverImage?: string;
  selectedFont?: string;
  style?: CoverStyle;
}

const LoveStoryCoverPreview = ({
  titleData,
  coverTitle = '',
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
        
        // 构建有效的标题数据对象
        let effectiveTitleData = titleData;
        
        // 如果没有传入 titleData 但有 coverTitle 和/或 subtitle，则构建一个标题数据对象
        if (!effectiveTitleData && (coverTitle || subtitle)) {
          // 检查 coverTitle 是否包含 "'s amazing adventure" 格式
          if (coverTitle && coverTitle.includes("'s amazing adventure")) {
            // 将 coverTitle 拆分为两行
            const namePart = coverTitle.split("'s amazing adventure")[0] + "'s";
            effectiveTitleData = {
              mainTitle: namePart,
              subTitle: "amazing adventure",
              thirdLine: '',
              fullTitle: coverTitle
            };
          } else if (coverTitle && coverTitle.includes("'s") && subtitle) {
            // 处理其他包含 's 的格式
            effectiveTitleData = {
              mainTitle: coverTitle,
              subTitle: subtitle,
              thirdLine: '',
              fullTitle: coverTitle + (subtitle ? ' ' + subtitle : '')
            };
          } else {
            // 其他情况
            effectiveTitleData = {
              mainTitle: coverTitle,
              subTitle: subtitle,
              thirdLine: '',
              fullTitle: coverTitle + (subtitle ? ' ' + subtitle : '')
            };
          }
        }
        
        // 如果没有任何标题数据，使用空对象
        if (!effectiveTitleData) {
          effectiveTitleData = {
            mainTitle: '',
            subTitle: '',
            thirdLine: '',
            fullTitle: ''
          };
        }
        
        // 所有图片加载完成后再绘制
        drawLoveStoryCover(
          ctx, 
          canvas,
          effectiveTitleData, 
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
  }, [titleData, coverTitle, subtitle, authorName, recipientName, image, selectedFont, style]);

  const drawLoveStoryCover = (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement,
    titleData: { mainTitle: string; subTitle: string; thirdLine: string; fullTitle: string },
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
      const y = height * 0.4;  // 图片位置上移
      
      // 绘制人物图像
      ctx.drawImage(image.element, x, y, drawWidth, drawHeight);
    }

    // 绘制标题文本
    ctx.textAlign = 'center';
    
    // 主标题
    ctx.fillStyle = titleColor;
    const titleFontSize = width * 0.06;
    
    // 从titleData获取标题信息
    const { mainTitle, subTitle, thirdLine, fullTitle } = titleData;
    
    console.log('绘制标题:', { mainTitle, subTitle, thirdLine, fullTitle });
    
    // 如果有主副标题，则绘制多行
    if (mainTitle) {
      // 为Playful样式特别处理字体
      if (style?.id === 'playful' || style?.id === 'modern' || style?.id === 'elegant') {
        // 放大字体并绘制主标题
        const mainTitleFontSize = titleFontSize * (style?.id === 'modern' ? 2.0 : 1.2); // Modern样式字体更大
        ctx.font = `bold ${mainTitleFontSize}px ${style?.id === 'playful' ? 'cursive' : style?.id === 'modern' ? "'Amatic SC', cursive" : "'Comic Sans MS', cursive"}`;
        
        // 只处理特定的三行标题模式：${authorName}'s wonderful ${recipientName}
        if (thirdLine && mainTitle.includes("'s") && subTitle === 'wonderful') {
          // 三行标题位置，增加间距，整体下移0.015
          // Modern样式特殊处理位置
          const yPosition = style?.id === 'modern' ? height * 0.25 : height * (0.16 + 0.015);
          ctx.fillText(mainTitle, width / 2, yPosition);
          
          const subTitleFontSize = titleFontSize * (style?.id === 'modern' ? 1.8 : 1.1); // Modern样式副标题也放大
          ctx.font = `bold ${subTitleFontSize}px ${style?.id === 'playful' ? 'cursive' : style?.id === 'modern' ? "'Amatic SC', cursive" : "'Comic Sans MS', cursive"}`;
          // Modern样式特殊处理位置
          const subYPosition = style?.id === 'modern' ? height * 0.35 : height * (0.26 + 0.015);
          const thirdYPosition = style?.id === 'modern' ? height * 0.45 : height * (0.36 + 0.015);
          ctx.fillText(subTitle, width / 2, subYPosition);
          ctx.fillText(thirdLine, width / 2, thirdYPosition);
        } else if (thirdLine) {
          // 其他三行标题情况，增加间距，整体下移0.015
          // Modern样式特殊处理位置
          const yPosition = style?.id === 'modern' ? height * 0.25 : height * (0.16 + 0.015);
          ctx.fillText(mainTitle, width / 2, yPosition);
          
          const subTitleFontSize = titleFontSize * (style?.id === 'modern' ? 1.8 : 1.1); // Modern样式副标题也放大
          ctx.font = `bold ${subTitleFontSize}px ${style?.id === 'playful' ? 'cursive' : style?.id === 'modern' ? "'Amatic SC', cursive" : "'Comic Sans MS', cursive"}`;
          // Modern样式特殊处理位置
          const subYPosition = style?.id === 'modern' ? height * 0.35 : height * (0.26 + 0.015);
          const thirdYPosition = style?.id === 'modern' ? height * 0.45 : height * (0.36 + 0.015);
          ctx.fillText(subTitle, width / 2, subYPosition);
          ctx.fillText(thirdLine, width / 2, thirdYPosition);
        } else {
          // 两行标题的情况位置，增加间距，整体下移0.01
          // Modern样式特殊处理位置
          const yPosition = style?.id === 'modern' ? height * 0.25 : height * (0.215 + 0.01);
          ctx.fillText(mainTitle, width / 2, yPosition);
          
          // 绘制副标题，增加间距
          const subTitleFontSize = titleFontSize * (style?.id === 'modern' ? 1.8 : 1.1);
          ctx.font = `bold ${subTitleFontSize}px ${style?.id === 'playful' ? 'cursive' : style?.id === 'modern' ? "'Amatic SC', cursive" : "'Comic Sans MS', cursive"}`;
          // Modern样式特殊处理位置
          const subYPosition = style?.id === 'modern' ? height * 0.35 : height * (0.315 + 0.01);
          ctx.fillText(subTitle, width / 2, subYPosition); 
        }
      }
      // Classic和Vintage样式，使用与其他样式相同的位置
      else if (style?.id === 'classic' || style?.id === 'vintage') {
        const mainTitleFontSize = titleFontSize * 1.2; // 增大主标题字体
        ctx.font = `bold ${mainTitleFontSize}px ${fontFamily}`;
        
        // 只处理特定的三行标题模式：${authorName}'s wonderful ${recipientName}
        if (thirdLine && mainTitle.includes("'s") && subTitle === 'wonderful') {
          // 使用与其他样式相同的位置
          ctx.fillText(mainTitle, width / 2, height * (0.16 + 0.015));
          
          const subTitleFontSize = titleFontSize * 1.1;
          ctx.font = `bold ${subTitleFontSize}px ${fontFamily}`;
          ctx.fillText(subTitle, width / 2, height * (0.26 + 0.015));
          ctx.fillText(thirdLine, width / 2, height * (0.36 + 0.015));
        } else if (thirdLine) {
          // 其他三行标题情况
          ctx.fillText(mainTitle, width / 2, height * (0.16 + 0.015));
          
          const subTitleFontSize = titleFontSize * 1.1;
          ctx.font = `bold ${subTitleFontSize}px ${fontFamily}`;
          ctx.fillText(subTitle, width / 2, height * (0.26 + 0.015));
          ctx.fillText(thirdLine, width / 2, height * (0.36 + 0.015));
        } else {
          // 两行标题的情况
          ctx.fillText(mainTitle, width / 2, height * (0.215 + 0.01));
          
          const subTitleFontSize = titleFontSize * 1.1;
          ctx.font = `bold ${subTitleFontSize}px ${fontFamily}`;
          ctx.fillText(subTitle, width / 2, height * (0.315 + 0.01));
        }
      }
      else {
        // 其他样式使用标准字体族但仍保持多行布局
        ctx.font = `bold ${titleFontSize}px ${fontFamily}`;
        
        // 只处理特定的三行标题模式：${authorName}'s wonderful ${recipientName}
        if (thirdLine && mainTitle.includes("'s") && subTitle === 'wonderful') {
          // 三行标题位置，增加间距，整体下移0.015
          ctx.fillText(mainTitle, width / 2, height * (0.09 + 0.015));
          
          ctx.font = `bold ${titleFontSize * 0.9}px ${fontFamily}`;
          ctx.fillText(subTitle, width / 2, height * (0.19 + 0.015));
          ctx.fillText(thirdLine, width / 2, height * (0.29 + 0.015));
        } else if (thirdLine) {
          // 其他三行标题情况，增加间距，整体下移0.015
          ctx.fillText(mainTitle, width / 2, height * (0.09 + 0.015));
          
          ctx.font = `bold ${titleFontSize * 0.9}px ${fontFamily}`;
          ctx.fillText(subTitle, width / 2, height * (0.19 + 0.015));
          ctx.fillText(thirdLine, width / 2, height * (0.29 + 0.015));
        } else {
          // 两行标题的情况位置，增加间距，整体下移0.01
          ctx.fillText(mainTitle, width / 2, height * (0.11 + 0.01));
          
          ctx.font = `bold ${titleFontSize * 0.9}px ${fontFamily}`;
          // 副标题也增加间距
          ctx.fillText(subTitle, width / 2, height * (0.21 + 0.01));
        }
      }
    } else {
      // 如果没有分开的标题，则使用完整标题，下移0.01
      if (style?.id === 'modern') {
        // 使用白色字体和更手写风格的字体
        ctx.fillStyle = '#FFFFFF';
        const modernTitleFontSize = titleFontSize * 2.0; // 将字体放大2倍
        ctx.font = `bold ${modernTitleFontSize}px 'Amatic SC', cursive`;
        // 将标题位置略微降低，与图中位置一致
        ctx.fillText(fullTitle, width / 2, height * 0.25);
      } else if (style?.id === 'elegant') {
        // 使用白色字体和手写风格的字体
        ctx.fillStyle = '#FFFFFF';
        const elegantTitleFontSize = titleFontSize * 1.3;
        ctx.font = `bold ${elegantTitleFontSize}px 'Comic Sans MS', cursive`;
        ctx.fillText(fullTitle, width / 2, height * (0.125 + 0.01));
      } else {
        // 其他样式使用默认字体
        ctx.font = `bold ${titleFontSize}px ${fontFamily}`;
        ctx.fillText(fullTitle, width / 2, height * (0.125 + 0.01));
      }
    }
    
    // 作者名
    // 如果是modern样式，使用白色字体，但位置与playful保持一致
    if (style?.id === 'modern') {
      ctx.fillStyle = '#FFFFFF';
      const authorFontSize = width * 0.035;
      ctx.font = `italic ${authorFontSize}px 'Amatic SC', cursive`;
      ctx.fillText(`Written by ${author}`, width * 0.85, height * 0.95); // 与playful位置一致
    } 
    // 如果是elegant样式，使用白色字体，但位置与playful保持一致
    else if (style?.id === 'elegant') {
      ctx.fillStyle = '#FFFFFF';
      const authorFontSize = width * 0.035;
      ctx.font = `italic ${authorFontSize}px 'Comic Sans MS', cursive`;
      ctx.fillText(`Written by ${author}`, width * 0.85, height * 0.95); // 与playful位置一致
    }
    // Classic和Vintage样式，使用与playful相同的位置
    else if (style?.id === 'classic' || style?.id === 'vintage') {
      ctx.fillStyle = authorColor;
      const authorFontSize = width * 0.035;
      ctx.font = `italic ${authorFontSize}px ${fontFamily}`;
      ctx.fillText(`Written by ${author}`, width * 0.85, height * 0.95); // 与playful位置一致
    }
    else {
      ctx.fillStyle = authorColor;
      const authorFontSize = width * 0.035;
      ctx.font = `italic ${authorFontSize}px ${fontFamily}`;
      
      // 如果是Playful样式，则将作者名放在右下角
      if (style?.id === 'playful') {
        ctx.fillText(`Written by ${author}`, width * 0.85, height * 0.95);
      } else {
        ctx.fillText(`Written by ${author}`, width * 0.75, height * 0.9);
      }
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