import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { preloadFonts } from '@/hooks/useFontLoader';

interface FontContextType {
  fontsLoaded: boolean;
  fontStatus: 'loading' | 'loaded' | 'error';
}

const FontContext = createContext<FontContextType>({
  fontsLoaded: false,
  fontStatus: 'loading',
});

export const useFontContext = () => useContext(FontContext);

// 在模块级别开始预加载字体，而不是等待组件挂载
// 创建一个字体预加载承诺，可以在组件外部使用
const fontPreloadPromise = typeof window !== 'undefined' ? preloadFonts() : Promise.resolve();

export const FontProvider = ({ children }: { children: ReactNode }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontStatus, setFontStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setFontStatus('loading');

    // 使用已经开始的字体加载承诺
    fontPreloadPromise
      .then(() => {
        if (!cancelled) {
          setFontsLoaded(true);
          setFontStatus('loaded');
          console.log('All fonts loaded successfully in FontContext');
        }
      })
      .catch((error) => {
        console.error('Font loading error in FontContext:', error);
        if (!cancelled) {
          setFontsLoaded(true); // 允许降级
          setFontStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FontContext.Provider value={{ fontsLoaded, fontStatus }}>
      {children}
    </FontContext.Provider>
  );
};
