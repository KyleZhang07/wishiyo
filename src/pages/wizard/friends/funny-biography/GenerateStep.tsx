
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import LayoutSelector from '@/components/cover-generator/FontSelector';
import TemplateSelector from '@/components/cover-generator/TemplateSelector';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const FunnyBiographyGenerateStep = () => {
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [selectedLayout, setSelectedLayout] = useState('centered');
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = () => {
      // Load data from localStorage
      const savedAuthor = localStorage.getItem('funnyBiographyAuthorName');
      const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
      const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
      const savedPhoto = localStorage.getItem('funnyBiographyPhoto');
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

      // If we already have a processed photo, use it
      if (processedPhoto) {
        setCoverImage(processedPhoto);
      } else if (savedPhoto) {
        // If we have an original photo but no processed one, remove the background
        removeBackground(savedPhoto);
      }
    };

    loadData();
  }, []);

  const removeBackground = async (imageData: string) => {
    setIsProcessing(true);
    toast({
      title: "Processing image",
      description: "Removing the background from your photo..."
    });

    try {
      const { data, error } = await supabase.functions.invoke('remove-background', {
        body: { image: imageData }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.image) {
        // Save the processed image
        localStorage.setItem('funnyBiographyProcessedPhoto', data.image);
        setCoverImage(data.image);
        
        toast({
          title: "Success",
          description: "Background removed successfully!"
        });
      } else {
        throw new Error('No processed image received');
      }
    } catch (error) {
      console.error('Error removing background:', error);
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to remove background. Using original image.",
      });
      // Fallback to original image
      setCoverImage(imageData);
    } finally {
      setIsProcessing(false);
    }
  };

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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Processing your image...</p>
            </div>
          )}
          
          <CanvasCoverPreview
            coverTitle={coverTitle}
            subtitle={subtitle}
            authorName={authorName}
            coverImage={coverImage}
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
            disabled={isProcessing}
          >
            Generate Your Book
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default FunnyBiographyGenerateStep;
