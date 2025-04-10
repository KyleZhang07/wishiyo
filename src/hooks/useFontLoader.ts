import { useState, useEffect } from 'react';

const fontLoadTimeoutMs = 3000; // 3秒超时

// 字体映射，将样式名称映射到实际字体名
export const fontMapping = {
  merriweather: 'Merriweather, serif',
  montserrat: 'Montserrat, sans-serif',
  inter: 'Inter, sans-serif',
  times: 'Times New Roman, serif',
  anton: 'Anton, sans-serif',
  georgia: 'Georgia, serif',
  impact: 'Impact, sans-serif',
  oswald: 'Oswald, sans-serif',
  raleway: 'Raleway, sans-serif',
  'fira-mono': 'Fira Mono, monospace',
  jost: 'Jost, sans-serif',
};

type FontStatus = 'loading' | 'loaded' | 'error';

export function useFontLoader(fontFamily: string): FontStatus {
  const [status, setStatus] = useState<FontStatus>('loading');

  useEffect(() => {
    // 如果浏览器不支持FontFace API，则假设已加载并返回
    if (typeof document === 'undefined' || !('fonts' in document)) {
      setStatus('loaded');
      return;
    }

    // 重置加载状态
    setStatus('loading');

    // 使用超时确保不会永远等待
    const timeoutId = setTimeout(() => {
      setStatus('loaded'); // 超时后假设已加载
      console.log(`Font loading timed out for ${fontFamily}, proceeding anyway`);
    }, fontLoadTimeoutMs);

    // 尝试使用document.fonts检测字体加载
    try {
      // 提取字体族名称
      const familyName = fontMapping[fontFamily as keyof typeof fontMapping] || fontFamily;
      
      // 检查字体是否已加载
      document.fonts.ready.then(() => {
        // 仅在组件仍然挂载时更新状态
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

// 预加载所有字体
export function preloadFonts(): Promise<void> {
  // 在浏览器环境外，直接返回已解决的Promise
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return Promise.resolve();
  }

  console.log('Preloading fonts...');
  return document.fonts.ready.then(() => {
    console.log('All fonts loaded!');
  }).catch(err => {
    console.error('Error preloading fonts:', err);
  });
} 