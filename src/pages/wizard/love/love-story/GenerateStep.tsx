import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CoverPreviewCard } from './components/CoverPreviewCard';
import { ContentImageCard } from './components/ContentImageCard';

interface ImageText {
  text: string;
  tone: string;
}

const GenerateStep = () => {
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [backCoverText, setBackCoverText] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [contentImage, setContentImage] = useState<string>();
  // contentImage2~11
  const [contentImage2, setContentImage2] = useState<string>();
  const [contentImage3, setContentImage3] = useState<string>();
  const [contentImage4, setContentImage4] = useState<string>();
  const [contentImage5, setContentImage5] = useState<string>();
  const [contentImage6, setContentImage6] = useState<string>();
  const [contentImage7, setContentImage7] = useState<string>();
  const [contentImage8, setContentImage8] = useState<string>();
  const [contentImage9, setContentImage9] = useState<string>();
  const [contentImage10, setContentImage10] = useState<string>();
  const [contentImage11, setContentImage11] = useState<string>();

  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
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
  const [isGeneratingContent11, setIsGeneratingContent11] = useState(false);

  const [selectedStyle, setSelectedStyle] = useState<string>('Photographic (Default)');
  const [imageTexts, setImageTexts] = useState<ImageText[]>([]);

  const { toast } = useToast();

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
    if (index < 2) return;

    const stateSetters = {
      2: setContentImage2,
      3: setContentImage3,
      4: setContentImage4,
      5: setContentImage5,
      6: setContentImage6,
      7: setContentImage7,
      8: setContentImage8,
      9: setContentImage9,
      10: setContentImage10,
      11: setContentImage11
    };

    const loadingSetters = {
      2: setIsGeneratingContent2,
      3: setIsGeneratingContent3,
      4: setIsGeneratingContent4,
      5: setIsGeneratingContent5,
      6: setIsGeneratingContent6,
      7: setIsGeneratingContent7,
      8: setIsGeneratingContent8,
      9: setIsGeneratingContent9,
      10: setIsGeneratingContent10,
      11: setIsGeneratingContent11
    };

    const setContentFn = stateSetters[index as keyof typeof stateSetters];
    const setIsGenerating = loadingSetters[index as keyof typeof loadingSetters];
    if (!setContentFn || !setIsGenerating) return;

    const lsKey = `loveStoryContentImage${index}`;
    console.log(`Regenerating image ${index}, removing old image from localStorage: ${lsKey}`);
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
      if (!prompts[index]) {
        throw new Error(`No prompt found for content index ${index}`);
      }
      
      // Use the provided style or fall back to the stored/default style
      const imageStyle = style || selectedStyle;
      console.log(`Using style for image ${index}: "${imageStyle}"`);
      
      // Update the stored style if a new one is provided
      if (style) {
        console.log(`Updating selected style to: "${style}"`);
        setSelectedStyle(style);
        localStorage.setItem('loveStoryStyle', style);
      }

      // Include style in the request
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: { 
          prompt: prompts[index].prompt, 
          photo: partnerPhoto,
          style: imageStyle
        }
      });
      if (error) throw error;

      // 后端可能返回 { output: [...]} 或 { contentImageX: [...] }
      // 具体看你的generate-love-cover实现
      const imageUrl = data?.[`contentImage${index}`]?.[0] || data?.output?.[0];
      if (!imageUrl) {
        throw new Error("No image generated from generate-love-cover");
      }
      console.log(`Image ${index} generated successfully, proceeding to expansion`);

      // 2) 调用expand-image进行扩展
      const expandedBase64 = await expandImage(imageUrl);
      console.log(`Image ${index} expanded successfully`);

      // 3) 存到state & localStorage
      setContentFn(expandedBase64);
      localStorage.setItem(lsKey, expandedBase64);
      console.log(`Image ${index} saved to localStorage with key: ${lsKey}`);

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

  const handleRegenerateContent2 = (style?: string) => handleGenericContentRegeneration(2, style);
  const handleRegenerateContent3 = (style?: string) => handleGenericContentRegeneration(3, style);
  const handleRegenerateContent4 = (style?: string) => handleGenericContentRegeneration(4, style);
  const handleRegenerateContent5 = (style?: string) => handleGenericContentRegeneration(5, style);
  const handleRegenerateContent6 = (style?: string) => handleGenericContentRegeneration(6, style);
  const handleRegenerateContent7 = (style?: string) => handleGenericContentRegeneration(7, style);
  const handleRegenerateContent8 = (style?: string) => handleGenericContentRegeneration(8, style);
  const handleRegenerateContent9 = (style?: string) => handleGenericContentRegeneration(9, style);
  const handleRegenerateContent10 = (style?: string) => handleGenericContentRegeneration(10, style);
  const handleRegenerateContent11 = (style?: string) => handleGenericContentRegeneration(11, style);

  const generateInitialImages = async (prompts: string, partnerPhoto: string) => {
    setIsGeneratingCover(true);
    setIsGeneratingContent1(true);
    console.log('Starting to generate initial images with style:', selectedStyle);
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

      // 处理封面图像
      if (data?.output?.[0]) {
        console.log('Cover image generated successfully');
        setCoverImage(data.output[0]);
        localStorage.setItem('loveStoryCoverImage', data.output[0]);
        console.log('Cover image saved to localStorage');
      } else {
        console.warn('No cover image was returned from the API');
      }

      // 处理内容图像1
      if (data?.contentImage?.[0]) {
        console.log('Content image 1 generated successfully');
        
        // 尝试扩展图像以更好地显示文本
        try {
          const expandedBase64 = await expandImage(data.contentImage[0]);
          console.log('Content image 1 expanded successfully');
          setContentImage(expandedBase64);
          localStorage.setItem('loveStoryContentImage', expandedBase64);
        } catch (expandError) {
          console.error('Error expanding content image 1:', expandError);
          // 扩展失败时使用原始图像
          setContentImage(data.contentImage[0]);
          localStorage.setItem('loveStoryContentImage', data.contentImage[0]);
        }
        
        console.log('Content image 1 saved to localStorage');
      } else {
        console.warn('No content image 1 was returned from the API');
      }

      // 处理内容图像2
      if (data?.contentImage2?.[0]) {
        console.log('Content image 2 generated successfully');
        
        // 尝试扩展图像以更好地显示文本
        try {
          const expandedBase64 = await expandImage(data.contentImage2[0]);
          console.log('Content image 2 expanded successfully');
          setContentImage2(expandedBase64);
          localStorage.setItem('loveStoryContentImage2', expandedBase64);
        } catch (expandError) {
          console.error('Error expanding content image 2:', expandError);
          // 扩展失败时使用原始图像
          setContentImage2(data.contentImage2[0]);
          localStorage.setItem('loveStoryContentImage2', data.contentImage2[0]);
        }
        
        console.log('Content image 2 saved to localStorage');
      } else {
        console.warn('No content image 2 was returned from the API');
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
      setIsGeneratingContent1(false);
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
    
    // Load images
    const savedCoverImage = localStorage.getItem('loveStoryCoverImage');
    const savedContentImage = localStorage.getItem('loveStoryContentImage');
    const savedContentImage2 = localStorage.getItem('loveStoryContentImage2');
    const savedContentImage3 = localStorage.getItem('loveStoryContentImage3');
    const savedContentImage4 = localStorage.getItem('loveStoryContentImage4');
    const savedContentImage5 = localStorage.getItem('loveStoryContentImage5');
    const savedContentImage6 = localStorage.getItem('loveStoryContentImage6');
    const savedContentImage7 = localStorage.getItem('loveStoryContentImage7');
    const savedContentImage8 = localStorage.getItem('loveStoryContentImage8');
    const savedContentImage9 = localStorage.getItem('loveStoryContentImage9');
    const savedContentImage10 = localStorage.getItem('loveStoryContentImage10');
    const savedContentImage11 = localStorage.getItem('loveStoryContentImage11');
    
    // Ensure we have a recipient name stored
    const savedQuestions = localStorage.getItem('loveStoryQuestions');
    if (savedQuestions) {
      try {
        const questions = JSON.parse(savedQuestions);
        const nameQuestion = questions.find((q: any) => 
          q.question.toLowerCase().includes('name') && 
          !q.question.toLowerCase().includes('your name')
        );
        
        if (nameQuestion && nameQuestion.answer) {
          localStorage.setItem('loveStoryRecipientName', nameQuestion.answer);
        }
      } catch (error) {
        console.error('Error parsing questions:', error);
      }
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

    if (savedCoverImage) {
      setCoverImage(savedCoverImage);
    }
    if (savedContentImage) {
      setContentImage(savedContentImage);
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
    if (savedContentImage11) {
      setContentImage11(savedContentImage11);
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
    console.log(`Regenerating cover image, removing old image from localStorage`);
    localStorage.removeItem('loveStoryCoverImage');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 0) {
        setIsGeneratingCover(true);
        
        // Use the provided style or fall back to the stored/default style
        const imageStyle = style || selectedStyle;
        console.log(`Using style for cover image: "${imageStyle}"`);
        
        // Update the stored style if a new one is provided
        if (style) {
          console.log(`Updating selected style to: "${style}"`);
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
            const imageUrl = data.output[0];
            console.log(`Cover image generated successfully`);
            setCoverImage(imageUrl);
            localStorage.setItem('loveStoryCoverImage', imageUrl);
            console.log(`Cover image saved to localStorage`);
            
            toast({
              title: "Cover image regenerated",
              description: `Cover updated with ${imageStyle} style`,
            });
          }
        } catch (error) {
          console.error('Error regenerating cover:', error);
          toast({
            title: "Error regenerating cover",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingCover(false);
        }
      }
    }
  };

  const handleRegenerateContent1 = async (style?: string) => {
    console.log(`Regenerating content image 1, removing old image from localStorage`);
    localStorage.removeItem('loveStoryContentImage');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 1) {
        setIsGeneratingContent1(true);
        
        // Use the provided style or fall back to the stored/default style
        const imageStyle = style || selectedStyle;
        console.log(`Using style for content image 1: "${imageStyle}"`);
        
        // Update the stored style if a new one is provided
        if (style) {
          console.log(`Updating selected style to: "${style}"`);
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
            const imageUrl = data.contentImage[0];
            console.log(`Content image 1 generated successfully`);
            
            // Optionally expand the image for better text display
            try {
              const expandedBase64 = await expandImage(imageUrl);
              console.log(`Content image 1 expanded successfully`);
              setContentImage(expandedBase64);
              localStorage.setItem('loveStoryContentImage', expandedBase64);
            } catch (expandError) {
              console.error('Error expanding image:', expandError);
              // Fall back to the original image if expansion fails
              setContentImage(imageUrl);
              localStorage.setItem('loveStoryContentImage', imageUrl);
            }
            
            console.log(`Content image 1 saved to localStorage`);
            
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
          setIsGeneratingContent1(false);
        }
      }
    }
  };

  // Render content images with text inside the canvas
  const renderContentImage = (imageIndex: number) => {
    const imageStateMap: Record<number, string | undefined> = {
      1: contentImage,
      2: contentImage2,
      3: contentImage3,
      4: contentImage4,
      5: contentImage5,
      6: contentImage6,
      7: contentImage7,
      8: contentImage8,
      9: contentImage9,
      10: contentImage10,
      11: contentImage11,
    };
    
    const loadingStateMap: Record<number, boolean> = {
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
      11: isGeneratingContent11,
    };
    
    const handleRegenerateMap: Record<number, () => void> = {
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
      11: handleRegenerateContent11,
    };
    
    const image = imageStateMap[imageIndex];
    const isLoading = loadingStateMap[imageIndex];
    const handleRegenerate = handleRegenerateMap[imageIndex];
    // Get the text for this image, adjusting for zero-based array index
    const imageText = imageTexts && imageTexts.length > imageIndex - 1 ? imageTexts[imageIndex - 1] : null;
    
    return (
      <div className="mb-10">
        <ContentImageCard 
          image={image} 
          isGenerating={isLoading}
          onRegenerate={handleRegenerate}
          index={imageIndex}
          onEditText={() => {}}
          text={imageText?.text}
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
        {/* 添加手动生成按钮 */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Image Generation</h2>
          <p className="text-gray-600 mb-4">If your images are not showing, you can generate them manually.</p>
          <Button
            onClick={() => {
              const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
              const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
              if (savedPrompts && partnerPhoto) {
                generateInitialImages(savedPrompts, partnerPhoto);
              } else {
                toast({
                  title: "Missing information",
                  description: "Cannot find prompts or partner photo. Please go back to previous steps.",
                  variant: "destructive",
                });
              }
            }}
            disabled={isGeneratingCover || isGeneratingContent1}
          >
            {(isGeneratingCover || isGeneratingContent1) ? 'Generating...' : 'Generate Images'}
          </Button>
        </div>

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
          {/* Render content images with text inside canvas */}
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
          {renderContentImage(11)}
        </div>
      </div>
    </WizardStep>
  );
};

export default GenerateStep;
