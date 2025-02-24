
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
  const [backCoverText, setBackCoverText] = useState('');
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved data from previous steps
    const savedAuthor = localStorage.getItem('loveStoryAuthorName');
    const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
    const savedMoments = localStorage.getItem('loveStoryMoments');
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const savedCoverImage = localStorage.getItem('loveStoryCoverImage');
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

    // Check if we already have a generated cover image
    if (savedCoverImage) {
      setCoverImage(savedCoverImage);
    } else if (savedPrompts && partnerPhoto) {
      // Only generate if we don't have a saved cover image
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 0) {
        generateCoverImage(prompts[0].prompt, partnerPhoto);
      }
    }
  }, []);

  const generateCoverImage = async (prompt: string, photo: string) => {
    setIsGeneratingCover(true);
    toast({
      title: "Generating cover image",
      description: "This may take a minute...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('generate-love-cover', {
        body: { prompt, photo }
      });

      if (error) throw error;

      if (data && data.output && data.output[0]) {
        const generatedImage = data.output[0];
        setCoverImage(generatedImage);
        // Store the generated image in localStorage
        localStorage.setItem('loveStoryCoverImage', generatedImage);
        toast({
          title: "Cover image generated",
          description: "Your cover image is ready!",
        });
      }
    } catch (error) {
      console.error('Error generating cover:', error);
      toast({
        title: "Error generating cover",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleEditCover = () => {
    toast({
      title: "Edit Cover",
      description: "Opening cover editor..."
    });
  };

  const handleEditDedication = () => {
    toast({
      title: "Edit Dedication",
      description: "Opening dedication editor..."
    });
  };

  const handleRegenerateCover = async () => {
    // Remove the saved cover image when regenerating
    localStorage.removeItem('loveStoryCoverImage');
    
    const savedPrompts = localStorage.getItem('loveStoryImagePrompts');
    const partnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPrompts && partnerPhoto) {
      const prompts = JSON.parse(savedPrompts);
      if (prompts && prompts.length > 0) {
        await generateCoverImage(prompts[0].prompt, partnerPhoto);
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
        {/* Cover Preview */}
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

        {/* Dedication Preview */}
        <div className="glass-card rounded-2xl p-8 py-[40px] relative">
          <div className="max-w-xl mx-auto">
            <div className="aspect-[3/4] bg-[#FFECD1] rounded-lg p-8">
              <div className="h-full flex flex-col justify-center items-center text-center space-y-6">
                <div className="space-y-4">
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
            <Button
              variant="secondary"
              className="absolute bottom-4 right-4"
              onClick={handleEditDedication}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit dedication
            </Button>
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
