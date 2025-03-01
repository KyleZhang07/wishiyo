
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { expandImage, generateImageText, uploadAndSaveImage } from '../utils/imageUtils';

export interface ImageText {
  text: string;
  tone: string;
}

export interface ImageStorageMap {
  [key: string]: {
    localStorageKey: string;
    url?: string;
  };
}

interface UseImageGenerationProps {
  selectedStyle: string;
  setSelectedStyle: (style: string) => void;
  imageTexts: ImageText[];
  setImageTexts: (texts: ImageText[]) => void;
  setImageStorageMap: (map: (prev: ImageStorageMap) => ImageStorageMap) => void;
  loadImagesFromSupabase: () => void;
}

export const useImageGeneration = ({
  selectedStyle,
  setSelectedStyle,
  imageTexts,
  setImageTexts,
  setImageStorageMap,
  loadImagesFromSupabase
}: UseImageGenerationProps) => {
  const { toast } = useToast();
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isGeneratingIntro, setIsGeneratingIntro] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState<{[key: number]: boolean}>({});

  const updateImageText = (index: number, newText: ImageText) => {
    const updatedTexts = [...imageTexts];
    
    // Ensure the array is large enough
    while (updatedTexts.length <= index) {
      updatedTexts.push({
        text: "A special moment captured in time.",
        tone: localStorage.getItem('loveStoryTone') || 'Heartfelt'
      });
    }
    
    updatedTexts[index] = newText;
    setImageTexts(updatedTexts);
    
    // Save to localStorage
    localStorage.setItem('loveStoryImageTexts', JSON.stringify(updatedTexts));
    
    return updatedTexts;
  };

  const handleUpdateContentText = (index: number, newText: string) => {
    const savedTone = localStorage.getItem('loveStoryTone') || 'Heartfelt';
    
    updateImageText(index, {
      text: newText,
      tone: savedTone
    });
    
    toast({
      title: "Text updated",
      description: `Caption for image ${index} has been updated.`,
    });
  };

  const handleRegenerateCover = async (style?: string) => {
    localStorage.removeItem('loveStoryCoverImage');
    localStorage.removeItem('loveStoryCoverImage_url');
    
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const characterPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && characterPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 0) {
        setIsGeneratingCover(true);
        
        const imageStyle = style || selectedStyle;
        
        if (style) {
          setSelectedStyle(style);
          localStorage.setItem('loveStoryStyle', style);
        }
        
        try {
          const requestBody = { 
            prompt: prompts[0].prompt, 
            photo: characterPhoto,
            style: imageStyle,
            type: 'cover'
          };

          console.log('Cover generation request:', JSON.stringify(requestBody));
          
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: requestBody
          });
          
          if (error) throw error;

          console.log('Cover generation response:', data);

          let coverImageData = '';
          if (data?.output && data.output.length > 0) {
            coverImageData = data.output[0];
          } else if (data?.coverImage && data.coverImage.length > 0) {
            coverImageData = data.coverImage[0];
          } else {
            throw new Error("No cover image data in response");
          }
          
          if (coverImageData) {
            try {
              const expandedBase64 = await expandImage(coverImageData);
              coverImageData = expandedBase64;
            } catch (expandError) {
              console.error("Error expanding cover image:", expandError);
            }
            
            const storageUrl = await uploadAndSaveImage(
              coverImageData, 
              'images', 
              'love-story-cover'
            );
            
            setImageStorageMap(prev => ({
              ...prev,
              ['loveStoryCoverImage']: {
                localStorageKey: 'loveStoryCoverImage',
                url: storageUrl
              }
            }));
            
            localStorage.setItem('loveStoryCoverImage_url', storageUrl);

            setTimeout(() => {
              loadImagesFromSupabase();
            }, 1000);
            
            toast({
              title: "Cover regenerated",
              description: `Cover updated with ${imageStyle} style`,
            });
            
            return coverImageData;
          } else {
            throw new Error("Failed to generate cover image");
          }
        } catch (error: any) {
          console.error('Error regenerating cover:', error);
          toast({
            title: "Error regenerating cover image",
            description: error.message || "Please try again",
            variant: "destructive",
          });
          throw error;
        } finally {
          setIsGeneratingCover(false);
        }
      }
    }
    return null;
  };

  const handleRegenerateIntro = async (style?: string) => {
    localStorage.removeItem('loveStoryIntroImage');
    localStorage.removeItem('loveStoryIntroImage_url');
    
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const characterPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && characterPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 1) {
        setIsGeneratingIntro(true);
        
        const imageStyle = style || selectedStyle;
        
        if (style) {
          setSelectedStyle(style);
          localStorage.setItem('loveStoryStyle', style);
        }
        
        try {
          const requestBody = {
            contentPrompt: prompts[1].prompt, 
            photo: characterPhoto,
            style: imageStyle,
            type: 'intro'
          };

          console.log('Intro generation request:', JSON.stringify(requestBody));
          
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: requestBody
          });
          
          if (error) throw error;
          
          console.log('Intro generation response:', data);
          
          let introImageData = '';
          if (data?.contentImage && data.contentImage.length > 0) {
            introImageData = data.contentImage[0];
          } else if (data?.output && data.output.length > 0) {
            introImageData = data.output[0];
          } else if (data?.introImage && data.introImage.length > 0) {
            introImageData = data.introImage[0];
          } else {
            throw new Error("No intro image data in response");
          }
          
          if (introImageData) {
            try {
              const expandedBase64 = await expandImage(introImageData);
              introImageData = expandedBase64;
            } catch (expandError) {
              console.error("Error expanding intro image:", expandError);
            }
            
            const storageUrl = await uploadAndSaveImage(
              introImageData, 
              'images', 
              'love-story-intro'
            );
            
            setImageStorageMap(prev => ({
              ...prev,
              ['loveStoryIntroImage']: {
                localStorageKey: 'loveStoryIntroImage',
                url: storageUrl
              }
            }));
            
            localStorage.setItem('loveStoryIntroImage_url', storageUrl);
            
            setTimeout(() => {
              loadImagesFromSupabase();
            }, 1000);
            
            toast({
              title: "Introduction image regenerated",
              description: `Intro image updated with ${imageStyle} style`,
            });
            
            return introImageData;
          } else {
            throw new Error("Failed to generate intro image");
          }
        } catch (error: any) {
          console.error('Error regenerating intro image:', error);
          toast({
            title: "Error regenerating intro image",
            description: error.message || "Please try again",
            variant: "destructive",
          });
          throw error;
        } finally {
          setIsGeneratingIntro(false);
        }
      }
    }
    return null;
  };

  const handleGenerateContentImage = async (index: number, style?: string) => {
    if (index < 1) return null;

    const lsKey = `loveStoryContentImage${index}`;
    localStorage.removeItem(lsKey);

    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const characterPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (!savedPrompts || !characterPhoto) {
      toast({
        title: "Missing info",
        description: "No prompts or character photo found",
        variant: "destructive",
      });
      return null;
    }

    setIsGeneratingContent(prev => ({...prev, [index]: true}));
    try {
      console.log(`Starting regeneration for content image ${index}`);
      const prompts = JSON.parse(savedPrompts);
      // Ensure promptIndex calculation is correct (0-based for prompts array)
      const promptIndex = index - 1;
      
      console.log(`Using prompt index ${promptIndex} for content image ${index}`);
      
      if (!prompts[promptIndex]) {
        console.error(`No prompt found at index ${promptIndex}`);
        throw new Error(`No prompt found for content index ${promptIndex}`);
      }
      
      const imageStyle = style || selectedStyle;
      
      if (style) {
        setSelectedStyle(style);
        localStorage.setItem('loveStoryStyle', style);
      }

      // First generate image text
      console.log(`Generating text for prompt index ${promptIndex}, image index ${index}`);
      const newText = await generateImageText(promptIndex);
      console.log(`Generated new text for image ${index}:`, newText);

      // Update text immediately
      updateImageText(promptIndex, newText);

      // Then generate the image
      const requestBody = {
        prompt: prompts[promptIndex].prompt,
        photo: characterPhoto,
        style: imageStyle,
        contentIndex: index,
        type: 'content'
      };

      console.log(`Content ${index} generation request:`, JSON.stringify(requestBody));

      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: requestBody
      });
      
      if (error) {
        console.error('Error generating image:', error);
        throw error;
      }

      console.log(`Content ${index} generation response:`, data);

      const imageUrl = data?.[`contentImage${index}`]?.[0] || data?.output?.[0];
      if (!imageUrl) {
        console.error('No image URL in response:', data);
        throw new Error("No image generated from generate-love-cover");
      }

      const expandedBase64 = await expandImage(imageUrl);
      const storageUrl = await uploadAndSaveImage(
        expandedBase64, 
        'images', 
        `love-story-content-${index}`
      );

      setImageStorageMap(prev => ({
        ...prev,
        [lsKey]: {
          localStorageKey: lsKey,
          url: storageUrl
        }
      }));

      localStorage.setItem(`${lsKey}_url`, storageUrl);

      setTimeout(() => {
        loadImagesFromSupabase();
      }, 1000);

      toast({
        title: "Image regenerated & expanded",
        description: `Content ${index} successfully updated with ${imageStyle} style`,
      });
      
      return expandedBase64;
    } catch (err: any) {
      console.error(`Error in handleGenerateContentImage(${index}):`, err);
      toast({
        title: "Error regenerating image",
        description: err.message || "Please try again",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGeneratingContent(prev => ({...prev, [index]: false}));
    }
  };

  return {
    isGeneratingCover,
    isGeneratingIntro,
    isGeneratingContent,
    handleRegenerateCover,
    handleRegenerateIntro,
    handleGenerateContentImage,
    handleUpdateContentText
  };
};
