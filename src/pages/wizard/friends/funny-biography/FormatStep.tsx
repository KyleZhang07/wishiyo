import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const hardcoverImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCADIASwDAREAAhEBAxEB/8QAHAABAAIDAQEBAAAAAAAAAAAAAAUGAwQHAggB/8QAGwEBAAIDAQEAAAAAAAAAAAAAAAMEAQIFBgf/2gAMAwEAAhADEAAAAfqkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARGfUfNbj48/oHyfoWVkpvTm9bwuixrS2trCy1tLS3NLe0tza3Nrc2tza2NrY3tjowdjGf0cZfZxl9HGXucZPZxk+HGP6cYvxxh/nCH+cIP5xgZcjHk5GDJcGHLdmDNeFgZr4wZL4wZMhsYstsYslwYMlwYMt2sDLdrAy3awMl2jjJdo4yXSMMd6ijFdI4wXqOL9+iPnXqP6By2pP5WrB931ptOzB99OqsejXAAAAAAAAACO1OL4PP4/rPI6EfO1f3vn7n0cPXOsZeqwh6JGMARmvUcSNgr4wZbgw5Lkw5LkxZbgwZbswZbswZLpYmS6MWS5WRjuVoY7lbGO6MTFkmjHkmjJlmjHlmjDkuI4yPDAyPDAw5DiMMdzHGHIcxBhyHUUYch1EGHIdRBfyXcYX8l1HF7JdxxeyXUcX7n2MNl5GGy8ii/59HF/h9OH0YcX0g8lscn2t/lNP3P0+bjorXpe2AAAAAAAAAAAAi9jianznNaXU0eVvVpJz/sRrR2ljqYAAAAAAAAAAMNZpgjTMHndswed2TB53ZMGndkwSc0jBJzSMEndNINX4NBq/BoNX4JBq/BINX4JBq/BINX4JBK/wASIN74fAk3vh0CXf8Ah0CXT+HwJNP4fAk0/h8CXS+HwJdL4fAljm0Cfc8lqQt6uJKvlB6HnT61zvv9dPV3vfDztMAAAAAAAAAAAAAEbpcNzvmcj1fMmHEQGkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANea4INn6FHS5eW17jGXrh7PX8yYcTAaQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABrvdLC1/Z07PTl5uj1kJ6YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIrs4aK88iK++HHOcHHesHF+2HEfIHDfQHB/YGn9waX3Bo/gGh+IZ/5BnfoGd+wZn8Bl/0GV/oe/8Ao9X0/pe/6Xt+l7fpe36Xt+l7fpe36Xt+l7fpe36Xr+l6/pev6Xp+l6fpen6Xp+l6fpen6Xp+l6fpWn/9k=";
  
  const softcoverImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCADIASwDAREAAhEBAxEB/8QAHAAAAgMBAQEBAAAAAAAAAAAABAUBAgMGBwAI/8QAGgEAAwEBAQEAAAAAAAAAAAAAAAIDBAEFBv/aAAwDAQACEAMQAAAB9UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVKEBJtlolLrRCtdNDOL2DMXtGUvaMhe2ZAvaAhe4ZAd4xA75hB3zADwDCDvmAHgGEHgGEHhGAHhGAHhGAfBGAPiMI+IxD4jEPkMA+QwD5DAPoMY+gxj6jEPqMY+wxi9GQXY0AvRuEL0bhC9G4Re1cIXtXBF7dgRe3dEXt3RFbt4Be7eDObzGTOZ1mTGdhkw2dgMH1GrEelzZqdFmTf0GFO9Y2OtoeXJsXSqTjBUNxgoFwoEAsShcJhcJhcJxILhKKBYJRQLhKJhcIxMKxKJxWJROKxMJxSJhUJhSJxOJxSJhQJxQJhQJxQJhUJRQJRQJBQJBoIxoJBoJBoIxoIxoIxsIhsIhsIhqIxqIxsIRsIRsIRsIRsIRsIRsIRuIBuOGc2VHOOm1c5ps6nF3OM07vUPQNxsdHnLuPUrDg0G40MxudDMaGwzGh0MxofDMZnwzGh4NBofDUZHg2GA0GYwGgzGIyGYxGYyGYxGYyGYyGIyGIxGIxGIxGQxGQxGQxGIyGIyGIxGIyGIyGIyGIxGIzGI0GIzGIzGIzGIzGIzGAzGAwGA0GAwGQyGQyGQ2GQyGQ2GQ2GQ2GQyGQyGg3GQ5GwyHI4G45HI5HI4HI5HI5HQ5HI5G46HI6HI6HIbnQbnY5HY7G52Ox0d/9k=";

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
    localStorage.setItem('funnyBiographySelectedFormat', formatId);
    
    const selectedFormatObj = coverFormats.find(format => format.id === formatId);
    if (selectedFormatObj) {
      localStorage.setItem('funnyBiographyFormatPrice', selectedFormatObj.price.toString());
    }
  };
  
  // 处理结账
  const handleCheckout = async () => {
    const selectedFormatObj = coverFormats.find(format => format.id === selectedFormat);
    
    if (selectedFormatObj) {
      setIsProcessing(true);
      
      // 保存书籍信息到localStorage
      const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
      const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
      let bookTitle = '';

      if (savedIdeas && savedIdeaIndex) {
        const ideas = JSON.parse(savedIdeas);
        const selectedIdea = ideas[parseInt(savedIdeaIndex)];
        if (selectedIdea && selectedIdea.title) {
          bookTitle = selectedIdea.title;
        }
      }

      // 如果没有找到title，使用默认值
      if (!bookTitle) {
        bookTitle = 'The ' + (localStorage.getItem('funnyBiographyAuthorName') || 'Friend') + ' Chronicles';
      }

      localStorage.setItem('funnyBiographyBookTitle', bookTitle);
      localStorage.setItem('funnyBiographyBookFormat', selectedFormatObj.name);
      localStorage.setItem('funnyBiographyBookPrice', selectedFormatObj.price.toString());
      
      try {
        // 调用Stripe支付API
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: 'funny-biography',
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
        localStorage.setItem('funnyBiographyOrderId', orderId);
        
        // 创建书籍记录到数据库
        try {
          // 收集书籍信息
          const authorName = localStorage.getItem('funnyBiographyAuthorName') || 'Friend';
          const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
          const selectedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
          const tableOfContent = localStorage.getItem('funnyBiographyTableOfContent');
          let ideas = null;
          let selectedIdea = null;
          let toc = null;
          
          if (savedIdeas) {
            ideas = JSON.parse(savedIdeas);
            if (selectedIdeaIndex) {
              selectedIdea = ideas[parseInt(selectedIdeaIndex)];
            }
          }
          
          if (tableOfContent) {
            toc = JSON.parse(tableOfContent);
          }
          
          // 添加记录到数据库
          const { data, error } = await supabase
            .from('funny_biography_books')
            .insert({
              order_id: orderId,
              title: bookTitle,
              author: authorName,
              ideas: ideas,
              selected_idea: selectedIdea,
              chapters: toc,
              status: 'created',
              timestamp: new Date().toISOString()
            })
            .select();
          
          if (error) {
            console.error('创建书籍记录错误:', error);
            throw new Error('无法在数据库中创建书籍记录');
          }
          
          console.log('书籍记录已创建:', data);
          
        } catch (dbError) {
          console.error('数据库错误:', dbError);
          // 继续处理结账，尽管数据库出错
          // 我们将依靠startBookGeneration函数在必要时重试
        }
        
        // 开始并行处理：1. 生成书籍内容 2. 生成封面PDF
        const startBookGeneration = async () => {
          try {
            // 更新书籍状态为"处理中"
            await updateBookStatus(orderId, "processing");
            
            // 1. 启动内容生成
            const contentPromise = fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-book-content`, {
              method: 'POST',
              body: JSON.stringify({ orderId }),
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
              }
            });
            
            // 2. 获取封面图像数据
            const frontCover = localStorage.getItem('funnyBiographyFrontCoverImage') || '';
            const spine = localStorage.getItem('funnyBiographySpineImage') || '';
            const backCover = localStorage.getItem('funnyBiographyBackCoverImage') || '';
            
            // 3. 如果有封面图像，并行启动封面PDF生成
            let coverPromise = Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
            if (frontCover && spine && backCover) {
              coverPromise = fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-cover-pdf`, {
                method: 'POST',
                body: JSON.stringify({ 
                  frontCover, 
                  spine, 
                  backCover 
                }),
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                }
              });
            }
            
            // 4. 等待内容生成完成
            const contentResponse = await contentPromise;
            const contentResult = await contentResponse.json();
            
            if (!contentResponse.ok || !contentResult.success) {
              throw new Error('内容生成失败');
            }
            
            // 5. 内容生成完成后，启动内页PDF生成
            const interiorResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-interior-pdf`, {
              method: 'POST',
              body: JSON.stringify({ orderId }),
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
              }
            });
            
            const interiorResult = await interiorResponse.json();
            if (!interiorResponse.ok || !interiorResult.success) {
              throw new Error('内页PDF生成失败');
            }
            
            // 6. 等待封面PDF生成完成
            const coverResponse = await coverPromise;
            const coverResult = await coverResponse.json();
            if (!coverResult.success) {
              throw new Error('封面PDF生成失败');
            }
            
            // 7. 所有处理完成，更新状态为"完成"
            await updateBookStatus(orderId, "completed");
            
            console.log('书籍生成流程已成功完成');
          } catch (error) {
            console.error('书籍生成过程中出错:', error);
            // 更新状态为"失败"
            await updateBookStatus(orderId, "failed");
          }
        };
        
        // 开始书籍生成流程，但不等待其完成
        startBookGeneration();
        
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
  
  // 辅助函数：更新书籍状态
  const updateBookStatus = async (orderId: string, status: string) => {
    return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-book-data`, {
      method: 'POST',
      body: JSON.stringify({ orderId, status }),
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      }
    });
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
      totalSteps={8}
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