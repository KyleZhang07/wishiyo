
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import LayoutSelector from '@/components/cover-generator/LayoutSelector';
import FontSelector from '@/components/cover-generator/FontSelector';
import TemplateSelector from '@/components/cover-generator/TemplateSelector';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const FunnyBiographyGenerateStep = () => {
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [selectedLayout, setSelectedLayout] = useState('classic-centered');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [selectedFont, setSelectedFont] = useState('playfair');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const { toast } = useToast();

  const removeBackground = async (imageUrl: string) => {
    setIsProcessingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('remove-background', {
        body: { imageUrl }
      });

      if (error || !data.success) {
        throw new Error(error?.message || data?.error || 'Failed to remove background');
      }

      setCoverImage(data.image);
      localStorage.setItem('funnyBiographyProcessedPhoto', data.image);
      
      toast({
        title: "Background removed successfully",
        description: "Your photo is now ready for the book cover."
      });
    } catch (error) {
      console.error('Error removing background:', error);
      toast({
        variant: "destructive",
        title: "Error removing background",
        description: "Will use original image for the cover."
      });
      // Use original image as fallback
      setCoverImage(imageUrl);
      localStorage.setItem('funnyBiographyProcessedPhoto', imageUrl);
    } finally {
      setIsProcessingImage(false);
    }
  };

  useEffect(() => {
    // Load data from localStorage
    const savedAuthor = localStorage.getItem('funnyBiographyAuthorName');
    const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
    const savedPhotos = localStorage.getItem('funnyBiographyPhoto');
    const processedPhoto = localStorage.getItem('funnyBiographyProcessedPhoto');

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

    // Always process the original photo if it exists and we don't have a processed version
    if (savedPhotos && !processedPhoto) {
      removeBackground(savedPhotos);
    } else if (processedPhoto) {
      setCoverImage(processedPhoto);
    }
  }, []);

  return (
    <WizardStep
      title="Create Your Book Cover"
      description="Design the perfect cover for your funny biography"
      previousStep="/create/friends/funny-biography/photos"
      currentStep={4}
      totalSteps={4}
    >
      <div className="glass-card rounded-2xl p-8 py-[40px]">
        <div className="max-w-xl mx-auto space-y-8">
          <div className="relative">
            <CanvasCoverPreview
              coverTitle={coverTitle}
              subtitle={subtitle}
              authorName={authorName}
              coverImage={coverImage}
              selectedFont={selectedFont}
              selectedTemplate={selectedTemplate}
              selectedLayout={selectedLayout}
            />
            
            {isProcessingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="text-center text-white">
                  <Loader2 className="w-8 h-8 mb-2 mx-auto animate-spin" />
                  <p>Removing background...</p>
                </div>
              </div>
            )}
          </div>
          
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
            Generate Your Book
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default FunnyBiographyGenerateStep;
