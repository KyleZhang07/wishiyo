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
        setContentImage2(data.contentImage2[0]);
        localStorage.setItem('loveStoryContentImage2', data.contentImage2[0]);
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

  const expandGeneratedImage = async (imageUrl: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('expand-image', {
        body: { imageUrl }
      });
      
      if (error) throw error;
      return data.image;
    } catch (error) {
      console.error('Error expanding image:', error);
      return imageUrl; // Fall back to original image if expansion fails
    }
  };

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

  const handleRegenerateContent1 = async () => {
    localStorage.removeItem('loveStoryContentImage');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 1) {
        setIsGeneratingContent1(true);
        try {
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { contentPrompt: prompts[1].prompt, photo: partnerPhoto }
          });
          if (error) throw error;
          if (data?.contentImage?.[0]) {
            const expandedImage = await expandGeneratedImage(data.contentImage[0]);
            setContentImage(expandedImage);
            localStorage.setItem('loveStoryContentImage', expandedImage);
          }
        } catch (error) {
          console.error('Error regenerating content:', error);
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
          if (data?.contentImage2?.[0]) {
            const expandedImage = await expandGeneratedImage(data.contentImage2[0]);
            setContentImage2(expandedImage);
            localStorage.setItem('loveStoryContentImage2', expandedImage);
          }
        } catch (error) {
          console.error('Error regenerating content:', error);
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

  const handleRegenerateContent3 = async () => {
    localStorage.removeItem('loveStoryContentImage3');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 3) {
        setIsGeneratingContent3(true);
        try {
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { content3Prompt: prompts[3].prompt, photo: partnerPhoto }
          });
          if (error) throw error;
          if (data?.contentImage3?.[0]) {
            const expandedImage = await expandGeneratedImage(data.contentImage3[0]);
            setContentImage3(expandedImage);
            localStorage.setItem('loveStoryContentImage3', expandedImage);
          }
        } catch (error) {
          console.error('Error regenerating content:', error);
          toast({
            title: "Error regenerating image",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingContent3(false);
        }
      }
    }
  };

  const handleRegenerateContent4 = async () => {
    localStorage.removeItem('loveStoryContentImage4');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 4) {
        setIsGeneratingContent4(true);
        try {
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { content4Prompt: prompts[4].prompt, photo: partnerPhoto }
          });
          if (error) throw error;
          if (data?.contentImage4?.[0]) {
            const expandedImage = await expandGeneratedImage(data.contentImage4[0]);
            setContentImage4(expandedImage);
            localStorage.setItem('loveStoryContentImage4', expandedImage);
          }
        } catch (error) {
          console.error('Error regenerating content:', error);
          toast({
            title: "Error regenerating image",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingContent4(false);
        }
      }
    }
  };

  const handleRegenerateContent5 = async () => {
    localStorage.removeItem('loveStoryContentImage5');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 5) {
        setIsGeneratingContent5(true);
        try {
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { content5Prompt: prompts[5].prompt, photo: partnerPhoto }
          });
          if (error) throw error;
          if (data?.contentImage5?.[0]) {
            const expandedImage = await expandGeneratedImage(data.contentImage5[0]);
            setContentImage5(expandedImage);
            localStorage.setItem('loveStoryContentImage5', expandedImage);
          }
        } catch (error) {
          console.error('Error regenerating content:', error);
          toast({
            title: "Error regenerating image",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingContent5(false);
        }
      }
    }
  };

  const handleRegenerateContent6 = async () => {
    localStorage.removeItem('loveStoryContentImage6');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 6) {
        setIsGeneratingContent6(true);
        try {
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { content6Prompt: prompts[6].prompt, photo: partnerPhoto }
          });
          if (error) throw error;
          if (data?.contentImage6?.[0]) {
            const expandedImage = await expandGeneratedImage(data.contentImage6[0]);
            setContentImage6(expandedImage);
            localStorage.setItem('loveStoryContentImage6', expandedImage);
          }
        } catch (error) {
          console.error('Error regenerating content:', error);
          toast({
            title: "Error regenerating image",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingContent6(false);
        }
      }
    }
  };

  const handleRegenerateContent7 = async () => {
    localStorage.removeItem('loveStoryContentImage7');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 7) {
        setIsGeneratingContent7(true);
        try {
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { content7Prompt: prompts[7].prompt, photo: partnerPhoto }
          });
          if (error) throw error;
          if (data?.contentImage7?.[0]) {
            const expandedImage = await expandGeneratedImage(data.contentImage7[0]);
            setContentImage7(expandedImage);
            localStorage.setItem('loveStoryContentImage7', expandedImage);
          }
        } catch (error) {
          console.error('Error regenerating content:', error);
          toast({
            title: "Error regenerating image",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingContent7(false);
        }
      }
    }
  };

  const handleRegenerateContent8 = async () => {
    localStorage.removeItem('loveStoryContentImage8');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 8) {
        setIsGeneratingContent8(true);
        try {
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { content8Prompt: prompts[8].prompt, photo: partnerPhoto }
          });
          if (error) throw error;
          if (data?.contentImage8?.[0]) {
            const expandedImage = await expandGeneratedImage(data.contentImage8[0]);
            setContentImage8(expandedImage);
            localStorage.setItem('loveStoryContentImage8', expandedImage);
          }
        } catch (error) {
          console.error('Error regenerating content:', error);
          toast({
            title: "Error regenerating image",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingContent8(false);
        }
      }
    }
  };

  const handleRegenerateContent9 = async () => {
    localStorage.removeItem('loveStoryContentImage9');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 9) {
        setIsGeneratingContent9(true);
        try {
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { content9Prompt: prompts[9].prompt, photo: partnerPhoto }
          });
          if (error) throw error;
          if (data?.contentImage9?.[0]) {
            const expandedImage = await expandGeneratedImage(data.contentImage9[0]);
            setContentImage9(expandedImage);
            localStorage.setItem('loveStoryContentImage9', expandedImage);
          }
        } catch (error) {
          console.error('Error regenerating content:', error);
          toast({
            title: "Error regenerating image",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingContent9(false);
        }
      }
    }
  };

  const handleRegenerateContent10 = async () => {
    localStorage.removeItem('loveStoryContentImage10');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 10) {
        setIsGeneratingContent10(true);
        try {
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { content10Prompt: prompts[10].prompt, photo: partnerPhoto }
          });
          if (error) throw error;
          if (data?.contentImage10?.[0]) {
            const expandedImage = await expandGeneratedImage(data.contentImage10[0]);
            setContentImage10(expandedImage);
            localStorage.setItem('loveStoryContentImage10', expandedImage);
          }
        } catch (error) {
          console.error('Error regenerating content:', error);
          toast({
            title: "Error regenerating image",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingContent10(false);
        }
      }
    }
  };

  const handleRegenerateContent11 = async () => {
    localStorage.removeItem('loveStoryContentImage11');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 11) {
        setIsGeneratingContent11(true);
        try {
          const { data, error } = await supabase.functions.invoke('generate-love-cover', {
            body: { content11Prompt: prompts[11].prompt, photo: partnerPhoto }
          });
          if (error) throw error;
          if (data?.contentImage11?.[0]) {
            const expandedImage = await expandGeneratedImage(data.contentImage11[0]);
            setContentImage11(expandedImage);
            localStorage.setItem('loveStoryContentImage11', expandedImage);
          }
        } catch (error) {
          console.error('Error regenerating content:', error);
          toast({
            title: "Error regenerating image",
            description: "Please try again",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingContent11(false);
        }
      }
    }
  };

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
