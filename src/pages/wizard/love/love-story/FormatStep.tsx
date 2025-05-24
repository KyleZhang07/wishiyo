import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getClientId } from '@/utils/clientId';

// 导入webp图片
import hardcoverWebp from '@/assets/format-images/love-story/hardcover.webp';
import softcoverWebp from '@/assets/format-images/love-story/softcover.webp';

// 封面类型
interface CoverFormat {
  id: string;
  name: string;
  price: number;
  description: string;
  imageSrc?: string; // 添加图片路径属性
}

const FormatStep = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // 硬封面和软封面的示例图片已通过import导入

  // 可选的封面格式
  const coverFormats: CoverFormat[] = [
    {
      id: 'hardcover',
      name: 'Elegant Glossy',
      price: 59.99,
      description: 'A vibrant glossy finish with bright, eye-catching colors.',
      imageSrc: hardcoverWebp
    },
    {
      id: 'hardcover_matte',
      name: 'Classic Matte',
      price: 49.99,
      description: 'An elegant matte finish – perfect for timeless gifts.',
      imageSrc: softcoverWebp
    }
  ];

  // 直接在状态初始化时从 localStorage 加载数据，避免闪烁
  const [selectedFormat, setSelectedFormat] = useState<string>(() => {
    const savedFormat = localStorage.getItem('loveStorySelectedFormat');
    return savedFormat || 'hardcover'; // 默认选择精装高光版
  });
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
      // 优先使用用户在CoverStep中设置的标题，如果没有则使用默认格式
      const bookTitle = localStorage.getItem('loveStoryCoverTitle') || 
                       ('THE MAGIC IN ' + (localStorage.getItem('loveStoryPersonName') || 'My Love'));
      localStorage.setItem('loveStoryBookTitle', bookTitle);
      localStorage.setItem('loveStoryBookFormat', selectedFormatObj.name);
      localStorage.setItem('loveStoryBookPrice', selectedFormatObj.price.toString());
      localStorage.setItem('loveStoryBindingType', selectedFormatObj.id); // 保存装订类型

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
            quantity: 1,
            binding_type: selectedFormatObj.id // 添加装订类型信息
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

          // 获取用户选择的封面样式
          const coverStyle = localStorage.getItem('loveStoryCoverStyle') || 'classic';

          const { data, error } = await supabase
            .from('love_story_books')
            .insert({
              order_id: orderId,
              title: bookTitle,
              person_name: personName,
              status: 'created',
              timestamp: new Date().toISOString(),
              client_id: clientId,
              session_id: localStorage.getItem('current_session_id') || undefined,
              // 保存封面样式信息
              style: coverStyle,
              // 保存装订类型（精装高光或精装哈光）
              binding_type: selectedFormatObj.id
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

  // 不再需要从 localStorage 加载已保存的选择
  // 因为我们已经在状态初始化时直接加载了数据


  return (
    <WizardStep
      title="Pick Your Perfect Finish"
      description="Select how your book will be printed."
      previousStep="/create/love/love-story/generate"
      currentStep={8}
      totalSteps={8}
    >
      <div className="max-w-4xl mx-auto">
        {/* 免运费提示 - 移动到顶部副标题下方 */}
        <div className="mt-[-24px] mb-8 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <p className="text-green-700 font-medium">🚚 Limited time offer - Free Shipping on All Orders!</p>
            <p className="text-gray-600 text-sm"></p>
          </div>
        </div>
        
        {/* 拉高显示区域，h-72 -> h-[22rem]，使得书本图片能完整露出顶部 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 封面格式选项 */}
          {coverFormats.map((format, idx) => (
            <div
              key={format.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                selectedFormat === format.id
                  ? 'border-[#0C5C4C] ring-1 ring-[#0C5C4C]'
                  : 'border-gray-200'
              } relative`}
            >
              {/* 斜角 Most popular 丝带，仅第一个卡片显示 */}
              {idx === 0 && (
                <span
                  className="most-popular-ribbon"
                  style={{
                    position: 'absolute',
                    left: '-44px', 
                    top: '40px',  
                    zIndex: 20,
                    display: 'inline-block',
                    width: '196px',
                    height: '32px',
                    background: '#FF7F50',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '13px',
                    textAlign: 'center',
                    lineHeight: '32px',
                    letterSpacing: '0.08em',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                    transform: 'rotate(-45deg)',
                    borderRadius: '6px',
                    textShadow: '0 1px 3px rgba(0,0,0,0.08)'
                  }}
                >
                  MOST POPULAR
                </span>
              )}
              {/* 封面图片区域：整体向上平移5%，宽度不变 */}
              <div className="h-[22rem] bg-gray-100 relative flex items-stretch justify-stretch p-0 m-0" style={{ transform: 'translateY(-5%)' }}>
                {format.imageSrc ? (
                  <img
                    src={format.imageSrc}
                    alt={`${format.name} book`}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center', display: 'block' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                    {format.name} Preview
                  </div>
                )}
              </div>

              {/* 文本内容 */}
              <div className="p-7">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold">{format.name}</h3>
                  <p className="text-xl font-bold">${format.price.toFixed(2)}</p>
                </div>
                <p className="text-gray-600 mb-6">{format.description}</p>

                {/* 选择按钮 */}
                <Button
                  variant={selectedFormat === format.id ? "default" : "outline"}
                  className={`w-full ${
                    selectedFormat === format.id
                      ? 'bg-[#1F2937] hover:bg-[#1F2937]/90'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => handleFormatSelect(format.id)}
                >
                  {selectedFormat === format.id ? (
                    <span className="flex items-center justify-center">
                      <span className="bg-white rounded-full p-0.5 mr-2">
                        <Check className="h-4 w-4 text-[#1F2937]" />
                      </span>
                      Selected
                    </span>
                  ) : "Select"}
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
            {isProcessing ? 'Processing...' : 'Order Now - Free Shipping!'}
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default FormatStep;