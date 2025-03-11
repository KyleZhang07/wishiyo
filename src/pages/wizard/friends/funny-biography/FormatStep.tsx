import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
  
  const softcoverImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCADIASwDAREAAhEBAxEB/8QAHAAAAgMBAQEBAAAAAAAAAAAABAUBAgMGBwAI/8QAGgEAAwEBAQEAAAAAAAAAAAAAAAIDBAEFBv/aAAwDAQACEAMQAAAB9UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVKEBJtlolLrRCtdNDOL2DMXtGUvaMhe2ZAvaAhe4ZAd4xA75hB3zADwDCDvmAHgGEHgGEHhGAHhGAHhGAfBGAPiMI+IxD4jEPkMA+QwD5DAPoMY+gxj6jEPqMY+wxi9GQXY0AvRuEL0bhC9G4Re1cIXtXBF7dgRe3dEXt3RFbt4Be7eDObzGTOZ1mTGdhkw2dgMH1GrEelzZqdFmTf0GFO9Y2OtoeXJsXSqTjBUNxgoFwoEAsShcJhcJhcJxILhKKBYJRQLhKJhcIxMKxKJxWJROKxMJxSJhUJhSJxOJxSJhQJxQJhQJxQJhUJRQJRQJBQJBoIxoJBoJBoIxoIxoIxsIhsIhsIhqIxqIxsIRsIRsIRsIRsIRsIRuIBuOGc2VHOOm1c5ps6nF3OM07vUPQNxsdHnLuPUrDg0G40MxudDMaGwzGh0MxofDMZnwzGh4NBofDUZHg2GA0GYwGgzGIyGYxGYyGYxGYyGYyGIyGIxGIxGIxGQxGQxGQxGIyGIyGIxGIyGIyGIyGIxGIzGI0GIzGIzGIzGIzGIzGAzGAwGA0GAwGQyGQyGQ2GQyGQ2GQ2GQ2GQyGQyGg3GQ5GwyHI4G45HI5HI4HI5HI5HQ5HI5G46HI6HI6HIbnQbnY5HY7G52Ox0dD/9k=";

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
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
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
  
  // 处理添加到购物车
  const handleAddToCart = () => {
    const selectedFormatObj = coverFormats.find(format => format.id === selectedFormat);
    
    if (selectedFormatObj) {
      setIsAddingToCart(true);
      
      // 保存书籍信息到localStorage
      localStorage.setItem('funnyBiographyBookTitle', 'The ' + (localStorage.getItem('funnyBiographyAuthorName') || 'Friend') + ' Chronicles');
      localStorage.setItem('funnyBiographyBookFormat', selectedFormatObj.name);
      localStorage.setItem('funnyBiographyBookPrice', selectedFormatObj.price.toString());
      
      // 模拟添加到购物车的延迟
      setTimeout(() => {
        // 显示添加成功提示
        toast({
          title: "Added to cart",
          description: `${selectedFormatObj.name} - $${selectedFormatObj.price.toFixed(2)} has been added to your cart.`,
        });
        
        // 导航到购物车页面
        navigate('/checkout');
        
        setIsAddingToCart(false);
      }, 800);
    }
  };
  
  // 从localStorage加载已保存的选择
  useEffect(() => {
    const savedFormat = localStorage.getItem('funnyBiographySelectedFormat');
    if (savedFormat) {
      setSelectedFormat(savedFormat);
    }
  }, []);
  
  return (
    <WizardStep
      title="Choose a format for your book"
      description="Make your gift even more special with our selection of cover options"
      previousStep="/create/friends/funny-biography/preview"
      currentStep={8}
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
              <div className="aspect-[4/3] bg-gray-50 relative">
                {format.imageSrc && (
                  <img 
                    src={format.imageSrc} 
                    alt={format.name}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* 选中标记 */}
                {selectedFormat === format.id && (
                  <div className="absolute top-2 right-2 bg-[#0C5C4C] text-white rounded-full p-1">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
              
              {/* 格式描述 */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold">{format.name}</h3>
                  <span className="text-xl font-medium">${format.price} USD</span>
                </div>
                <p className="text-gray-600 mb-6">{format.description}</p>
                
                {/* 选择按钮 */}
                <Button
                  variant={selectedFormat === format.id ? "default" : "outline"}
                  className={`w-full ${
                    selectedFormat === format.id 
                      ? 'bg-[#0C5C4C] hover:bg-[#0C5C4C]/90' 
                      : 'text-[#0C5C4C] border-[#0C5C4C]'
                  }`}
                  onClick={() => handleFormatSelect(format.id)}
                >
                  {selectedFormat === format.id ? 'Selected' : `Select ${format.name}`}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* 添加到购物车按钮 */}
        <div className="mt-12">
          <Button 
            variant="default" 
            size="lg"
            className="w-full bg-[#FF7F50] hover:bg-[#FF7F50]/80 text-white"
            onClick={handleAddToCart}
            disabled={isAddingToCart}
          >
            {isAddingToCart ? 'Adding to cart...' : 'Add to cart'}
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default FormatStep; 