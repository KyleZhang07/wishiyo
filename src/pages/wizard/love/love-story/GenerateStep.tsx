
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import LayoutSelector from '@/components/cover-generator/LayoutSelector';
import FontSelector from '@/components/cover-generator/FontSelector';
import TemplateSelector from '@/components/cover-generator/TemplateSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
    const savedAuthor = localStorage.getItem('loveStoryAuthorName');
    const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
    const savedAnswers = localStorage.getItem('loveStoryAnswers');
    const savedMoments = localStorage.getItem('loveStoryMoments');

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

    if (savedAnswers) {
      const answers = JSON.parse(savedAnswers);
      handleImageGeneration(answers);
    }

    if (savedMoments) {
      const moments = JSON.parse(savedMoments);
      const formattedMoments = moments
        .map((moment: string) => `"${moment}"`)
        .join('\n\n');
      setBackCoverText(formattedMoments);
    }
  }, []);

  const generatePromptFromAnswers = (answers: Array<{ question: string; answer: string }>) => {
    // Find specific answers
    const locationAnswer = answers.find(a => a.question.includes('drawn to cities, nature'))?.answer || '';
    const climateAnswer = answers.find(a => a.question.includes('climate excites'))?.answer || '';
    const settingAnswer = answers.find(a => a.question.includes('historical, futuristic, fantasy'))?.answer || '';
    const moodAnswer = answers.find(a => a.question.includes('mood should it capture'))?.answer || '';
    const experienceAnswer = answers.find(a => a.question.includes('romantic experiences excite'))?.answer || '';

    // Ensure all required parts are present
    if (!locationAnswer || !settingAnswer || !moodAnswer) {
      throw new Error('Missing required answers for image generation');
    }

    return `A romantic couple in a ${locationAnswer} setting, 
      ${climateAnswer ? `with ${climateAnswer} weather atmosphere,` : ''} 
      ${settingAnswer} style scene.
      The image captures a ${moodAnswer} mood 
      ${experienceAnswer ? `with ${experienceAnswer}` : ''}.
      Focus on emotional connection between the couple, elegant and romantic composition`;
  };

  const handleImageGeneration = async (answers: Array<{ question: string; answer: string }>) => {
    setIsProcessingImage(true);
    try {
      const prompt = generatePromptFromAnswers(answers);
      console.log('Generated prompt:', prompt);

      const { data, error } = await supabase.functions.invoke('generate-anime-couple', {
        body: { prompt }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('Image generation failed:', data?.error);
        throw new Error(data?.error || 'Failed to generate image');
      }

      if (!data.image) {
        throw new Error('No image URL in response');
      }

      setCoverImage(data.image);
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        variant: "destructive",
        title: "Failed to generate the cover image",
        description: error.message || "Please try again."
      });
    } finally {
      setIsProcessingImage(false);
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
