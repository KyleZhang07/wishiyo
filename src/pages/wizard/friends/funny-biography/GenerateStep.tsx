import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';

interface Praise {
  source: string;
  text: string;
}

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
    id: 'bestseller-style',
    name: 'Bestseller',
    font: 'montserrat',
    template: 'bestseller',
    layout: 'bestseller-modern',
    description: 'Black background with yellow title and blue description area'
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
    font: 'inter',
    template: 'minimal',
    layout: 'centered-title',
    description: 'Gray background with black and white color scheme'
  },
  {
    id: 'pastel-beige',
    name: 'Sweet Pink',
    font: 'times',
    template: 'pastel-beige',
    layout: 'classic-centered',
    description: 'Pink background with purple text'
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
  
  const [frontCoverPdf, setFrontCoverPdf] = useState<string | null>(null);
  const [backCoverPdf, setBackCoverPdf] = useState<string | null>(null);
  const [spinePdf, setSpinePdf] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  
  const canvasPdfContainerRef = useRef<HTMLDivElement>(null);

  const [generationStarted, setGenerationStarted] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [shouldRegenerate, setShouldRegenerate] = useState(false);
  const [lastUsedImage, setLastUsedImage] = useState<string | null>(null);
  const [lastUsedStyle, setLastUsedStyle] = useState<string | null>(null);

  const standardPreviewWidth = 180;
  const standardPreviewHeight = 270;
  const standardSpineWidth = 21;

  const getCurrentStyle = () => {
    return stylePresets.find(style => style.id === selectedStyle) || stylePresets[0];
  };

  useEffect(() => {
    const savedAuthor = localStorage.getItem('funnyBiographyAuthorName');
    const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
    const savedPhotos = localStorage.getItem('funnyBiographyPhoto');
    const savedStyle = localStorage.getItem('funnyBiographySelectedStyle');
    const savedGenerationComplete = localStorage.getItem('funnyBiographyGenerationComplete');
    
    const savedFrontCoverPdf = localStorage.getItem('funnyBiographyFrontCoverImage');
    const savedBackCoverPdf = localStorage.getItem('funnyBiographyBackCoverImage');
    const savedSpinePdf = localStorage.getItem('funnyBiographySpineImage');
    
    if (savedFrontCoverPdf) {
      setFrontCoverPdf(savedFrontCoverPdf);
      setGenerationComplete(true);
    }
    if (savedBackCoverPdf) setBackCoverPdf(savedBackCoverPdf);
    if (savedSpinePdf) setSpinePdf(savedSpinePdf);

    if (savedAuthor) {
      setAuthorName(savedAuthor);
    }

    if (savedStyle) {
      setSelectedStyle(savedStyle);
      setLastUsedStyle(savedStyle);
    }

    if (savedIdeas && savedIdeaIndex) {
      const ideas = JSON.parse(savedIdeas);
      const selectedIdea = ideas[parseInt(savedIdeaIndex)];
      if (selectedIdea) {
        setCoverTitle(selectedIdea.title || '');
        setSubtitle(selectedIdea.description || '');
        if (savedAuthor) {
          setAuthorName(savedAuthor);
        }
        
        if (selectedIdea.praises && Array.isArray(selectedIdea.praises)) {
          setPraises(selectedIdea.praises);
        }
      }
    }

    if (savedPhotos) {
      handleImageProcessing(savedPhotos);
      setLastUsedImage(savedPhotos);
    }
    
    if (savedGenerationComplete === 'true') {
      setGenerationComplete(true);
    }
  }, []);
  
  useEffect(() => {
    if (lastUsedStyle && selectedStyle !== lastUsedStyle) {
      setShouldRegenerate(true);
      setLastUsedStyle(selectedStyle);
      localStorage.setItem('funnyBiographySelectedStyle', selectedStyle);
    }
  }, [selectedStyle, lastUsedStyle]);
  
  useEffect(() => {
    if (coverImage && lastUsedImage !== coverImage && !generationComplete) {
      setShouldRegenerate(true);
      setLastUsedImage(coverImage);
    } else if (coverImage && !lastUsedImage) {
      setLastUsedImage(coverImage);
    }
  }, [coverImage, lastUsedImage, generationComplete]);
  
  useEffect(() => {
    if (shouldRegenerate && coverImage && authorName && coverTitle) {
      setFrontCoverPdf(null);
      setBackCoverPdf(null);
      setSpinePdf(null);
      
      setGenerationStarted(true);
      setGenerationComplete(false);
      localStorage.removeItem('funnyBiographyGenerationComplete');
      
      setTimeout(() => {
        generateImagesFromCanvas();
        setShouldRegenerate(false);
      }, 1000);
    }
  }, [shouldRegenerate, coverImage, authorName, coverTitle]);

  useEffect(() => {
    if (generationComplete) {
      localStorage.setItem('funnyBiographyGenerationComplete', 'true');
    }
  }, [generationComplete]);

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
  
  const generateImagesFromCanvas = async () => {
    if (!canvasPdfContainerRef.current || pdfGenerating) return;
    
    setPdfGenerating(true);
    
    setTimeout(() => {
      try {
        if (!canvasPdfContainerRef.current) {
          console.error('Canvas container not found');
          setPdfGenerating(false);
          return;
        }
        
        const canvases = canvasPdfContainerRef.current.querySelectorAll('canvas');
        if (canvases.length < 3) {
          console.error('Not enough canvas elements found');
          setPdfGenerating(false);
          return;
        }
        
        const frontCoverCanvas = canvases[0];
        const frontImgData = frontCoverCanvas.toDataURL('image/jpeg', 0.9);
        setFrontCoverPdf(frontImgData);
        localStorage.setItem('funnyBiographyFrontCoverImage', frontImgData);
        
        const spineCanvas = canvases[1];
        const spineImgData = spineCanvas.toDataURL('image/jpeg', 0.9);
        setSpinePdf(spineImgData);
        localStorage.setItem('funnyBiographySpineImage', spineImgData);
        
        const backCoverCanvas = canvases[2];
        const backImgData = backCoverCanvas.toDataURL('image/jpeg', 0.9);
        setBackCoverPdf(backImgData);
        localStorage.setItem('funnyBiographyBackCoverImage', backImgData);
        
        setPdfGenerating(false);
        setGenerationComplete(true);
        
        console.log('All cover images generated successfully');
      } catch (error) {
        console.error('Error generating cover images:', error);
        setPdfGenerating(false);
      }
    }, 500);
  };

  const handleGenerateBook = () => {
    if (!frontCoverPdf || !backCoverPdf || !spinePdf) {
      generateImagesFromCanvas();
    }
    
    localStorage.setItem('funnyBiographySelectedStyle', selectedStyle);
    
    navigate('/create/friends/funny-biography/preview');
  };

  const currentStyle = getCurrentStyle();

  return (
    <WizardStep
      title="Create Your Book Cover"
      description=""
      previousStep="/create/friends/funny-biography/photos"
      currentStep={5}
      totalSteps={7}
    >
      <div className="space-y-8">
        <div className="mx-auto flex justify-center" ref={canvasPdfContainerRef} style={{ position: 'absolute', left: '-9999px', visibility: 'hidden' }}>
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
            previewMode={false}
          />
        </div>
        
        <div className="mx-auto flex flex-col items-center">
          {!frontCoverPdf || pdfGenerating ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-[#FF7F50] border-t-transparent rounded-full"></div>
              <span className="ml-3">Generating cover...</span>
            </div>
          ) : (
            <div className="flex items-start space-x-2 justify-center">
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600 mb-2">Front Cover</p>
                <img
                  src={frontCoverPdf} 
                  className={`w-[${standardPreviewWidth}px] h-[${standardPreviewHeight}px] border shadow-md object-cover bg-gray-50`}
                  alt="Front Cover"
                />
              </div>
              
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600 mb-2">Spine</p>
                <img 
                  src={spinePdf || ''} 
                  className={`w-[${standardSpineWidth}px] h-[${standardPreviewHeight}px] border shadow-md object-cover bg-gray-50`}
                  alt="Spine"
                />
              </div>
              
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600 mb-2">Back Cover</p>
                <img 
                  src={backCoverPdf || ''} 
                  className={`w-[${standardPreviewWidth}px] h-[${standardPreviewHeight}px] border shadow-md object-cover bg-gray-50`}
                  alt="Back Cover"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-4 mt-4">
          <div className="flex flex-wrap justify-center gap-6">
            {[...stylePresets].map((style, index) => {
              const template = style.template;
              
              let styleConfig;
              if (style.id === 'classic-red') {
                styleConfig = { bg: '#C41E3A', text: '#FFFFFF', border: 'none' };
              } else if (style.id === 'bestseller-style') {
                styleConfig = { bg: '#4361EE', text: '#F7DC6F', border: 'none' };
              } else if (style.id === 'modern-green') {
                styleConfig = { bg: '#E6DEC9', text: '#D4AF37', border: 'none' };
              } else if (style.id === 'minimal-gray') {
                styleConfig = { bg: '#D9D9D9', text: '#FFFFFF', border: 'none' };
              } else if (style.id === 'pastel-beige') {
                styleConfig = { bg: '#FFC0CB', text: '#8A2BE2', border: 'none' };
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
                        ? 'ring-4 ring-[#FF7F50] ring-offset-2' 
                        : 'hover:ring-2 hover:ring-[#FF7F50]/50'
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
            className="w-full py-6 text-lg bg-[#FF7F50] hover:bg-[#FF7F50]/80 text-white"
            onClick={handleGenerateBook}
            disabled={pdfGenerating}
          >
            Continue
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default FunnyBiographyGenerateStep;
