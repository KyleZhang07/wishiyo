import { useRef, useEffect, useState } from 'react';
import { useImageLoader } from './hooks/useImageLoader';
import CoverImageControls from './components/CoverImageControls';
import { coverTemplates, coverLayouts } from './types';
import { useFontLoader, fontMapping } from '@/hooks/useFontLoader';

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

  // 跟踪渲染尝试次数
  const [renderAttempts, setRenderAttempts] = useState(0);

  // 使用字体加载检测
  const fontStatus = useFontLoader(selectedFont);

  // 使用 useImageLoader hook 加载封面图片
  const image = useImageLoader(coverImage);
  // 加载书脊 logo
  const spineLogo = useImageLoader('/assets/logos/spine-logo.png');
  // 加载条形码图像 - 更新路径
  const barcode = useImageLoader('/assets/logos/bar-code.png');
  // 加载 bestseller badge
  const bestsellerBadge = useImageLoader('/assets/badges/1badge.png');
  // 加载第二个 bestseller badge
  const bestsellerBadge2 = useImageLoader('/assets/badges/2badge.png');
  // 加载第三个 bestseller badge
  const bestsellerBadge3 = useImageLoader('/assets/badges/3badge.png');
  // 加载第四个 bestseller badge
  const bestsellerBadge4 = useImageLoader('/assets/badges/4badge.png');

  useEffect(() => {
    // If font is not yet loaded, delay rendering
    if (fontStatus === 'loading' && renderAttempts < 5) {
      console.log(`Waiting for font ${selectedFont} to load... Attempt ${renderAttempts + 1}/5`);
      const timer = setTimeout(() => {
        setRenderAttempts(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Font is loaded or max attempts reached, continue rendering
    if (fontStatus === 'loading') {
      console.warn(`Font ${selectedFont} failed to load, continuing with fallback font`);
    }

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

    // 根据字体加载状态选择正确的字体
    const resolvedFont = (fontStatus === 'loaded')
      ? fontMapping[selectedFont as keyof typeof fontMapping] || selectedFont
      : getFallbackFont(selectedFont);

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
  }, [coverTitle, subtitle, authorName, image, selectedFont, selectedTemplate, selectedLayout, category, imagePosition, imageScale, previewMode, scaleFactor, praises, fontStatus, renderAttempts]);

  // 获取后备字体
  const getFallbackFont = (font: string): string => {
    switch(font) {
      case 'merriweather':
        return 'Georgia, serif';
      case 'montserrat':
        return 'Arial, sans-serif';
      case 'inter':
        return 'Helvetica, sans-serif';
      case 'times':
        return 'serif';
      case 'anton':
        return 'Impact, "Arial Black", sans-serif';
      case 'oswald':
        return '"Arial Narrow", Arial, sans-serif';
      default:
        return 'sans-serif';
    }
  };

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
    // 获取正确的字体
    const resolvedFont = (fontStatus === 'loaded')
      ? fontMapping[selectedFont as keyof typeof fontMapping] || selectedFont
      : getFallbackFont(selectedFont);

    // Draw background
    if (template.id === 'classic') {
      // 先填充纯黑色背景
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // 只在底部三分之一区域添加黑红渐变
      const gradientHeight = height * 0.33; // 只占页面的三分之一
      const gradient = ctx.createLinearGradient(0, height - gradientHeight, 0, height);
      gradient.addColorStop(0, '#000000'); // 上部黑色
      gradient.addColorStop(1, '#9B0000'); // 底部深红色
      ctx.fillStyle = gradient;
      ctx.fillRect(0, height - gradientHeight, width, gradientHeight);

      // 在顶部添加金红色的细微星点效果
      const topParticleArea = height * 0.2; // 顶部区域高度
      const particleCount = 150; // 粒子数量

      // 创建从上到下的透明度渐变
      const particleGradient = ctx.createLinearGradient(0, 0, 0, topParticleArea);
      particleGradient.addColorStop(0, 'rgba(255, 100, 50, 0.4)'); // 顶部金红色，较高透明度
      particleGradient.addColorStop(1, 'rgba(255, 100, 50, 0)'); // 底部完全透明

      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * topParticleArea;
        const radius = Math.random() * 1.2 + 0.3; // 粒子半径在 0.3-1.5 之间

        // 根据粒子位置计算透明度
        const opacity = 0.4 * (1 - y / topParticleArea); // 越靠近顶部越不透明

        ctx.fillStyle = `rgba(255, ${100 + Math.random() * 50}, ${20 + Math.random() * 30}, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = template.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

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

          // 调整位置让图像正确显示 - 注意这里使用了像素值
          // 将 imagePosition 的范围 (-1 到 1) 转换为像素偏移
          const posX = imagePosition.x * containerWidth / 2; // 范围从 -containerWidth/2 到 containerWidth/2
          const posY = imagePosition.y * containerHeight / 2; // 范围从 -containerHeight/2 到 containerHeight/2
          console.log('应用图片位置调整:', imagePosition, '转换为像素偏移:', { posX, posY });
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
              y += 70; // 从100像素减少到70像素，减少下移量
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

            // 对于 minimal 和 classic 样式，不使用圆形裁剪
            if (template.id !== 'minimal' && template.id !== 'classic') {
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
              ctx.clip();
            }

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
            if (template.id === 'minimal') {
              // --- 实现真正的图片灰度化 ---
              const offscreenCanvas = document.createElement('canvas');
              const offscreenCtx = offscreenCanvas.getContext('2d');
              if (offscreenCtx && image.element) {
                offscreenCanvas.width = image.element.naturalWidth;
                offscreenCanvas.height = image.element.naturalHeight;
                offscreenCtx.drawImage(image.element, 0, 0);
                const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                const data = imageData.data;
                const contrastFactor = 1.2; // 对比度因子
                const threshold = 128; // 中间灰度值
                for (let i = 0; i < data.length; i += 4) {
                  const r = data[i];
                  const g = data[i + 1];
                  const b = data[i + 2];
                  // 计算原始灰度值
                  let grayscale = 0.299 * r + 0.587 * g + 0.114 * b;

                  // 应用对比度调整
                  grayscale = contrastFactor * (grayscale - threshold) + threshold;

                  // 确保值在 [0, 255] 范围内
                  grayscale = Math.max(0, Math.min(255, grayscale));

                  data[i] = grayscale;     // Red
                  data[i + 1] = grayscale; // Green
                  data[i + 2] = grayscale; // Blue
                  // Alpha (data[i + 3]) 保持不变
                }
                offscreenCtx.putImageData(imageData, 0, 0);
                ctx.drawImage(offscreenCanvas, x, drawY_adjusted, drawWidth, drawHeight);
              } else {
                ctx.drawImage(image.element, x, drawY_adjusted, drawWidth, drawHeight);
              }
              // --- 灰度化结束 ---
            } else {
              ctx.drawImage(image.element, x, drawY_adjusted, drawWidth, drawHeight);
            }

            // Restore context
            ctx.restore();
          } else {
            // Draw without clipping
            if (template.id === 'minimal') {
              // --- 实现真正的图片灰度化 ---
              const offscreenCanvas = document.createElement('canvas');
              const offscreenCtx = offscreenCanvas.getContext('2d');
              if (offscreenCtx && image.element) {
                offscreenCanvas.width = image.element.naturalWidth;
                offscreenCanvas.height = image.element.naturalHeight;
                offscreenCtx.drawImage(image.element, 0, 0);
                const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
                const data = imageData.data;
                const contrastFactor = 1.2;
                const threshold = 128;
                for (let i = 0; i < data.length; i += 4) {
                  let grayscale = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
                  grayscale = contrastFactor * (grayscale - threshold) + threshold;
                  grayscale = Math.max(0, Math.min(255, grayscale));
                  data[i] = data[i+1] = data[i+2] = grayscale;
                }
                offscreenCtx.putImageData(imageData, 0, 0);
                ctx.drawImage(offscreenCanvas, x, y, drawWidth, drawHeight);
              } else {
                ctx.drawImage(image.element, x, y, drawWidth, drawHeight);
              }
              // --- 灰度化结束 ---
            } else {
              ctx.drawImage(image.element, x, y, drawWidth, drawHeight);
            }
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
          if (template.id === 'minimal') {
            // --- 实现真正的图片灰度化 ---
            const offscreenCanvas = document.createElement('canvas');
            const offscreenCtx = offscreenCanvas.getContext('2d');
            if (offscreenCtx && image.element) {
              offscreenCanvas.width = image.element.naturalWidth;
              offscreenCanvas.height = image.element.naturalHeight;
              offscreenCtx.drawImage(image.element, 0, 0);
              const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
              const data = imageData.data;
              const contrastFactor = 1.2;
              const threshold = 128;
              for (let i = 0; i < data.length; i += 4) {
                let grayscale = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
                grayscale = contrastFactor * (grayscale - threshold) + threshold;
                grayscale = Math.max(0, Math.min(255, grayscale));
                data[i] = data[i+1] = data[i+2] = grayscale;
              }
              offscreenCtx.putImageData(imageData, 0, 0);
              ctx.drawImage(offscreenCanvas, x, y, drawWidth, drawHeight);
            } else {
              ctx.drawImage(image.element, x, y, drawWidth, drawHeight);
            }
            // --- 灰度化结束 ---
          } else {
            ctx.drawImage(image.element, x, y, drawWidth, drawHeight);
          }
          ctx.globalAlpha = 1.0;
          ctx.filter = 'none';
        }
      }
    }

    // 专门为Modern/Green风格添加自定义图片处理
    if (image?.element && (template.id === 'modern' || template.id === 'vibrant-green')) {
      // 计算图片区域 - 缩小第三种样式的照片
      const imgSizeMultiplier = 0.75; // 对所有样式使用相同的尺寸
      const imgSize = width * imgSizeMultiplier; // 图片大小为宽度的75%
      const centerX = width / 2;
      const centerY = height * 0.35; // 将图片中心点放在页面35%的位置

      // 应用图片位置调整 - 将范围从 -1~1 转换为像素偏移
      const posX = imagePosition.x * imgSize / 2; // 范围从 -imgSize/2 到 imgSize/2
      const posY = imagePosition.y * imgSize / 2; // 范围从 -imgSize/2 到 imgSize/2

      // 调整中心点位置
      const adjustedCenterX = centerX + posX;
      const adjustedCenterY = centerY + posY;

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

      // 应用缩放
      const scale = imageScale / 100;
      drawWidth *= scale;
      drawHeight *= scale;

      // 计算调整后的位置
      const x = adjustedCenterX - drawWidth / 2;
      const y = adjustedCenterY - drawHeight / 2;

      console.log('Modern/Green 风格图片调整:', { imagePosition, imageScale, posX, posY, x, y, drawWidth, drawHeight });

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

    // 专门为 Sweet Pink (pastel-beige) 风格添加自定义图片处理
    console.log('检查 Sweet Pink 风格图片处理:', {
      hasImage: !!image?.element,
      templateId: template.id,
      isSweetPink: template.id === 'pastel-beige',
      imagePosition,
      imageScale
    });

    // 强制处理 Sweet Pink 风格图片，无论 isSweetPink 变量是否正确
    if (image?.element && template.id === 'pastel-beige') {
      console.log('开始处理 Sweet Pink 风格图片');
      // 计算图片区域 - 使用更大的尺寸
      const imgSizeMultiplier = 0.95; // 对 Sweet Pink 样式使用更大的尺寸
      const imgSize = width * imgSizeMultiplier; // 图片大小为宽度的95%
      const centerX = width / 2;
      const centerY = height * 0.6; // 将图片中心点放在页面60%的位置，即下移到页面中部偏下

      // 应用图片位置调整 - 将范围从 -1~1 转换为像素偏移
      const posX = imagePosition.x * imgSize / 2; // 范围从 -imgSize/2 到 imgSize/2
      const posY = imagePosition.y * imgSize / 2; // 范围从 -imgSize/2 到 imgSize/2

      // 调整中心点位置
      const adjustedCenterX = centerX + posX;
      const adjustedCenterY = centerY + posY;

      // 不再使用圆形裁剪，直接显示矩形图片
      ctx.save(); // 保存上下文状态，但不进行裁剪

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

      // 应用缩放
      const scale = imageScale / 100;
      drawWidth *= scale;
      drawHeight *= scale;

      // 计算调整后的位置
      const x = adjustedCenterX - drawWidth / 2;
      const y = adjustedCenterY - drawHeight / 2;

      console.log('Sweet Pink 风格图片调整:', { imagePosition, imageScale, posX, posY, x, y, drawWidth, drawHeight });

      // 应用滤镜和透明度
      ctx.filter = 'none'; // 不使用滤镜
      ctx.globalAlpha = 0.9; // 设置透明度

      // 绘制图片
      ctx.drawImage(image.element, x, y, drawWidth, drawHeight);

      // 恢复上下文
      ctx.restore();
      ctx.globalAlpha = 1.0;
      ctx.filter = 'none';
    }

    // 如果是bestseller模板
    if (template.id === 'bestseller') {
      // 确保bestseller风格始终使用Oswald字体，而不是Anton（因为Anton加载不成功）
      // 文本自动换行函数
      const oswaldFont = (fontStatus === 'loaded')
        ? 'Oswald, sans-serif'
        : '"Arial Narrow", Arial, sans-serif';

      // 绘制科技星空背景
      // 将背景改为更黑的蓝黑色
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#050A14'); // 顶部更黑的蓝黑色
      bgGradient.addColorStop(1, '#0A1428'); // 底部稍浅的深蓝色
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // 在上半部添加蓝色高光效果 - 略微降低散射范围，使光源衰减更快
      const topGlow = ctx.createRadialGradient(
        width * 0.5, height * 0.3, 10,
        width * 0.5, height * 0.3, width * 1.6
      );
      topGlow.addColorStop(0, 'rgba(0, 120, 255, 0.3)');
      topGlow.addColorStop(0.5, 'rgba(0, 80, 200, 0.1)');
      topGlow.addColorStop(1, 'rgba(0, 0, 100, 0)');

      ctx.globalAlpha = 0.7;
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, width, height); // 扩大覆盖区域到整个封面

      // 恢复透明度
      ctx.globalAlpha = 1.0;

      // 添加金色星点效果
      ctx.fillStyle = '#FFC300'; // 改为金色
      const starCount = 100; // 星星数量
      for (let i = 0; i < starCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 1.5; // 随机星星大小
        const opacity = Math.random() * 0.8 + 0.2; // 随机透明度

        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 恢复透明度
      ctx.globalAlpha = 1.0;

      // 在顶部添加轻柔的金色粒子散射
      const particleCount = 30;
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height * 0.3; // 只在顶部30%区域
        const radius = Math.random() * 1.2;
        const opacity = Math.random() * 0.4; // 非常轻柔的透明度

        ctx.globalAlpha = opacity;
        ctx.fillStyle = '#FFD700'; // 金色
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 恢复透明度
      ctx.globalAlpha = 1.0;

      const titleFont = `bold 80px ${oswaldFont}`; // 使用Oswald字体替代Anton字体
      const titleColor = '#FFC300';
      const titleLineHeight = 100; // 大幅增加行高，从75增加到100
      const titleArea = { x: width * 0.1, y: height * 0.55, width: width * 0.8, height: height * 0.3 }; // Define title area

      // 直接添加作者名字
      ctx.font = `bold 36px ${oswaldFont}`; // 从30px放大到36px
      ctx.fillStyle = '#FFFFFF'; // 白色文字
      ctx.textAlign = 'center';
      ctx.fillText(authorName, width / 2, 80); // 位置从60下移到80

      // 在底部绘制蓝色渐变描述区域 - 增强科技感
      const blueHeight = height * 0.15; // 从0.2缩小到0.15

      // 创建下深上浅的蓝色渐变
      const blueGradient = ctx.createLinearGradient(0, height - blueHeight, 0, height);
      blueGradient.addColorStop(0, '#1A2A8F'); // 上方较浅的蓝色
      blueGradient.addColorStop(1, '#0A1428'); // 下方较深的蓝色

      ctx.fillStyle = blueGradient;
      ctx.fillRect(0, height - blueHeight, width, blueHeight);

      // 在底部蓝色区域添加金色星点
      ctx.fillStyle = '#FFC300'; // 改为金色
      const bottomStarCount = 15; // 底部星星数量
      for (let i = 0; i < bottomStarCount; i++) {
        const x = Math.random() * width;
        const y = (height - blueHeight) + (Math.random() * blueHeight);
        const radius = Math.random() * 1.2; // 随机星星大小
        const opacity = Math.random() * 0.7 + 0.2; // 随机透明度

        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 恢复透明度
      ctx.globalAlpha = 1.0;

      // Split title into lines (existing logic)
      const titleWords = coverTitle.split(' ');
      const titleLines = [];
      let currentLine = '';
      ctx.font = titleFont; // Set font for measurement
      for (let i = 0; i < titleWords.length; i++) {
        const word = titleWords[i];
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        ctx.font = titleFont; // Use base font for initial measurement
        const metrics = ctx.measureText(testLine.toUpperCase());
        ctx.font = titleFont; // Reset to base font for next check

        if (metrics.width > titleArea.width && currentLine !== '') {
          titleLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        titleLines.push(currentLine);
      }

      // 如果有图片，在背景效果之后绘制图片
      if (image?.element) {
        ctx.save();

        // 计算图片尺寸 - 进一步缩小图片
        const imgAspect = image.element.width / image.element.height;
        let drawWidth, drawHeight;
        const scaleFactor = 0.75; // 缩小图片至原始大小的75%

        // 让图片覆盖封面上部
        if (imgAspect > 1) {
          // 横向图片
          drawHeight = height * 0.5 * scaleFactor; // 高度设置为封面高度的50%
          drawWidth = drawHeight * imgAspect;
        } else {
          // 纵向图片
          drawWidth = width * scaleFactor;
          drawHeight = drawWidth / imgAspect;
        }

        // 应用缩放
        const scale = imageScale / 100;
        drawWidth *= scale;
        drawHeight *= scale;

        // 计算图片区域的中心点
        const centerX = width / 2;
        const centerY = height * 0.30; // 将图片中心点放在封面高度的30%处

        // 应用图片位置调整 - 将范围从 -1~1 转换为像素偏移
        const posX = imagePosition.x * width / 4; // 范围从 -width/4 到 width/4
        const posY = imagePosition.y * height / 4; // 范围从 -height/4 到 height/4

        // 调整中心点位置
        const adjustedCenterX = centerX + posX;
        const adjustedCenterY = centerY + posY;

        // 计算最终绘制位置
        const x = adjustedCenterX - drawWidth / 2;
        const y = adjustedCenterY - drawHeight / 2;

        console.log('Bestseller 风格图片调整:', { imagePosition, imageScale, posX, posY, x, y, drawWidth, drawHeight });

        // 应用滤镜和透明度
        ctx.filter = template.imageStyle.filter;
        ctx.globalAlpha = parseFloat(template.imageStyle.opacity) * 0.9; // 透明度调整为0.9

        // 绘制图片
        ctx.drawImage(image.element, x, y, drawWidth, drawHeight);

        // 恢复上下文
        ctx.restore();
      }

      // 直接绘制标题文本，不添加背景或光晕效果
      ctx.font = titleFont;
      ctx.fillStyle = titleColor;
      ctx.textAlign = 'center';

      const totalTitleHeight = titleLines.length * titleLineHeight;
      let currentY = titleArea.y + (titleArea.height - totalTitleHeight) / 2 + titleLineHeight * 0.8;

      for (let i = 0; i < titleLines.length; i++) {
        ctx.fillText(titleLines[i].toUpperCase(), titleArea.x + titleArea.width / 2, currentY);
        currentY += titleLineHeight;
      }

      // 绘制描述性副标题在蓝色区域
      const subtitleFont = `500 26px ${oswaldFont}`; // 恢复bestseller样式的原始字体
      const subtitleColor = '#FFC300';
      
      // 渲染第二个 Bestseller badge
      if (bestsellerBadge2?.element) {
        ctx.save();
        
        // 计算合适的大小
        const badgeWidth = width * 0.275; // 封面宽度的27.5%，再放大 10%
        const badgeHeight = badgeWidth * (bestsellerBadge2.element.height / bestsellerBadge2.element.width);
        
        // 定位在右上角
        const badgeX = width * 0.82;
        const badgeY = height * 0.15; // 从 0.25 上移到 0.2，上移 0.05
        
        // 旋转和亮度调整
        ctx.translate(badgeX, badgeY);
        ctx.rotate(15 * Math.PI / 180); // 顺时针旋转15度
        ctx.filter = 'brightness(1.1)'; // 增加10%亮度
        
        // 绘制徽章
        ctx.drawImage(
          bestsellerBadge2.element,
          -badgeWidth / 2, // 以中心点为基准定位
          -badgeHeight / 2,
          badgeWidth,
          badgeHeight
        );
        
        // 恢复上下文状态
        ctx.restore();
      }
      const subtitleLineHeight = 34; // 从32增加到34，略微增加行距
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
      const titleFont = `bold 52px ${resolvedFont}`; // Base font for measurement
      const titleColor = '#FFFFFF';
      const normalLineHeight = 70; // 缩小白色部分的行距
      const largeLineHeight = 90; // 保持与红色部分的行距
      const titleArea = { x: width * 0.1, y: height * 0.02, width: width * 0.8, height: height * 0.4 }; // 再次上移标题区域 (y from 0.1 to 0.02, height adjusted)

      // Split title into lines with adaptive font size for measurement
      const titleWords = coverTitle.split(' ');
      const maxLineWidth = titleArea.width;
      const titleLines = [];
      let currentLine = '';

      // 估计前半部分的行数（用于放宽前半部分的换行要求）
      const estimatedTotalLines = Math.ceil(coverTitle.length / 15); // 粗略估计总行数
      const estimatedMidpoint = Math.ceil(estimatedTotalLines / 2);

      ctx.font = titleFont; // Use base font for initial measurement
      for (let i = 0; i < titleWords.length; i++) {
        const word = titleWords[i];
        const testLine = currentLine + (currentLine ? ' ' : '') + word;

        // 根据当前行数决定使用哪种字体进行测量
        // 如果当前行数小于估计的中点，使用较小字体进行测量
        // 否则使用最大字体进行测量
        if (titleLines.length < estimatedMidpoint) {
          ctx.font = `bold 54px ${resolvedFont}`; // 使用前半部分的较小字体进行测量
        } else {
          ctx.font = `bold 80px ${resolvedFont}`; // 使用后半部分的较大字体进行测量
        }

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
      // 确保至少有一行文字在红色背景部分
      let midpoint;
      if (titleLines.length === 1) {
        // 如果只有一行，强制分成两部分：白色和红色
        midpoint = 0; // 所有行都使用红色
      } else if (titleLines.length === 2) {
        // 如果有两行，第一行白色，第二行红色
        midpoint = 1;
      } else {
        // 如果有三行或更多，大约一半使用白色，一半使用红色
        midpoint = Math.ceil(titleLines.length / 2);
      }

      const whiteLinesHeight = (midpoint > 0 ? (midpoint - 1) * normalLineHeight : 0);
      const redLinesHeight = (titleLines.length - midpoint > 0 ? (titleLines.length - midpoint) * largeLineHeight : 0);
      // Adjust total height calculation for mixed line heights
      const textBlockHeight = whiteLinesHeight + redLinesHeight + (midpoint > 0 && titleLines.length - midpoint > 0 ? largeLineHeight : 0); // Add transition gap

      let startY = titleArea.y + (titleArea.height - textBlockHeight) / 2;
      startY = Math.max(titleArea.y, startY);
      ctx.textAlign = 'center';
      let currentY = startY;

      // 如果只有一行文字，将其分成两部分：白色和红色
      if (titleLines.length === 1) {
        const lineText = titleLines[0].toUpperCase();
        const words = lineText.split(' ');

        if (words.length === 1) {
          // 如果只有一个单词，将其一半显示为白色，一半显示为红色
          const halfIndex = Math.ceil(lineText.length / 2);
          const firstHalf = lineText.substring(0, halfIndex);
          const secondHalf = lineText.substring(halfIndex);

          // 绘制第一部分（白色）
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold 54px ${resolvedFont}`;
          ctx.fillText(firstHalf, titleArea.x + titleArea.width / 2, currentY);

          // 绘制第二部分（红色）
          ctx.fillStyle = '#CE1F1F';
          ctx.font = `bold 80px ${resolvedFont}`;
          currentY += largeLineHeight;
          ctx.fillText(secondHalf, titleArea.x + titleArea.width / 2, currentY);
        } else {
          // 如果有多个单词，将前半部分单词显示为白色，后半部分显示为红色
          const halfIndex = Math.ceil(words.length / 2);
          const firstHalf = words.slice(0, halfIndex).join(' ');
          const secondHalf = words.slice(halfIndex).join(' ');

          // 绘制第一部分（白色）
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold 54px ${resolvedFont}`;
          ctx.fillText(firstHalf, titleArea.x + titleArea.width / 2, currentY);

          // 绘制第二部分（红色）
          ctx.fillStyle = '#CE1F1F';
          ctx.font = `bold 80px ${resolvedFont}`;
          currentY += largeLineHeight;
          ctx.fillText(secondHalf, titleArea.x + titleArea.width / 2, currentY);
        }
      } else {
        // 多行文字的处理
        for (let i = 0; i < titleLines.length; i++) {
            const lineText = titleLines[i].toUpperCase();
            let effectiveLineHeight = largeLineHeight; // Default to large

            if (i < midpoint) {
                ctx.fillStyle = '#FFFFFF';
                ctx.font = `bold 54px ${resolvedFont}`;
                if (i < midpoint - 1) { // Use smaller lineHeight for lines before the last white one
                  effectiveLineHeight = normalLineHeight;
                }
                // The transition from white to red uses largeLineHeight
            } else {
                ctx.fillStyle = '#CE1F1F';
                ctx.font = `bold 80px ${resolvedFont}`;
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
      }

      // 绘制红色底部区域
      const bottomHeight = height * (template.bottomAreaHeight || 0.15);
      ctx.fillStyle = template.bottomAreaColor || '#9B0000';
      ctx.fillRect(0, height - bottomHeight, width, bottomHeight);

      // 在红色区域绘制白色描述文字
      const subtitleFont = template.id === 'classic'
        ? `italic 26px ${resolvedFont}` // 只有classic样式使用斜体字体
        : `normal 26px ${resolvedFont}`;
      const subtitleColor = '#FFFFFF';
      const subtitleLineHeight = 34; // 从32增加到34，略微增加行距
      const subtitleArea = { x: width * 0.075, y: height - bottomHeight, width: width * 0.85, height: bottomHeight };
      ctx.font = subtitleFont;
      const availableWidth = subtitleArea.width;
      const lines = wrapText(ctx, subtitle, 0, 0, availableWidth, subtitleLineHeight);
      drawTextInArea(ctx, lines, subtitleArea, subtitleFont, subtitleColor, subtitleLineHeight, 'center');

      // 在右下角红色区域上方绘制作者名
      ctx.font = `bold 30px ${resolvedFont}`; // Smaller font for author
      ctx.fillStyle = '#FFFFFF'; // White color
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom'; // Align to the bottom
      ctx.fillText(authorName, width - (width * 0.075), height - bottomHeight - 10); // Position right-aligned, 10px above red area
      
      // 渲染 Bestseller badge
      if (bestsellerBadge?.element) {
        ctx.save();
        
        // 计算合适的大小
        const badgeWidth = width * 0.25; // 封面宽度的24.2%，再增加 10%
        const badgeHeight = badgeWidth * (bestsellerBadge.element.height / bestsellerBadge.element.width);
        
        // 定位在书名下方
        const badgeX = width * 0.82; // 右侧偏移更多，从 0.75 增加到 0.82
        const badgeY = height * 0.27; // 上方四分之一处
        
        // 旋转和亮度调整
        ctx.translate(badgeX, badgeY);
        ctx.rotate(15 * Math.PI / 180); // 顺时针旋转15度
        ctx.filter = 'brightness(1.1)'; // 增加10%亮度
        
        // 绘制徽章
        ctx.drawImage(
          bestsellerBadge.element,
          -badgeWidth / 2, // 以中心点为基准定位
          -badgeHeight / 2,
          badgeWidth,
          badgeHeight
        );
        
        // 恢复上下文状态
        ctx.restore();
      }
    } else if (template.id === 'modern' || template.id === 'vibrant-green') {
      // 为奶油色肖像风格重写渲染逻辑

      // 添加顶部淡金渐变光晕和粒子效果
      const topGradient = ctx.createLinearGradient(0, 0, 0, height * 0.4);
      topGradient.addColorStop(0, 'rgba(255, 215, 150, 0.3)');
      topGradient.addColorStop(0.5, 'rgba(255, 200, 120, 0.15)');
      topGradient.addColorStop(1, 'rgba(255, 180, 100, 0)');

      ctx.fillStyle = topGradient;
      ctx.fillRect(0, 0, width, height * 0.4);

      // 添加粒子效果（模拟粉尘或书页反光）
      ctx.fillStyle = 'rgba(255, 230, 180, 0.6)';
      const particleCount = 40;
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height * 0.4; // 只在顶部区域
        const radius = Math.random() * 1.5 + 0.5; // 粒子大小
        const opacity = Math.random() * 0.4 + 0.1; // 透明度

        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 恢复透明度
      ctx.globalAlpha = 1.0;

      // 顶部绘制作者名字
      ctx.font = `bold 42px ${resolvedFont}`; // 添加粗体
      ctx.fillStyle = '#A3896B'; // 将白色改为棕褐色
      ctx.textAlign = 'center';
      ctx.fillText(authorName.toUpperCase(), width / 2, 90); // Y位置从70下移到90

      // 封面中央绘制大号金色标题
      const titleFont = `bold 70px ${resolvedFont}`;
      const titleColor = '#D7B33E'; // 使用更柔和的金铜色调
      const titleLineHeight = 90;
      const titleArea = { x: width * 0.1, y: height * 0.6, width: width * 0.8, height: height * 0.25 }; // 下移标题区域 (y from 0.5 to 0.6, height adjusted)

      // Wrap title text
      ctx.font = titleFont; // Set font for measurement
      const titleWords = coverTitle.split(' ');
      const titleLines = [];
      let currentLine = '';
      for (let i = 0; i < titleWords.length; i++) {
        if (currentLine.length + titleWords[i].length > 15) { // 15 char limit
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

      // 在底部添加奶茶渐变区域
      const bottomHeight = height * 0.2;
      const milkTeaGradient = ctx.createLinearGradient(0, height - bottomHeight, 0, height);
      milkTeaGradient.addColorStop(0, 'rgba(163, 137, 107, 0)');
      milkTeaGradient.addColorStop(0.3, 'rgba(163, 137, 107, 0.1)');
      milkTeaGradient.addColorStop(1, 'rgba(163, 137, 107, 0.25)');

      ctx.fillStyle = milkTeaGradient;
      ctx.fillRect(0, height - bottomHeight, width, bottomHeight);

      // 在底部绘制副标题
      const subtitleFont = `normal 26px ${resolvedFont}`; // 从28px减小到26px (折中方案)
      const subtitleColor = '#A3896B'; // 将白色改为棕褐色
      const subtitleLineHeight = 34; // 从36减小到34
      const subtitleArea = { x: width * 0.075, y: height * 0.81, width: width * 0.85, height: height * 0.15 }; // 位置从0.82调整到0.81

      // Wrap subtitle text
      ctx.font = subtitleFont; // Set font for measurement
      const availableWidth = subtitleArea.width;
      const lines = wrapText(ctx, subtitle, 0, 0, availableWidth, subtitleLineHeight);

      // Draw subtitle using helper function
      drawTextInArea(ctx, lines, subtitleArea, subtitleFont, subtitleColor, subtitleLineHeight, 'center');
      
      // 渲染第三个 Bestseller badge
      if (bestsellerBadge3?.element) {
        ctx.save();
        
        // 计算合适的大小
        const badgeWidth = width * 0.275; // 封面宽度的27.5%
        const badgeHeight = badgeWidth * (bestsellerBadge3.element.height / bestsellerBadge3.element.width);
        
        // 定位在右上角
        const badgeX = width * 0.82;
        const badgeY = height * 0.15;
        
        // 亮度调整，但不旋转
        ctx.filter = 'brightness(1.1)'; // 增加10%亮度
        
        // 绘制徽章
        ctx.drawImage(
          bestsellerBadge3.element,
          badgeX - badgeWidth / 2, // 以中心点为基准定位
          badgeY - badgeHeight / 2,
          badgeWidth,
          badgeHeight
        );
        
        // 恢复上下文状态
        ctx.restore();
      }
    } else if (template.id === 'minimal') {
      // 使用安全的字体代替可能加载失败的Montserrat
      const montserratFont = (fontStatus === 'loaded')
        ? 'Montserrat, sans-serif'
        : 'Arial, Helvetica, sans-serif';

      // 添加顶部逐渐变灰的渐变，比原来更灰一些
      const topGrayGradient = ctx.createLinearGradient(0, 0, 0, height * 0.33);
      topGrayGradient.addColorStop(0, '#E3E3E3'); // 在白色和灰色之间的折中颜色
      topGrayGradient.addColorStop(1, 'rgba(227, 227, 227, 0)'); // 逐渐透明

      ctx.fillStyle = topGrayGradient;
      ctx.fillRect(0, 0, width, height * 0.33); // 顶部1/3区域

      // 添加像素颜粒纹理
      ctx.globalAlpha = 0.05; // 非常淡的颜粒
      for (let i = 0; i < width * height * 0.01; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.5;
        ctx.fillStyle = Math.random() > 0.5 ? '#FFFFFF' : '#000000';
        ctx.fillRect(x, y, size, size);
      }
      ctx.globalAlpha = 1.0;

      // 左上角绘制作者名字
      ctx.font = `bold 60px ${montserratFont}`;
      ctx.fillStyle = '#FFFFFF'; // 设置作者名称为白色

      // 为minimal样式的作者名添加阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillText(authorName, 60, 100); // 从50增加到60，增加左边距

      // 重置阴影
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 左对齐绘制标题
      const titleFont = `bold 70px ${montserratFont}`; // 从75px缩小到70px
      const titleColor = '#FFFFFF';
      const titleLineHeight = 80; // 从85减小到80，以匹配更小的字体
      const titleArea = { x: 60, y: height * 0.62, width: width - 120, height: height * 0.25 }; // 从x:50增加到x:60，width从width-100减小到width-120

      // Wrap title text
      ctx.font = titleFont; // Set font for measurement
      const titleWords = coverTitle.split(' ');
      const maxLineWidth = titleArea.width;
      const titleLines = [];
      let currentLine = '';
      for (let i = 0; i < titleWords.length; i++) {
        if (currentLine.length + titleWords[i].length > 15) { // 15 char limit
          titleLines.push(currentLine.trim());
          currentLine = titleWords[i] + ' ';
        } else {
          currentLine += titleWords[i] + ' ';
        }
      }
      if (currentLine.trim() !== '') {
        titleLines.push(currentLine.trim());
      }

      // 为minimal样式的标题添加阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Draw title using helper function, left-aligned
      drawTextInArea(ctx, titleLines.map(line => line.toUpperCase()), titleArea, titleFont, titleColor, titleLineHeight, 'left');

      // 重置阴影
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 左对齐绘制描述文字
      const subtitleFont = `300 26px ${montserratFont}`; // 从28px减小到26px (折中方案)
      const subtitleColor = '#FFFFFF';
      const subtitleLineHeight = 36; // 保持36
      const subtitleArea = { x: 60, y: height * 0.85, width: width - 120, height: height * 0.1 }; // 从x:50增加到x:60，width从width-100减小到width-120

      // Wrap subtitle text
      ctx.font = subtitleFont; // Set font for measurement
      const availableWidth = subtitleArea.width;
      const lines = wrapText(ctx, subtitle, 0, 0, availableWidth, subtitleLineHeight);

      // 为minimal样式的副标题添加阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Draw subtitle using helper function, left-aligned
      drawTextInArea(ctx, lines, subtitleArea, subtitleFont, subtitleColor, subtitleLineHeight, 'left');

      // 重置阴影
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // 渲染第四个 Bestseller badge
      if (bestsellerBadge4?.element) {
        ctx.save();
        
        // 计算合适的大小
        const badgeWidth = width * 0.275; // 封面宽度的27.5%
        const badgeHeight = badgeWidth * (bestsellerBadge4.element.height / bestsellerBadge4.element.width);
        
        // 定位在右上角
        const badgeX = width * 0.82;
        const badgeY = height * 0.15;
        
        // 亮度调整，但不旋转
        ctx.filter = 'brightness(1.1)'; // 增加10%亮度
        
        // 绘制徽章
        ctx.drawImage(
          bestsellerBadge4.element,
          badgeX - badgeWidth / 2, // 以中心点为基准定位
          badgeY - badgeHeight / 2,
          badgeWidth,
          badgeHeight
        );
        
        // 恢复上下文状态
        ctx.restore();
      }
    } else if (template.id === 'pastel-beige') {
      // 使用安全的字体代替可能加载失败的Comic Sans MS
      const comicFont = (fontStatus === 'loaded')
        ? "'Comic Sans MS', cursive"
        : "'Arial Rounded MT Bold', 'Arial', sans-serif";

      // 可爱粉色风格布局

      // 添加顶部渐变：淡紫 → 粉色（天空感 + 层次感）
      const topGradient = ctx.createLinearGradient(0, 0, 0, height * 0.33);
      topGradient.addColorStop(0, '#EBD8FF'); // 淡紫色
      topGradient.addColorStop(1, '#FFC0CB'); // 原始的粉色 #FFC0CB

      ctx.fillStyle = topGradient;
      ctx.fillRect(0, 0, width, height * 0.33);

      // 添加底部渐变：粉 → 樱花白 - 从1/3处开始而不是2/3
      const bottomGradient = ctx.createLinearGradient(0, height * 0.33, 0, height);
      bottomGradient.addColorStop(0, '#FFC0CB'); // 原始的粉色 #FFC0CB
      bottomGradient.addColorStop(1, '#FFEFF4'); // 樱花白

      ctx.fillStyle = bottomGradient;
      ctx.fillRect(0, height * 0.33, width, height * 0.67);

      // ========== 图片绘制代码块（从原位置移动到此处） ==========
      if (image?.element) {
        // 检查是否已经在前面绘制了图片
        console.log('备用图片绘制代码执行中...');

        // 计算图片区域 - 使用更大的尺寸
        const imgSizeMultiplier = 0.95; // 对 Sweet Pink 样式使用更大的尺寸
        const imgSize = width * imgSizeMultiplier; // 图片大小为宽度的95%
        const centerX = width / 2;
        const centerY = height * 0.6; // 将图片中心点放在页面60%的位置，即下移到页面中部偏下

        // 应用图片位置调整 - 将范围从 -1~1 转换为像素偏移
        const posX = imagePosition.x * imgSize / 2; // 范围从 -imgSize/2 到 imgSize/2
        const posY = imagePosition.y * imgSize / 2; // 范围从 -imgSize/2 到 imgSize/2

        // 调整中心点位置
        const adjustedCenterX = centerX + posX;
        const adjustedCenterY = centerY + posY;

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

        // 应用缩放
        const scale = imageScale / 100;
        drawWidth *= scale;
        drawHeight *= scale;

        // 计算最终绘制位置
        const x = adjustedCenterX - drawWidth / 2;
        const y = adjustedCenterY - drawHeight / 2;

        console.log('备用 Sweet Pink 风格图片调整:', { imagePosition, imageScale, posX, posY, x, y, drawWidth, drawHeight });

        // 不再使用圆形裁剪，直接显示矩形图片
        ctx.save(); // 保存上下文状态，但不进行裁剪

        // 绘制图片
        ctx.drawImage(image.element, x, y, drawWidth, drawHeight);

        // 恢复上下文
        ctx.restore();
      }
      // ========== 图片绘制代码块结束 ==========

      // 添加更多星星装饰
      ctx.fillStyle = '#FFF2B3'; // 更浅的黄色星星

      // 绘制四角星函数 - 旋转45度
      function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (i * 2 * Math.PI) / 4; // 四角星角度 - 旋转45度
          const outerX = x + size * Math.cos(angle);
          const outerY = y + size * Math.sin(angle);
          if (i === 0) {
            ctx.moveTo(outerX, outerY);
          } else {
            ctx.lineTo(outerX, outerY);
          }
          const innerAngle = angle + Math.PI / 4; // 四角星内角度
          const innerX = x + size * 0.4 * Math.cos(innerAngle);
          const innerY = y + size * 0.4 * Math.sin(innerAngle);
          ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
      }

      // 添加多个星星 - 减小星星大小
      drawStar(ctx, 80, 60, 12); // 左上角
      drawStar(ctx, width - 100, 80, 10); // 右上角
      drawStar(ctx, 150, height - 150, 12); // 左下角
      drawStar(ctx, width - 150, height - 200, 12); // 右下角
      drawStar(ctx, width / 2 - 100, 120, 8); // 上方中间
      drawStar(ctx, width / 2 + 150, 200, 8); // 上方中间 - 放大到 8

      // 绘制云朵
      ctx.fillStyle = '#FFFFFF'; // 白色云朵
      function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.6, y - size * 0.3, size * 0.7, 0, Math.PI * 2);
        ctx.arc(x + size * 1.1, y, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      drawCloud(ctx, 100, 100, 50); // 左上角云朵
      drawCloud(ctx, width - 100, 120, 40); // 右上角云朵

      // 上部绘制标题 - 向上移动 0.02
      const titleFont = `bold 65px ${comicFont}`;
      const titleColor = '#8A2BE2'; // Purple title
      const titleLineHeight = 70;
      const titleArea = { x: width * 0.1, y: height * 0.08, width: width * 0.8, height: height * 0.25 }; // 从 0.1 移动到 0.08

      // Wrap title text
      ctx.font = titleFont; // Set font for measurement
      const titleWords = coverTitle.split(' ');
      const titleLines = [];
      let currentLine = '';
      for (let i = 0; i < titleWords.length; i++) {
        if (currentLine.length + titleWords[i].length > 15) { // 15 char limit
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
      drawTextInArea(ctx, titleLines.map(line => line.toUpperCase()), titleArea, titleFont, titleColor, titleLineHeight, 'center');

      // 标题下方描述 - 向上移动 0.02
      const subtitleFont = `normal 26px ${comicFont}`; // 从28px减小到26px (折中方案)
      const subtitleColor = '#9400D3'; // Dark purple text
      const subtitleLineHeight = 33; // 从35减小到33 (折中方案)
      const subtitleArea = { x: width * 0.1, y: height * 0.25, width: width * 0.8, height: height * 0.15 }; // 从 0.27 移动到 0.25

      // Wrap subtitle text
      ctx.font = subtitleFont; // Set font for measurement
      const availableWidth = subtitleArea.width;
      const lines = wrapText(ctx, subtitle, 0, 0, availableWidth, subtitleLineHeight);

      // Draw subtitle using helper function
      drawTextInArea(ctx, lines, subtitleArea, subtitleFont, subtitleColor, subtitleLineHeight, 'center');

      // Draw author name - 再向上移动一点
      ctx.font = `bold 35px ${comicFont}`;
      ctx.fillStyle = '#8A2BE2'; // Purple text
      ctx.textAlign = 'right'; // 右对齐
      ctx.fillText(authorName, width - 80, height - 120); // 再向上移动一点
    } else {
      // 原有的标准封面绘制逻辑
      // Add a semi-transparent overlay
      ctx.fillStyle = `${template.backgroundColor}33`; // 20% opacity
      ctx.fillRect(0, 0, width, height);

      // Draw author name using layout configuration
      ctx.font = `bold 48px ${resolvedFont}`;
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
      ctx.font = `bold 48px ${resolvedFont}`;
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
      ctx.font = `18px ${resolvedFont}`;
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
    // 获取正确的字体
    const resolvedFont = (fontStatus === 'loaded')
      ? fontMapping[selectedFont as keyof typeof fontMapping] || selectedFont
      : getFallbackFont(selectedFont);

    // 设置背景色
    if (template.id === 'classic') {
      // 对于 classic 样式，先填充纯黑色背景
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // 只在底部三分之一区域添加黑红渐变
      const gradientHeight = height * 0.33; // 只占页面的三分之一
      const spineGradient = ctx.createLinearGradient(0, height - gradientHeight, 0, height);
      spineGradient.addColorStop(0, '#000000'); // 上部黑色
      spineGradient.addColorStop(1, '#9B0000'); // 底部深红色
      ctx.fillStyle = spineGradient;
      ctx.fillRect(0, height - gradientHeight, width, gradientHeight);

      // 在顶部添加金红色的细微星点效果
      const topParticleArea = height * 0.2; // 顶部区域高度
      const particleCount = 80; // 粒子数量 - 书脉宽度小，所以减少粒子数量

      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * topParticleArea;
        const radius = Math.random() * 0.8 + 0.2; // 粒子半径在 0.2-1.0 之间，比封面的粒子小

        // 根据粒子位置计算透明度
        const opacity = 0.4 * (1 - y / topParticleArea); // 越靠近顶部越不透明

        ctx.fillStyle = `rgba(255, ${100 + Math.random() * 50}, ${20 + Math.random() * 30}, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (template.id === 'minimal') {
      // 对于 minimal 样式，使用纯黑色作为 spine 背景
      ctx.fillStyle = '#000000';
    } else if (template.id === 'bestseller') {
      // 对于 bestseller 样式，使用更黑的星空渐变作为 spine 背景
      const spineGradient = ctx.createLinearGradient(0, 0, 0, height);
      spineGradient.addColorStop(0, '#050A14'); // 上方更黑的蓝黑色
      spineGradient.addColorStop(1, '#0A1428'); // 下方稍浅的深蓝色
      ctx.fillStyle = spineGradient;

      // 绘制背景
      ctx.fillRect(0, 0, width, height);

      // 在spine中部添加蓝色高光效果
      const spineGlow = ctx.createRadialGradient(
        width * 0.5, height * 0.5, 5,
        width * 0.5, height * 0.5, width * 1.2
      );
      spineGlow.addColorStop(0, 'rgba(0, 120, 255, 0.3)');
      spineGlow.addColorStop(0.5, 'rgba(0, 80, 200, 0.1)');
      spineGlow.addColorStop(1, 'rgba(0, 0, 100, 0)');

      ctx.globalAlpha = 0.6;
      ctx.fillStyle = spineGlow;
      ctx.fillRect(0, 0, width, height);

      // 添加金色星点效果
      ctx.fillStyle = '#FFC300'; // 改为金色
      const starCount = 30; // 星星数量，在spine上减少数量
      for (let i = 0; i < starCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 1.2; // 随机星星大小
        const opacity = Math.random() * 0.7 + 0.2; // 随机透明度

        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 恢复透明度
      ctx.globalAlpha = 1.0;
    } else if (template.id === 'modern' || template.id === 'vibrant-green') {
      // 对于 vibrant-green 样式，添加淡金渐变和奶茶渐变
      ctx.fillStyle = template.backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // 添加顶部淡金渐变光晕
      const topGradient = ctx.createLinearGradient(0, 0, 0, height * 0.4);
      topGradient.addColorStop(0, 'rgba(255, 215, 150, 0.3)');
      topGradient.addColorStop(0.5, 'rgba(255, 200, 120, 0.15)');
      topGradient.addColorStop(1, 'rgba(255, 180, 100, 0)');

      ctx.fillStyle = topGradient;
      ctx.fillRect(0, 0, width, height * 0.4);

      // 添加粒子效果（模拟粉尘或书页反光）
      ctx.fillStyle = 'rgba(255, 230, 180, 0.6)';
      const particleCount = 20;
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height * 0.4; // 只在顶部区域
        const radius = Math.random() * 1.5 + 0.5; // 粒子大小
        const opacity = Math.random() * 0.4 + 0.1; // 透明度

        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 在底部添加奶茶渐变区域
      const bottomHeight = height * 0.2;
      const milkTeaGradient = ctx.createLinearGradient(0, height - bottomHeight, 0, height);
      milkTeaGradient.addColorStop(0, 'rgba(163, 137, 107, 0)');
      milkTeaGradient.addColorStop(0.3, 'rgba(163, 137, 107, 0.1)');
      milkTeaGradient.addColorStop(1, 'rgba(163, 137, 107, 0.25)');

      ctx.fillStyle = milkTeaGradient;
      ctx.fillRect(0, height - bottomHeight, width, bottomHeight);

      // 恢复透明度
      ctx.globalAlpha = 1.0;
    } else if (template.id === 'pastel-beige') {
      // 为第五种样式的书脉添加柔亮竖向渐变 - 降低紫色程度，更接近粉色
      const spineGradient = ctx.createLinearGradient(0, 0, width, 0);
      spineGradient.addColorStop(0, '#E78FC1'); // 更接近粉色的淡紫色
      spineGradient.addColorStop(1, '#FFC0CB'); // 原始粉色

      ctx.fillStyle = spineGradient;
      ctx.fillRect(0, 0, width, height);

      // 添加星星装饰
      ctx.fillStyle = '#FFFFFF';
      // 移除spine上的星星装饰
    } else {
      ctx.fillStyle = template.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // 设置文本属性
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Position for vertical text (centered horizontally, starting from top)
    const centerX = width / 2;

    // --- 强制使用等宽字体以获得均匀间距 ---
    const spineFontFamily = template.id === 'classic' ? "'Fira Mono', monospace" : 'monospace'; // Classic样式使用Fira Mono
    const spineFontSize = template.spineStyle.titleFontSize || 40; // 可以调整字体大小
    const spineFontWeight = (template.id === 'minimal') ? '500' : 'bold';
    ctx.font = `${spineFontWeight} ${spineFontSize}px ${spineFontFamily}`;
    // --- 结束强制字体 ---

    // 为 logo 预留空间
    const logoHeight = 50;
    const logoMargin = 15;

    // 处理作者名称：首字母大写，其余小写
    const authorWords = authorName.split(' ');
    const formattedAuthorWords = authorWords.map(word => {
      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    const formattedAuthorName = formattedAuthorWords.join(' ');
    const authorChars = formattedAuthorName.split('');

    // 计算作者名称的总高度
    const authorFontSize = template.spineStyle.authorFontSize || 24;
    const authorCharSpacing = authorFontSize * (template.spineStyle.charSpacing || 1.0); // 从0.75增加到1.0，使作者名字间距适度宽松
    const authorHeight = authorChars.length * authorCharSpacing;

    // 将作者名称放在顶部，大幅减小边距使其更靠近顶部
    const topMargin = 80; // 从130减小到80，使作者名称大幅上移
    let authorStartY = topMargin;

    // Draw each character of the author name vertically with rotation
    // 如果是vibrant-green样式，使用棕褐色
    if (template.id === 'vibrant-green') {
      ctx.fillStyle = '#A3896B';
    } else {
      ctx.fillStyle = template.spineStyle.authorColor || '#FFFFFF';
    }

    authorChars.forEach(char => {
      ctx.save();
      ctx.translate(centerX, authorStartY);
      ctx.rotate(Math.PI / 2); // Rotate 90 degrees clockwise
      ctx.fillText(char, 0, 0);
      ctx.restore();

      // 使用模板中的字符间距配置
      authorStartY += Math.round(authorCharSpacing);
    });

    // 计算标题字符数和预计高度
    const titleChars = coverTitle.toUpperCase().split('');
    // 使用非常小的字符间距，使字体密集排列
    const charSpacingMultiplier = 0.7; // 为等宽字体调整间距因子
    const charSpacing = Math.round(spineFontSize * charSpacingMultiplier);

    // 计算标题总高度
    const titleHeight = titleChars.length * charSpacing;

    // 计算脊柱中心位置
    const spineCenter = height / 2;

    // 计算标题起始位置，使其在可用空间内居中
    // 标题位于脊柱中心位置
    let currentY = spineCenter - (titleHeight / 2);

    // 确保标题不会与作者名重叠
    const authorEndY = authorStartY + 20; // 作者名结束位置加一些间距
    if (currentY < authorEndY) {
      currentY = authorEndY;
    }

    // Draw title vertically, with each character rotated 90 degrees
    ctx.fillStyle = template.spineStyle.titleColor || '#7CFC00';

    // 计算 logo 位置 - logo 应该在底部，但略微下移
    const logoY = height - logoHeight - logoMargin - 80; // 从100减小到80，使logo略微下移

    // 计算可用空间 (从作者名称结束到 logo 位置)
    const availableSpaceForTitle = logoY - authorEndY - 20; // 在 logo 上方留出 20px 的空间

    // If title is too long, we need to truncate it
    let charsToShow = titleChars;
    if (titleHeight > availableSpaceForTitle) {
      // Calculate how many characters can fit
      const maxChars = Math.floor(availableSpaceForTitle / charSpacing);
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
      // 将 logo 宽度缩减为原来的 80%，但保持高度不变
      const originalLogoWidth = Math.min(width - 4, 60); // 原始限制宽度
      const originalLogoHeight = originalLogoWidth / (spineLogo.element.width / spineLogo.element.height); // 原始高度

      // 新的宽度为原来的 80%，但高度保持不变
      const logoWidth = originalLogoWidth * 0.8; // 缩减为原来的 80%
      const logoHeight = originalLogoHeight; // 高度保持不变

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
        logoHeight
      );
    }
  };

  const drawBackCover = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    template: any
  ) => {
    // 获取正确的字体
    const resolvedFont = (fontStatus === 'loaded')
      ? fontMapping[selectedFont as keyof typeof fontMapping] || selectedFont
      : getFallbackFont(selectedFont);

    // 设置背景色
    if (template.id === 'classic') {
      // 对于 classic 样式，先填充纯黑色背景
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // 只在底部三分之一区域添加黑红渐变
      const gradientHeight = height * 0.33; // 只占页面的三分之一
      const backGradient = ctx.createLinearGradient(0, height - gradientHeight, 0, height);
      backGradient.addColorStop(0, '#000000'); // 上部黑色
      backGradient.addColorStop(1, '#9B0000'); // 底部深红色
      ctx.fillStyle = backGradient;
      ctx.fillRect(0, height - gradientHeight, width, gradientHeight);

      // 在顶部添加金红色的细微星点效果
      const topParticleArea = height * 0.2; // 顶部区域高度
      const particleCount = 150; // 粒子数量

      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * topParticleArea;
        const radius = Math.random() * 1.2 + 0.3; // 粒子半径在 0.3-1.5 之间

        // 根据粒子位置计算透明度
        const opacity = 0.4 * (1 - y / topParticleArea); // 越靠近顶部越不透明

        ctx.fillStyle = `rgba(255, ${100 + Math.random() * 50}, ${20 + Math.random() * 30}, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (template.id === 'minimal') {
      // 对于 minimal 样式，使用灰色作为 back cover 背景
      ctx.fillStyle = '#ECECEC';
      ctx.fillRect(0, 0, width, height);

      // 添加底部渐变：深灰 → 当前灰色（与封面保持一致）
      const backBottomGradient = ctx.createLinearGradient(0, height * 0.67, 0, height);
      backBottomGradient.addColorStop(0, '#ECECEC'); // 当前灰色
      backBottomGradient.addColorStop(1, '#999999'); // 深灰色

      ctx.fillStyle = backBottomGradient;
      ctx.fillRect(0, height * 0.67, width, height * 0.33); // 底部向上1/3
    } else if (template.id === 'bestseller') {
      // 对于 bestseller 样式，使用更黑的星空背景
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, '#050A14'); // 顶部更黑的蓝黑色
      bgGradient.addColorStop(1, '#0A1428'); // 底部稍浅的深蓝色
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // 在下半部添加蓝色高光效果 - 略微降低散射范围，使光源衰减更快
      const bottomGlow = ctx.createRadialGradient(
        width * 0.5, height * 0.8, 10,
        width * 0.5, height * 0.8, width * 1.6
      );
      bottomGlow.addColorStop(0, 'rgba(0, 120, 255, 0.3)');
      bottomGlow.addColorStop(0.5, 'rgba(0, 80, 200, 0.1)');
      bottomGlow.addColorStop(1, 'rgba(0, 0, 100, 0)');

      ctx.globalAlpha = 0.7;
      ctx.fillStyle = bottomGlow;
      ctx.fillRect(0, 0, width, height); // 扩大覆盖区域到整个封面

      // 添加金色星点效果
      ctx.fillStyle = '#FFC300'; // 金色星点
      const starCount = 100; // 星星数量
      for (let i = 0; i < starCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 1.5; // 随机星星大小
        const opacity = Math.random() * 0.8 + 0.2; // 随机透明度

        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 恢复透明度
      ctx.globalAlpha = 1.0;
    } else if (template.id === 'modern' || template.id === 'vibrant-green') {
      // 对于 vibrant-green 样式，添加淡金渐变和奶茶渐变
      ctx.fillStyle = template.backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // 添加顶部淡金渐变光晕
      const topGradient = ctx.createLinearGradient(0, 0, 0, height * 0.4);
      topGradient.addColorStop(0, 'rgba(255, 215, 150, 0.3)');
      topGradient.addColorStop(0.5, 'rgba(255, 200, 120, 0.15)');
      topGradient.addColorStop(1, 'rgba(255, 180, 100, 0)');

      ctx.fillStyle = topGradient;
      ctx.fillRect(0, 0, width, height * 0.4);

      // 添加粒子效果（模拟粉尘或书页反光）
      ctx.fillStyle = 'rgba(255, 230, 180, 0.6)';
      const particleCount = 30;
      for (let i = 0; i < particleCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height * 0.4; // 只在顶部区域
        const radius = Math.random() * 1.5 + 0.5; // 粒子大小
        const opacity = Math.random() * 0.4 + 0.1; // 透明度

        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 在底部添加奶茶渐变区域
      const bottomHeight = height * 0.2;
      const milkTeaGradient = ctx.createLinearGradient(0, height - bottomHeight, 0, height);
      milkTeaGradient.addColorStop(0, 'rgba(163, 137, 107, 0)');
      milkTeaGradient.addColorStop(0.3, 'rgba(163, 137, 107, 0.1)');
      milkTeaGradient.addColorStop(1, 'rgba(163, 137, 107, 0.25)');

      ctx.fillStyle = milkTeaGradient;
      ctx.fillRect(0, height - bottomHeight, width, bottomHeight);

      // 恢复透明度
      ctx.globalAlpha = 1.0;
    } else if (template.id === 'pastel-beige') {
      // 为 back cover 添加与封面相同的渐变效果

      // 添加顶部渐变：淡紫 → 粉色（天空感 + 层次感）
      const topGradient = ctx.createLinearGradient(0, 0, 0, height * 0.33);
      topGradient.addColorStop(0, '#EBD8FF'); // 淡紫色
      topGradient.addColorStop(1, '#FFC0CB'); // 原始的粉色 #FFC0CB

      ctx.fillStyle = topGradient;
      ctx.fillRect(0, 0, width, height * 0.33);

      // 添加底部渐变：粉 → 樱花白 - 从1/3处开始而不是2/3
      const bottomGradient = ctx.createLinearGradient(0, height * 0.33, 0, height);
      bottomGradient.addColorStop(0, '#FFC0CB'); // 原始的粉色 #FFC0CB
      bottomGradient.addColorStop(1, '#FFEFF4'); // 樱花白

      ctx.fillStyle = bottomGradient;
      ctx.fillRect(0, height * 0.33, width, height * 0.67);

      // 添加星星装饰
      ctx.fillStyle = '#FFF2B3'; // 更浅的黄色星星

      // 绘制四角星函数 - 旋转45度
      function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
          const angle = (i * 2 * Math.PI) / 4; // 四角星角度 - 旋转45度
          const outerX = x + size * Math.cos(angle);
          const outerY = y + size * Math.sin(angle);
          if (i === 0) {
            ctx.moveTo(outerX, outerY);
          } else {
            ctx.lineTo(outerX, outerY);
          }
          const innerAngle = angle + Math.PI / 4; // 四角星内角度
          const innerX = x + size * 0.4 * Math.cos(innerAngle);
          const innerY = y + size * 0.4 * Math.sin(innerAngle);
          ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
      }

      // 添加多个星星 - 减小星星大小
      drawStar(ctx, 80, 60, 12); // 左上角
      drawStar(ctx, width - 100, 80, 10); // 右上角
      drawStar(ctx, 150, height - 150, 12); // 左下角
      drawStar(ctx, width - 150, height - 200, 12); // 右下角
      drawStar(ctx, width / 2 - 100, 120, 8); // 上方中间
      drawStar(ctx, width / 2 + 150, 200, 8); // 上方中间 - 放大到 8

      // 绘制云朵
      ctx.fillStyle = '#FFFFFF'; // 白色云朵
      function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.6, y - size * 0.3, size * 0.7, 0, Math.PI * 2);
        ctx.arc(x + size * 1.1, y, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      drawCloud(ctx, 100, 100, 50); // 左上角云朵
      drawCloud(ctx, width - 100, 120, 40); // 右上角云朵
    } else {
      ctx.fillStyle = template.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // 绘制赞美语，如果有的话
    if (praises && praises.length > 0) {
      const availablePraises = praises.slice(0, 4); // 限制最多显示4条赞美语

      // 使用模板中的边距配置，如果没有则使用默认值 - 向下移动
      const marginLeft = template.backCoverStyle.marginLeft || 50; // 从60减小到50，减少左边距
      let marginTop;

      // 为minimal和classic样式设置更小的顶部边距
      if (template.id === 'minimal' || template.id === 'classic') {
        marginTop = template.backCoverStyle.marginTop || 50; // 从80减小到50，向上移动
      } else {
        marginTop = template.backCoverStyle.marginTop || 80; // 其他样式保持不变
      }

      // 设置标题
      ctx.textAlign = template.backCoverStyle.textAlign || 'left';
      // 如果是vibrant-green样式，使用棕褐色
      if (template.id === 'vibrant-green') {
        ctx.fillStyle = '#A3896B';
      } else if (template.id === 'bestseller') {
        // 对于 bestseller 样式，使用金色文字
        ctx.fillStyle = '#FFC300';
      } else {
        ctx.fillStyle = template.backCoverStyle.textColor || '#FFFFFF';
      }

      const x = Math.round(marginLeft);
      let yPosition = marginTop;

      // 为minimal和classic样式不显示"Praises for ..."标题
      if (template.id === 'minimal' || template.id === 'classic') {
        yPosition += 40; // 向下移动40像素
      } else {
        // 为 pastel-beige 样式使用特殊字体
        if (template.id === 'pastel-beige') {
          const comicFont = (fontStatus === 'loaded')
            ? "'Comic Sans MS', cursive"
            : "'Arial Rounded MT Bold', 'Arial', sans-serif";
          ctx.font = `bold ${template.backCoverStyle.titleFontSize || 34}px ${comicFont}`;
        } else {
          ctx.font = `bold ${template.backCoverStyle.titleFontSize || 34}px ${resolvedFont}`;
        }

        // 对于第一、二、三、五种样式，使用文本换行处理标题
        if (template.id === 'classic' || template.id === 'bestseller' || template.id === 'vibrant-green' || template.id === 'pastel-beige') {
          const titleText = `Praises for ${coverTitle}`;
          const availableTitleWidth = width - marginLeft * 2.3; // 与正文相同的宽度

          // 测量标题宽度
          const titleWidth = ctx.measureText(titleText).width;

          if (titleWidth > availableTitleWidth) {
            // 需要换行
            const words = titleText.split(' ');
            let line = '';
            let firstLine = true;

            for (let i = 0; i < words.length; i++) {
              const testLine = line + words[i] + ' ';
              const testWidth = ctx.measureText(testLine).width;

              if (testWidth > availableTitleWidth && i > 0) {
                // 绘制当前行
                ctx.fillText(line.trim(), x, yPosition);
                line = words[i] + ' ';
                yPosition += template.backCoverStyle.titleSpacing || 40;
                firstLine = false;
              } else {
                line = testLine;
              }
            }

            // 绘制最后一行
            if (line.trim() !== '') {
              ctx.fillText(line.trim(), x, yPosition);
            }
          } else {
            // 不需要换行，直接绘制
            ctx.fillText(titleText, x, yPosition);
          }
        } else {
          // 其他样式保持原样
          ctx.fillText(`Praises for ${coverTitle}`, x, yPosition);
        }

        // 使用模板中的行间距配置，如果没有则使用默认值
        yPosition += template.backCoverStyle.titleSpacing || 40;
      }

      // 绘制每条赞美语
      availablePraises.forEach(praise => {
        // 对于 bestseller 样式，赞美语正文使用白色
        if (template.id === 'bestseller') {
          ctx.fillStyle = '#FFFFFF';
        }

        // 赞美文本内容 - 为minimal样式使用Raleway
        if (template.id === 'minimal') {
          ctx.font = `normal 20px 'Raleway', sans-serif`; // 从300 14px改为normal 16px

          // 使用文本换行函数 - 对minimal样式的文本进行大写转换
          const wrappedText = wrapTextWithHeight(
            ctx,
            `"${praise.text.toUpperCase()}"`, // 将文本转换为大写
            x,
            Math.round(yPosition),
            width - marginLeft * 2.3, // 从marginLeft * 2.2调整为marginLeft * 2.3
            template.backCoverStyle.lineHeight || 28, // 从33减小到28
            'justify' // 添加左右对齐参数
          );

          // 使用模板中的赞美语间距配置，如果没有则使用默认值
          const praiseSpacing = template.backCoverStyle.praiseSpacing || 20; // 从24轻微减小到20
          yPosition += wrappedText.height + Math.round(praiseSpacing * 1.4); // 从1.5轻微减小到1.4
        } else {
          // 放大classic样式的正文字体
          if (template.id === 'classic') {
            ctx.font = `italic ${template.backCoverStyle.praiseFontSize || 24}px ${resolvedFont}`; // 从26px减小到24px
          } else if (template.id === 'pastel-beige') {
            // 为 pastel-beige 样式使用特殊字体
            const comicFont = (fontStatus === 'loaded')
              ? "'Comic Sans MS', cursive"
              : "'Arial Rounded MT Bold', 'Arial', sans-serif";
            ctx.font = `italic ${template.backCoverStyle.praiseFontSize || 22}px ${comicFont}`;
          } else {
            ctx.font = `italic ${template.backCoverStyle.praiseFontSize || 22}px ${resolvedFont}`;
          }

          // 使用文本换行函数
          const wrappedText = wrapTextWithHeight(
            ctx,
            `"${praise.text}"`,
            x,
            Math.round(yPosition),
            width - marginLeft * 2.3, // 从marginLeft * 2.2调整为marginLeft * 2.3
            template.backCoverStyle.lineHeight || 28, // 从33减小到28
            'justify' // 添加左右对齐参数
          );

          // 使用模板中的赞美语间距配置，如果没有则使用默认值
          const praiseSpacing = template.backCoverStyle.praiseSpacing || 20; // 从24轻微减小到20
          yPosition += wrappedText.height + Math.round(praiseSpacing * 1.4); // 从1.5轻微减小到1.4
        }

        // 赞美来源，在作者名称前添加"-"符号
        // 对于 bestseller 样式，赞美语来源使用金色
        if (template.id === 'bestseller') {
          ctx.fillStyle = '#FFC300';
        }

        if (template.id === 'minimal') {
          ctx.font = `bold ${template.backCoverStyle.sourceFontSize || 24}px 'Montserrat', sans-serif`; // 从28px减小到24px
        } else if (template.id === 'classic') {
          ctx.font = `bold ${template.backCoverStyle.sourceFontSize || 24}px ${resolvedFont}`; // 从26px减小到24px
        } else if (template.id === 'pastel-beige') {
          // 为 pastel-beige 样式使用特殊字体
          const comicFont = (fontStatus === 'loaded')
            ? "'Comic Sans MS', cursive"
            : "'Arial Rounded MT Bold', 'Arial', sans-serif";
          ctx.font = `bold ${template.backCoverStyle.sourceFontSize || 24}px ${comicFont}`; // 从28px减小到24px
        } else {
          ctx.font = `bold ${template.backCoverStyle.sourceFontSize || 24}px ${resolvedFont}`; // 从28px减小到24px
        }

        // 只有classic和minimal样式的作者名称右对齐，其他样式使用左对齐
        if (template.id === 'classic' || template.id === 'minimal') {
          // 将作者名称右对齐
          ctx.textAlign = 'right';
          const rightMargin = width - marginLeft * 1.3; // 从width - marginLeft * 1.2调整为width - marginLeft * 1.3
          ctx.fillText(`- ${praise.source}`, rightMargin, Math.round(yPosition));
        } else {
          // 其他样式保持左对齐
          ctx.textAlign = 'left';
          ctx.fillText(`- ${praise.source}`, x, Math.round(yPosition));
        }

        // 恢复左对齐设置，以免影响后续文本
        ctx.textAlign = template.backCoverStyle.textAlign || 'left';

        // 使用模板中的来源间距配置，如果没有则使用默认值
        yPosition += template.backCoverStyle.sourceSpacing || 52; // 从60轻微减小到52
      });
    }

    // Draw book info at the bottom - 确保使用整数坐标
    ctx.textAlign = 'left';
    // 根据样式设置文本颜色
    if (template.id === 'minimal' || template.id === 'vibrant-green' || template.id === 'pastel-beige') {
      ctx.fillStyle = '#000000'; // 黑色文本
    } else {
      ctx.fillStyle = '#FFFFFF'; // 其他样式使用白色文本
    }

    // 为minimal样式使用Open Sans Light
    if (template.id === 'minimal') {
      ctx.font = `normal 20px 'Open Sans', sans-serif`;
    } else {
      ctx.font = `20px ${resolvedFont}`;
    }

    // 将品牌标识向右上移动
    const brandX = Math.round(60); // 从40增加到60，向右移动
    const brandY1 = Math.round(height - 100); // 从80增加到100，再向上移动10像素
    const brandY2 = Math.round(height - 70); // 从50增加到70，再向上移动10像素

    ctx.fillText("Visit wishiyo.com", brandX, brandY1);

    // 使用 Futura 字体
    ctx.font = `bold 20px "Futura", sans-serif`;
    ctx.fillStyle = '#FF6B35'; // Orange for WISHIYO
    ctx.fillText("WISHIYO", brandX, brandY2);

    // 绘制条形码在右下角 - 向左上移动
    if (barcode?.element) {
      // 设置条形码尺寸 - 增大到 200x100
      const barcodeWidth = 200;
      const barcodeHeight = 100;

      // 调整位置，向左上移动
      const barcodeX = Math.round(width - barcodeWidth - 60); // 从40增加到60，向左移动
      const barcodeY = Math.round(height - barcodeHeight - 60); // 从40增加到60，向上移动

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
      ctx.fillRect(Math.round(width - 260), Math.round(height - 160), 200, 100); // 相应调整占位区域位置
    }
  };

  // 添加文本换行并计算高度的辅助函数
  const wrapTextWithHeight = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    align: 'left' | 'center' | 'right' | 'justify' = 'justify' // 添加对齐方式参数，默认为左右对齐
  ) => {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineCount = 0;
    const lines: { text: string, width: number }[] = []; // 存储每行文本及其宽度

    // 设置文本渲染属性 - 保证清晰度
    ctx.textBaseline = 'middle'; // 使文本垂直居中，增加清晰度

    // 应用适当的字符间距，增加可读性
    ctx.letterSpacing = '0.5px';

    // 第一步：计算行分割
    for (let n = 0; n < words.length; n++) {
      testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        // 保存当前行及其宽度
        lines.push({ text: line.trim(), width: ctx.measureText(line.trim()).width });
        line = words[n] + ' ';
        lineCount++;
      } else {
        line = testLine;
      }
    }

    // 添加最后一行
    if (line.trim() !== '') {
      lines.push({ text: line.trim(), width: ctx.measureText(line.trim()).width });
      lineCount++;
    }

    // 第二步：根据对齐方式绘制文本
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i].text;
      const lineWidth = lines[i].width;
      const yPos = y + (i * lineHeight) + lineHeight/2;

      if (align === 'justify' && i < lines.length - 1) { // 最后一行不进行两端对齐
        // 实现左右对齐
        const words = lineText.split(' ');
        if (words.length > 1) { // 只有多个单词才能两端对齐
          const totalSpacing = maxWidth - lineWidth;
          const spaceBetweenWords = totalSpacing / (words.length - 1);
          let currentX = x;

          // 绘制每个单词，并添加计算好的间距
          for (let j = 0; j < words.length; j++) {
            ctx.fillText(words[j], currentX, yPos);
            // 如果不是最后一个单词，添加间距
            if (j < words.length - 1) {
              const wordWidth = ctx.measureText(words[j]).width;
              currentX += wordWidth + ctx.measureText(' ').width + spaceBetweenWords;
            }
          }
        } else {
          // 单个单词直接左对齐
          ctx.fillText(lineText, x, yPos);
        }
      } else {
        // 其他对齐方式
        let drawX = x;
        if (align === 'center') {
          drawX = x + (maxWidth - lineWidth) / 2;
        } else if (align === 'right') {
          drawX = x + maxWidth - lineWidth;
        }
        ctx.fillText(lineText, drawX, yPos);
      }
    }

    // 返回文本块的总高度
    return {
      height: lineCount * lineHeight // 总高度
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