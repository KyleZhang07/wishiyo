
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAllImagesFromStorage } from '@/integrations/supabase/storage';
import { ImageStorageMap } from './useImageGeneration';

interface SupabaseImage {
  name: string;
  url: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  id: string;
}

interface UseSupabaseImagesReturn {
  coverImage?: string;
  introImage?: string;
  contentImages: {[key: number]: string | undefined};
  imageStorageMap: ImageStorageMap;
  isLoadingImages: boolean;
  loadImagesFromSupabase: () => Promise<void>;
  setImageFunction: (type: 'cover' | 'intro' | number, value: string | undefined) => void;
}

export const useSupabaseImages = (): UseSupabaseImagesReturn => {
  const [coverImage, setCoverImage] = useState<string>();
  const [introImage, setIntroImage] = useState<string>();
  const [contentImages, setContentImages] = useState<{[key: number]: string | undefined}>({});
  const [imageStorageMap, setImageStorageMap] = useState<ImageStorageMap>({});
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [supabaseImages, setSupabaseImages] = useState<SupabaseImage[]>([]);
  const { toast } = useToast();

  const setImageFunction = (type: 'cover' | 'intro' | number, value: string | undefined) => {
    if (type === 'cover') {
      setCoverImage(value);
    } else if (type === 'intro') {
      setIntroImage(value);
    } else if (typeof type === 'number') {
      setContentImages(prev => ({...prev, [type]: value}));
    }
  };

  const loadImagesFromSupabase = async () => {
    setIsLoadingImages(true);
    try {
      const images = await getAllImagesFromStorage('images');
      setSupabaseImages(images);
      
      const newImageMap: ImageStorageMap = {};
      const newContentImages: {[key: number]: string | undefined} = {};
      
      images.forEach(img => {
        const pathParts = img.name.split('/');
        const fileName = pathParts[pathParts.length - 1];
        
        if (/^love-story-cover/.test(fileName)) {
          setCoverImage(img.url);
          newImageMap['loveStoryCoverImage'] = {
            localStorageKey: 'loveStoryCoverImage',
            url: img.url
          };
        } else if (/^love-story-intro/.test(fileName)) {
          setIntroImage(img.url);
          newImageMap['loveStoryIntroImage'] = {
            localStorageKey: 'loveStoryIntroImage',
            url: img.url
          };
        } else {
          // Handle content images (1-10)
          for (let i = 1; i <= 10; i++) {
            const regex = new RegExp(`^love-story-content-${i}$|^love-story-content-${i}-`);
            if (regex.test(fileName)) {
              newContentImages[i] = img.url;
              newImageMap[`loveStoryContentImage${i}`] = {
                localStorageKey: `loveStoryContentImage${i}`,
                url: img.url
              };
              break;
            }
          }
        }
      });
      
      setContentImages(newContentImages);
      setImageStorageMap(newImageMap);
    } catch (error) {
      console.error('Error loading images from Supabase:', error);
      toast({
        title: "Error loading images",
        description: "Failed to load images from Supabase storage",
        variant: "destructive",
      });
    } finally {
      setIsLoadingImages(false);
    }
  };

  return {
    coverImage,
    introImage,
    contentImages,
    imageStorageMap,
    isLoadingImages,
    loadImagesFromSupabase,
    setImageFunction
  };
};
