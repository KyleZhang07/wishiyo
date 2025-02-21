
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import LayoutSelector from '@/components/cover-generator/LayoutSelector';
import FontSelector from '@/components/cover-generator/FontSelector';
import TemplateSelector from '@/components/cover-generator/TemplateSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const LoveStoryGenerateStep = () => {
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

  useEffect(() => {
    const loadData = async () => {
      const savedAuthor = localStorage.getItem('loveStoryAuthorName');
      const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
      const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
      const savedMoments = localStorage.getItem('loveStoryMoments');
      const savedUserPhoto = localStorage.getItem('loveStoryUserPhoto');
      const savedPartnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
      const savedAnswers = localStorage.getItem('loveStoryAnswers');

      if (savedAuthor) {
        setAuthorName(savedAuthor);
      }

      let promptDescription = "";
      if (savedIdeas && savedIdeaIndex) {
        const ideas = JSON.parse(savedIdeas);
        const selectedIdea = ideas[parseInt(savedIdeaIndex)];
        if (selectedIdea) {
          setCoverTitle(selectedIdea.title || '');
          setSubtitle(selectedIdea.description || '');
          promptDescription = selectedIdea.description || '';
        }
      }

      if (savedMoments) {
        const moments = JSON.parse(savedMoments);
        const formattedMoments = moments
          .map((moment: string) => `"${moment}"`)
          .join('\n\n');
        setBackCoverText(formattedMoments);
      }

      // Generate anime couple image using answers and subtitle
      if (savedAnswers && promptDescription) {
        try {
          setIsProcessingImage(true);
          const answers = JSON.parse(savedAnswers);
          const promptKeywords = answers.map((qa: any) => qa.answer).join(", ");
          
          // Generate anime couple image
          const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-anime-couple', {
            body: {
              prompt: `Anime style romantic couple, ${promptDescription}, ${promptKeywords}`,
              style: "anime"
            }
          });

          if (imageError) throw imageError;

          // If we have both photos, proceed with face swapping
          if (savedUserPhoto && savedPartnerPhoto && imageData.image) {
            const { data: swappedData, error: swapError } = await supabase.functions.invoke('swap-faces', {
              body: {
                targetImage: imageData.image,
                userFace: savedUserPhoto,
                partnerFace: savedPartnerPhoto
              }
            });

            if (swapError) throw swapError;

            if (swappedData.success) {
              setCoverImage(swappedData.image);
            }
          } else {
            // If no photos available, use the generated image directly
            setCoverImage(imageData.image);
          }
        } catch (error) {
          console.error('Error processing images:', error);
          toast({
            variant: "destructive",
            title: "Error processing images",
            description: "Failed to generate or process the cover image. Please try again."
          });
        } finally {
          setIsProcessingImage(false);
        }
      }
    };

    loadData();
  }, [toast]);

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
            onClick={() => {/* Generate book logic */}}
          >
            Generate Your Love Story
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryGenerateStep;

