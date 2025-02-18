
import { useState, useEffect } from 'react';
import { CanvasImage } from '../types';

export const useImageLoader = (
  coverImage: string | undefined,
  imageScale: number,
  imagePosition: { x: number, y: number }
) => {
  const [image, setImage] = useState<CanvasImage | null>(null);

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  useEffect(() => {
    const initImage = async () => {
      if (coverImage) {
        try {
          const img = await loadImage(coverImage);
          setImage({
            element: img,
            scale: imageScale,
            position: imagePosition
          });
        } catch (error) {
          console.error('Failed to load image:', error);
        }
      }
    };

    initImage();
  }, [coverImage, imageScale, imagePosition]);

  return image;
};
