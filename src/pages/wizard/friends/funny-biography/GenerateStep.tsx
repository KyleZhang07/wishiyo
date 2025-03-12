import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';

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
  
  // PDF状态
  const [frontCoverPdf, setFrontCoverPdf] = useState<string | null>(null);
  const [backCoverPdf, setBackCoverPdf] = useState<string | null>(null);
  const [spinePdf, setSpinePdf] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  
  // Canvas引用，用于生成PDF
  const canvasPdfContainerRef = useRef<HTMLDivElement>(null);

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
    
    // 尝试加载已保存的PDF
    const savedFrontCoverPdf = localStorage.getItem('funnyBiographyFrontCoverImage');
    const savedBackCoverPdf = localStorage.getItem('funnyBiographyBackCoverImage');
    const savedSpinePdf = localStorage.getItem('funnyBiographySpineImage');
    
    if (savedFrontCoverPdf) setFrontCoverPdf(savedFrontCoverPdf);
    if (savedBackCoverPdf) setBackCoverPdf(savedBackCoverPdf);
    if (savedSpinePdf) setSpinePdf(savedSpinePdf);

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
  
  // When style or other related parameters change, generate PDF
  useEffect(() => {
    // Only generate PDF when all necessary data is ready
    if (coverTitle && authorName && coverImage) {
      // Check if we already have PDFs, don't regenerate if we're returning to this step
      const hasExistingPdfs = frontCoverPdf && backCoverPdf && spinePdf;
      if (!hasExistingPdfs) {
        generatePdfsFromCanvas();
      }
    }
  }, [selectedStyle, coverTitle, subtitle, authorName, coverImage, imagePosition, imageScale]);

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
    // Clear previous PDFs
    setFrontCoverPdf(null);
    setBackCoverPdf(null);
    setSpinePdf(null);
    
    // Remove from localStorage
    localStorage.removeItem('funnyBiographyFrontCoverImage');
    localStorage.removeItem('funnyBiographyBackCoverImage');
    localStorage.removeItem('funnyBiographySpineImage');
    
    // Set new style
    setSelectedStyle(styleId);
    localStorage.setItem('funnyBiographySelectedStyle', styleId);
  };
  
  // Generate PDF from Canvas and save
  const generatePdfsFromCanvas = async () => {
    setPdfGenerating(true);
    
    // Ensure Canvas is rendered
    setTimeout(() => {
      try {
        if (!canvasPdfContainerRef.current) {
          console.error('Canvas container not found');
          setPdfGenerating(false);
          return;
        }
        
        // Get all Canvas elements
        const canvases = canvasPdfContainerRef.current.querySelectorAll('canvas');
        if (canvases.length < 3) {
          console.error('Not enough canvas elements found');
          setPdfGenerating(false);
          return;
        }
        
        // Front cover
        const frontCoverCanvas = canvases[0];
        const frontPdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [frontCoverCanvas.width, frontCoverCanvas.height]
        });
        const frontImgData = frontCoverCanvas.toDataURL('image/jpeg', 1.0);
        frontPdf.addImage(frontImgData, 'JPEG', 0, 0, frontCoverCanvas.width, frontCoverCanvas.height);
        const frontPdfData = frontPdf.output('datauristring');
        setFrontCoverPdf(frontPdfData);
        localStorage.setItem('funnyBiographyFrontCoverImage', frontPdfData);
        
        // Spine
        const spineCanvas = canvases[1];
        const spinePdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [spineCanvas.width, spineCanvas.height]
        });
        const spineImgData = spineCanvas.toDataURL('image/jpeg', 1.0);
        spinePdf.addImage(spineImgData, 'JPEG', 0, 0, spineCanvas.width, spineCanvas.height);
        const spinePdfData = spinePdf.output('datauristring');
        setSpinePdf(spinePdfData);
        localStorage.setItem('funnyBiographySpineImage', spinePdfData);
        
        // Back cover
        const backCoverCanvas = canvases[2];
        const backPdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [backCoverCanvas.width, backCoverCanvas.height]
        });
        const backImgData = backCoverCanvas.toDataURL('image/jpeg', 1.0);
        backPdf.addImage(backImgData, 'JPEG', 0, 0, backCoverCanvas.width, backCoverCanvas.height);
        const backPdfData = backPdf.output('datauristring');
        setBackCoverPdf(backPdfData);
        localStorage.setItem('funnyBiographyBackCoverImage', backPdfData);
        
        console.log('PDFs generated successfully');
      } catch (error) {
        console.error('Error generating PDFs:', error);
        toast({
          variant: "destructive",
          title: "Error generating PDFs",
          description: "Failed to convert canvas to PDF. Please try again."
        });
      } finally {
        setPdfGenerating(false);
      }
    }, 500); // Give Canvas some time to render
  };

  const handleGenerateBook = () => {
    // If PDFs haven't been generated yet, try generating once
    if (!frontCoverPdf || !backCoverPdf || !spinePdf) {
      generatePdfsFromCanvas();
    }
    
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
        {/* Canvas container for generating PDF, not directly displayed */}
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
        
        {/* PDF preview area */}
        <div className="mx-auto flex justify-center">
          {pdfGenerating ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-[#F6C744] border-t-transparent rounded-full"></div>
              <span className="ml-3">Generating PDF...</span>
            </div>
          ) : frontCoverPdf ? (
            <div className="flex items-start space-x-4">
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600 mb-2">Front Cover</p>
                <iframe 
                  src={frontCoverPdf} 
                  className="w-[300px] h-[450px] border shadow-md"
                  title="Front Cover PDF"
                />
              </div>
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600 mb-2">Spine</p>
                <iframe 
                  src={spinePdf || ''} 
                  className="w-[40px] h-[450px] border shadow-md"
                  title="Spine PDF"
                />
              </div>
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600 mb-2">Back Cover</p>
                <iframe 
                  src={backCoverPdf || ''} 
                  className="w-[300px] h-[450px] border shadow-md"
                  title="Back Cover PDF"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p>Preparing cover preview...</p>
            </div>
          )}
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
              } else if (style.id === 'bestseller-style') {
                styleConfig = { bg: '#4361EE', text: '#F7DC6F', border: 'none' }; // Blue with yellow text
              } else if (style.id === 'modern-green') {
                styleConfig = { bg: '#E6DEC9', text: '#D4AF37', border: 'none' }; // 折中的奶油色底金字
              } else if (style.id === 'minimal-gray') {
                styleConfig = { bg: '#D9D9D9', text: '#FFFFFF', border: 'none' }; // 浅灰色背景，白色文字
              } else if (style.id === 'pastel-beige') {
                styleConfig = { bg: '#FFC0CB', text: '#8A2BE2', border: 'none' }; // 粉色背景，紫色文字
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
            disabled={pdfGenerating}
          >
            {pdfGenerating ? 'Generating PDF...' : 'Generate Your Book'}
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default FunnyBiographyGenerateStep;