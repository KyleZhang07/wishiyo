import { useState, useEffect } from 'react';

const fontLoadTimeoutMs = 3000; // 3 second timeout

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

  // 创建加载字体的Promise数组
  const fontLoadPromises = loveStoryFonts.map(font => {
    try {
      // 使用12px作为测试大小
      return document.fonts.load(`12px ${font}`);
    } catch (err) {
      console.error(`Error loading font ${font}:`, err);
      return Promise.resolve(); // 即使加载失败也继续
    }
  });

  // 等待所有字体加载完成
  return Promise.all(fontLoadPromises)
    .then(() => {
      console.log('All love-story style fonts preloaded successfully!');
      // 最后等待document.fonts.ready确保所有字体都已加载
      return document.fonts.ready;
    })
    .then(() => {
      console.log('All fonts loaded!');
    })
    .catch(err => {
      console.error('Error preloading fonts:', err);
    });
}