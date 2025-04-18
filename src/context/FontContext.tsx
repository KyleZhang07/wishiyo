import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

export const FontProvider = ({ children }: { children: ReactNode }) => {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [fontStatus, setFontStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setFontStatus('loading');
    preloadFonts()
      .then(() => {
        if (!cancelled) {
          setFontsLoaded(true);
          setFontStatus('loaded');
        }
      })
      .catch(() => {
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
