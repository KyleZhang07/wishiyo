import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define combined style presets
const stylePresets = [
  {
    id: 'modern-green',
    name: 'Modern Green',
    font: 'playfair',
    template: 'vibrant-green',
    layout: 'classic-centered',
    description: 'Black background with green text'
  },
  {
    id: 'classic-elegant',
    name: 'Classic Elegant',
    font: 'merriweather',
    template: 'classic',
    layout: 'left-align',
    description: 'Cream background with red accents'
  },
  {
    id: 'bold-vibrant',
    name: 'Bold Vibrant',
    font: 'montserrat',
    template: 'vibrant',
    layout: 'bold-header',
    description: 'Blue background with yellow highlights'
  },
  {
    id: 'minimal-clean',
    name: 'Minimal Clean',
    font: 'roboto',
    template: 'minimal',
    layout: 'minimal-frame',
    description: 'Light background with dark text'
  }
];

const FunnyBiographyGenerateStep = () => {
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [selectedStyle, setSelectedStyle] = useState('modern-green');
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(100);
  const [praises, setPraises] = useState<string>('');
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
    const savedPraises = localStorage.getItem('funnyBiographyPraises');

    if (savedAuthor) {
      setAuthorName(savedAuthor);
    }

    if (savedIdeas && savedIdeaIndex) {
      const ideas = JSON.parse(savedIdeas);
      const selectedIdea = ideas[parseInt(savedIdeaIndex)];
      if (selectedIdea) {
        setCoverTitle(selectedIdea.title || '');
        setSubtitle(selectedIdea.description || '');
        
        // If the selected idea has praises, use them
        if (selectedIdea.praises && Array.isArray(selectedIdea.praises)) {
          const formattedPraises = selectedIdea.praises
            .map((praise: { quote: string; source: string }) => 
              `"${praise.quote}"\n— ${praise.source}`
            )
            .join('\n\n');
          setPraises(formattedPraises);
          
          // Save formatted praises to localStorage for CanvasCoverPreview
          localStorage.setItem('funnyBiographyFormattedPraises', formattedPraises);
        }
      }
    }

    // If we didn't get praises from the selected idea, try the separate praises storage
    if (!praises && savedPraises) {
      try {
        const praisesData = JSON.parse(savedPraises);
        if (Array.isArray(praisesData)) {
          // Store in local component state for easy access
          const formattedPraises = praisesData
            .map((praise: { quote: string; source: string }) => 
              `"${praise.quote}"\n— ${praise.source}`
            )
            .join('\n\n');
          setPraises(formattedPraises);
          
          // Save formatted praises to localStorage for CanvasCoverPreview
          localStorage.setItem('funnyBiographyFormattedPraises', formattedPraises);
        }
      } catch (error) {
        console.error('Error parsing praises:', error);
      }
    }

    // If still no praises available, add mock praise words
    if (!praises && !localStorage.getItem('funnyBiographyFormattedPraises')) {
      const mockPraises = [
        {
          quote: "A hilarious romp through family dynamics that had me laughing until I cried. 'Family Feuds & Food Fights' brilliantly captures the chaos of sibling relationships.",
          source: "The Gastronomy Gazette"
        },
        {
          quote: "Equal parts heartwarming and hysterical. This book serves up family drama with a side of wit that's impossible to resist.",
          source: "Sibling Saga Monthly"
        },
        {
          quote: "A masterclass in storytelling that transforms everyday family squabbles into literary gold. Relatable, insightful, and genuinely funny.",
          source: "Family Feud Review"
        },
        {
          quote: "The perfect blend of humor and heart. 'Family Feuds & Food Fights' dishes out insights about family dynamics that are as nourishing as they are entertaining.",
          source: "Culinary Chronicles"
        }
      ];
      
      const formattedPraises = mockPraises
        .map((praise) => `"${praise.quote}"\n— ${praise.source}`)
        .join('\n\n');
      
      setPraises(formattedPraises);
      localStorage.setItem('funnyBiographyFormattedPraises', formattedPraises);
      localStorage.setItem('funnyBiographyPraises', JSON.stringify(mockPraises));
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
  };

  const currentStyle = getCurrentStyle();

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
          <CanvasCoverPreview
            coverTitle={coverTitle}
            subtitle={subtitle}
            authorName={authorName}
            coverImage={coverImage}
            selectedFont={currentStyle.font}
            selectedTemplate={currentStyle.template}
            selectedLayout={currentStyle.layout}
            category="friends"
            backCoverText={praises}
            imagePosition={imagePosition}
            imageScale={imageScale}
            onImageAdjust={handleImageAdjust}
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
