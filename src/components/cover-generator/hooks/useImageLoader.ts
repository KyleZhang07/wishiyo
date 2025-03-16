import { useState, useEffect } from 'react';

interface LoadedImage {
  element: HTMLImageElement;
  loaded: Promise<void>;
}

export const useImageLoader = (imageSrc: string | undefined) => {
  const [image, setImage] = useState<LoadedImage | null>(null);

  useEffect(() => {
    if (!imageSrc) {
      setImage(null);
      return;
    }

    const img = new Image();
    const loadPromise = new Promise<void>((resolve) => {
      img.onload = () => {
        resolve();
      };
    });

    img.src = imageSrc;
    setImage({ element: img, loaded: loadPromise });
  }, [imageSrc]);

  return image;
};
