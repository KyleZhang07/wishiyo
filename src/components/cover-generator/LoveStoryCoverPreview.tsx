import { useRef, useEffect, useState } from 'react';
import { useImageLoader } from './hooks/useImageLoader';
import drawTexturedBackground from './TexturedBackground';
import drawSnowNightBackground from './SnowNightBackground';
import blueTextureBackground from '../../assets/Generated Image March 15, 2025 - 3_12PM_LE_upscale_balanced_x4.jpg';
import greenLeafBackground from '../../assets/leaves.jpg';
import rainbowBackground from '../../assets/rainbow2.jpg';
import heartCoverBackground from '../../assets/heart_cover_8.5in_highres.png';
import { useFontContext } from '@/context/FontContext';
import { fontMapping } from '@/hooks/useFontLoader';

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
  const [isLoading, setIsLoading] = useState(true); // 添加加载状态
  const [canvasRendered, setCanvasRendered] = useState(false); // 跟踪Canvas是否已经渲染

  // 预加载所有图片
  const image = useImageLoader(coverImage);
  const blueTexture = useImageLoader(blueTextureBackground);
  const greenLeaf = useImageLoader(greenLeafBackground);
  const rainbow = useImageLoader(rainbowBackground);
  const heartCover = useImageLoader(heartCoverBackground);

  // 使用FontContext中的字体加载状态
  const { fontsLoaded, fontStatus } = useFontContext();

  useEffect(() => {
    // 当组件挂载时设置加载状态
    setIsLoading(true);
    setCanvasRendered(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸为 1:1 比例
    canvas.width = 2400;
    canvas.height = 2400;

    // 先绘制一个简单的背景，避免空白闪烁
    if (style) {
      ctx.fillStyle = style.background || '#FFFFFF';
    } else {
      ctx.fillStyle = '#FFFFFF';
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 根据当前样式预加载对应的字体 - 增强版
    const preloadStyleFont = async () => {
      if (style?.id && typeof document !== 'undefined' && 'fonts' in document) {
        let fontToLoad = '';

        // 根据样式选择字体
        switch (style.id) {
          case 'classic':
            fontToLoad = "'Patrick Hand', cursive";
            break;
          case 'vintage':
            fontToLoad = "'Freckle Face', cursive";
            break;
          case 'modern':
            fontToLoad = "'Amatic SC', cursive";
            break;
          case 'playful':
            fontToLoad = "'Caveat', cursive";
            break;
          case 'elegant':
            fontToLoad = "'Luckiest Guy', cursive";
            break;
        }

        if (fontToLoad) {
          console.log(`Preloading style font: ${fontToLoad} for style ${style.id}`);
          try {
            // 使用更多大小和粗细加载字体，确保它在不同大小下都可用
            const fontSizes = [12, 24, 36, 48, 64, 72];
            const fontWeights = ['normal', 'bold', 'italic'];

            const loadPromises = [];

            // 为每种大小和粗细创建加载承诺
            for (const size of fontSizes) {
              for (const weight of fontWeights) {
                loadPromises.push(document.fonts.load(`${weight} ${size}px ${fontToLoad}`));
              }
            }

            // 等待所有字体加载完成
            await Promise.all(loadPromises);
            console.log(`Style font ${fontToLoad} loaded successfully with ${loadPromises.length} variations`);

            // 测试字体是否真正加载完成
            const testFont = await document.fonts.load(`bold 48px ${fontToLoad}`);
            console.log(`Font load test result:`, testFont.length > 0 ? 'Success' : 'Failed');

            return true;
          } catch (err) {
            console.error(`Error loading style font ${fontToLoad}:`, err);
            return false;
          }
        }
      }
      return false;
    };

    // 预加载所有图片和字体，确保在绘制前已加载完成 - 增强版带重试
    const preloadImages = async () => {
      try {
        // 先加载当前样式的字体，最多重试3次
        let fontLoaded = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (!fontLoaded && attempts < maxAttempts) {
          attempts++;
          console.log(`Attempt ${attempts}/${maxAttempts} to load style font`);
          fontLoaded = await preloadStyleFont();

          if (!fontLoaded && attempts < maxAttempts) {
            // 等待一小段时间再重试
            console.log(`Font loading attempt ${attempts} failed, waiting before retry...`);
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }

        if (!fontLoaded) {
          console.warn(`Failed to load style font after ${maxAttempts} attempts, proceeding with fallback fonts`);
        }

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

        // 设置加载完成状态
        setIsLoading(false);
        setCanvasRendered(true);
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

        // 即使出错也设置加载完成状态
        setIsLoading(false);
        setCanvasRendered(true);
      }
    };

    // 如果字体已加载，直接执行图像加载
    // 否则添加小延迟确保字体加载
    if (fontsLoaded) {
      preloadImages();
    } else {
      setTimeout(() => {
        preloadImages();
      }, 100);
    }
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

        // 使用雪夜背景函数来绘制更多雪花，只绘制雪花而不绘制背景
        drawSnowNightBackground({
          ctx,
          width,
          height,
          baseColor: 'transparent', // 使用透明背景，因为我们已经有背景图片
          snowOpacity: 0.9 // 高不透明度使雪花更明显
        });
      } else {
        // 如果无法加载modern背景图片，使用雪夜背景函数绘制完整背景
        drawSnowNightBackground({
          ctx,
          width,
          height,
          snowOpacity: 0.9 // 高不透明度使雪花更明显
        });
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
      if (style?.id === 'vintage') {
        // 为 vintage 样式创建对角线渐变背景（左上角到右下角）
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#e7c9a9');   // 左上角较深棕色
        gradient.addColorStop(0.4, '#f8e9d6');  // 浅色过渡区域，扩大范围到0.4
        gradient.addColorStop(0.6, '#f8e9d6');  // 浅色过渡区域，缩小范围到0.6
        gradient.addColorStop(1, '#e7c9a9');   // 右下角较深棕色

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 添加轻微的纹理效果
        for (let i = 0; i < 20; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const radius = 80 + Math.random() * 150;

          const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
          spotGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
          spotGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = spotGradient;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // 强化左上角和右下角的深色效果
        const cornerRadius = width * 0.7; // 增加半径使渐变更接近中心

        // 左上角深色渐变 - 增强深度
        const topLeftGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cornerRadius);
        topLeftGradient.addColorStop(0, 'rgba(193, 156, 125, 0.6)');  // 更深的颜色，更高不透明度
        topLeftGradient.addColorStop(0.6, 'rgba(203, 176, 145, 0.15)'); // 延伸过渡区域
        topLeftGradient.addColorStop(1, 'rgba(203, 176, 145, 0)');
        ctx.fillStyle = topLeftGradient;
        ctx.fillRect(0, 0, width, height);

        // 右下角深色渐变 - 减轻深度
        const bottomRightGradient = ctx.createRadialGradient(width, height, 0, width, height, cornerRadius);
        bottomRightGradient.addColorStop(0, 'rgba(203, 176, 145, 0.25)');  // 降低不透明度使其较浅
        bottomRightGradient.addColorStop(0.6, 'rgba(203, 176, 145, 0.1)'); // 延伸过渡区域
        bottomRightGradient.addColorStop(1, 'rgba(203, 176, 145, 0)');
        ctx.fillStyle = bottomRightGradient;
        ctx.fillRect(0, 0, width, height);
      } else if (style?.id === 'classic') {
        // classic 样式使用心形背景图片
        if (heartCover && heartCover.element) {
          // 使用加载的图片作为背景
          ctx.drawImage(heartCover.element, 0, 0, width, height);

          // 添加米色半透明叠加层，使图片更柔和
          ctx.fillStyle = 'rgba(245, 235, 220, 0.3)';
          ctx.fillRect(0, 0, width, height);
        } else {
          // 如果无法加载背景图片，使用纯色背景
          ctx.fillStyle = style.background;
          ctx.fillRect(0, 0, width, height);
        }
      }
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
      // 根据样式选择不同的字体
      if (style?.id === 'playful') {
        ctx.fillStyle = '#2A4C08'; // Playful样式使用折中的深绿色字体
        const playfulTitleFontSize = titleFontSize * 2.2; // 将字体放大2.2倍
        ctx.font = `bold ${playfulTitleFontSize}px 'Caveat', cursive`;
      } else if (style?.id === 'modern') {
        ctx.fillStyle = '#FFFFFF'; // Modern样式使用白色字体
        const modernTitleFontSize = titleFontSize * 2.0; // 将字体放大2.0倍，与副标题保持一致
        ctx.font = `bold ${modernTitleFontSize}px 'Amatic SC', cursive`;
      } else if (style?.id === 'elegant') {
        ctx.fillStyle = '#FDF0F3'; // Elegant样式使用更接近白色的淡粉色字体
        const elegantTitleFontSize = titleFontSize * 1.6; // 将字体放大1.6倍，比之前的2.0小
        ctx.font = `bold ${elegantTitleFontSize}px 'Luckiest Guy', cursive`;
      } else if (style?.id === 'classic') {
        const classicTitleFontSize = titleFontSize * 2.0; // 将字体放大2倍，与Modern一致
        ctx.font = `bold ${classicTitleFontSize}px 'Patrick Hand', cursive`;
      } else if (style?.id === 'vintage') {
        const vintageTitleFontSize = titleFontSize * 1.8; // 将字体放大1.8倍，与Modern一致
        ctx.font = `bold ${vintageTitleFontSize}px 'Freckle Face', cursive`;
      } else {
        ctx.font = `bold ${titleFontSize}px ${getFontFamily(style?.font || selectedFont)}`;
      }

      // 只处理特定的三行标题模式：${authorName}'s wonderful ${recipientName}
      if (thirdLine && mainTitle.includes("'s") && subTitle === 'wonderful') {
        // 三行标题位置，上移以避免与图片重合
        if (style?.id === 'modern') {
          // Modern样式特殊处理位置
          ctx.fillText(mainTitle, width / 2, height * 0.17); // 上移到0.17（原来是0.20）

          const subTitleFontSize = titleFontSize * 2.0; // Modern样式副标题放大2倍
          ctx.font = `bold ${subTitleFontSize}px 'Amatic SC', cursive`;
          ctx.fillText(subTitle, width / 2, height * 0.28); // 上移到0.28（原来是0.30）
          ctx.fillText(thirdLine, width / 2, height * 0.40); // 保持不变
        } else {
          ctx.fillText(mainTitle, width / 2, height * 0.17); // 上移到0.17（原来是0.20）

          let subTitleFontSize: number;
          if (style?.id === 'playful') {
            subTitleFontSize = titleFontSize * 2.2; // Playful样式副标题放大2.2倍
            ctx.font = `bold ${subTitleFontSize}px 'Caveat', cursive`;
          } else if (style?.id === 'classic') {
            subTitleFontSize = titleFontSize * 2.0; // Classic样式副标题也放大2倍
            ctx.font = `bold ${subTitleFontSize}px 'Patrick Hand', cursive`;
          } else if (style?.id === 'elegant') {
            subTitleFontSize = titleFontSize * 1.6; // Elegant样式副标题保持较小的字体大小
            ctx.font = `bold ${subTitleFontSize}px 'Luckiest Guy', cursive`;
          } else if (style?.id === 'vintage') {
            subTitleFontSize = titleFontSize * 1.8;
            ctx.font = `bold ${subTitleFontSize}px 'Freckle Face', cursive`;
          }
          ctx.fillText(subTitle, width / 2, height * 0.28); // 上移到0.28（原来是0.30）
          ctx.fillText(thirdLine, width / 2, height * 0.40); // 保持不变
        }
      } else if (thirdLine) {
        // 其他三行标题情况，增加间距，整体下移0.015
        if (style?.id === 'modern') {
          // Modern样式特殊处理位置
          ctx.fillText(mainTitle, width / 2, height * 0.22); // 上移到0.22（原来是0.25）

          const subTitleFontSize = titleFontSize * 2.0; // Modern样式副标题放大2倍
          ctx.font = `bold ${subTitleFontSize}px 'Amatic SC', cursive`;
          ctx.fillText(subTitle, width / 2, height * 0.33); // 上移到0.33（原来是0.35）
          ctx.fillText(thirdLine, width / 2, height * 0.45); // 保持不变
        } else {
          ctx.fillText(mainTitle, width / 2, height * 0.22); // 上移到0.22（原来是0.25）

          let subTitleFontSize: number;
          if (style?.id === 'playful') {
            subTitleFontSize = titleFontSize * 2.2; // Playful样式副标题放大2.2倍
            ctx.font = `bold ${subTitleFontSize}px 'Caveat', cursive`;
          } else if (style?.id === 'classic') {
            subTitleFontSize = titleFontSize * 2.0; // Classic样式副标题也放大2倍
            ctx.font = `bold ${subTitleFontSize}px 'Patrick Hand', cursive`;
          } else if (style?.id === 'elegant') {
            subTitleFontSize = titleFontSize * 1.6; // Elegant样式副标题保持较小的字体大小
            ctx.font = `bold ${subTitleFontSize}px 'Luckiest Guy', cursive`;
          } else if (style?.id === 'vintage') {
            subTitleFontSize = titleFontSize * 1.8;
            ctx.font = `bold ${subTitleFontSize}px 'Freckle Face', cursive`;
          }
          ctx.fillText(subTitle, width / 2, height * 0.33); // 上移到0.33（原来是0.35）
          ctx.fillText(thirdLine, width / 2, height * 0.45); // 保持不变
        }
      } else {
        // 两行标题的情况，增加行间距，第一行适度上移，第二行位置不变
        if (style?.id === 'modern') {
          // Modern样式特殊处理位置
          ctx.fillText(mainTitle, width / 2, height * 0.25); // 下移0.02 // 第一行适度上移

          const subTitleFontSize = titleFontSize * 2.0; // Modern样式副标题放大2倍
          ctx.font = `bold ${subTitleFontSize}px 'Amatic SC', cursive`;
          ctx.fillText(subTitle, width / 2, height * 0.37); // 下移0.02 // 第二行位置不变
        } else {
          ctx.fillText(mainTitle, width / 2, height * 0.25); // 下移0.02 // 第一行适度上移

          // 绘制副标题，增加间距
          let subTitleFontSize: number;
          if (style?.id === 'playful') {
            subTitleFontSize = titleFontSize * 2.2; // Playful样式副标题放大2.2倍
            ctx.font = `bold ${subTitleFontSize}px 'Caveat', cursive`;
          } else if (style?.id === 'classic') {
            subTitleFontSize = titleFontSize * 2.0; // Classic样式副标题也放大2倍
            ctx.font = `bold ${subTitleFontSize}px 'Patrick Hand', cursive`;
          } else if (style?.id === 'elegant') {
            subTitleFontSize = titleFontSize * 1.6; // Elegant样式副标题保持较小的字体大小
            ctx.font = `bold ${subTitleFontSize}px 'Luckiest Guy', cursive`;
          } else if (style?.id === 'vintage') {
            subTitleFontSize = titleFontSize * 1.8;
            ctx.font = `bold ${subTitleFontSize}px 'Freckle Face', cursive`;
          }
          ctx.fillText(subTitle, width / 2, height * 0.37); // 下移0.02 // 第二行位置不变
        }
      }
    } else {
      // 如果没有分开的标题，则使用完整标题
      if (style?.id === 'modern') {
        // 使用白色字体和更手写风格的字体
        ctx.fillStyle = '#FFFFFF';
        const modernTitleFontSize = titleFontSize * 2.0; // 将字体放大2.0倍，与副标题保持一致
        ctx.font = `bold ${modernTitleFontSize}px 'Amatic SC', cursive`;
        ctx.fillText(fullTitle, width / 2, height * 0.27); // 下移0.02 // 将标题位置调整为与 CoverStep 一致
      } else if (style?.id === 'elegant') {
        // 使用极淡粉色字体和手写风格的字体
        ctx.fillStyle = '#FDF0F3'; // Elegant样式使用更接近白色的淡粉色字体
        const elegantTitleFontSize = titleFontSize * 1.6; // 将字体放大1.6倍
        ctx.font = `bold ${elegantTitleFontSize}px 'Luckiest Guy', cursive`;
        ctx.fillText(fullTitle, width / 2, height * 0.27); // 下移0.02
      } else if (style?.id === 'playful') {
        ctx.fillStyle = '#2A4C08';
        const playfulTitleFontSize = titleFontSize * 2.2; // 将字体放大2.2倍
        ctx.font = `bold ${playfulTitleFontSize}px 'Caveat', cursive`;
        ctx.fillText(fullTitle, width / 2, height * 0.27); // 下移0.02
      } else if (style?.id === 'classic') {
        const classicTitleFontSize = titleFontSize * 2.0;
        ctx.font = `bold ${classicTitleFontSize}px 'Patrick Hand', cursive`;
        ctx.fillText(fullTitle, width / 2, height * 0.27); // 下移0.02
      } else if (style?.id === 'vintage') {
        const vintageTitleFontSize = titleFontSize * 1.8; // 将字体放大1.8倍
        ctx.font = `bold ${vintageTitleFontSize}px 'Freckle Face', cursive`;
        ctx.fillText(fullTitle, width / 2, height * 0.27); // 下移0.02
      } else {
        // 其他样式使用默认字体
        ctx.font = `bold ${titleFontSize}px ${getFontFamily(style?.font || selectedFont)}`;
        ctx.fillText(fullTitle, width / 2, height * 0.27); // 下移0.02
      }
    }

    // 作者名 - 定义固定区域并居中显示
    // 定义作者签名区域（右下角）
    const authorAreaWidth = width * 0.3; // 区域宽度为封面宽度30%
    const authorAreaX = width * 0.71; // 区域左边界位置，右移0.01
    const authorAreaY = height * 0.95; // 区域底部位置

    // 设置文本居中对齐
    ctx.textAlign = 'center';

    // 根据不同样式设置字体和颜色
    if (style?.id === 'modern') {
      ctx.fillStyle = '#FFFFFF';
      const authorFontSize = width * 0.035;
      ctx.font = `italic ${authorFontSize}px 'Amatic SC', cursive`;
      ctx.fillText(`By ${author}`, authorAreaX + authorAreaWidth/2, authorAreaY); // 居中显示
    }
    // 如果是elegant样式，使用极淡粉色字体
    else if (style?.id === 'elegant') {
      ctx.fillStyle = '#FDF0F3'; // 使用极淡粉色
      const authorFontSize = width * 0.025; // 缩小作者字体
      ctx.font = `italic ${authorFontSize}px 'Luckiest Guy', cursive`;
      ctx.fillText(`By ${author}`, authorAreaX + authorAreaWidth/2, authorAreaY); // 居中显示
    }
    // Classic和Vintage样式
    else if (style?.id === 'classic') {
      ctx.fillStyle = '#C75B7D'; // 使用深粉红色/玫瑰色
      const authorFontSize = width * 0.035;
      ctx.font = `italic ${authorFontSize}px 'Patrick Hand', cursive`;
      ctx.fillText(`By ${author}`, authorAreaX + authorAreaWidth/2, authorAreaY); // 居中显示
    }
    else if (style?.id === 'vintage') {
      ctx.fillStyle = style.titleColor; // 使用标题颜色
      const authorFontSize = width * 0.030; // 缩小作者字体
      ctx.font = `italic ${authorFontSize}px 'Freckle Face', cursive`;
      ctx.fillText(`By ${author}`, authorAreaX + authorAreaWidth/2, authorAreaY); // 居中显示
    }
    else if (style?.id === 'playful') {
      ctx.fillStyle = '#2A4C08'; // 使用折中的深绿色
      const authorFontSize = width * 0.035;
      ctx.font = `italic ${authorFontSize}px 'Caveat', cursive`;
      ctx.fillText(`By ${author}`, authorAreaX + authorAreaWidth/2, authorAreaY); // 居中显示
    }
    else {
      ctx.fillStyle = authorColor;
      const authorFontSize = width * 0.035;
      ctx.font = `italic ${authorFontSize}px ${fontFamily}`;
      ctx.fillText(`By ${author}`, authorAreaX + authorAreaWidth/2, height * 0.9); // 其他样式位置稍高
    }

    // 恢复文本对齐方式为默认值（左对齐）
    ctx.textAlign = 'left';
  };

  // Helper function to get the font family based on the selected font
  const getFontFamily = (selectedFont?: string): string => {
    // 使用全局字体映射
    if (selectedFont && fontMapping[selectedFont]) {
      return fontMapping[selectedFont];
    }

    // 兼容旧版本的字体选择
    switch (selectedFont?.toLowerCase()) {
      case 'patrick-hand':
        return "'Patrick Hand', cursive";
      case 'freckle-face':
        return "'Freckle Face', cursive";
      case 'amatic-sc':
        return "'Amatic SC', cursive";
      case 'caveat':
        return "'Caveat', cursive";
      case 'luckiest-guy':
        return "'Luckiest Guy', cursive";
      case 'montserrat':
        return 'sans-serif';
      case 'comic-sans':
        return 'cursive';
      case 'didot':
      case 'playfair':
        return 'serif';
      default:
        // 如果没有匹配到，尝试直接使用传入的字体名
        if (selectedFont) {
          return `'${selectedFont}', serif`;
        }
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
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
            <div className="animate-spin h-12 w-12 border-4 border-[#FF7F50] border-t-transparent rounded-full"></div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={`w-full h-full object-contain ${canvasRendered ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        />
      </div>
    </div>
  );
};

export default LoveStoryCoverPreview;