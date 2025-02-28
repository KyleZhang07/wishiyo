import React, { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage } from '@/integrations/supabase/storage';
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

  const { toast } = useToast();

  // Add state for tracking Supabase image URLs
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

    const lsKey = `loveStoryContentImage${index+1}`;
    
    // Clear existing localStorage entry
    localStorage.removeItem(lsKey);

    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (!savedPrompts || !partnerPhoto) {
      toast({
        title: "Missing info",
        description: "No prompts or partner photo found",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prompts = JSON.parse(savedPrompts);
      if (!prompts[index+1]) {
        throw new Error(`No prompt found for content index ${index+1}`);
      }
      
      // Use the provided style or fall back to the stored/default style
      const imageStyle = style || selectedStyle;
      
      // Update the stored style if a new one is provided
      if (style) {
        setSelectedStyle(style);
        localStorage.setItem('loveStoryStyle', style);
      }

      // Include style in the request
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: { 
          prompt: prompts[index+1].prompt,
          photo: partnerPhoto,
          style: imageStyle
        }
      });
      if (error) throw error;

      // 后端可能返回 { output: [...]} 或 { contentImageX: [...] }
      const imageUrl = data?.[`contentImage${index+1}`]?.[0] || data?.output?.[0];
      if (!imageUrl) {
        throw new Error("No image generated from generate-love-cover");
      }

      // 2) 调用expand-image进行扩展
      const expandedBase64 = await expandImage(imageUrl);

      // 3) Upload to Supabase Storage instead of localStorage
      const storageUrl = await uploadImageToStorage(
        expandedBase64, 
        'images', 
        `love-story-content-${index}`
      );

      // 4) Update state and storage map
      setContentFn(expandedBase64);
      setImageStorageMap(prev => ({
        ...prev,
        [lsKey]: {
          localStorageKey: lsKey,
          url: storageUrl
        }
      }));

      // 5) Store only the URL reference in localStorage, not the actual image
      localStorage.setItem(`${lsKey}_url`, storageUrl);

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
        
        // Upload to Supabase Storage
        const storageUrl = await uploadImageToStorage(
          coverImageData, 
          'images', 
          'love-story-cover'
        );
        
        // Update storage map
        setImageStorageMap(prev => ({
          ...prev,
          ['loveStoryCoverImage']: {
            localStorageKey: 'loveStoryCoverImage',
            url: storageUrl
          }
        }));
        
        // Store only the URL reference in localStorage
        localStorage.setItem('loveStoryCoverImage_url', storageUrl);
      }

      if (data?.contentImage?.[0]) {
        const introImageData = data.contentImage[0];
        setIntroImage(introImageData);
        
        // Upload to Supabase Storage
        const storageUrl = await uploadImageToStorage(
          introImageData, 
          'images', 
          'love-story-intro'
        );
        
        // Update storage map
        setImageStorageMap(prev => ({
          ...prev,
          ['loveStoryIntroImage']: {
            localStorageKey: 'loveStoryIntroImage',
            url: storageUrl
          }
        }));
        
        // Store only the URL reference in localStorage
        localStorage.setItem('loveStoryIntroImage_url', storageUrl);
      }

      if (data?.contentImage2?.[0]) {
        const contentImage1Data = data.contentImage2[0];
        setContentImage1(contentImage1Data);
        
        // Upload to Supabase Storage
        const storageUrl = await uploadImageToStorage(
          contentImage1Data, 
          'images', 
          'love-story-content-1'
        );
        
        // Update storage map
        setImageStorageMap(prev => ({
          ...prev,
          ['loveStoryContentImage1']: {
            localStorageKey: 'loveStoryContentImage1',
            url: storageUrl
          }
        }));
        
        // Store only the URL reference in localStorage
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

  useEffect(() => {
    const savedAuthor = localStorage.getItem('loveStoryAuthorName');
    const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
    const savedMoments = localStorage.getItem('loveStoryMoments');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const savedStyle = localStorage.getItem('loveStoryStyle');
    const savedTexts = localStorage.getItem('loveStoryImageTexts');
    
    // Load images - first try from localStorage_url references
    const savedCoverImageUrl = localStorage.getItem('loveStoryCoverImage_url');
    const savedIntroImageUrl = localStorage.getItem('loveStoryIntroImage_url');
    const savedContentImage1Url = localStorage.getItem('loveStoryContentImage1_url');
    const savedContentImage2Url = localStorage.getItem('loveStoryContentImage2_url');
    const savedContentImage3Url = localStorage.getItem('loveStoryContentImage3_url');
    const savedContentImage4Url = localStorage.getItem('loveStoryContentImage4_url');
    const savedContentImage5Url = localStorage.getItem('loveStoryContentImage5_url');
    const savedContentImage6Url = localStorage.getItem('loveStoryContentImage6_url');
    const savedContentImage7Url = localStorage.getItem('loveStoryContentImage7_url');
    const savedContentImage8Url = localStorage.getItem('loveStoryContentImage8_url');
    const savedContentImage9Url = localStorage.getItem('loveStoryContentImage9_url');
    const savedContentImage10Url = localStorage.getItem('loveStoryContentImage10_url');
    
    // Fallback to actual images in localStorage
    const savedCoverImage = localStorage.getItem('loveStoryCoverImage');
    const savedIntroImage = localStorage.getItem('loveStoryIntroImage');
    const savedContentImage1 = localStorage.getItem('loveStoryContentImage1');
    const savedContentImage2 = localStorage.getItem('loveStoryContentImage2');
    const savedContentImage3 = localStorage.getItem('loveStoryContentImage3');
    const savedContentImage4 = localStorage.getItem('loveStoryContentImage4');
    const savedContentImage5 = localStorage.getItem('loveStoryContentImage5');
    const savedContentImage6 = localStorage.getItem('loveStoryContentImage6');
    const savedContentImage7 = localStorage.getItem('loveStoryContentImage7');
    const savedContentImage8 = localStorage.getItem('loveStoryContentImage8');
    const savedContentImage9 = localStorage.getItem('loveStoryContentImage9');
    const savedContentImage10 = localStorage.getItem('loveStoryContentImage10');
    
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    
    // Ensure we have a recipient name stored
    const savedQuestions = localStorage.getItem('loveStoryQuestions');
    
    // Build the image storage map
    const updatedStorageMap: ImageStorageMap = {};
    
    // For each image, check URL first, then localStorage data
    if (savedCoverImageUrl) {
      updatedStorageMap['loveStoryCoverImage'] = {
        localStorageKey: 'loveStoryCoverImage',
        url: savedCoverImageUrl
      };
    }
    
    if (savedIntroImageUrl) {
      updatedStorageMap['loveStoryIntroImage'] = {
        localStorageKey: 'loveStoryIntroImage',
        url: savedIntroImageUrl
      };
    }
    
    if (savedContentImage1Url) {
      updatedStorageMap['loveStoryContentImage1'] = {
        localStorageKey: 'loveStoryContentImage1',
        url: savedContentImage1Url
      };
    }
    
    if (savedContentImage2Url) {
      updatedStorageMap['loveStoryContentImage2'] = {
        localStorageKey: 'loveStoryContentImage2',
        url: savedContentImage2Url
      };
    }
    
    if (savedContentImage3Url) {
      updatedStorageMap['loveStoryContentImage3'] = {
        localStorageKey: 'loveStoryContentImage3',
        url: savedContentImage3Url
      };
    }
    
    if (savedContentImage4Url) {
      updatedStorageMap['loveStoryContentImage4'] = {
        localStorageKey: 'loveStoryContentImage4',
        url: savedContentImage4Url
      };
    }
    
    if (savedContentImage5Url) {
      updatedStorageMap['loveStoryContentImage5'] = {
        localStorageKey: 'loveStoryContentImage5',
        url: savedContentImage5Url
      };
    }
    
    if (savedContentImage6Url) {
      updatedStorageMap['loveStoryContentImage6'] = {
        localStorageKey: 'loveStoryContentImage6',
        url: savedContentImage6Url
      };
    }
    
    if (savedContentImage7Url) {
      updatedStorageMap['loveStoryContentImage7'] = {
        localStorageKey: 'loveStoryContentImage7',
        url: savedContentImage7Url
      };
    }
    
    if (savedContentImage8Url) {
      updatedStorageMap['loveStoryContentImage8'] = {
        localStorageKey: 'loveStoryContentImage8',
        url: savedContentImage8Url
      };
    }
    
    if (savedContentImage9Url) {
      updatedStorageMap['loveStoryContentImage9'] = {
        localStorageKey: 'loveStoryContentImage9',
        url: savedContentImage9Url
      };
    }
    
    if (savedContentImage10Url) {
      updatedStorageMap['loveStoryContentImage10'] = {
        localStorageKey: 'loveStoryContentImage10',
        url: savedContentImage10Url
      };
    }
    
    // Update the storage map
    setImageStorageMap(updatedStorageMap);

    // Now load images, preferring URLs from storage map if available
    if (savedCoverImage) {
      setCoverImage(savedCoverImage);
    }
    if (savedIntroImage) {
      setIntroImage(savedIntroImage);
    }
    if (savedContentImage1) {
      setContentImage1(savedContentImage1);
    }
    if (savedContentImage2) {
      setContentImage2(savedContentImage2);
    }
    if (savedContentImage3) {
      setContentImage3(savedContentImage3);
    }
    if (savedContentImage4) {
      setContentImage4(savedContentImage4);
    }
    if (savedContentImage5) {
      setContentImage5(savedContentImage5);
    }
    if (savedContentImage6) {
      setContentImage6(savedContentImage6);
    }
    if (savedContentImage7) {
      setContentImage7(savedContentImage7);
    }
    if (savedContentImage8) {
      setContentImage8(savedContentImage8);
    }
    if (savedContentImage9) {
      setContentImage9(savedContentImage9);
    }
    if (savedContentImage10) {
      setContentImage10(savedContentImage10);
    }

    if (savedAuthor) {
      setAuthorName(savedAuthor);
    }

    if (savedStyle) {
      // Map old style names to new API-compatible style names
      const styleMapping: Record<string, string> = {
        'Comic Book': 'Comic book',
        'Line Art': 'Line art',
        'Fantasy Art': 'Fantasy art',
        'Photographic': 'Photographic (Default)',
        'Cinematic': 'Cinematic'
      };
      
      // Use the mapping or the original value
      const normalizedStyle = styleMapping[savedStyle] || savedStyle;
      setSelectedStyle(normalizedStyle);
      
      // Update localStorage with the normalized style if it changed
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

    // Temporarily commented out for testing purposes
    // if ((!savedCoverImage || !savedIntroImage || !savedContentImage1) && savedPrompts && partnerPhoto) {
    //   generateInitialImages(savedPrompts, partnerPhoto);
    // }
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
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 0) {
        setIsGeneratingCover(true);
        
        // Use the provided style or fall back to the stored/default style
        const imageStyle = style || selectedStyle;
        
        // Update the stored style if a new one is provided
        if (style) {
          setSelectedStyle(style);
          localStorage.setItem('loveStoryStyle', style);
        }
        
        try {
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { 
              prompt: prompts[0].prompt, 
              photo: partnerPhoto,
              style: imageStyle
            }
          });
          if (error) throw error;
          if (data?.output?.[0]) {
            const coverImageData = data.output[0];
            setCoverImage(coverImageData);
            
            // Upload to Supabase Storage
            const storageUrl = await uploadImageToStorage(
              coverImageData, 
              'images', 
              'love-story-cover'
            );
            
            // Update storage map
            setImageStorageMap(prev => ({
              ...prev,
              ['loveStoryCoverImage']: {
                localStorageKey: 'loveStoryCoverImage',
                url: storageUrl
              }
            }));
            
            // Store only the URL reference in localStorage
            localStorage.setItem('loveStoryCoverImage_url', storageUrl);
            
            toast({
              title: "Cover regenerated",
              description: `Cover updated with ${imageStyle} style`,
            });
          }
        } catch (error) {
          console.error('Error regenerating cover:', error);
          toast({
            title: "Error regenerating image",
            description: "Please try again",
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
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 1) {
        setIsGeneratingIntro(true);
        
        // Use the provided style or fall back to the stored/default style
        const imageStyle = style || selectedStyle;
        
        // Update the stored style if a new one is provided
        if (style) {
          setSelectedStyle(style);
          localStorage.setItem('loveStoryStyle', style);
        }
        
        try {
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { 
              contentPrompt: prompts[1].prompt, 
              photo: partnerPhoto,
              style: imageStyle
            }
          });
          if (error) throw error;
          if (data?.contentImage?.[0]) {
            const introImageData = data.contentImage[0];
            setIntroImage(introImageData);
            
            // Upload to Supabase Storage
            const storageUrl = await uploadImageToStorage(
              introImageData, 
              'images', 
              'love-story-intro'
            );
            
            // Update storage map
            setImageStorageMap(prev => ({
              ...prev,
              ['loveStoryIntroImage']: {
                localStorageKey: 'loveStoryIntroImage',
                url: storageUrl
              }
            }));
            
            // Store only the URL reference in localStorage
            localStorage.setItem('loveStoryIntroImage_url', storageUrl);
            
            toast({
              title: "Image regenerated",
              description: `Image 1 updated with ${imageStyle} style`,
            });
          }
        } catch (error) {
          console.error('Error regenerating content image 1:', error);
          toast({
            title: "Error regenerating image",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingIntro(false);
        }
      }
    }
  };

  // Render content images with text inside the canvas
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
    // Get the text for this image, adjusting for zero-based array index
    const imageText = imageTexts && imageTexts.length > imageIndex ? imageTexts[imageIndex] : null;
    
    // 显示标题适配新的命名方式
    let title = imageIndex === 0 ? "Introduction" : `Moment ${imageIndex}`;
    
    return (
      <div className="mb-10">
        <ContentImageCard 
          image={image} 
          isGenerating={isLoading}
          onRegenerate={handleRegenerate}
          index={imageIndex}
          onEditText={() => {}}
          text={imageText?.text}
          title={title}
        />
      </div>
    );
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
        {/* Cover section */}
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
        
        <h2 className="text-2xl font-bold mb-6">Story Images with Text</h2>
        <div className="space-y-8">
          {/* 渲染介绍图片和内容图片 */}
          {renderContentImage(0)} {/* 介绍图片 */}
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
    </WizardStep>
  );
};

export default GenerateStep;
