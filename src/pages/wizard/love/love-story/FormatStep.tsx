import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getClientId } from '@/utils/clientId';

interface CoverFormat {
  id: string;
  name: string;
  price: number;
  description: string;
  popular?: boolean;
  imageSrc?: string;
}

const FormatStep = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const hardcoverImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCADIASwDAREAAhEBAxEB/8QAHAAAAgMBAQEBAAAAAAAAAAAABAUBAgMGBwAI/8QAGgEAAwEBAQEAAAAAAAAAAAAAAAIDBAEFBv/aAAwDAQACEAMQAAAB9UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVKEBJtlolLrRCtdNDOL2DMXtGUvaMhe2ZAvaAhe4ZAd4xA75hB3zADwDCDvmAHgGEHgGEHhGAHhGAHhGAfBGAPiMI+IxD4jEPkMA+QwD5DAPoMY+gxj6jEPqMY+wxi9GQXY0AvRuEL0bhC9G4Re1cIXtXBF7dgRe3dEXt3RFbt4Be7eDObzGTOZ1mTGdhkw2dgMH1GrEelzZqdFmTf0GFO9Y2OtoeXJsXSqTjBUNxgoFwoEAsShcJhcJhcJxILhKKBYJRQLhKJhcIxMKxKJxWJROKxMJxSJhUJhSJxOJxSJhQJxQJxQJxQJhUJRQJRQJBQJBoIxoJBoJBoIxoIxoIxsIhsIhsIhqIxqIxsIRsIRsIRsIRsIRsIRsIRuIBuOGc2VHOOm1c5ps6nF3OM07vUPQNxsdHnLuPUrDg0G40MxudDMaGwzGh0MxofDMZnwzGh4NBofDUZHg2GA0GYwGgzGIyGYxGYyGYxGYyGIyGIxGIxGIxGQxGQxGQxGIyGIyGIxGIyGIyGIyGIxGIyGIzGIzGIzGIzGIzGIzGAzGAwGAwGQyGQyGQ2GQyGQ2GQ2GQ2GQyGQyGg3GQ5GwyHI4G45HI5HI4HI5HI5HQ5HI5G46HI6HI6HIbnQbnY5HY7G52Ox0dD/9k=";
  
  const softcoverImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCADIASwDAREAAhEBAxEB/8QAHAAAAgMBAQEBAAAAAAAAAAAABAUBAgMGBwAI/8QAGgEAAwEBAQEAAAAAAAAAAAAAAAIDBAEFBv/aAAwDAQACEAMQAAAB9UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVKEBJtlolLrRCtdNDOL2DMXtGUvaMhe2ZAvaAhe4ZAd4xA75hB3zADwDCDvmAHgGEHgGEHhGAHhGAHhGAfBGAPiMI+IxD4jEPkMA+QwD5DAPoMY+gxj6jEPqMY+wxi9GQXY0AvRuEL0bhC9G4Re1cIXtXBF7dgRe3dEXt3RFbt4Be7eDObzGTOZ1mTGdhkw2dgMH1GrEelzZqdFmTf0GFO9Y2OtoeXJsXSqTjBUNxgoFwoEAsShcJhcJhcJxILhKKBYJRQLhKJhcIxMKxKJxWJROKxMJxSJhUJhSJxOJxSJhQJxQJxQJxQJhUJRQJRQJBQJBoIxoJBoJBoIxoIxoIxsIhsIhsIhqIxqIxsIRsIRsIRsIRsIRsIRsIRuIBuOGc2VHOOm1c5ps6nF3OM07vUPQNxsdHnLuPUrDg0G40MxudDMaGwzGh0MxofDMZnwzGh4NBofDUZHg2GA0GYwGgzGIyGYxGYyGYxGYyGIyGIxGIxGIxGQxGQxGQxGIyGIyGIxGIyGIyGIyGIxGIyGIzGIzGIzGIzGIzGIzGAzGAwGAwGQyGQyGQ2GQyGQ2GQ2GQ2GQyGQyGg3GQ5GwyHI4G45HI5HI4HI5HI5HQ5HI5G46HI6HI6HIbnQbnY5HY7G52Ox0dD/9k=";

  const coverFormats: CoverFormat[] = [
    {
      id: 'hardcover',
      name: 'Hardcover',
      price: 59.99,
      description: 'A premium hardcover with a quality matte finish. Made to be read again and again.',
      popular: true,
      imageSrc: hardcoverImage
    },
    {
      id: 'softcover',
      name: 'Softcover',
      price: 44.99,
      description: 'A lovely, lightweight softcover printed on thick, durable paper.',
      imageSrc: softcoverImage
    }
  ];
  
  const [selectedFormat, setSelectedFormat] = useState<string>('softcover');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleFormatSelect = (formatId: string) => {
    setSelectedFormat(formatId);
    localStorage.setItem('loveStorySelectedFormat', formatId);
    
    const selectedFormatObj = coverFormats.find(format => format.id === formatId);
    if (selectedFormatObj) {
      localStorage.setItem('loveStoryFormatPrice', selectedFormatObj.price.toString());
    }
  };
  
  const handleCheckout = async () => {
    const selectedFormatObj = coverFormats.find(format => format.id === selectedFormat);
    
    if (selectedFormatObj) {
      setIsProcessing(true);
      
      const bookTitle = 'THE MAGIC IN ' + (localStorage.getItem('loveStoryPersonName') || 'My Love');
      localStorage.setItem('loveStoryBookTitle', bookTitle);
      localStorage.setItem('loveStoryBookFormat', selectedFormatObj.name);
      localStorage.setItem('loveStoryBookPrice', selectedFormatObj.price.toString());
      
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: 'love-story',
            title: bookTitle,
            format: selectedFormatObj.name,
            price: selectedFormatObj.price.toString(),
            quantity: 1
          }),
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const { url, orderId } = await response.json();
        
        localStorage.setItem('loveStoryOrderId', orderId);
        
        const personName = localStorage.getItem('loveStoryPersonName') || '';
        
        try {
          const clientId = getClientId();
          
          const selectedCoverImageUrl = localStorage.getItem('loveStorySelectedCoverImage_url') || 
                                       localStorage.getItem('loveStoryCoverImage_url') || '';
          
          const { data, error } = await supabase
            .from('love_story_books')
            .insert({
              order_id: orderId,
              title: bookTitle,
              person_name: personName,
              status: 'created',
              timestamp: new Date().toISOString(),
              client_id: clientId
            })
            .select();
          
          if (error) {
            console.error('Database error when creating book record:', error);
          } else {
            console.log('Love story book record created:', data);
            
            console.log('Book generation will be handled by Stripe webhook after payment confirmation');
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
        }
        
        if (url) {
          window.location.href = url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } catch (error) {
        console.error('Checkout error:', error);
        toast({
          title: "Checkout Error",
          description: "An error occurred during checkout. Please try again.",
          variant: "destructive"
        });
        setIsProcessing(false);
      }
    }
  };
  
  useEffect(() => {
    const savedFormat = localStorage.getItem('loveStorySelectedFormat');
    if (savedFormat) {
      setSelectedFormat(savedFormat);
    }
  }, []);
  
  return (
    <WizardStep
      title="Choose a format for your book"
      description="Make your gift even more glorious with our selection of cover options"
      previousStep="/create/love/love-story/generate"
      currentStep={8}
      totalSteps={8}
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coverFormats.map((format) => (
            <div 
              key={format.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                selectedFormat === format.id 
                  ? 'border-[#0C5C4C] ring-1 ring-[#0C5C4C]' 
                  : 'border-gray-200'
              }`}
            >
              {format.popular && (
                <div className="bg-[#FFC83D] text-center py-2">
                  <p className="font-medium">Most popular</p>
                </div>
              )}
              
              <div className="h-64 bg-gray-100 border-b relative">
                {format.imageSrc ? (
                  <img 
                    src={format.imageSrc} 
                    alt={`${format.name} book`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                    {format.name} Preview
                  </div>
                )}
                
                {selectedFormat === format.id && (
                  <div className="absolute top-2 right-2 bg-[#0C5C4C] text-white rounded-full p-1">
                    <Check className="w-5 h-5" />
                  </div>
                )}
              </div>
              
              <div className="p-6 text-center">
                <h3 className="text-2xl font-bold mb-1">{format.name}</h3>
                <p className="text-2xl font-bold mb-4">${format.price.toFixed(2)} USD</p>
                <p className="text-gray-600 mb-6">{format.description}</p>
                
                <Button
                  variant={selectedFormat === format.id ? "default" : "outline"}
                  className={`w-full ${
                    selectedFormat === format.id 
                      ? 'bg-[#0C5C4C] hover:bg-[#0C5C4C]/90' 
                      : 'border-[#0C5C4C] text-[#0C5C4C] hover:bg-[#0C5C4C]/10'
                  }`}
                  onClick={() => handleFormatSelect(format.id)}
                >
                  {selectedFormat === format.id ? `${format.name} selected` : `Select ${format.name}`}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12">
          <Button 
            variant="default" 
            size="lg"
            className="w-full bg-[#FF7F50] hover:bg-[#FF7F50]/80 text-white"
            onClick={handleCheckout}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Checkout'}
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default FormatStep;
