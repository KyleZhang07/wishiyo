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
  const hardcoverImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCADIASwDAREAAhEBAxEB/8QAHAABAAIDAQEBAAAAAAAAAAAAAAUGAwQHAggB/8QAGwEBAAIDAQEAAAAAAAAAAAAAAAMEAQIFBgf/2gAMAwEAAhADEAAAAfqkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARGfUfNbj48/oHyfoWVkpvTm9bwuixrS2trCy1tLS3NLe0tza3Nrc2tza2NrY3tjowdjGf0cZfZxl9HGXucZPZxk+HGP6cYvxxh/nCH+cIP5xgZcjHk5GDJcGHLdmDNeFgZr4wZL4wZMhsYstsYslwYMlwYMt2sDLdrAy3awMl2jjJdo4yXSMMd6ijFdI4wXqOL9+iPnXqP6By2pP5WrB931ptOzB99OqsejXAAAAAAAAACO1OL4PP4/rPI6EfO1f3vn7n0cPXOsZeqwh6JGMARmvUcSNgr4wZbgw5Lkw5LkxZbgwZbswZbswZLpYmS6MWS5WRjuVoY7lbGO6MTFkmjHkmjJlmjHlmjDkuI4yPDAyPDAw5DiMMdzHGHIcxBhyHUUYch1EGHIdRBfyXcYX8l1HF7JdxxeyXUcX7n2MNl5GGy8ii/59HF/h9OH0YcX0g8lscn2t/lNP3P0+bjorXpe2AAAAAAAAAAAAi9jianznNaXU0eVvVpJz/sRrR2ljqYAAAAAAAAAAMNZpgjTMHndswed2TB53ZMGndkwSc0jBJzSMEndNINX4NBq/BoNX4JBq/BINX4JBq/BINX4JBK/wASIN74fAk3vh0CXf8Ah0CXT+HwJNP4fAk0/h8CXS+HwJdL4fAljm0Cfc8lqQt6uJKvlB6HnT61zvv9dPV3vfDztMAAAAAAAAAEbpcNzvmcj1fMmHEQGkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAANea4INn6FHS5eW17jGXrh7PX8yYcTAaQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABrvdLC1/Z07PTl5uj1kJ6YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIrs4aK88iK++HHOcHHesHF+2HEfIHDfQHB/YGn9waX3Bo/gGh+IZ/5BnfoGd+wZn8Bl/0GV/oe/8Ao9X0/pe/6Xt+l7fpe36Xt+l7fpe36Xt+l7fpe36Xr+l6/pev6Xp+l6fpen6Xp+l6fpen6Xp+l6fpWn/9k=";
  
  const softcoverImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wgARCADIASwDAREAAhEBAxEB/8QAHAAAAgMBAQEBAAAAAAAAAAAABAUBAgMGBwAI/8QAGgEAAwEBAQEAAAAAAAAAAAAAAAIDBAEFBv/aAAwDAQACEAMQAAAB9UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVKEBJtlolLrRCtdNDOL2DMXtGUvaMhe2ZAvaAhe4ZAd4xA75hB3zADwDCDvmAHgGEHgGEHhGAHhGAHhGAfBGAPiMI+IxD4jEPkMA+QwD5DAPoMY+gxj6jEPqMY+wxi9GQXY0AvRuEL0bhC9G4Re1cIXtXBF7dgRe3dEXt3RFbt4Be7eDObzGTOZ1mTGdhkw2dgMH1GrEelzZqdFmTf0GFO9Y2OtoeXJsXSqTjBUNxgoFwoEAsShcJhcJhcJxILhKKBYJRQLhKJhcIxMKxKJxWJROKxMJxSJhUJhSJxOJxSJhQJxQJxQJxQJhUJRQJRQJBQJBoIxoJBoJBoIxoIxoIxsIhsIhsIhqIxqIxsIRsIRsIRsIRsIRsIRsIRsIRuOAc2VHOOm1c5ps6nF3OM07vUPQNxsdHnLuPUrDg0G40MxudDMaGwzGh0MxofDMZnwzGh4NBofDUZHg2GA0GYwGgzGIyGYxGYyGYxGYyGIyGIxGIxGIxGQxGQxGQxGIyGIyGIxGIyGIyGIyGIxGIzGI0GIzGIzGIzGIzGIzGAzGAwGA0GAwGQyGQyGQ2GQyGQ2GQ2GQ2GQyGQyGg3GQ5GwyHI4G45HI5HI4HI5HI5HQ5HI5G46HI6HI6HIbnQbnY5HY7G52Ox0d/9k=";

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
                binding_type: selectedFormat, // 直接在创建记录时添加binding_type
                // 保存图片URL到数据库
                images: {
                  frontCover: frontCoverUrl,
                  spine: spineUrl,
                  backCover: backCoverUrl
                }
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