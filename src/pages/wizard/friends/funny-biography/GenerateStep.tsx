
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import LayoutSelector from '@/components/cover-generator/FontSelector';
import TemplateSelector from '@/components/cover-generator/TemplateSelector';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const FunnyBiographyGenerateStep = () => {
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [processedImage, setProcessedImage] = useState<string>();
  const [selectedLayout, setSelectedLayout] = useState('centered');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('remove-background', {
        body: { image: imageData }
      });

      if (error) throw error;

      if (data?.processedImage) {
        setProcessedImage(data.processedImage);
        localStorage.setItem('funnyBiographyProcessedPhoto', data.processedImage);
        toast({
          title: "Success",
          description: "Background removed successfully!"
        });
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: "Failed to remove background. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Load data from localStorage
    const savedAuthor = localStorage.getItem('funnyBiographyAuthorName');
    const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
    const savedPhotos = localStorage.getItem('funnyBiographyPhoto');
    const savedProcessedPhoto = localStorage.getItem('funnyBiographyProcessedPhoto');

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

    if (savedProcessedPhoto) {
      setProcessedImage(savedProcessedPhoto);
      setCoverImage(savedProcessedPhoto);
    } else if (savedPhotos) {
      setCoverImage(savedPhotos);
      processImage(savedPhotos);
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
          {isProcessing && (
            <div className="text-center py-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto" />
              <p className="mt-2 text-gray-600">Removing background from your image...</p>
            </div>
          )}
          
          <CanvasCoverPreview
            coverTitle={coverTitle}
            subtitle={subtitle}
            authorName={authorName}
            coverImage={processedImage || coverImage}
            selectedFont="Arial"
            selectedTemplate={selectedTemplate}
            selectedLayout={selectedLayout}
          />
          
          <div className="space-y-4">
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
