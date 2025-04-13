import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getClientId } from '@/utils/clientId';

// 导入图片
import hardcoverImage from '@/assets/format-images/funny-biography/hardcover.jpg';
import softcoverImage from '@/assets/format-images/funny-biography/softcover.jpg';

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

  // 直接在状态初始化时从 localStorage 加载数据，避免闪烁
  const [selectedFormat, setSelectedFormat] = useState<string>(() => {
    const savedFormat = localStorage.getItem('funnyBiographySelectedFormat');
    return savedFormat || 'softcover'; // 默认选择软封面
  });
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
        // 获取封面图片数据
        const frontCoverBase64 = localStorage.getItem('funnyBiographyFrontCoverImage') || '';
        const spineBase64 = localStorage.getItem('funnyBiographySpineImage') || '';
        const backCoverBase64 = localStorage.getItem('funnyBiographyBackCoverImage') || '';

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

        // 上传封面图片到Supabase Storage
        try {
          // 转换Base64数据（PDF或图片）为Blob
          const dataUriToBlob = (dataUri, defaultType = 'image/jpeg') => {
            // 检查数据格式是否有效
            if (!dataUri || typeof dataUri !== 'string') {
              console.error('Invalid data URI:', dataUri?.substring(0, 50));
              return null;
            }

            try {
              // 确定正确的MIME类型
              let mimeType = defaultType;
              let base64Data = dataUri;

              // 处理标准Data URI格式
              if (dataUri.startsWith('data:')) {
                const parts = dataUri.split(',');
                const matches = parts[0].match(/^data:([^;]+);base64$/);
                if (matches && matches[1]) {
                  mimeType = matches[1];
                }
                base64Data = parts[1];
              }
              // 处理jsPDF输出的datauristring（带有应用类型前缀）
              else if (dataUri.startsWith('data:application/pdf;')) {
                // 从PDF提取图像数据时需要特殊处理
                mimeType = 'application/pdf';
                const parts = dataUri.split(',');
                base64Data = parts[1];
              }
              // 如果没有前缀，假设是原始base64
              else {
                // 添加必要的头部
                base64Data = dataUri;
              }

              // 解码base64数据
              const byteString = atob(base64Data);
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);

              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }

              return new Blob([ab], { type: mimeType });
            } catch (error) {
              console.error('Error converting data URI to blob:', error);
              return null;
            }
          };

          // 上传图片到Supabase Storage
          const uploadImage = async (dataUri, fileName) => {
            if (!dataUri) {
              console.error('No image data provided for:', fileName);
              return '';
            }

            console.log(`Uploading ${fileName}, data URI format:`, dataUri.substring(0, 50) + '...');

            // 强制使用图像格式，即使输入是PDF
            const contentType = 'image/jpeg';
            const fileExtension = '.jpg';
            const actualFileName = fileName.endsWith(fileExtension) ? fileName : fileName + fileExtension;

            // 转换为Blob
            const blob = dataUriToBlob(dataUri, contentType);
            if (!blob) {
              console.error('Failed to convert data to blob for:', fileName);
              return '';
            }

            const file = new File([blob], actualFileName, { type: contentType });
            console.log(`Created file for ${actualFileName}, size: ${file.size} bytes`);

            try {
              const { data, error } = await supabase.storage
                .from('book-covers')
                .upload(`${orderId}/${actualFileName}`, file, {
                  upsert: true,
                  contentType: contentType
                });

              if (error) {
                console.error(`Error uploading ${actualFileName}:`, error);
                return '';
              }

              console.log(`Successfully uploaded ${actualFileName} to Supabase`);

              // 获取公共URL
              const { data: urlData } = supabase.storage
                .from('book-covers')
                .getPublicUrl(`${orderId}/${actualFileName}`);

              console.log(`Generated public URL for ${actualFileName}:`, urlData.publicUrl);
              return urlData.publicUrl;
            } catch (uploadError) {
              console.error(`Exception during upload of ${actualFileName}:`, uploadError);
              return '';
            }
          };

          // 上传三个封面图片
          console.log('Starting image uploads to Supabase Storage');
          const frontCoverUrl = await uploadImage(frontCoverBase64, 'front-cover.jpg');
          const spineUrl = await uploadImage(spineBase64, 'spine.jpg');
          const backCoverUrl = await uploadImage(backCoverBase64, 'back-cover.jpg');

          // 创建书籍记录到数据库
          try {
            // 收集书籍信息
            const authorName = localStorage.getItem('funnyBiographyAuthorName') || 'Friend';
            const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
            const selectedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
            const tableOfContent = localStorage.getItem('funnyBiographyTableOfContent');
            const savedAnswers = localStorage.getItem('funnyBiographyAnswers'); // 从Stories Step获取问题和回答
            const savedChapters = localStorage.getItem('funnyBiographyChapters'); // 从Preview Step获取章节信息

            let ideas = null;
            let selectedIdea = null;
            let toc = null;
            let answers = null;
            let chapters = null;

            if (savedIdeas) {
              ideas = JSON.parse(savedIdeas);
              if (selectedIdeaIndex) {
                selectedIdea = ideas[parseInt(selectedIdeaIndex)];
              }
            }

            if (tableOfContent) {
              toc = JSON.parse(tableOfContent);
            }

            // 解析回答数据
            if (savedAnswers) {
              answers = JSON.parse(savedAnswers);
            }

            // 解析章节数据
            if (savedChapters) {
              chapters = JSON.parse(savedChapters);
            }

            // 获取客户端ID
            const clientId = getClientId();

            // 添加记录到数据库
            const { data, error } = await supabase
              .from('funny_biography_books')
              .insert({
                order_id: orderId,
                title: bookTitle,
                author: authorName,
                ideas: ideas,
                selected_idea: selectedIdea,
                chapters: chapters || toc, // 优先使用chapters，如果不存在则使用toc
                answers: answers, // 添加answers字段
                status: 'created',
                timestamp: new Date().toISOString(),
                // 保存封面样式
                style: localStorage.getItem('funnyBiographySelectedStyle') || 'classic',
                // 保存图片URL到数据库
                images: {
                  frontCover: frontCoverUrl,
                  spine: spineUrl,
                  backCover: backCoverUrl
                },
                // 设置客户端ID用于行级安全性
                client_id: clientId
              })
              .select();

            if (error) {
              console.error('Database error when creating book record:', error);
              throw new Error('Unable to create book record in database');
            }

            console.log('Book record created:', data);

          } catch (dbError) {
            console.error('Database error:', dbError);
            // Continue with checkout despite database error
            // We'll rely on startBookGeneration function to retry if necessary
          }
        } catch (uploadError) {
          console.error('Error uploading images to storage:', uploadError);
          // 继续结账流程，即使图片上传失败
        }

        // 书籍生成流程将通过 Stripe Webhook 在支付成功后处理
        console.log('Book generation will be handled by Stripe webhook after payment confirmation');

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
    // 从 localStorage 获取用户选择的封面样式
    const coverStyle = localStorage.getItem('funnyBiographySelectedStyle') || 'classic';

    return fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-book-data`, {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        status,
        style: coverStyle // 使用 style 字段保存封面样式
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      }
    });
  };

  // 不再需要从 localStorage 加载已保存的选择
  // 因为我们已经在状态初始化时直接加载了数据


  return (
    <WizardStep
      title="Pick Your Perfect Finish"
      description="Select how your book will be printed."
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


              {/* 封面图片 */}
              <div className="aspect-[4/3] h-72 bg-gray-50 relative flex items-end">
                {format.imageSrc && (
                  <img
                    src={format.imageSrc}
                    alt={format.name}
                    className="w-full object-contain"
                  />
                )}
              </div>

              {/* 格式描述 */}
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
            {isProcessing ? 'Processing...' : 'Checkout'}
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default FormatStep;