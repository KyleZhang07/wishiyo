import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getClientId } from '@/utils/clientId';

// 导入图片
import hardcoverImage from '@/assets/format-images/love-story/hardcover.jpg';
import softcoverImage from '@/assets/format-images/love-story/softcover.jpg';

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
      name: 'Hardcover',
      price: 59.99,
      description: 'A luxurious hardcover made to last for generations.',
      imageSrc: hardcoverImage
    },
    {
      id: 'softcover',
      name: 'Softcover',
      price: 39.99,
      description: 'Lightweight and beautiful – perfect for everyday reading.',
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
      title="Pick Your Perfect Finish"
      description="Select how your book will be printed."
      previousStep="/create/love/love-story/generate"
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


              {/* 封面图片 */}
              <div className="h-72 bg-gray-100 relative">
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
              </div>

              {/* 文本内容 */}
              <div className="p-7">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold">{format.name}</h3>
                  <p className="text-xl font-bold">${format.price.toFixed(2)} USD</p>
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
            {isProcessing ? 'Processing...' : 'Checkout'}
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default FormatStep;