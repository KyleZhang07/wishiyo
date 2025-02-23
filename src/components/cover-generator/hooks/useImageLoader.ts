
import { useState, useEffect } from 'react';

interface LoadedImage {
  element: HTMLImageElement;
}

export const useImageLoader = (imageSrc: string | undefined) => {
  const [image, setImage] = useState<LoadedImage | null>(null);

  useEffect(() => {
    if (!imageSrc) {
      setImage(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      setImage({ element: img });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  return image;
};
