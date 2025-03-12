
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { getClientId } from '@/integrations/supabase/storage';

// 封面类型
interface CoverFormat {
  id: string;
  name: string;
  price: number;
  description: string;
  popular?: boolean;
  imageSrc?: string;
}

const FunnyBiographyFormatStep = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // 硬封面和软封面的示例图片
  const hardcoverImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCADIASwDAREAAhEBAxEB/8QAHAABAAIDAQEBAAAAAAAAAAAAAAUGAwQHAggB/8QAGwEBAAIDAQEAAAAAAAAAAAAAAAMEAQIFBgf/2gAMAwEAAhADEAAAAfqkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARGfUfNbj48/oHyfoWVkpvTm9bwuixrS2trCy1tLS3NLe0tza3Nrc2tza2NrY3tjowdjGf0cZfZxl9HGXucZPZxk+HGP6cYvxxh/nCH+cIP5xgZcjHk5GDJcGHLdmDNeGDNfGDLfGDJkNjFltTFktzDkuDBluDBmu1gZbtYGW7WBku0cZLtHGS6RhjvUUYrpHGC9Rxfv0R869R/QOW1J/K1YPu+tNp2YPvp1Vj0e4AAAAAAAAAAR2pxfB5/H9Z5HQj52r+98/c+jh651jL1WEPRIxgCM16jiRsFfGDLcGHJcmHJcmLLcGDLdmDLdmDJdLEyXRiyXKyMdytDHcrYx3RiYsk0Y8k0ZMs0Y8s0YclxHGR4YGR4YGHIcRhjuY4w5DmIMOQ6ijDkOogw5DqIL+S7jC/kuo4vZLuOL2S6ji/c+xhsvIw2XkUX/Po4v8Ppw+jDi+kHktjk+1v8pp+5+nzcdFd9L2wAAAAAAAAAAARexxNT5zmtLqaPK3q0k5/2I1o7Sx1MAAAAAAAAAAYazTBGmYPO7Zg87smDzuyYNO7Jgk5pGCTmkYJO56QavwaDV+DQavwSDV+CQavwSDV+CQavwSDV+CQS/wASIN74fAk3vh0CXf8Ah0CXT+HwJNP4fAk0/h8CXS+HwJdL4fAljm0Cfc8lqQt6uJKvlB6HnT61zvv9dPV3vfDztMAAAAAAAAAAAAAEbpcNzvmcj1fMmHEQGkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANea4INn6FHS5eW17jGXrh7PX8yYcTAaQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABrvdLC1/Z07PTl5uj1kJ6YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIrs4aK88iK++HHOcHHesHF+2HEfIHDfQHB/YGn9waX3Bo/gGh+IZ/5BnfoGd+wZn8Bl/0GV/oe/8Ao9X0/pe/6Xt+l7fpe36Xt+l7fpe36Xt+l7fpe36Xr+l6/pev6Xp+l6fpen6Xp+l6fpen6Xp+l6fpWn/9k=";
  
  const softcoverImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCADIASwDAREAAhEBAxEB/8QAHAAAAgMBAQEBAAAAAAAAAAAABAUBAgMGBwAI/8QAGgEAAwEBAQEAAAAAAAAAAAAAAAIDBAEFBv/aAAwDAQACEAMQAAAB9UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVKEBJtlolLrRCtdNDOL2DMXtGUvaMhe2ZAvaAhe4ZAd4xA75hB3zADwDCDvmAHgGEHgGEHhGAHhGAHhGAfBGAPiMI+IxD4jEPkMA+QwD5DAPoMY+gxj6jEPqMY+wxi9GQXY0AvRuEL0bhC9G4Re1cIXtXBF7dgRe3dEXt3RFbt4Be7eDObzGTOZ1mTGdhkw2dgMH1GrEelzZqdFmTf0GFO9Y2OtoeXJsXSqTjBUNxgoFwoEAsShcJhcJhcJxILhKKBYJRQLhKJhcIxMKxKJxWJROKxMJxSJhUJhSJxOJxSJhQJxQJhQJxQJhUJRQJRQJBQJBoIxoJBoJBoIxoIxoIxsIhsIhsIhqIxqIxsIRsIRsIRsIRsIRsIRsIRuIBuOGc2VHOOm1c5ps6nF3OM07vUPQNxsdHnLuPUrDg0G40MxudDMaGwzGh0MxofDMZnwzGh4NBofDUZHg2GA0GYwGgzGIyGYxGYyGYxGYyGYyGIyGIxGIxGIxGQxGQxGQxGIyGIyGIxGIyGIyGIyGIxGIzGI0GIzGIzGIzGIzGIzGAwGA0GAwGQyGQyGQ2GQyGQ2GQ2GQ2GQyGQyGg3GQ5GwyHI4G45HI5HI4HI5HI5HQ5HI5G46HI6HI6HIbnQbnY5HY7G52Ox0dD/9k=";

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
  
  // 默认选择硬封面
  const [selectedFormat, setSelectedFormat] = useState<string>('hardcover');
  const [isProcessing, setIsProcessing] = useState(false);

  // 通过Ref获取canvas元素
  const coverCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const spineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // 处理格式选择
  const handleFormatSelect = (formatId: string) => {
    setSelectedFormat(formatId);
    // 保存选择到localStorage
    localStorage.setItem('funnyBiographySelectedFormat', formatId);
    
    const selectedFormatObj = coverFormats.find(format => format.id === formatId);
    if (selectedFormatObj) {
      localStorage.setItem('funnyBiographyFormatPrice', selectedFormatObj.price.toString());
    }
  };

  // 获取canvas元素的图片数据
  const getCanvasImageData = (canvasRef: React.RefObject<HTMLCanvasElement>): string | null => {
    if (!canvasRef.current) {
      console.error('Canvas element not found');
      return null;
    }
    
    try {
      return canvasRef.current.toDataURL('image/jpeg', 0.9);
    } catch (error) {
      console.error('Error converting canvas to image:', error);
      return null;
    }
  };
  
  // 从 DOM 获取 Canvas 元素
  const getCoverSpineElements = () => {
    if (!coverCanvasRef.current) {
      // 尝试直接从DOM获取
      const coverCanvas = document.getElementById('cover-canvas') as HTMLCanvasElement;
      if (coverCanvas) {
        coverCanvasRef.current = coverCanvas;
      }
    }
    
    if (!spineCanvasRef.current) {
      // 尝试直接从DOM获取
      const spineCanvas = document.getElementById('spine-canvas') as HTMLCanvasElement;
      if (spineCanvas) {
        spineCanvasRef.current = spineCanvas;
      }
    }
    
    return { coverCanvas: coverCanvasRef.current, spineCanvas: spineCanvasRef.current };
  };

  // 构建书籍数据
  const buildBookData = () => {
    const bookTitle = localStorage.getItem('funnyBiographyIdea') || 'Untitled Biography';
    const authorName = localStorage.getItem('funnyBiographyAuthor') || 'Anonymous';
    const answers = JSON.parse(localStorage.getItem('funnyBiographyAnswers') || '[]');
    const tableOfContents = JSON.parse(localStorage.getItem('funnyBiographyTableOfContents') || '[]');
    const selectedPhoto = localStorage.getItem('funnyBiographyPhoto') || '';
    
    const selectedFormatObj = coverFormats.find(format => format.id === selectedFormat);
    
    return {
      title: bookTitle,
      author: authorName,
      answers: answers,
      tableOfContents: tableOfContents,
      photo: selectedPhoto ? selectedPhoto : null,
      format: selectedFormatObj?.name || 'Hardcover',
      price: selectedFormatObj?.price || 59.99
    };
  };
  
  // 处理结账
  const handleCheckout = async () => {
    setIsProcessing(true);
    
    try {
      // 显示加载提示
      toast({
        title: "Processing your order",
        description: "Please wait while we prepare your book...",
      });
      
      // 获取Canvas元素
      const { coverCanvas, spineCanvas } = getCoverSpineElements();
      
      if (!coverCanvas) {
        throw new Error("Cover canvas not found");
      }
      
      // 获取封面和书脊图片
      const coverImage = getCanvasImageData(coverCanvasRef);
      const spineImage = spineCanvas ? getCanvasImageData(spineCanvasRef) : null;
      
      if (!coverImage) {
        throw new Error("Failed to get cover image data");
      }
      
      // 构建书籍数据
      const bookData = buildBookData();
      
      // 生成唯一订单ID
      const orderId = `funny-bio-${uuidv4()}`;
      
      // 获取客户端ID
      const clientId = getClientId();
      
      // 将数据保存到Supabase
      const { data, error } = await supabase.functions.invoke('save-book-data', {
        body: {
          orderId,
          bookData,
          coverImage,
          spineImage,
          clientId,
          productType: 'funny-biography'
        }
      });
      
      if (error) {
        throw error;
      }
      
      // 保存订单ID用于后续查询
      localStorage.setItem('currentOrderId', orderId);
      
      toast({
        title: "Order processed successfully",
        description: "Redirecting to success page...",
      });
      
      // 跳转到成功页面
      navigate(`/order-success?orderId=${orderId}`);
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
  
  // 从localStorage加载已保存的选择
  useEffect(() => {
    const savedFormat = localStorage.getItem('funnyBiographySelectedFormat');
    if (savedFormat) {
      setSelectedFormat(savedFormat);
    }
    
    // 初始化引用
    getCoverSpineElements();
  }, []);
  
  return (
    <WizardStep
      title="Choose a format for your book"
      description="Make your gift even more special with our selection of cover options"
      previousStep="/create/friends/funny-biography/preview"
      currentStep={7}
      totalSteps={7}
    >
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 封面格式选项 */}
          {coverFormats.map((format) => (
            <div 
              key={format.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                selectedFormat === format.id 
                  ? 'border-primary ring-1 ring-primary' 
                  : 'border-gray-200'
              }`}
            >
              {/* 人气标签 */}
              {format.popular && (
                <div className="bg-yellow-300 text-center py-2">
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
                  <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
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
                      ? 'bg-primary hover:bg-primary/90' 
                      : 'border-primary text-primary hover:bg-primary/10'
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

export default FunnyBiographyFormatStep;
