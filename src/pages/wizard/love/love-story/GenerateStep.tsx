import React, { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage, getAllImagesFromStorage } from '@/integrations/supabase/storage';
import { CoverPreviewCard } from './components/CoverPreviewCard';
import { ContentImageCard } from './components/ContentImageCard';

interface ImageText {
  text: string;
  tone: string;
}

// Interface to track image storage locations
interface ImageStorageMap {
  [key: string]: {
    localStorageKey: string;
    url?: string;  // Supabase Storage URL
  };
}

// Interface for Supabase image objects
interface SupabaseImage {
  name: string;
  url: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  id: string;
}

interface ImagePrompt {
  question: string;
  prompt: string;
}

const GenerateStep = () => {
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [backCoverText, setBackCoverText] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [introImage, setIntroImage] = useState<string>();
  const [contentImage1, setContentImage1] = useState<string>();
  const [contentImage2, setContentImage2] = useState<string>();
  const [contentImage3, setContentImage3] = useState<string>();
  const [contentImage4, setContentImage4] = useState<string>();
  const [contentImage5, setContentImage5] = useState<string>();
  const [contentImage6, setContentImage6] = useState<string>();
  const [contentImage7, setContentImage7] = useState<string>();
  const [contentImage8, setContentImage8] = useState<string>();
  const [contentImage9, setContentImage9] = useState<string>();
  const [contentImage10, setContentImage10] = useState<string>();

  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isGeneratingIntro, setIsGeneratingIntro] = useState(false);
  const [isGeneratingContent1, setIsGeneratingContent1] = useState(false);
  const [isGeneratingContent2, setIsGeneratingContent2] = useState(false);
  const [isGeneratingContent3, setIsGeneratingContent3] = useState(false);
  const [isGeneratingContent4, setIsGeneratingContent4] = useState(false);
  const [isGeneratingContent5, setIsGeneratingContent5] = useState(false);
  const [isGeneratingContent6, setIsGeneratingContent6] = useState(false);
  const [isGeneratingContent7, setIsGeneratingContent7] = useState(false);
  const [isGeneratingContent8, setIsGeneratingContent8] = useState(false);
  const [isGeneratingContent9, setIsGeneratingContent9] = useState(false);
  const [isGeneratingContent10, setIsGeneratingContent10] = useState(false);

  const [selectedStyle, setSelectedStyle] = useState<string>('Photographic (Default)');
  const [imageTexts, setImageTexts] = useState<ImageText[]>([]);
  const [isGeneratingTexts, setIsGeneratingTexts] = useState(false);

  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [supabaseImages, setSupabaseImages] = useState<SupabaseImage[]>([]);

  const { toast } = useToast();

  const [imageStorageMap, setImageStorageMap] = useState<ImageStorageMap>({});

  const expandImage = async (imageUrl: string): Promise<string> => {
    try {
      console.log('Starting image expansion for:', imageUrl);
      const { data, error } = await supabase.functions.invoke('expand-image', {
        body: { 
          imageUrl,
          textPrompt: "The expanded area should be: very clean with no objects and shapes; suitable for text placement(clean background); soft gradient background matching the original image tone; seamless transition"
        }
      });
      
      if (error) throw error;
      if (!data?.imageData) {
        throw new Error("No imageData returned from expand-image");
      }
      
      return data.imageData;
    } catch (err) {
      console.error("Error expanding image:", err);
      throw err;
    }
  };

  const generateImageText = async (promptIndex: number) => {
    setIsGeneratingTexts(true);
    
    try {
      const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
      const savedTone = localStorage.getItem('loveStoryTone') || 'Heartfelt';
      const personName = localStorage.getItem('loveStoryPersonName');
      
      if (!savedPrompts) {
        throw new Error('No prompts found');
      }
      
      const prompts = JSON.parse(savedPrompts);
      const singlePrompt = promptIndex >= 0 && promptIndex < prompts.length 
        ? prompts[promptIndex] 
        : prompts[0];
      
      console.log(`Generating text for prompt index ${promptIndex}:`, singlePrompt);
      
      const { data, error } = await supabase.functions.invoke('generate-image-text', {
        body: { 
          prompts: [singlePrompt],
          tone: savedTone,
          personName
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data || !data.texts || !data.texts.length) {
        throw new Error('No text received from server');
      }
      
      console.log('Generated text response:', data);
      
      if (promptIndex >= 0) {
        const savedTextsJson = localStorage.getItem('loveStoryImageTexts');
        let currentTexts: ImageText[] = [];
        
        if (savedTextsJson) {
          try {
            currentTexts = JSON.parse(savedTextsJson);
          } catch (e) {
            console.error('Error parsing saved texts:', e);
            currentTexts = [];
          }
        }
        
        while (currentTexts.length <= promptIndex) {
          currentTexts.push({
            text: "A special moment captured in time.",
            tone: savedTone
          });
        }
        
        currentTexts[promptIndex] = data.texts[0];
        
        localStorage.setItem('loveStoryImageTexts', JSON.stringify(currentTexts));
        
        setImageTexts(currentTexts);
        
        console.log(`Updated text at index ${promptIndex}:`, data.texts[0]);
        return data.texts[0];
      } else {
        localStorage.setItem('loveStoryImageTexts', JSON.stringify(data.texts));
        setImageTexts(data.texts);
        return data.texts;
      }
    } catch (error) {
      console.error('Error generating image texts:', error);
      
      const savedTone = localStorage.getItem('loveStoryTone') || 'Heartfelt';
      const defaultText = {
        text: "A special moment captured in time.",
        tone: savedTone
      };
      
      if (promptIndex >= 0) {
        const savedTextsJson = localStorage.getItem('loveStoryImageTexts');
        let currentTexts: ImageText[] = [];
        
        if (savedTextsJson) {
          try {
            currentTexts = JSON.parse(savedTextsJson);
          } catch (e) {
            console.error('Error parsing saved texts:', e);
            currentTexts = [];
          }
        }
        
        while (currentTexts.length <= promptIndex) {
          currentTexts.push(defaultText);
        }
        
        currentTexts[promptIndex] = defaultText;
        
        localStorage.setItem('loveStoryImageTexts', JSON.stringify(currentTexts));
        setImageTexts(currentTexts);
        
        return defaultText;
      }
      
      return defaultText;
    } finally {
      setIsGeneratingTexts(false);
    }
  };

  const handleGenericContentRegeneration = async (index: number, style?: string) => {
    if (index < 1) return;

    const stateSetters = {
      1: setContentImage1,
      2: setContentImage2,
      3: setContentImage3,
      4: setContentImage4,
      5: setContentImage5,
      6: setContentImage6,
      7: setContentImage7,
      8: setContentImage8,
      9: setContentImage9,
      10: setContentImage10
    };

    const loadingSetters = {
      1: setIsGeneratingContent1,
      2: setIsGeneratingContent2,
      3: setIsGeneratingContent3,
      4: setIsGeneratingContent4, 
      5: setIsGeneratingContent5,
      6: setIsGeneratingContent6,
      7: setIsGeneratingContent7,
      8: setIsGeneratingContent8,
      9: setIsGeneratingContent9,
      10: setIsGeneratingContent10
    };

    const setContentFn = stateSetters[index as keyof typeof stateSetters];
    const setIsGenerating = loadingSetters[index as keyof typeof loadingSetters];
    if (!setContentFn || !setIsGenerating) return;

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
      return;
    }

    setIsGenerating(true);
    try {
      const prompts = JSON.parse(savedPrompts);
      const promptIndex = index <= prompts.length ? index : prompts.length - 1;
      if (!prompts[promptIndex]) {
        throw new Error(`No prompt found for content index ${promptIndex}`);
      }
      
      const imageStyle = style || selectedStyle;
      
      if (style) {
        setSelectedStyle(style);
        localStorage.setItem('loveStoryStyle', style);
      }

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
      
      if (error) throw error;

      console.log(`Content ${index} generation response:`, data);

      const imageUrl = data?.[`contentImage${index}`]?.[0] || data?.output?.[0];
      if (!imageUrl) {
        throw new Error("No image generated from generate-love-cover");
      }

      const expandedBase64 = await expandImage(imageUrl);

      const timestamp = Date.now();

      const storageUrl = await uploadImageToStorage(
        expandedBase64, 
        'images', 
        `love-story-content-${index}-${timestamp}`
      );

      setContentFn(expandedBase64);
      setImageStorageMap(prev => ({
        ...prev,
        [lsKey]: {
          localStorageKey: lsKey,
          url: storageUrl
        }
      }));

      localStorage.setItem(`${lsKey}_url`, storageUrl);

      const newText = await generateImageText(promptIndex);
      console.log(`Generated new text for image ${index}:`, newText);

      setTimeout(() => {
        loadImagesFromSupabase();
      }, 1000);

      toast({
        title: "Image regenerated & expanded",
        description: `Content ${index} successfully updated with ${imageStyle} style`,
      });
    } catch (err: any) {
      console.error("Error in handleGenericContentRegeneration:", err);
      toast({
        title: "Error regenerating image",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateContent1 = (style?: string) => handleGenericContentRegeneration(1, style);
  const handleRegenerateContent2 = (style?: string) => handleGenericContentRegeneration(2, style);
  const handleRegenerateContent3 = (style?: string) => handleGenericContentRegeneration(3, style);
  const handleRegenerateContent4 = (style?: string) => handleGenericContentRegeneration(4, style);
  const handleRegenerateContent5 = (style?: string) => handleGenericContentRegeneration(5, style);
  const handleRegenerateContent6 = (style?: string) => handleGenericContentRegeneration(6, style);
  const handleRegenerateContent7 = (style?: string) => handleGenericContentRegeneration(7, style);
  const handleRegenerateContent8 = (style?: string) => handleGenericContentRegeneration(8, style);
  const handleRegenerateContent9 = (style?: string) => handleGenericContentRegeneration(9, style);
  const handleRegenerateContent10 = (style?: string) => handleGenericContentRegeneration(10, style);

  const generateInitialImages = async (prompts: string, partnerPhoto: string) => {
    setIsGeneratingCover(true);
    setIsGeneratingIntro(true);
    toast({
      title: "Generating images",
      description: "This may take a minute...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: { 
          prompt: prompts, 
          contentPrompt: prompts,
          content2Prompt: prompts,
          photo: partnerPhoto,
          style: selectedStyle
        }
      });

      if (error) throw error;

      if (data?.output?.[0]) {
        const coverImageData = data.output[0];
        setCoverImage(coverImageData);
        
        const storageUrl = await uploadImageToStorage(
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
      }

      if (data?.contentImage?.[0]) {
        const introImageData = data.contentImage[0];
        setIntroImage(introImageData);
        
        const storageUrl = await uploadImageToStorage(
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
      }

      if (data?.contentImage2?.[0]) {
        const contentImage1Data = data.contentImage2[0];
        setContentImage1(contentImage1Data);
        
        const storageUrl = await uploadImageToStorage(
          contentImage1Data, 
          'images', 
          'love-story-content-1'
        );
        
        setImageStorageMap(prev => ({
          ...prev,
          ['loveStoryContentImage1']: {
            localStorageKey: 'loveStoryContentImage1',
            url: storageUrl
          }
        }));
        
        localStorage.setItem('loveStoryContentImage1_url', storageUrl);
      }

      toast({
        title: "Images generated",
        description: "Your images are ready!",
      });
    } catch (error) {
      console.error('Error generating images:', error);
      toast({
        title: "Error generating images",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCover(false);
      setIsGeneratingIntro(false);
    }
  };

  const loadImagesFromSupabase = async () => {
    setIsLoadingImages(true);
    try {
      const images = await getAllImagesFromStorage('images');
      setSupabaseImages(images);
      
      const newImageMap: ImageStorageMap = {};
      
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
        } else if (/^love-story-content-1$|^love-story-content-1-/.test(fileName)) {
          setContentImage1(img.url);
          newImageMap['loveStoryContentImage1'] = {
            localStorageKey: 'loveStoryContentImage1',
            url: img.url
          };
        } else if (/^love-story-content-2$|^love-story-content-2-/.test(fileName)) {
          setContentImage2(img.url);
          newImageMap['loveStoryContentImage2'] = {
            localStorageKey: 'loveStoryContentImage2',
            url: img.url
          };
        } else if (/^love-story-content-3$|^love-story-content-3-/.test(fileName)) {
          setContentImage3(img.url);
          newImageMap['loveStoryContentImage3'] = {
            localStorageKey: 'loveStoryContentImage3',
            url: img.url
          };
        } else if (/^love-story-content-4$|^love-story-content-4-/.test(fileName)) {
          setContentImage4(img.url);
          newImageMap['loveStoryContentImage4'] = {
            localStorageKey: 'loveStoryContentImage4',
            url: img.url
          };
        } else if (/^love-story-content-5$|^love-story-content-5-/.test(fileName)) {
          setContentImage5(img.url);
          newImageMap['loveStoryContentImage5'] = {
            localStorageKey: 'loveStoryContentImage5',
            url: img.url
          };
        } else if (/^love-story-content-6$|^love-story-content-6-/.test(fileName)) {
          setContentImage6(img.url);
          newImageMap['loveStoryContentImage6'] = {
            localStorageKey: 'loveStoryContentImage6',
            url: img.url
          };
        } else if (/^love-story-content-7$|^love-story-content-7-/.test(fileName)) {
          setContentImage7(img.url);
          newImageMap['loveStoryContentImage7'] = {
            localStorageKey: 'loveStoryContentImage7',
            url: img.url
          };
        } else if (/^love-story-content-8$|^love-story-content-8-/.test(fileName)) {
          setContentImage8(img.url);
          newImageMap['loveStoryContentImage8'] = {
            localStorageKey: 'loveStoryContentImage8',
            url: img.url
          };
        } else if (/^love-story-content-9$|^love-story-content-9-/.test(fileName)) {
          setContentImage9(img.url);
          newImageMap['loveStoryContentImage9'] = {
            localStorageKey: 'loveStoryContentImage9',
            url: img.url
          };
        } else if (/^love-story-content-10$|^love-story-content-10-/.test(fileName)) {
          setContentImage10(img.url);
          newImageMap['loveStoryContentImage10'] = {
            localStorageKey: 'loveStoryContentImage10',
            url: img.url
          };
        }
      });
      
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

  useEffect(() => {
    const savedAuthor = localStorage.getItem('loveStoryAuthorName');
    const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
    const savedMoments = localStorage.getItem('loveStoryMoments');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const savedStyle = localStorage.getItem('loveStoryStyle');
    const savedTexts = localStorage.getItem('loveStoryImageTexts');
    
    loadImagesFromSupabase();

    if (savedAuthor) {
      setAuthorName(savedAuthor);
    }

    if (savedStyle) {
      const styleMapping: Record<string, string> = {
        'Comic Book': 'Comic book',
        'Line Art': 'Line art',
        'Fantasy Art': 'Fantasy art',
        'Photographic': 'Photographic (Default)',
        'Cinematic': 'Cinematic'
      };
      
      const normalizedStyle = styleMapping[savedStyle] || savedStyle;
      setSelectedStyle(normalizedStyle);
      
      if (normalizedStyle !== savedStyle) {
        localStorage.setItem('loveStoryStyle', normalizedStyle);
      }
    }

    if (savedTexts) {
      try {
        setImageTexts(JSON.parse(savedTexts));
      } catch (error) {
        console.error('Error parsing saved texts:', error);
      }
    }

    if (savedIdeas && savedIdeaIndex) {
      const ideas = JSON.parse(savedIdeas);
      const selectedIdea = ideas[parseInt(savedIdeaIndex)];
      if (selectedIdea) {
        setCoverTitle(selectedIdea.title || '');
        setSubtitle(selectedIdea.description || '');
      }
    }

    if (savedMoments) {
      const moments = JSON.parse(savedMoments);
      const formattedMoments = moments
        .map((moment: string) => `"${moment}"`)
        .join('\n\n');
      setBackCoverText(formattedMoments);
    }
  }, []);

  const handleEditCover = () => {
    toast({
      title: "Edit Cover",
      description: "Opening cover editor..."
    });
  };

  const handleEditText = () => {
    toast({
      title: "Edit Text",
      description: "Opening text editor..."
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
            
            setCoverImage(coverImageData);
            
            const timestamp = Date.now();
            
            const storageUrl = await uploadImageToStorage(
              coverImageData, 
              'images', 
              `love-story-cover-${timestamp}`
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
        } finally {
          setIsGeneratingCover(false);
        }
      }
    }
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
            
            setIntroImage(introImageData);
            
            const timestamp = Date.now();
            
            const storageUrl = await uploadImageToStorage(
              introImageData, 
              'images', 
              `love-story-intro-${timestamp}`
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
        } finally {
          setIsGeneratingIntro(false);
        }
      }
    }
  };

  const handleUpdateContentText = (index: number, newText: string) => {
    const savedTextsJson = localStorage.getItem('loveStoryImageTexts');
    let currentTexts: ImageText[] = [];
    
    if (savedTextsJson) {
      try {
        currentTexts = JSON.parse(savedTextsJson);
      } catch (e) {
        console.error('Error parsing saved texts:', e);
        currentTexts = [];
      }
    }
    
    const savedTone = localStorage.getItem('loveStoryTone') || 'Heartfelt';
    
    while (currentTexts.length <= index) {
      currentTexts.push({
        text: "A special moment captured in time.",
        tone: savedTone
      });
    }
    
    currentTexts[index] = {
      text: newText,
      tone: savedTone
    };
    
    localStorage.setItem('loveStoryImageTexts', JSON.stringify(currentTexts));
    
    setImageTexts(currentTexts);
    
    toast({
      title: "Text updated",
      description: `Caption for image ${index} has been updated.`,
    });
  };

  const renderContentImage = (imageIndex: number) => {
    const imageStateMap: Record<number, string | undefined> = {
      0: introImage,
      1: contentImage1,
      2: contentImage2,
      3: contentImage3,
      4: contentImage4,
      5: contentImage5,
      6: contentImage6,
      7: contentImage7,
      8: contentImage8,
      9: contentImage9,
      10: contentImage10,
    };
    
    const loadingStateMap: Record<number, boolean> = {
      0: isGeneratingIntro,
      1: isGeneratingContent1,
      2: isGeneratingContent2,
      3: isGeneratingContent3,
      4: isGeneratingContent4, 
      5: isGeneratingContent5,
      6: isGeneratingContent6,
      7: isGeneratingContent7,
      8: isGeneratingContent8,
      9: isGeneratingContent9,
      10: isGeneratingContent10,
    };
    
    const handleRegenerateMap: Record<number, (style?: string) => void> = {
      0: handleRegenerateIntro,
      1: handleRegenerateContent1,
      2: handleRegenerateContent2,
      3: handleRegenerateContent3,
      4: handleRegenerateContent4,
      5: handleRegenerateContent5,
      6: handleRegenerateContent6,
      7: handleRegenerateContent7,
      8: handleRegenerateContent8,
      9: handleRegenerateContent9,
      10: handleRegenerateContent10,
    };
    
    const image = imageStateMap[imageIndex];
    const isLoading = loadingStateMap[imageIndex];
    const handleRegenerate = handleRegenerateMap[imageIndex];
    
    let imageText = null;
    if (imageTexts && imageTexts.length > imageIndex) {
      imageText = imageTexts[imageIndex]?.text;
    }
    
    console.log(`Rendering image ${imageIndex} with text:`, imageText);
    
    let title = imageIndex === 0 ? "Introduction" : `Moment ${imageIndex}`;
    
    return (
      <div className="mb-10">
        <ContentImageCard 
          image={image} 
          isGenerating={isLoading}
          onRegenerate={handleRegenerate}
          index={imageIndex}
          onEditText={() => {}}
          onTextUpdate={(text) => handleUpdateContentText(imageIndex, text)}
          text={imageText}
          title={title}
        />
      </div>
    );
  };

  const refreshImages = () => {
    loadImagesFromSupabase();
    toast({
      title: "Refreshing images",
      description: "Loading latest images from Supabase Storage",
    });
  };

  return (
    <WizardStep
      title="Your Love Story Images"
      description="Here are your personalized love story images with accompanying text."
      previousStep="/create/love/love-story/moments"
      nextStep="/create/love/love-story/preview"
      currentStep={4}
      totalSteps={4}
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-4 flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshImages}
            disabled={isLoadingImages}
          >
            {isLoadingImages ? 'Loading...' : 'Refresh Images'}
          </Button>
        </div>
      
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Cover</h2>
          <CoverPreviewCard 
            coverImage={coverImage}
            coverTitle={coverTitle}
            subtitle={subtitle}
            authorName={authorName}
            backCoverText={backCoverText}
            isGeneratingCover={isGeneratingCover}
            onRegenerateCover={handleRegenerateCover}
            onEditCover={() => {}}
          />
        </div>
        
        <div className="mb-12 border-t-2 border-gray-200 pt-8">
          <h2 className="text-2xl font-bold mb-6">Introduction</h2>
          <div className="mb-10">
            <ContentImageCard 
              image={introImage} 
              isGenerating={isGeneratingIntro}
              onRegenerate={handleRegenerateIntro}
              index={0}
              onEditText={() => {}}
              onTextUpdate={(text) => handleUpdateContentText(0, text)}
              text={imageTexts && imageTexts.length > 0 ? imageTexts[0]?.text : undefined}
              title="Introduction"
            />
          </div>
        </div>
        
        <div className="border-t-2 border-gray-200 pt-8">
          <h2 className="text-2xl font-bold mb-6">Story Moments</h2>
          <div className="space-y-8">
            {renderContentImage(1)}
            {renderContentImage(2)}
            {renderContentImage(3)}
            {renderContentImage(4)}
            {renderContentImage(5)}
            {renderContentImage(6)}
            {renderContentImage(7)}
            {renderContentImage(8)}
            {renderContentImage(9)}
            {renderContentImage(10)}
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default GenerateStep;
