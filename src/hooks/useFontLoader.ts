import { useState, useEffect } from 'react';

const fontLoadTimeoutMs = 5000; // 5 second timeout - 增加超时时间以确保字体有足够的时间加载

// Font mapping, maps style names to actual font names
export const fontMapping = {
  // funny-bio fonts
  merriweather: 'Merriweather, serif',
  montserrat: 'Montserrat, sans-serif',
  inter: 'Inter, sans-serif',
  times: 'Times New Roman, serif',
  anton: 'Anton, sans-serif',
  oswald: 'Oswald, sans-serif',
  georgia: 'Georgia, serif',
  impact: 'Impact, sans-serif',
  raleway: 'Raleway, sans-serif',
  'fira-mono': 'Fira Mono, monospace',
  jost: 'Jost, sans-serif',
  'comic-sans': 'Comic Sans MS, cursive',

  // love-story fonts
  'patrick-hand': "'Patrick Hand', cursive",
  'freckle-face': "'Freckle Face', cursive",
  'amatic-sc': "'Amatic SC', cursive",
  'caveat': "'Caveat', cursive",
  'luckiest-guy': "'Luckiest Guy', cursive",

  // 直接映射字体名称（用于直接使用字体名的情况）
  'Patrick Hand': "'Patrick Hand', cursive",
  'Freckle Face': "'Freckle Face', cursive",
  'Amatic SC': "'Amatic SC', cursive",
  'Caveat': "'Caveat', cursive",
  'Luckiest Guy': "'Luckiest Guy', cursive",
};

type FontStatus = 'loading' | 'loaded' | 'error';

export function useFontLoader(fontFamily: string): FontStatus {
  const [status, setStatus] = useState<FontStatus>('loading');

  useEffect(() => {
    // If browser doesn't support FontFace API, assume loaded and return
    if (typeof document === 'undefined' || !('fonts' in document)) {
      setStatus('loaded');
      return;
    }

    // Reset loading status
    setStatus('loading');

    // Use timeout to ensure we don't wait forever
    const timeoutId = setTimeout(() => {
      setStatus('loaded'); // Assume loaded after timeout
      console.log(`Font loading timed out for ${fontFamily}, proceeding anyway`);
    }, fontLoadTimeoutMs);

    // Try to detect font loading using document.fonts
    try {
      // Extract font family name
      const familyName = fontMapping[fontFamily as keyof typeof fontMapping] || fontFamily;

      // Check if font is loaded
      document.fonts.ready.then(() => {
        // Only update state if component is still mounted
        clearTimeout(timeoutId);
        setStatus('loaded');
        console.log(`Font ${familyName} loaded successfully`);
      }).catch(err => {
        console.error(`Error loading font ${familyName}:`, err);
        setStatus('error');
      });
    } catch (err) {
      console.error('Font loading error:', err);
      setStatus('error');
      clearTimeout(timeoutId);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [fontFamily]);

  return status;
}

// Preload all fonts
export function preloadFonts(): Promise<void> {
  // In non-browser environment, return resolved Promise
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return Promise.resolve();
  }

  console.log('Preloading fonts...');

  // 主动预加载所有love-story样式字体
  const loveStoryFonts = [
    "'Patrick Hand', cursive",  // classic 样式
    "'Freckle Face', cursive", // vintage 样式
    "'Amatic SC', cursive",    // modern 样式
    "'Caveat', cursive",       // playful 样式
    "'Luckiest Guy', cursive"  // elegant 样式
  ];

  // 使用多种字体大小预加载每种字体，确保它们在不同大小下都可用
  // 根据实际使用的字体大小范围添加更多大小
  // 最大的字体大小是 width * 0.132，对于2400px的画布是316.8px
  const fontSizes = [12, 24, 36, 48, 64, 72, 96, 120, 144, 192, 240, 320]; // 添加更大的字体大小
  const fontWeights = ['normal', 'bold', 'italic', 'bold italic']; // 添加更多粗细变体

  // 创建加载字体的Promise数组 - 对每种字体使用多种大小和粗细
  const fontLoadPromises: Promise<any>[] = [];

  // 预加载字体的函数
  const preloadFont = (font: string, size: number, weight: string) => {
    try {
      const loadPromise = document.fonts.load(`${weight} ${size}px ${font}`);
      fontLoadPromises.push(loadPromise);
      return true;
    } catch (err) {
      console.error(`Error loading font ${font} at ${size}px ${weight}:`, err);
      return false;
    }
  };

  // 对每种字体使用多种大小和粗细
  loveStoryFonts.forEach(font => {
    // 首先加载实际使用的大小
    // 根据分析，各种样式的实际字体大小
    if (font === "'Patrick Hand', cursive") { // classic
      // 主标题: width * 0.12, 副标题: width * 0.12, 作者名: width * 0.035
      [120, 35].forEach(size => {
        fontWeights.forEach(weight => preloadFont(font, size, weight));
      });
    } else if (font === "'Freckle Face', cursive") { // vintage
      // 主标题: width * 0.108, 副标题: width * 0.108, 作者名: width * 0.030
      [108, 30].forEach(size => {
        fontWeights.forEach(weight => preloadFont(font, size, weight));
      });
    } else if (font === "'Amatic SC', cursive") { // modern
      // 主标题: width * 0.12, 副标题: width * 0.12, 作者名: width * 0.035
      [120, 35].forEach(size => {
        fontWeights.forEach(weight => preloadFont(font, size, weight));
      });
    } else if (font === "'Caveat', cursive") { // playful
      // 主标题: width * 0.132, 副标题: width * 0.132, 作者名: width * 0.035
      [132, 35].forEach(size => {
        fontWeights.forEach(weight => preloadFont(font, size, weight));
      });
    } else if (font === "'Luckiest Guy', cursive") { // elegant
      // 主标题: width * 0.096, 副标题: width * 0.096, 作者名: width * 0.025
      [96, 25].forEach(size => {
        fontWeights.forEach(weight => preloadFont(font, size, weight));
      });
    }

    // 然后加载其他常用大小
    fontSizes.forEach(size => {
      fontWeights.forEach(weight => preloadFont(font, size, weight));
    });
  });

  // 主动触发字体加载
  if (fontLoadPromises.length === 0) {
    console.warn('No font load promises created, using document.fonts.ready as fallback');
    return document.fonts.ready.then(() => {
      console.log('Fonts loaded via document.fonts.ready');
    });
  }

  console.log(`Starting to load ${fontLoadPromises.length} font variations...`);

  // 使用Promise.allSettled而不是Promise.all，确保即使有失败也不会影响整体加载
  return Promise.allSettled(fontLoadPromises)
    .then((results) => {
      const fulfilled = results.filter(r => r.status === 'fulfilled').length;
      const rejected = results.filter(r => r.status === 'rejected').length;
      console.log(`Font preloading completed: ${fulfilled} successful, ${rejected} failed`);

      // 最后等待document.fonts.ready确保所有字体都已加载
      return document.fonts.ready;
    })
    .then(() => {
      console.log('All fonts loaded!');

      // 测试字体是否真正加载完成
      return Promise.all(loveStoryFonts.map(async (font) => {
        const testFont = await document.fonts.load(`bold 48px ${font}`);
        console.log(`Font load test for ${font}:`, testFont.length > 0 ? 'Success' : 'Failed');
      }));
    })
    .catch(err => {
      console.error('Error preloading fonts:', err);
      // 即使出错也返回已解决的Promise，以便应用程序可以继续
      return document.fonts.ready;
    });
}