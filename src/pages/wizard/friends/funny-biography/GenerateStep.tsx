import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define combined style presets
const stylePresets = [
  {
    id: 'classic-red',
    name: '经典红色',
    font: 'merriweather',
    template: 'classic',
    layout: 'classic-centered',
    description: '红色背景与金色边框，典雅风格'
  },
  {
    id: 'modern-green',
    name: '现代绿色',
    font: 'montserrat',
    template: 'vibrant-green',
    layout: 'bold-header',
    description: '黑色背景配以鲜亮的绿色文字'
  },
  {
    id: 'minimal-gray',
    name: '简约灰色',
    font: 'roboto',
    template: 'minimal',
    layout: 'minimal-frame',
    description: '灰色背景与黑白配色，简约时尚'
  },
  {
    id: 'vibrant-blue',
    name: '活力蓝色',
    font: 'montserrat',
    template: 'vibrant',
    layout: 'bold-header',
    description: '蓝色背景与黄色文字，充满活力'
  },
  {
    id: 'pastel-beige',
    name: '柔和米色',
    font: 'playfair',
    template: 'classic',
    layout: 'left-align',
    description: '米色背景与深蓝色文字，温暖柔和'
  }
];

const FunnyBiographyGenerateStep = () => {
  const navigate = useNavigate();
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [selectedStyle, setSelectedStyle] = useState('classic-red');
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(100);
  const { toast } = useToast();

  // Get the current style preset
  const getCurrentStyle = () => {
    return stylePresets.find(style => style.id === selectedStyle) || stylePresets[0];
  };

  useEffect(() => {
    const savedAuthor = localStorage.getItem('funnyBiographyAuthorName');
    const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
    const savedPhotos = localStorage.getItem('funnyBiographyPhoto');
    const savedStyle = localStorage.getItem('funnyBiographySelectedStyle');

    if (savedAuthor) {
      setAuthorName(savedAuthor);
    }

    if (savedStyle) {
      setSelectedStyle(savedStyle);
    }

    if (savedIdeas && savedIdeaIndex) {
      const ideas = JSON.parse(savedIdeas);
      const selectedIdea = ideas[parseInt(savedIdeaIndex)];
      if (selectedIdea) {
        setCoverTitle(selectedIdea.title || '');
        setSubtitle(selectedIdea.description || '');
        // Always use the authorName from localStorage, ignore any author field from the idea
        if (savedAuthor) {
          setAuthorName(savedAuthor);
        }
      }
    }

    if (savedPhotos) {
      handleImageProcessing(savedPhotos);
    }
  }, []);

  const handleImageProcessing = async (imageUrl: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('remove-background', {
        body: { imageUrl }
      });

      if (error) throw error;

      if (data.success && data.image) {
        setCoverImage(data.image);
      } else {
        throw new Error('Failed to process image');
      }
    } catch (error) {
      console.error('Error removing background:', error);
      toast({
        variant: "destructive",
        title: "Error processing image",
        description: "Failed to remove background from the image. Please try again."
      });
      setCoverImage(imageUrl);
    }
  };

  const handleImageAdjust = (position: { x: number; y: number }, scale: number) => {
    setImagePosition(position);
    setImageScale(scale);
  };

  const handleStyleChange = (styleId: string) => {
    setSelectedStyle(styleId);
    localStorage.setItem('funnyBiographySelectedStyle', styleId);
  };

  const handleGenerateBook = () => {
    // Save current style selection to localStorage
    localStorage.setItem('funnyBiographySelectedStyle', selectedStyle);
    
    // Navigate to the preview page
    navigate('/create/friends/funny-biography/preview');
  };

  const currentStyle = getCurrentStyle();

  return (
    <WizardStep
      title="Create Your Book Cover"
      description="Design the perfect cover for your funny biography"
      previousStep="/create/friends/funny-biography/photos"
      currentStep={4}
      totalSteps={5}
    >
      <div className="glass-card rounded-2xl p-8 py-[40px]">
        <div className="max-w-xl mx-auto space-y-8">
          <CanvasCoverPreview
            coverTitle={coverTitle}
            subtitle={subtitle}
            authorName={authorName}
            coverImage={coverImage}
            selectedFont={currentStyle.font}
            selectedTemplate={currentStyle.template}
            selectedLayout={currentStyle.layout}
            category="friends"
            imagePosition={imagePosition}
            imageScale={imageScale}
            onImageAdjust={handleImageAdjust}
            scaleFactor={0.4}
          />
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-center mb-4">Choose Your Style</h3>
              <div className="grid grid-cols-2 gap-4">
                {stylePresets.map((style) => (
                  <div 
                    key={style.id}
                    onClick={() => handleStyleChange(style.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedStyle === style.id 
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary' 
                        : 'bg-card hover:bg-accent'
                    }`}
                  >
                    <h4 className="font-medium">{style.name}</h4>
                    <p className="text-sm opacity-80">{style.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button 
            className="w-full py-6 text-lg"
            onClick={handleGenerateBook}
          >
            Generate Your Book
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default FunnyBiographyGenerateStep;
