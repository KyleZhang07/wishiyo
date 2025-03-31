import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getClientId } from '@/utils/clientId';

// 封面类型
interface CoverFormat {
  id: string;
  name: string;
  price: number;
  description: string;
  popular?: boolean;
  imageSrc?: string; // 添加图片路径属性
}

const FormatStep = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 硬封面和软封面的示例图片
  const hardcoverImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCADIASwDAREAAhEBAxEB/8QAHAABAAIDAQEBAAAAAAAAAAAAAAUGAwQHAggB/8QAGwEBAAIDAQEAAAAAAAAAAAAAAAMEAQIFBgf/2gAMAwEAAhADEAAAAfqkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARGfUfNbj48/oHyfoWVkpvTm9bwuixrS2trCy1tLS3NLe0tza3Nrc2tza2NrY3tjowdjGf0cZfZxl9HGXucZPZxk+HGP6cYvxxh/nCH+cIP5xgZcjHk5GDJcGHLdmDNeGDNfGDLfGDJkNjFltTFktzDkuDBluDBmu1gZbtYGW7WBku0cZLtHGS6RhjvUUYrpHGC9Rxfv0R869R/QOW1J/K1YPu+tNp2YPvp1Vj0e4AAAAAAAAAAR2pxfB5/H9Z5HQj52r+98/c+jh651jL1WEPRIxgCM16jiRsFfGDLcGHJcmHJcmLLcGDLdmDLdmDJdLEyXRiyXKyMdytDHcrYx3RiYsk0Y8k0ZMs0Y8s0YclxHGR4YGR4YGHIcRhjuY4w5DmIMOQ6ijDkOogw5DqIL+S7jC/kuo4vZLuOL2S6ji/c+xhsvIw2XkUX/Po4v8Ppw+jDi+kHktjk+1v8pp+5+nzcdFd9L2wAAAAAAAAAAARexxNT5zmtLqaPK3q0k5/2I1o7Sx1MAAAAAAAAAAYazTBGmYPO7Zg87smDzuyYNO7Jgk5pGCTmkYJO56QavwaDV+DQavwSDV+CQavwSDV+CQavwSDV+CQS/wASIN74fAk3vh0CXf8Ah0CXT+HwJNP4fAk0/h8CXS+HwJdL4fAljm0Cfc8lqQt6uJKvlB6HnT61zvv9dPV3vfDztMAAAAAAAAAAAAAEbpcNzvmcj1fMmHEQGkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANea4INn6FHS5eW17jGXrh7PX8yYcTAaQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABrvdLC1/Z07PTl5uj1kJ6YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIrs4aK88iK++HHOcHHesHF+2HEfIHDfQHB/YGn9waX3Bo/gGh+IZ/5BnfoGd+wZn8Bl/0GV/oe/8Ao9X0/pe/6Xt+l7fpe36Xt+l7fpe36Xt+l7fpe36Xr+l6/pev6Xp+l6fpen6Xp+l6fpen6Xp+l6fpWn/9k=";
  
  const softcoverImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCADIASwDAREAAhEBAxEB/8QAHAAAAgMBAQEBAAAAAAAAAAAABAUBAgMGBwAI/8QAGgEAAwEBAQEAAAAAAAAAAAAAAAIDBAEFBv/aAAwDAQACEAMQAAAB9UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVKEBJtlolLrRCtdNDOL2DMXtGUvaMhe2ZAvaAhe4ZAd4xA75hB3zADwDCDvmAHgGEHgGEHhGAHhGAHhGAfBGAPiMI+IxD4jEPkMA+QwD5DAPoMY+gxj6jEPqMY+wxi9GQXY0AvRuEL0bhC9G4Re1cIXtXBF7dgRe3dEXt3RFbt4Be7eDObzGTOZ1mTGdhkw2dgMH1GrEelzZqdFmTf0GFO9Y2OtoeXJsXSqTjBUNxgoFwoEAsShcJhcJhcJxILhKKBYJRQLhKJhcIxMKxKJxWJROKxMJxSJhUJhSJxOJxSJhQJxQJxQJxQJhUJRQJRQJBQJBoIxoJBoJBoIxoIxoIxsIhsIhsIhqIxqIxsIRsIRsIRsIRsIRsIRsIRuIBuOGc2VHOOm1c5ps6nF3OM07vUPQNxsdHnLuPUrDg0G40MxudDMaGwzGh0MxofDMZnwzGh4NBofDUZHg2GA0GYwGgzGIyGYxGYyGYxGYyGIyGIxGIxGIxGQxGQxGQxGIyGIyGIxGIyGIyGIyGIxGIzGI0GIzGIzGIzGIzGIzGAzGAwGAwGQyGQyGQ2GQyGQ2GQ2GQ2GQyGQyGg3GQ5GwyHI4G45HI5HI4HI5HI5HQ5HI5G46HI6HI6HIbnQbnY5HY7G52Ox0dD/9k=";

  // 可选的封面格式
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
  
  // 默认选择软封面
  const [selectedFormat, setSelectedFormat] = useState<string>('softcover');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 处理格式选择
  const handleFormatSelect = (formatId: string) => {
    setSelectedFormat(formatId);
    // 保存选择到localStorage
    localStorage.setItem('loveStorySelectedFormat', formatId);
    
    const selectedFormatObj = coverFormats.find(format => format.id === formatId);
    if (selectedFormatObj) {
      localStorage.setItem('loveStoryFormatPrice', selectedFormatObj.price.toString());
    }
  };
  
  // 处理结账
  const handleCheckout = async () => {
    const selectedFormatObj = coverFormats.find(format => format.id === selectedFormat);
    
    if (selectedFormatObj) {
      setIsProcessing(true);
      
      // 保存书籍信息到localStorage
      const bookTitle = 'THE MAGIC IN ' + (localStorage.getItem('loveStoryPersonName') || 'My Love');
      localStorage.setItem('loveStoryBookTitle', bookTitle);
      localStorage.setItem('loveStoryBookFormat', selectedFormatObj.name);
      localStorage.setItem('loveStoryBookPrice', selectedFormatObj.price.toString());
      
      try {
        // 调用Stripe支付API
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
        
        // 保存订单ID
        localStorage.setItem('loveStoryOrderId', orderId);
        
        // 从localStorage获取必要信息
        const personName = localStorage.getItem('loveStoryPersonName') || '';
        
        try {
          // 添加记录到数据库
          const clientId = getClientId();
          
          // 获取用户选择的封面图片 URL
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
            
            // PDF生成将通过Stripe webhook在支付成功后处理
            console.log('Book generation will be handled by Stripe webhook after payment confirmation');
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
          // 继续结账流程，即使数据库操作失败
        }
        
        // 重定向到Stripe结账页面
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
  
  // 从localStorage加载已保存的选择
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
      currentStep={9}
      totalSteps={9}
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 封面格式选项 */}
          {coverFormats.map((format) => (
            <div 
              key={format.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                selectedFormat === format.id 
                  ? 'border-[#0C5C4C] ring-1 ring-[#0C5C4C]' 
                  : 'border-gray-200'
              }`}
            >
              {/* 人气标签 */}
              {format.popular && (
                <div className="bg-[#FFC83D] text-center py-2">
                  <p className="font-medium">Most popular</p>
                </div>
              )}
              
              {/* 封面图片 */}
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
                
                {/* 选中标记 */}
                {selectedFormat === format.id && (
                  <div className="absolute top-2 right-2 bg-[#0C5C4C] text-white rounded-full p-1">
                    <Check className="w-5 h-5" />
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
        
        {/* 结账按钮 */}
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