import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import { useToast } from '@/components/ui/use-toast';
import { Edit, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const GenerateStep = () => {
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [contentImage, setContentImage] = useState<string>();
  const [contentImage2, setContentImage2] = useState<string>();
  const [backCoverText, setBackCoverText] = useState('');
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [isGeneratingContent1, setIsGeneratingContent1] = useState(false);
  const [isGeneratingContent2, setIsGeneratingContent2] = useState(false);
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
            setContentImage(data.contentImage[0]);
            localStorage.setItem('loveStoryContentImage', data.contentImage[0]);
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
            setContentImage2(data.contentImage2[0]);
            localStorage.setItem('loveStoryContentImage2', data.contentImage2[0]);
          }
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

  return (
    <WizardStep
      title="Create Your Love Story"
      description="Let's turn your beautiful moments into a timeless story"
      previousStep="/create/love/love-story/moments"
      currentStep={4}
      totalSteps={4}
    >
      <div className="space-y-8">
        <div className="glass-card rounded-2xl p-8 py-[40px] relative">
          <div className="max-w-xl mx-auto">
            <CanvasCoverPreview
              coverTitle={coverTitle}
              subtitle={subtitle}
              authorName={authorName}
              coverImage={coverImage}
              selectedFont="playfair"
              selectedTemplate="modern"
              selectedLayout="centered"
              backCoverText={backCoverText}
              category="love"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <Button
                variant="secondary"
                onClick={handleEditCover}
                disabled={isGeneratingCover}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit cover
              </Button>
              <Button
                variant="secondary"
                onClick={handleRegenerateCover}
                disabled={isGeneratingCover}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingCover ? 'animate-spin' : ''}`} />
                Regenerate cover
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 py-[40px] relative">
          <div className="max-w-xl mx-auto">
            <div className="aspect-[2/1] bg-[#FFECD1] rounded-lg p-8 relative">
              <div className="h-full flex flex-col justify-center items-center text-center space-y-6">
                {contentImage && (
                  <div className="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center">
                    <img 
                      src={contentImage} 
                      alt="Story content" 
                      className="w-auto h-full object-contain max-w-full"
                    />
                    <div className="absolute inset-0 bg-[#FFECD1] opacity-40" />
                  </div>
                )}
                <div className="space-y-4 relative z-10">
                  <p className="text-lg">Dear {coverTitle.split(',')[0]},</p>
                  <p className="text-lg">
                    This book is full of the words I have chosen for you.<br/>
                    Thank you for making the story of us so beautiful.
                  </p>
                  <p className="text-lg">Happy Anniversary!</p>
                  <p className="text-lg">Love,<br/>{authorName}</p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                onClick={handleEditText}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit text
              </Button>
              <Button
                variant="secondary"
                onClick={handleRegenerateContent1}
                disabled={isGeneratingContent1}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingContent1 ? 'animate-spin' : ''}`} />
                Regenerate image
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 py-[40px] relative">
          <div className="max-w-xl mx-auto">
            <div className="aspect-[2/1] bg-[#FFECD1] rounded-lg p-8 relative">
              {contentImage2 && (
                <div className="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center">
                  <img 
                    src={contentImage2} 
                    alt="Additional content" 
                    className="w-auto h-full object-contain max-w-full" 
                  />
                  <div className="absolute inset-0 bg-[#FFECD1] opacity-40" />
                </div>
              )}
            </div>
            <div className="absolute bottom-4 right-4">
              <Button
                variant="secondary"
                onClick={handleRegenerateContent2}
                disabled={isGeneratingContent2}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingContent2 ? 'animate-spin' : ''}`} />
                Regenerate image
              </Button>
            </div>
          </div>
        </div>

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
