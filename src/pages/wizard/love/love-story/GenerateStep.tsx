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
    try {
      console.log('Expanding image:', imageUrl);
      const { data, error } = await supabase.functions.invoke('expand-image', {
        body: { imageUrl }
      });

      if (error) throw error;
      
      // Create a blob URL from the response
      const blob = new Blob([data], { type: 'image/png' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error expanding image:', error);
      throw error;
    }
  };

  const generateImages = async (coverPrompt: string, content1Prompt: string, content2Prompt: string, photo: string) => {
    setIsGeneratingCover(true);
    setIsGeneratingContent1(true);
    setIsGeneratingContent2(true);
    toast({
      title: "Generating images",
      description: "This may take a minute...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: { 
          prompt: coverPrompt, 
          contentPrompt: content1Prompt,
          content2Prompt: content2Prompt,
          photo 
        }
      });

      if (error) throw error;

      if (data?.output?.[0]) {
        setCoverImage(data.output[0]);
        localStorage.setItem('loveStoryCoverImage', data.output[0]);
      }

      if (data?.contentImage?.[0]) {
        setContentImage(data.contentImage[0]);
        localStorage.setItem('loveStoryContentImage', data.contentImage[0]);
      }

      if (data?.contentImage2?.[0]) {
        // 对 contentImage2 进行扩展处理
        const expandedImage = await expandImage(data.contentImage2[0]);
        setContentImage2(expandedImage);
        localStorage.setItem('loveStoryContentImage2', expandedImage);
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
      setIsGeneratingContent2(false);
    }
  };

  const handleGenericContentRegeneration = async (index: number) => {
    const stateSetters = {
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

    if (!setContentImage || !setIsGenerating) return;

    const contentKey = `loveStoryContentImage${index}`;
    localStorage.removeItem(contentKey);
    
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > index) {
        setIsGenerating(true);
        try {
          // 首先生成原始图片
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { 
              prompt: prompts[index].prompt, 
              photo: partnerPhoto,
              contentIndex: index 
            }
          });
          
          if (error) throw error;
          
          let contentImage = data?.[`contentImage${index}`]?.[0] || data?.output?.[0];
          if (!contentImage) throw new Error('No image generated');

          // 对生成的图片进行扩展处理
          contentImage = await expandImage(contentImage);
          
          setContentImage(contentImage);
          localStorage.setItem(contentKey, contentImage);
          
        } catch (error) {
          console.error(`Error regenerating content image ${index}:`, error);
          toast({
            title: "Error regenerating image",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGenerating(false);
        }
      }
    }
  };

  const handleRegenerateContent2 = async () => {
    localStorage.removeItem('loveStoryContentImage2');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 2) {
        setIsGeneratingContent2(true);
        try {
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { content2Prompt: prompts[2].prompt, photo: partnerPhoto }
          });
          
          if (error) throw error;
          
          let contentImage = data?.contentImage2?.[0];
          if (!contentImage) throw new Error('No image generated');

          // 对生成的图片进行扩展处理
          contentImage = await expandImage(contentImage);
          
          setContentImage2(contentImage);
          localStorage.setItem('loveStoryContentImage2', contentImage);
          
        } catch (error) {
          console.error('Error regenerating content image 2:', error);
          toast({
            title: "Error regenerating image",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingContent2(false);
        }
      }
    }
  };

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
