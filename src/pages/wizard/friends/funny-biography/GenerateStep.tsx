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
  const [combinedPdfUrl, setCombinedPdfUrl] = useState<string | null>(null);
  
  const canvasPdfContainerRef = useRef<HTMLDivElement>(null);

  const getCurrentStyle = () => {
    return stylePresets.find(style => style.id === selectedStyle) || stylePresets[0];
  };

  useEffect(() => {
    const savedAuthor = localStorage.getItem('funnyBiographyAuthorName');
    const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
    const savedPhotos = localStorage.getItem('funnyBiographyPhoto');
    const savedStyle = localStorage.getItem('funnyBiographySelectedStyle');
    
    const savedFrontCoverPdf = localStorage.getItem('funnyBiographyFrontCoverImage');
    const savedBackCoverPdf = localStorage.getItem('funnyBiographyBackCoverImage');
    const savedSpinePdf = localStorage.getItem('funnyBiographySpineImage');
    const savedCombinedPdfUrl = localStorage.getItem('funnyBiographyCombinedPdfUrl');
    
    if (savedFrontCoverPdf) setFrontCoverPdf(savedFrontCoverPdf);
    if (savedBackCoverPdf) setBackCoverPdf(savedBackCoverPdf);
    if (savedSpinePdf) setSpinePdf(savedSpinePdf);
    if (savedCombinedPdfUrl) setCombinedPdfUrl(savedCombinedPdfUrl);

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
    }
  }, []);
  
  useEffect(() => {
    if (coverTitle && authorName && coverImage) {
      const hasExistingPdfs = frontCoverPdf && backCoverPdf && spinePdf;
      if (!hasExistingPdfs && !pdfGenerating) {
        console.log('Generating PDFs from canvas...');
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
    setFrontCoverPdf(null);
    setBackCoverPdf(null);
    setSpinePdf(null);
    setCombinedPdfUrl(null);
    
    localStorage.removeItem('funnyBiographyFrontCoverImage');
    localStorage.removeItem('funnyBiographyBackCoverImage');
    localStorage.removeItem('funnyBiographySpineImage');
    localStorage.removeItem('funnyBiographyCombinedPdfUrl');
    
    setSelectedStyle(styleId);
    localStorage.setItem('funnyBiographySelectedStyle', styleId);
  };
  
  const generatePdfsFromCanvas = async () => {
    setPdfGenerating(true);
    
    try {
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
          console.log(`Front cover canvas dimensions: ${frontCoverCanvas.width}x${frontCoverCanvas.height}`);
          
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
          console.log('Front cover PDF generated successfully, length:', frontPdfData.length);
          
          const spineCanvas = canvases[1];
          console.log(`Spine canvas dimensions: ${spineCanvas.width}x${spineCanvas.height}`);
          
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
          console.log('Spine PDF generated successfully, length:', spinePdfData.length);
          
          const backCoverCanvas = canvases[2];
          console.log(`Back cover canvas dimensions: ${backCoverCanvas.width}x${backCoverCanvas.height}`);
          
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
          console.log('Back cover PDF generated successfully, length:', backPdfData.length);
          
          console.log('All PDFs generated successfully');
          
          const orderId = localStorage.getItem('funnyBiographyOrderId') || `temp_${Date.now()}`;
          
          combinePdfs(frontPdfData, spinePdfData, backPdfData, orderId);
        } catch (error) {
          console.error('Error generating PDFs:', error);
          toast({
            variant: "destructive",
            title: "Error generating PDFs",
            description: "Failed to convert canvas to PDF. Please try again."
          });
          setPdfGenerating(false);
        }
      }, 500);
    } catch (error) {
      console.error('Error in generatePdfsFromCanvas:', error);
      setPdfGenerating(false);
      toast({
        variant: "destructive",
        title: "Error generating PDFs",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    }
  };

  const combinePdfs = async (frontCover: string, spine: string, backCover: string, orderId: string) => {
    try {
      console.log('Calling generate-cover-pdf edge function to combine PDFs...');
      
      const { data, error } = await supabase.functions.invoke('generate-cover-pdf', {
        body: { 
          frontCover, 
          spine, 
          backCover,
          orderId
        }
      });
      
      if (error) {
        throw error;
      }
      
      if (data.success && data.coverSourceUrl) {
        console.log('Combined PDF generated successfully:', data.coverSourceUrl);
        setCombinedPdfUrl(data.coverSourceUrl);
        localStorage.setItem('funnyBiographyCombinedPdfUrl', data.coverSourceUrl);
        localStorage.setItem('funnyBiographyOrderId', orderId);
        
        toast({
          title: "Cover PDF Generated",
          description: "Your book cover has been successfully generated."
        });
      } else {
        throw new Error('Failed to generate combined PDF');
      }
    } catch (error) {
      console.error('Error combining PDFs:', error);
      toast({
        variant: "destructive",
        title: "Error generating combined PDF",
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleGenerateBook = () => {
    if (!frontCoverPdf || !backCoverPdf || !spinePdf) {
      generatePdfsFromCanvas();
      return;
    }
    
    localStorage.setItem('funnyBiographySelectedStyle', selectedStyle);
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
        
        <div className="mx-auto flex justify-center">
          {pdfGenerating ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-[#F6C744] border-t-transparent rounded-full"></div>
              <span className="ml-3">Generating PDF...</span>
            </div>
          ) : combinedPdfUrl ? (
            <div className="flex flex-col items-center">
              <p className="text-sm text-gray-600 mb-2">Complete Cover Preview</p>
              <iframe 
                src={combinedPdfUrl} 
                className="w-[650px] h-[450px] border shadow-md"
                title="Combined Cover PDF"
              />
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
            {stylePresets.map((style) => {
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


