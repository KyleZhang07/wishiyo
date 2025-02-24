
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CoverPreviewCard } from './components/CoverPreviewCard';
import { ContentImageCard } from './components/ContentImageCard';

const GenerateStep = () => {
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [contentImage, setContentImage] = useState<string>();
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
  const [backCoverText, setBackCoverText] = useState('');
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
  const { toast } = useToast();

  useEffect(() => {
    const savedAuthor = localStorage.getItem('loveStoryAuthorName');
    const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
    const savedMoments = localStorage.getItem('loveStoryMoments');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const savedCoverImage = localStorage.getItem('loveStoryCoverImage');
    const savedContentImage = localStorage.getItem('loveStoryContentImage');
    const savedContentImage2 = localStorage.getItem('loveStoryContentImage2');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');

    if (savedAuthor) {
      setAuthorName(savedAuthor);
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
    
    if ((!savedCoverImage || !savedContentImage || !savedContentImage2) && savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 2) {
        generateImages(prompts[0].prompt, prompts[1].prompt, prompts[2].prompt, partnerPhoto);
      }
    }
  }, []);

  const expandImage = async (imageUrl: string): Promise<string> => {
    console.log('Starting image expansion for:', imageUrl);
    const { data, error } = await supabase.functions.invoke('expand-image', {
      body: { imageUrl }
    });

    if (error) {
      console.error('Error from expand-image function:', error);
      throw error;
    }

    if (!data?.imageData) {
      console.error('No image data received from expand-image function');
      throw new Error('Failed to receive image data');
    }

    console.log('Successfully received expanded image data');
    return data.imageData;
  };

  const handleEditCover = () => {
    // Navigate to cover edit page or open dialog
    console.log('Edit cover clicked');
    // 实现编辑封面的逻辑，暂时只打印日志
  };

  const handleEditText = () => {
    // Handle text editing
    console.log('Edit text clicked');
    // 实现编辑文本的逻辑，暂时只打印日志
  };

  const handleRegenerateContent1 = async () => {
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');

    if (!savedPrompts || !partnerPhoto) {
      toast({
        title: "Error regenerating image",
        description: "Missing required information",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingContent1(true);
    try {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 1) {
        const { data, error } = await supabase.functions.invoke('generate-love-cover', {
          body: { 
            prompt: prompts[1].prompt, 
            photo: partnerPhoto,
            contentIndex: 1
          }
        });

        if (error) throw error;

        if (data?.contentImage?.[0]) {
          setContentImage(data.contentImage[0]);
          localStorage.setItem('loveStoryContentImage', data.contentImage[0]);
        }

        toast({
          title: "Image regenerated",
          description: "Your dedication page image has been updated",
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
  };

  const handleGenericContentRegeneration = async (index: number) => {
    if (index < 2) return; // Don't process cover image

    console.log(`Triggering regeneration for content ${index}`);
    
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

    const setContentImage = stateSetters[index as keyof typeof stateSetters];
    const setIsGenerating = loadingSetters[index as keyof typeof loadingSetters];

    if (!setContentImage || !setIsGenerating) {
      console.error(`Invalid index ${index} for content regeneration`);
      return;
    }

    const contentKey = `loveStoryContentImage${index}`;
    localStorage.removeItem(contentKey);

    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');

    if (!savedPrompts || !partnerPhoto) {
      console.error('Missing required prompts or partner photo');
      toast({
        title: "Error regenerating image",
        description: "Missing required information",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log(`Starting content regeneration for index ${index}`);
      const prompts = JSON.parse(savedPrompts);
      
      if (!prompts || !prompts[index]) {
        throw new Error(`No prompt found for index ${index}`);
      }

      // 1. Generate initial image using generate-love-cover
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: { 
          prompt: prompts[index].prompt, 
          photo: partnerPhoto,
          contentIndex: index 
        }
      });
      
      if (error) throw error;
      
      const originalImageUrl = data?.[`contentImage${index}`]?.[0] || data?.output?.[0];
      if (!originalImageUrl) {
        throw new Error('No image generated');
      }

      console.log(`Successfully generated original image for content ${index}:`, originalImageUrl);

      // 2. Expand the generated image using LightX API
      console.log(`Starting image expansion for content ${index}`);
      const expandedImageData = await expandImage(originalImageUrl);
      console.log(`Successfully expanded image for content ${index}`);
      
      // 3. Save the expanded image to state and localStorage
      setContentImage(expandedImageData);
      localStorage.setItem(contentKey, expandedImageData);
      
      toast({
        title: "Image generated and expanded",
        description: "Your image has been successfully created",
      });
    } catch (error) {
      console.error(`Error in content regeneration for index ${index}:`, error);
      toast({
        title: "Error generating image",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateCover = async () => {
    localStorage.removeItem('loveStoryCoverImage');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 0) {
        setIsGeneratingCover(true);
        try {
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { prompt: prompts[0].prompt, photo: partnerPhoto }
          });
          if (error) throw error;
          if (data?.output?.[0]) {
            setCoverImage(data.output[0]);
            localStorage.setItem('loveStoryCoverImage', data.output[0]);
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

  const handleRegenerateContent2 = () => handleGenericContentRegeneration(2);
  const handleRegenerateContent3 = () => handleGenericContentRegeneration(3);
  const handleRegenerateContent4 = () => handleGenericContentRegeneration(4);
  const handleRegenerateContent5 = () => handleGenericContentRegeneration(5);
  const handleRegenerateContent6 = () => handleGenericContentRegeneration(6);
  const handleRegenerateContent7 = () => handleGenericContentRegeneration(7);
  const handleRegenerateContent8 = () => handleGenericContentRegeneration(8);
  const handleRegenerateContent9 = () => handleGenericContentRegeneration(9);
  const handleRegenerateContent10 = () => handleGenericContentRegeneration(10);
  const handleRegenerateContent11 = () => handleGenericContentRegeneration(11);

  return (
    <WizardStep
      title="Create Your Love Story"
      description="Let's turn your beautiful moments into a timeless story"
      previousStep="/create/love/love-story/moments"
      currentStep={4}
      totalSteps={4}
    >
      <div className="space-y-8">
        <CoverPreviewCard
          coverTitle={coverTitle}
          subtitle={subtitle}
          authorName={authorName}
          coverImage={coverImage}
          backCoverText={backCoverText}
          isGeneratingCover={isGeneratingCover}
          onEditCover={handleEditCover}
          onRegenerateCover={handleRegenerateCover}
        />

        <ContentImageCard
          image={contentImage}
          isGenerating={isGeneratingContent1}
          onEditText={handleEditText}
          onRegenerate={handleRegenerateContent1}
          index={1}
          authorName={authorName}
          coverTitle={coverTitle}
          showDedicationText={true}
        />

        {[
          { image: contentImage2, isGenerating: isGeneratingContent2, handler: handleRegenerateContent2 },
          { image: contentImage3, isGenerating: isGeneratingContent3, handler: handleRegenerateContent3 },
          { image: contentImage4, isGenerating: isGeneratingContent4, handler: handleRegenerateContent4 },
          { image: contentImage5, isGenerating: isGeneratingContent5, handler: handleRegenerateContent5 },
          { image: contentImage6, isGenerating: isGeneratingContent6, handler: handleRegenerateContent6 },
          { image: contentImage7, isGenerating: isGeneratingContent7, handler: handleRegenerateContent7 },
          { image: contentImage8, isGenerating: isGeneratingContent8, handler: handleRegenerateContent8 },
          { image: contentImage9, isGenerating: isGeneratingContent9, handler: handleRegenerateContent9 },
          { image: contentImage10, isGenerating: isGeneratingContent10, handler: handleRegenerateContent10 },
          { image: contentImage11, isGenerating: isGeneratingContent11, handler: handleRegenerateContent11 },
        ].map((content, index) => (
          <ContentImageCard
            key={index + 2}
            image={content.image}
            isGenerating={content.isGenerating}
            onEditText={handleEditText}
            onRegenerate={content.handler}
            index={index + 2}
          />
        ))}

        <Button 
          className="w-full py-6 text-lg"
          onClick={() => {/* Generate book logic */}}
        >
          Generate Your Love Story
        </Button>
      </div>
    </WizardStep>
  );
};

export default GenerateStep;
