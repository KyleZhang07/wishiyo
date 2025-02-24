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
  const [contentImage3, setContentImage3] = useState<string>();
  const [contentImage4, setContentImage4] = useState<string>();
  const [contentImage5, setContentImage5] = useState<string>();
  const [contentImage6, setContentImage6] = useState<string>();
  const [contentImage7, setContentImage7] = useState<string>();
  const [contentImage8, setContentImage8] = useState<string>();
  const [contentImage9, setContentImage9] = useState<string>();
  const [contentImage10, setContentImage10] = useState<string>();
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
            setContentImage3(data.contentImage3[0]);
            localStorage.setItem('loveStoryContentImage3', data.contentImage3[0]);
          }
        } catch (error) {
          console.error('Error regenerating content image 3:', error);
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
            setContentImage4(data.contentImage4[0]);
            localStorage.setItem('loveStoryContentImage4', data.contentImage4[0]);
          }
        } catch (error) {
          console.error('Error regenerating content image 4:', error);
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
            setContentImage5(data.contentImage5[0]);
            localStorage.setItem('loveStoryContentImage5', data.contentImage5[0]);
          }
        } catch (error) {
          console.error('Error regenerating content image 5:', error);
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
            setContentImage6(data.contentImage6[0]);
            localStorage.setItem('loveStoryContentImage6', data.contentImage6[0]);
          }
        } catch (error) {
          console.error('Error regenerating content image 6:', error);
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
            setContentImage7(data.contentImage7[0]);
            localStorage.setItem('loveStoryContentImage7', data.contentImage7[0]);
          }
        } catch (error) {
          console.error('Error regenerating content image 7:', error);
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
            setContentImage8(data.contentImage8[0]);
            localStorage.setItem('loveStoryContentImage8', data.contentImage8[0]);
          }
        } catch (error) {
          console.error('Error regenerating content image 8:', error);
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
            setContentImage9(data.contentImage9[0]);
            localStorage.setItem('loveStoryContentImage9', data.contentImage9[0]);
          }
        } catch (error) {
          console.error('Error regenerating content image 9:', error);
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
            setContentImage10(data.contentImage10[0]);
            localStorage.setItem('loveStoryContentImage10', data.contentImage10[0]);
          }
        } catch (error) {
          console.error('Error regenerating content image 10:', error);
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
                onClick={handleRegenerateContent2}
                disabled={isGeneratingContent2}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingContent2 ? 'animate-spin' : ''}`} />
                Regenerate image
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 py-[40px] relative">
          <div className="max-w-xl mx-auto">
            <div className="aspect-[2/1] bg-[#FFECD1] rounded-lg p-8 relative">
              {contentImage3 && (
                <div className="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center">
                  <img 
                    src={contentImage3} 
                    alt="Additional content" 
                    className="w-auto h-full object-contain max-w-full" 
                  />
                  <div className="absolute inset-0 bg-[#FFECD1] opacity-40" />
                </div>
              )}
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
                onClick={handleRegenerateContent3}
                disabled={isGeneratingContent3}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingContent3 ? 'animate-spin' : ''}`} />
                Regenerate image
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 py-[40px] relative">
          <div className="max-w-xl mx-auto">
            <div className="aspect-[2/1] bg-[#FFECD1] rounded-lg p-8 relative">
              {contentImage4 && (
                <div className="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center">
                  <img 
                    src={contentImage4} 
                    alt="Additional content" 
                    className="w-auto h-full object-contain max-w-full" 
                  />
                  <div className="absolute inset-0 bg-[#FFECD1] opacity-40" />
                </div>
              )}
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
                onClick={handleRegenerateContent4}
                disabled={isGeneratingContent4}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingContent4 ? 'animate-spin' : ''}`} />
                Regenerate image
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 py-[40px] relative">
          <div className="max-w-xl mx-auto">
            <div className="aspect-[2/1] bg-[#FFECD1] rounded-lg p-8 relative">
              {contentImage5 && (
                <div className="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center">
                  <img 
                    src={contentImage5} 
                    alt="Additional content" 
                    className="w-auto h-full object-contain max-w-full" 
                  />
                  <div className="absolute inset-0 bg-[#FFECD1] opacity-40" />
                </div>
              )}
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
                onClick={handleRegenerateContent5}
                disabled={isGeneratingContent5}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingContent5 ? 'animate-spin' : ''}`} />
                Regenerate image
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 py-[40px] relative">
          <div className="max-w-xl mx-auto">
            <div className="aspect-[2/1] bg-[#FFECD1] rounded-lg p-8 relative">
              {contentImage6 && (
                <div className="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center">
                  <img 
                    src={contentImage6} 
                    alt="Additional content" 
                    className="w-auto h-full object-contain max-w-full" 
                  />
                  <div className="absolute inset-0 bg-[#FFECD1] opacity-40" />
                </div>
              )}
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
                onClick={handleRegenerateContent6}
                disabled={isGeneratingContent6}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingContent6 ? 'animate-spin' : ''}`} />
                Regenerate image
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 py-[40px] relative">
          <div className="max-w-xl mx-auto">
            <div className="aspect-[2/1] bg-[#FFECD1] rounded-lg p-8 relative">
              {contentImage7 && (
                <div className="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center">
                  <img 
                    src={contentImage7} 
                    alt="Additional content" 
                    className="w-auto h-full object-contain max-w-full" 
                  />
                  <div className="absolute inset-0 bg-[#FFECD1] opacity-40" />
                </div>
              )}
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
                onClick={handleRegenerateContent7}
                disabled={isGeneratingContent7}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingContent7 ? 'animate-spin' : ''}`} />
                Regenerate image
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 py-[40px] relative">
          <div className="max-w-xl mx-auto">
            <div className="aspect-[2/1] bg-[#FFECD1] rounded-lg p-8 relative">
              {contentImage8 && (
                <div className="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center">
                  <img 
                    src={contentImage8} 
                    alt="Additional content" 
                    className="w-auto h-full object-contain max-w-full" 
                  />
                  <div className="absolute inset-0 bg-[#FFECD1] opacity-40" />
                </div>
              )}
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
                onClick={handleRegenerateContent8}
                disabled={isGeneratingContent8}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingContent8 ? 'animate-spin' : ''}`} />
                Regenerate image
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 py-[40px] relative">
          <div className="max-w-xl mx-auto">
            <div className="aspect-[2/1] bg-[#FFECD1] rounded-lg p-8 relative">
              {contentImage9 && (
                <div className="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center">
                  <img 
                    src={contentImage9} 
                    alt="Additional content" 
                    className="w-auto h-full object-contain max-w-full" 
                  />
                  <div className="absolute inset-0 bg-[#FFECD1] opacity-40" />
                </div>
              )}
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
                onClick={handleRegenerateContent9}
                disabled={isGeneratingContent9}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingContent9 ? 'animate-spin' : ''}`} />
                Regenerate image
              </Button>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8 py-[40px] relative">
          <div className="max-w-xl mx-auto">
            <div className="aspect-[2/1] bg-[#FFECD1] rounded-lg p-8 relative">
              {contentImage10 && (
                <div className="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center">
                  <img 
                    src={contentImage10} 
                    alt="Additional content" 
                    className="w-auto h-full object-contain max-w-full" 
                  />
                  <div className="absolute inset-0 bg-[#FFECD1] opacity-40" />
                </div>
              )}
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
                onClick={handleRegenerateContent10}
                disabled={isGeneratingContent10}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingContent10 ? 'animate-spin' : ''}`} />
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
