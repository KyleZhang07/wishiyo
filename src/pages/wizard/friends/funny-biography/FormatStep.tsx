
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';

// 定义封面格式
interface CoverFormat {
  id: string;
  name: string;
  price: number;
  description: string;
  popular?: boolean;
}

const FormatStep = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authorName, setAuthorName] = useState('');
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [selectedStyle, setSelectedStyle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('hardcover');
  const coverCanvasRef = useRef<HTMLDivElement>(null);
  const spineCanvasRef = useRef<HTMLDivElement>(null);

  // 封面格式列表
  const coverFormats: CoverFormat[] = [
    {
      id: 'hardcover',
      name: 'Hardcover',
      price: 59.99,
      description: 'A premium hardcover with a quality matte finish. Made to be read again and again.',
      popular: true
    },
    {
      id: 'softcover',
      name: 'Softcover',
      price: 44.99,
      description: 'A lovely, lightweight softcover printed on thick, durable paper.'
    }
  ];

  useEffect(() => {
    const savedAuthor = localStorage.getItem('funnyBiographyAuthorName');
    const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
    const savedStyle = localStorage.getItem('funnyBiographySelectedStyle');
    const savedFormat = localStorage.getItem('funnyBiographySelectedFormat');

    if (savedAuthor) {
      setAuthorName(savedAuthor);
    }

    if (savedStyle) {
      setSelectedStyle(savedStyle);
    }

    if (savedFormat) {
      setSelectedFormat(savedFormat);
    }

    if (savedIdeas && savedIdeaIndex) {
      const ideas = JSON.parse(savedIdeas);
      const selectedIdea = ideas[parseInt(savedIdeaIndex)];
      if (selectedIdea) {
        setCoverTitle(selectedIdea.title || '');
        setSubtitle(selectedIdea.description || '');
      }
    }

    const savedPhotos = localStorage.getItem('funnyBiographyPhoto');
    if (savedPhotos) {
      setCoverImage(savedPhotos);
    }
  }, []);

  const handleFormatSelect = (formatId: string) => {
    setSelectedFormat(formatId);
    localStorage.setItem('funnyBiographySelectedFormat', formatId);
    
    const selectedFormatObj = coverFormats.find(format => format.id === formatId);
    if (selectedFormatObj) {
      localStorage.setItem('funnyBiographyFormatPrice', selectedFormatObj.price.toString());
    }
  };

  const captureCanvasAsImage = async (canvasRef: React.RefObject<HTMLDivElement>): Promise<string | null> => {
    if (!canvasRef.current) {
      console.error('Canvas reference not found');
      return null;
    }
    
    try {
      // Find the canvas element inside the div
      const canvasElement = canvasRef.current.querySelector('canvas');
      if (!canvasElement) {
        throw new Error('Canvas element not found inside the ref');
      }
      
      // Get base64 data URL
      const dataUrl = canvasElement.toDataURL('image/jpeg', 0.9);
      return dataUrl;
    } catch (error) {
      console.error('Error capturing canvas image:', error);
      return null;
    }
  };

  const handleCheckout = async () => {
    // Find the selected format
    const selectedFormatObj = coverFormats.find(format => format.id === selectedFormat);
    if (!selectedFormatObj) {
      toast({
        title: "Error",
        description: "Please select a format to continue",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Capture cover canvas image
      const coverImageData = await captureCanvasAsImage(coverCanvasRef);
      if (!coverImageData) {
        throw new Error('Failed to capture cover image. Canvas not found.');
      }

      // Capture spine canvas image (if available)
      const spineImageData = await captureCanvasAsImage(spineCanvasRef);
      
      // Generate a unique order ID
      const orderId = uuidv4();
      localStorage.setItem('currentOrderId', orderId);
      
      // Prepare book data
      const bookData = {
        title: coverTitle || 'Untitled Book',
        subtitle: subtitle || '',
        authorName: authorName || 'Anonymous',
        format: selectedFormatObj.name,
        price: selectedFormatObj.price,
        chapters: JSON.parse(localStorage.getItem('funnyBiographyChapters') || '[]'),
        style: localStorage.getItem('funnyBiographySelectedStyle') || '',
        photo: localStorage.getItem('funnyBiographyPhoto') || '',
        photoPosition: localStorage.getItem('funnyBiographyCoverImagePosition') || '',
        photoScale: localStorage.getItem('funnyBiographyCoverImageScale') || '100',
        answers: JSON.parse(localStorage.getItem('funnyBiographyAnswers') || '[]'),
        ideas: JSON.parse(localStorage.getItem('funnyBiographyGeneratedIdeas') || '[]'),
        selectedIdeaIndex: localStorage.getItem('funnyBiographySelectedIdea') || '0'
      };

      console.log('Uploading book data to Supabase:', { 
        orderId, 
        formatId: selectedFormat,
        price: selectedFormatObj.price
      });
      
      try {
        // Upload data and images to Supabase
        const { data, error } = await supabase.functions.invoke('save-book-data', {
          body: {
            orderId,
            bookData,
            coverImage: coverImageData,
            spineImage: spineImageData,
            clientId: 'anonymous', // We could add user id here if we had authentication
            productType: 'funny-biography'
          }
        });

        if (error) {
          throw new Error(`Supabase function error: ${error.message}`);
        }

        console.log('Book data saved successfully:', data);
        
        // Save necessary data for the success page
        localStorage.setItem('funnyBiographyOrderId', orderId);
        localStorage.setItem('funnyBiographyBookTitle', coverTitle);
        localStorage.setItem('funnyBiographyBookFormat', selectedFormatObj.name);
        localStorage.setItem('funnyBiographyBookPrice', selectedFormatObj.price.toString());
        
        // Redirect to success page
        navigate(`/order-success?orderId=${orderId}`);
      } catch (uploadError: any) {
        console.error('Error uploading to Supabase:', uploadError);
        throw new Error(`Failed to save book data: ${uploadError.message}`);
      }
      
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: error.message || "An error occurred during checkout. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get the current style preset
  const getCurrentStyle = () => {
    const stylePresets = [
      {
        id: 'classic-red',
        name: 'Classic Beige',
        font: 'merriweather',
        template: 'classic',
        layout: 'classic-centered'
      },
      {
        id: 'bestseller-style',
        name: 'Bestseller',
        font: 'montserrat',
        template: 'bestseller',
        layout: 'bestseller-modern'
      },
      {
        id: 'modern-green',
        name: 'Modern Green',
        font: 'montserrat',
        template: 'vibrant-green',
        layout: 'bold-header'
      },
      {
        id: 'minimal-gray',
        name: 'Minimal Gray',
        font: 'inter',
        template: 'minimal',
        layout: 'centered-title'
      },
      {
        id: 'pastel-beige',
        name: 'Sweet Pink',
        font: 'times',
        template: 'pastel-beige',
        layout: 'classic-centered'
      }
    ];
    return stylePresets.find(style => style.id === selectedStyle) || stylePresets[0];
  };

  const currentStyle = getCurrentStyle();

  return (
    <WizardStep
      title="Choose a format for your book"
      description="Make your gift even more glorious with our selection of cover options"
      previousStep="/create/friends/funny-biography/preview"
      currentStep={7}
      totalSteps={7}
    >
      <div className="max-w-4xl mx-auto">
        {/* Hidden canvas for capturing the cover image */}
        <div className="hidden">
          <div ref={coverCanvasRef}>
            <CanvasCoverPreview
              coverTitle={coverTitle}
              subtitle={subtitle}
              authorName={authorName}
              coverImage={coverImage}
              selectedFont={currentStyle.font}
              selectedTemplate={currentStyle.template}
              selectedLayout={currentStyle.layout}
              category="friends"
              scaleFactor={0.8}
            />
          </div>
          <div ref={spineCanvasRef}>
            {/* Spine canvas would go here if we implement it */}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 封面格式选项 */}
          {coverFormats.map((format) => (
            <div 
              key={format.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                selectedFormat === format.id 
                  ? 'border-[#F6C744] ring-1 ring-[#F6C744]' 
                  : 'border-gray-200'
              }`}
            >
              {/* 人气标签 */}
              {format.popular && (
                <div className="bg-[#F6C744] text-center py-2">
                  <p className="font-medium">Most popular</p>
                </div>
              )}
              
              {/* 封面预览区 */}
              <div className="h-64 bg-gray-100 border-b relative">
                {format.id === 'hardcover' ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-700 font-semibold">
                    Hardcover Preview
                    {selectedFormat === format.id && (
                      <div className="absolute top-2 right-2 bg-[#F6C744] text-white rounded-full p-1">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-700 font-semibold">
                    Softcover Preview
                    {selectedFormat === format.id && (
                      <div className="absolute top-2 right-2 bg-[#F6C744] text-white rounded-full p-1">
                        <Check className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* 文本内容 */}
              <div className="p-6 text-center">
                <h3 className="text-2xl font-bold mb-1">{format.name}</h3>
                <p className="text-2xl font-bold mb-4">${format.price.toFixed(2)} USD</p>
                <p className="text-gray-600 mb-6">{format.description}</p>
                
                {/* 选择按钮 */}
                <Button
                  variant={selectedFormat === format.id ? "default" : "outline"}
                  className={`w-full ${
                    selectedFormat === format.id 
                      ? 'bg-[#F6C744] hover:bg-[#F6C744]/90' 
                      : 'border-[#F6C744] text-[#F6C744] hover:bg-[#F6C744]/10'
                  }`}
                  onClick={() => handleFormatSelect(format.id)}
                >
                  {selectedFormat === format.id ? `${format.name} selected` : `Select ${format.name}`}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* 结账按钮 */}
        <div className="mt-12">
          <Button 
            variant="default" 
            size="lg"
            className="w-full bg-[#F6C744] hover:bg-[#F6C744]/80 text-white py-6 text-lg"
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Complete My Order'}
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default FormatStep;
