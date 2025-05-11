import { useState, useEffect } from 'react';

interface LoadedImage {
  element: HTMLImageElement;
  loaded: Promise<void>;
  isLoaded: boolean; // 新增：标记图片是否已加载完成
  error: boolean;   // 新增：标记加载是否出错
}

export const useImageLoader = (imageSrc: string | undefined) => {
  const [image, setImage] = useState<LoadedImage | null>(null);

  useEffect(() => {
    if (!imageSrc) {
      setImage(null);
      return;
    }

    // 创建新的图片实例
    const img = new Image();
    
    // 初始状态：未加载完成，无错误
    let imageState: LoadedImage = {
      element: img,
      loaded: Promise.resolve(),
      isLoaded: false,
      error: false
    };
    
    // 创建加载完成的 Promise
    const loadPromise = new Promise<void>((resolve, reject) => {
      img.onload = () => {
        // 图片加载完成，更新状态
        setImage(prevState => {
          if (prevState?.element === img) {
            return { ...prevState, isLoaded: true };
          }
          return prevState;
        });
        resolve();
      };
      
      img.onerror = (err) => {
        // 图片加载失败，标记错误
        console.error(`Failed to load image: ${imageSrc}`, err);
        setImage(prevState => {
          if (prevState?.element === img) {
            return { ...prevState, error: true };
          }
          return prevState;
        });
        reject(new Error(`Failed to load image: ${imageSrc}`));
      };
    });
    
    // 设置初始状态
    imageState.loaded = loadPromise;
    setImage(imageState);
    
    // 设置图片源，开始加载
    img.src = imageSrc;
    
    // 清理函数
    return () => {
      // 如果组件卸载，取消图片加载（通过设置空src）
      if (!img.complete) {
        img.src = '';
      }
    };
  }, [imageSrc]);

  return image;
};
