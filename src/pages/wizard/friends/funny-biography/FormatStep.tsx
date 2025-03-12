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
  const hardcoverImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCADIASwDAREAAhEBAxEB/8QAHAABAAIDAQEBAAAAAAAAAAAAAAUGAwQHAggB/8QAGwEBAAIDAQEAAAAAAAAAAAAAAAMEAQIFBgf/2gAMAwEAAhADEAAAAfqkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARGfUfNbj48/oHyfoWVkpvTm9bwuixrS2trCy1tLS3NLe0tza3Nrc2tza2NrY3tjowdjGf0cZfZxl9HGXucZPZxk+HGP6cYvxxh/nCH+cIP5xgZcjHk5GDJcGHLdmDNeFgZr4wZL4wZMhsYstsYslwYMlwYMt2sDLdrAy3awMl2jjJdo4yXSMMd6ijFdI4wXqOL9+iPnXqP6By2pP5WrB931ptOzB99OqsejXAAAAAAAAACO1OL4PP4/rPI6EfO1f3vn7n0cPXOsZeqwh6JGMARmvUcSNgr4wZbgw5Lkw5LkxZbgwZbswZbswZLpYmS6MWS5WRjuVoY7lbGO6MTFkmjHkmjJlmjHlmjDkuI4yPDAyPDAw5DiMMdzHGHIcxBhyHUUYch1EGHIdRBfyXcYX8l1HF7JdxxeyXUcX7n2MNl5GGy8ii/59HF/h9OH0YcX0g8lscn2t/lNP3P0+bjorXpe2AAAAAAAAAAAAi9jianznNaXU0eVvVpJz/sRrR2ljqYAAAAAAAAAAMNZpgjTMHndswed2TB53ZMGndkwSc0jBJzSMEndNINX4NBq/BoNX4JBq/BINX4JBq/BINX4JBK/wASIN74fAk3vh0CXf8Ah0CXT+HwJNP4fAk0/h8CXS+HwJdL4fAljm0Cfc8lqQt6uJKvlB6HnT61zvv9dPV3vfDztMAAAAAAAAAAAAAEbpcNzvmcj1fMmHEQGkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANea4INn6FHS5eW17jGXrh7PX8yYcTAaQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABrvdLC1/Z07PTl5uj1kJ6YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIrs4aK88iK++HHOcHHesHF+2HEfIHDfQHB/YGn9waX3Bo/gGh+IZ/5BnfoGd+wZn8Bl/0GV/oe/8Ao9X0/pe/6Xt+l7fpe36Xt+l7fpe36Xt+l7fpe36Xr+l6/pev6Xp+l6fpen6Xp+l6fpen6Xp+l6fpWn/9k=";
  
  const softcoverImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCADIASwDAREAAhEBAxEB/8QAHAAAAgMBAQEBAAAAAAAAAAAABAUBAgMGBwAI/8QAGgEAAwEBAQEAAAAAAAAAAAAAAAIDBAEFBv/aAAwDAQACEAMQAAAB9UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVKEBJtlolLrRCtdNDOL2DMXtGUvaMhe2ZAvaAhe4ZAd4xA75hB3zADwDCDvmAHgGEHgGEHhGAHhGAHhGAfBGAPiMI+IxD4jEPkMA+QwD5DAPoMY+gxj6jEPqMY+wxi9GQXY0AvRuEL0bhC9G4Re1cIXtXBF7dgRe3dEXt3RFbt4Be7eDObzGTOZ1mTGdhkw2dgMH1GrEelzZqdFmTf0GFO9Y2OtoeXJsXSqTjBUNxgoFwoEAsShcJhcJhcJxILhKKBYJRQLhKJhcIxMKxKJxWJROKxMJxSJhUJhSJxOJxSJhQJxQJhQJxQJhUJRQJRQJBQJBoIxoJBoJBoIxoIxoIxsIhsIhsIhqIxqIxsIRsIRsIRsIRsIRsIRsIRuIBuOGc2VHOOm1c5ps6nF3OM07vUPQNxsdHnLuPUrDg0G40MxudDMaGwzGh0MxofDMZnwzGh4NBofDUZHg2GA0GYwGgzGIyGYxGYyGYxGYyGYyGIyGIxGIxGIxGQxGQxGQxGIyGIyGIxGIyGIyGIyGIxGIzGI0GIzGIzGIzGIzGIzGAzGAwGA0GAwGQyGQyGQ2GQyGQ2GQ2GQ2GQyGQyGg3GQ5GwyHI4G45HI5HI4HI5HI5HQ5HI5G46HI6HI6HIbnQbnY5HY7G52Ox0dD/9k=";

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
  
  // 将用户数据保存到Supabase的辅助函数
  const saveDataToSupabase = async (orderId: string, bookTitle: string) => {
    try {
      // 从localStorage获取所有需要的数据
      const authorName = localStorage.getItem('funnyBiographyAuthorName') || '';
      const savedAnswers = localStorage.getItem('funnyBiographyAnswers') || '[]';
      const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas') || '[]';
      const selectedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea') || '0';
      const selectedStyle = localStorage.getItem('funnyBiographySelectedStyle') || 'classic-red';
      const photoUrl = localStorage.getItem('funnyBiographyPhoto') || '';
      
      // 解析数据
      const answers = JSON.parse(savedAnswers);
      const ideas = JSON.parse(savedIdeas);
      const selectedIdea = ideas[parseInt(selectedIdeaIndex)] || {};
      
      // 导入需要的Supabase工具
      const { uploadImageToStorage, ensureBucketExists, ensureFunnyBiographyTableExists } = await import('@/integrations/supabase/storage');
      
      // 确保存储桶和数据库表都已存在
      await ensureBucketExists('funny-biography');
      await ensureFunnyBiographyTableExists();
      
      // 从CanvasCoverPreview组件获取封面图像
      // 创建临时Canvas元素来生成封面图像
      const frontCoverCanvas = document.createElement('canvas');
      const spineCanvas = document.createElement('canvas');
      const backCoverCanvas = document.createElement('canvas');
      
      // 设置画布大小
      const baseWidth = 800;
      const baseHeight = 1200;
      const baseSpineWidth = 80;
      
      frontCoverCanvas.width = baseWidth;
      frontCoverCanvas.height = baseHeight;
      spineCanvas.width = baseSpineWidth;
      spineCanvas.height = baseHeight;
      backCoverCanvas.width = baseWidth;
      backCoverCanvas.height = baseHeight;
      
      // 获取上下文
      const frontCtx = frontCoverCanvas.getContext('2d');
      const spineCtx = spineCanvas.getContext('2d');
      const backCtx = backCoverCanvas.getContext('2d');
      
      if (!frontCtx || !spineCtx || !backCtx) {
        throw new Error('Failed to get canvas context');
      }
      
      // 导入需要的模板数据
      const { coverTemplates, coverLayouts } = await import('@/components/cover-generator/types');
      
      // 获取选中的样式
      const stylePreset = [
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
      ].find(style => style.id === selectedStyle) || {
        id: 'classic-red',
        name: 'Classic Beige',
        font: 'merriweather',
        template: 'classic',
        layout: 'classic-centered'
      };
      
      // 加载图片
      const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        });
      };
      
      // 画封面函数 - 简化版，仅供保存使用
      const drawSimpleCover = (ctx: CanvasRenderingContext2D, type: 'front' | 'spine' | 'back') => {
        // 选择合适的模板和布局
        const template = coverTemplates[stylePreset.template] || coverTemplates.modern;
        const layout = coverLayouts[stylePreset.layout] || coverLayouts['classic-centered'];
        
        // 基本背景
        ctx.fillStyle = template.backgroundColor;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // 简单的文字
        ctx.font = `bold 48px ${stylePreset.font}`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        
        if (type === 'front') {
          // 封面标题
          ctx.fillText(bookTitle, ctx.canvas.width / 2, ctx.canvas.height / 2);
          ctx.fillText(authorName, ctx.canvas.width / 2, ctx.canvas.height / 2 + 60);
        } else if (type === 'spine') {
          // 书脊
          ctx.save();
          ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
          ctx.rotate(Math.PI / 2);
          ctx.fillText(bookTitle, 0, 0);
          ctx.restore();
        } else {
          // 封底
          ctx.fillText('Back Cover', ctx.canvas.width / 2, ctx.canvas.height / 2);
        }
      };
      
      // 绘制简单的封面
      drawSimpleCover(frontCtx, 'front');
      drawSimpleCover(spineCtx, 'spine');
      drawSimpleCover(backCtx, 'back');
      
      // 转换成base64
      const frontCoverImage = frontCoverCanvas.toDataURL('image/jpeg');
      const spineImage = spineCanvas.toDataURL('image/jpeg');
      const backCoverImage = backCoverCanvas.toDataURL('image/jpeg');
      
      // 上传封面图像
      const frontCoverUrl = await uploadImageToStorage(
        frontCoverImage, 
        'funny-biography', 
        `${orderId}/front-cover`
      );
      
      const spineUrl = await uploadImageToStorage(
        spineImage, 
        'funny-biography', 
        `${orderId}/spine`
      );
      
      const backCoverUrl = await uploadImageToStorage(
        backCoverImage, 
        'funny-biography', 
        `${orderId}/back-cover`
      );
      
      // 如果有照片，也上传照片
      let profilePhotoUrl = '';
      if (photoUrl) {
        profilePhotoUrl = await uploadImageToStorage(
          photoUrl,
          'funny-biography',
          `${orderId}/profile-photo`
        );
      }
      
      // 整合所有数据
      const bookData = {
        orderId,
        title: bookTitle,
        author: authorName,
        selectedIdea,
        ideas,
        answers,
        style: stylePreset,
        images: {
          frontCover: frontCoverUrl,
          spine: spineUrl,
          backCover: backCoverUrl,
          profilePhoto: profilePhotoUrl
        },
        timestamp: new Date().toISOString()
      };
      
      // 将合并的数据保存到Supabase
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('funny_biography_books')
        .insert(bookData);
        
      if (error) {
        console.error('Error inserting data:', error);
        throw error;
      }
      
      console.log('Successfully saved book data to Supabase:', orderId);
    } catch (error) {
      console.error('Error saving data to Supabase:', error);
      // 失败时不影响结账流程，只记录错误
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
        
        // 在重定向前，启动后台保存过程
        // 使用setTimeout和Promise.race让保存过程在后台进行，不阻塞用户跳转
        setTimeout(() => {
          saveDataToSupabase(orderId, bookTitle).catch(err => {
            console.error('Background save error:', err);
          });
        }, 0);
        
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