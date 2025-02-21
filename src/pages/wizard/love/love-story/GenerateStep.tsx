import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import LayoutSelector from '@/components/cover-generator/LayoutSelector';
import FontSelector from '@/components/cover-generator/FontSelector';
import TemplateSelector from '@/components/cover-generator/TemplateSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const LoveStoryGenerateStep = () => {
  const navigate = useNavigate();
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [selectedLayout, setSelectedLayout] = useState('classic-centered');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [selectedFont, setSelectedFont] = useState('playfair');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [backCoverText, setBackCoverText] = useState('');
  const { toast } = useToast();

  const generateImage = async (promptDescription: string, promptKeywords: string) => {
    try {
      const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-anime-couple', {
        body: {
          prompt: `Anime style romantic couple in love, ${promptDescription}, ${promptKeywords}`,
        }
      });

      if (imageError) throw imageError;
      if (!imageData?.image) throw new Error('No image generated');

      const savedUserPhoto = localStorage.getItem('loveStoryUserPhoto');
      const savedPartnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');

      if (savedUserPhoto && savedPartnerPhoto) {
        const { data: swappedData, error: swapError } = await supabase.functions.invoke('swap-faces', {
          body: {
            targetImage: imageData.image,
            userFace: savedUserPhoto,
            partnerFace: savedPartnerPhoto
          }
        });

        if (swapError) throw swapError;
        if (!swappedData?.success) throw new Error('Face swap failed');

        return swappedData.image;
      }

      return imageData.image;
    } catch (error) {
      console.error('Error in generateImage:', error);
      throw error;
    }
  };

  const handleGenerateClick = async () => {
    const savedIdeas = localStorage.getItem('loveStoryGeneratedIdea');
    const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
    const savedAnswers = localStorage.getItem('loveStoryAnswers');

    if (!savedIdeas || !savedIdeaIndex || !savedAnswers) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please complete the previous steps first. Redirecting..."
      });
      setTimeout(() => {
        navigate('/create/love/love-story/questions');
      }, 2000);
      return;
    }

    try {
      setIsProcessingImage(true);
      const idea = JSON.parse(savedIdeas);
      const answers = JSON.parse(savedAnswers);
      
      const promptDescription = idea.description || '';
      const promptKeywords = answers.map((qa: any) => qa.answer).join(", ");
      
      const generatedImage = await generateImage(promptDescription, promptKeywords);
      setCoverImage(generatedImage);
      
      toast({
        title: "Success!",
        description: "Your book cover has been generated.",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        variant: "destructive",
        title: "Error generating image",
        description: "Failed to generate the cover image. Please try again."
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const savedAuthor = localStorage.getItem('loveStoryAuthorName');
      const savedIdeas = localStorage.getItem('loveStoryGeneratedIdea');
      const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
      const savedMoments = localStorage.getItem('loveStoryMoments');

      if (!savedIdeas || !savedIdeaIndex) {
        toast({
          variant: "destructive",
          title: "Missing information",
          description: "Please complete the previous steps first. Redirecting..."
        });
        setTimeout(() => {
          navigate('/create/love/love-story/ideas');
        }, 2000);
        return;
      }

      if (savedAuthor) {
        setAuthorName(savedAuthor);
      }

      try {
        const idea = JSON.parse(savedIdeas);
        setCoverTitle(idea.title || '');
        setSubtitle(idea.description || '');

        if (savedMoments) {
          const moments = JSON.parse(savedMoments);
          const formattedMoments = moments
            .map((moment: string) => `"${moment}"`)
            .join('\n\n');
          setBackCoverText(formattedMoments);
        }
      } catch (error) {
        console.error('Error parsing saved data:', error);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "Please try completing the previous steps again."
        });
        setTimeout(() => {
          navigate('/create/love/love-story/ideas');
        }, 2000);
      }
    };

    loadData();
  }, [navigate, toast]);

  return (
    <WizardStep
      title="Create Your Love Story"
      description="Let's turn your beautiful moments into a timeless story"
      previousStep="/create/love/love-story/moments"
      currentStep={4}
      totalSteps={4}
    >
      <div className="glass-card rounded-2xl p-8 py-[40px]">
        <div className="max-w-xl mx-auto space-y-8">
          <CanvasCoverPreview
            coverTitle={coverTitle}
            subtitle={subtitle}
            authorName={authorName}
            coverImage={coverImage}
            selectedFont={selectedFont}
            selectedTemplate={selectedTemplate}
            selectedLayout={selectedLayout}
            isProcessingImage={isProcessingImage}
            backCoverText={backCoverText}
          />
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-center mb-2">Choose Your Font</h3>
              <FontSelector
                selectedFont={selectedFont}
                onSelectFont={setSelectedFont}
              />
            </div>

            <div>
              <h3 className="text-lg font-medium text-center mb-2">Choose Your Color Theme</h3>
              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-center mb-2">Choose Your Cover Layout</h3>
              <LayoutSelector
                selectedLayout={selectedLayout}
                onSelectLayout={setSelectedLayout}
              />
            </div>
          </div>

          <Button 
            className="w-full py-6 text-lg"
            onClick={handleGenerateClick}
            disabled={isProcessingImage}
          >
            {isProcessingImage ? 'Generating...' : 'Generate Your Love Story'}
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryGenerateStep;
