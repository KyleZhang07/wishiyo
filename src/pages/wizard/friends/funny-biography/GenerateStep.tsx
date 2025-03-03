import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// 定义赞美语接口
interface Praise {
  source: string;
  text: string;
}

// Define combined style presets
const stylePresets = [
  {
    id: 'classic-red',
    name: 'Classic Beige',
    font: 'merriweather',
    template: 'classic',
    layout: 'classic-centered',
    description: 'Warm beige background with navy blue text and circular image'
  },
  {
    id: 'modern-green',
    name: 'Modern Green',
    font: 'montserrat',
    template: 'vibrant-green',
    layout: 'bold-header',
    description: 'Black background with vibrant green text'
  },
  {
    id: 'minimal-gray',
    name: 'Minimal Gray',
    font: 'roboto',
    template: 'minimal',
    layout: 'minimal-frame',
    description: 'Gray background with monochrome styling'
  },
  {
    id: 'vibrant-blue',
    name: 'Vibrant Blue',
    font: 'montserrat',
    template: 'vibrant',
    layout: 'bold-header',
    description: 'Blue background with yellow highlight text'
  },
  {
    id: 'pastel-beige',
    name: 'Pastel Beige',
    font: 'playfair',
    template: 'classic',
    layout: 'left-align',
    description: 'Soft beige background with navy blue text'
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
  const [praises, setPraises] = useState<Praise[]>([]);
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
        
        // 获取赞美语
        if (selectedIdea.praises && Array.isArray(selectedIdea.praises)) {
          setPraises(selectedIdea.praises);
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
      currentStep={5}
      totalSteps={6}
    >
      <div className="space-y-8">
        <div className="mx-auto flex justify-center">
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
            scaleFactor={0.45}
            praises={praises}
          />
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-center mb-4">Choose Your Style</h3>
          <div className="flex flex-wrap justify-center gap-6 mt-4">
            {[...stylePresets].map((style, index) => {
              // Get template and layout data based on style configuration
              const template = style.template;
              
              // Define style colors to match the image
              let styleConfig;
              if (style.id === 'classic-red') {
                styleConfig = { bg: '#C41E3A', text: '#FFFFFF', border: 'none' }; // Red with white text (first circle)
              } else if (style.id === 'modern-green') {
                styleConfig = { bg: '#121212', text: '#7CFC00', border: 'none' }; // Black with green text (second circle)
              } else if (style.id === 'minimal-gray') {
                styleConfig = { bg: '#808080', text: '#FFFFFF', border: 'none' }; // Gray with white text (third circle)
              } else if (style.id === 'vibrant-blue') {
                styleConfig = { bg: '#4361EE', text: '#FFC300', border: 'none' }; // Blue with yellow text (fourth circle)
              } else if (style.id === 'pastel-beige') {
                styleConfig = { bg: '#FFD1DC', text: '#000000', border: 'none' }; // Pink with black (fifth circle)
              } else {
                styleConfig = { bg: '#F8D5B2', text: '#1E365C', border: 'none' }; // Default
              }
              
              return (
                <div 
                  key={style.id}
                  onClick={() => handleStyleChange(style.id)}
                  className="flex flex-col items-center"
                >
                  <div 
                    className={`w-[80px] h-[80px] rounded-full flex items-center justify-center cursor-pointer transition-all ${
                      selectedStyle === style.id 
                        ? 'ring-4 ring-[#F6C744] ring-offset-2' 
                        : 'hover:ring-2 hover:ring-[#F6C744]/50'
                    }`}
                    style={{ 
                      backgroundColor: styleConfig.bg,
                      border: styleConfig.border
                    }}
                  >
                    <span 
                      className="text-3xl font-bold"
                      style={{ 
                        color: styleConfig.text,
                        fontFamily: style.font === 'playfair' ? 'serif' 
                                 : style.font === 'merriweather' ? 'serif' 
                                 : style.font === 'montserrat' ? 'sans-serif' 
                                 : style.font === 'roboto' ? 'sans-serif'
                                 : 'sans-serif',
                        fontWeight: style.font === 'montserrat' || style.font === 'roboto' ? '700' : '800',
                      }}
                    >
                      Aa
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-8">
          <Button 
            className="w-full py-6 text-lg bg-[#F6C744] hover:bg-[#E5B73E] text-white"
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