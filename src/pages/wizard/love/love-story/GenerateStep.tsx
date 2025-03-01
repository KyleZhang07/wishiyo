
import React, { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CoverPreviewCard } from './components/CoverPreviewCard';
import { useSupabaseImages } from './hooks/useSupabaseImages';
import { useImageGeneration, ImageText } from './hooks/useImageGeneration';
import IntroductionSection from './components/IntroductionSection';
import StoryContentSection from './components/StoryContentSection';

const GenerateStep = () => {
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [backCoverText, setBackCoverText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('Photographic (Default)');
  const [imageTexts, setImageTexts] = useState<ImageText[]>([]);
  const [isGeneratingTexts, setIsGeneratingTexts] = useState(false);
  const { toast } = useToast();

  // Load images from Supabase
  const {
    coverImage,
    introImage,
    contentImages,
    imageStorageMap,
    isLoadingImages,
    loadImagesFromSupabase,
    setImageFunction
  } = useSupabaseImages();

  // Handle image generation
  const {
    isGeneratingCover,
    isGeneratingIntro,
    isGeneratingContent,
    handleRegenerateCover,
    handleRegenerateIntro,
    handleGenerateContentImage,
    handleUpdateContentText
  } = useImageGeneration({
    selectedStyle,
    setSelectedStyle,
    imageTexts,
    setImageTexts,
    setImageStorageMap,
    loadImagesFromSupabase
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      const savedAuthor = localStorage.getItem('loveStoryAuthorName');
      const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
      const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
      const savedMoments = localStorage.getItem('loveStoryMoments');
      const savedTexts = localStorage.getItem('loveStoryImageTexts');
      const savedStyle = localStorage.getItem('loveStoryStyle');
      
      await loadImagesFromSupabase();

      if (savedAuthor) {
        setAuthorName(savedAuthor);
      }

      if (savedStyle) {
        const styleMapping: Record<string, string> = {
          'Comic Book': 'Comic book',
          'Line Art': 'Line art',
          'Fantasy Art': 'Fantasy art',
          'Photographic': 'Photographic (Default)',
          'Cinematic': 'Cinematic'
        };
        
        const normalizedStyle = styleMapping[savedStyle] || savedStyle;
        setSelectedStyle(normalizedStyle);
        
        if (normalizedStyle !== savedStyle) {
          localStorage.setItem('loveStoryStyle', normalizedStyle);
        }
      }

      if (savedTexts) {
        try {
          setImageTexts(JSON.parse(savedTexts));
        } catch (error) {
          console.error('Error parsing saved texts:', error);
        }
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
    };

    loadInitialData();
  }, []);

  // Handle regenerating images for any content index
  const handleRegenerateContentImage = async (index: number, style?: string) => {
    const imageData = await handleGenerateContentImage(index, style);
    if (imageData) {
      setImageFunction(index, imageData);
    }
  };

  // Handle refreshing images from storage
  const refreshImages = () => {
    loadImagesFromSupabase();
    toast({
      title: "Refreshing images",
      description: "Loading latest images from Supabase Storage",
    });
  };

  // Placeholder functions
  const handleEditCover = () => {
    toast({
      title: "Edit Cover",
      description: "Opening cover editor..."
    });
  };

  return (
    <WizardStep
      title="Your Love Story Images"
      description="Here are your personalized love story images with accompanying text."
      previousStep="/create/love/love-story/moments"
      nextStep="/create/love/love-story/preview"
      currentStep={4}
      totalSteps={4}
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-4 flex justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshImages}
            disabled={isLoadingImages}
          >
            {isLoadingImages ? 'Loading...' : 'Refresh Images'}
          </Button>
        </div>
      
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Cover</h2>
          <CoverPreviewCard 
            coverImage={coverImage}
            coverTitle={coverTitle}
            subtitle={subtitle}
            authorName={authorName}
            backCoverText={backCoverText}
            isGeneratingCover={isGeneratingCover}
            onRegenerateCover={handleRegenerateCover}
            onEditCover={handleEditCover}
          />
        </div>

        <IntroductionSection 
          introImage={introImage}
          isGeneratingIntro={isGeneratingIntro}
          imageTexts={imageTexts}
          onRegenerateIntro={handleRegenerateIntro}
          onUpdateText={handleUpdateContentText}
        />
        
        <StoryContentSection 
          contentImages={contentImages}
          isGeneratingContent={isGeneratingContent}
          imageTexts={imageTexts}
          onRegenerateImage={handleRegenerateContentImage}
          onUpdateText={handleUpdateContentText}
        />
      </div>
    </WizardStep>
  );
};

export default GenerateStep;
