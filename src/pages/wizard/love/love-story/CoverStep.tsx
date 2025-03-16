import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Edit, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import WizardStep from '@/components/wizard/WizardStep';
import LoveStoryCoverPreview from '@/components/cover-generator/LoveStoryCoverPreview';
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage, getClientId, getAllImagesFromStorage, deleteImageFromStorage } from '@/integrations/supabase/storage';

// 定义封面样式类型
interface CoverStyle {
  id: string;
  name: string;
  background: string;
  titleColor: string;
  subtitleColor: string;
  authorColor: string;
  font: string;
  borderColor?: string;
}

// 预定义的封面样式
const coverStyles: CoverStyle[] = [
  {
    id: 'classic',
    name: 'Classic',
    background: '#f6f4ea', // 介于之前两种颜色之间的中间值
    titleColor: '#444444', // 保持深灰色标题
    subtitleColor: '#633d63', // 保持紫色副标题
    authorColor: '#222222', // 保持深灰色作者名
    font: 'playfair',
    borderColor: '#EAC46E'
  },
  {
    id: 'modern',
    name: 'Modern',
    background: '#000000',
    titleColor: '#4caf50',
    subtitleColor: '#ffffff',
    authorColor: '#4caf50',
    font: 'montserrat'
  },
  {
    id: 'playful',
    name: 'Playful',
    background: '#4A89DC',
    titleColor: '#FFEB3B',
    subtitleColor: '#FFFFFF',
    authorColor: '#FFEB3B',
    font: 'comic-sans'
  },
  {
    id: 'elegant',
    name: 'Elegant',
    background: '#FFFFFF',
    titleColor: '#000000',
    subtitleColor: '#333333',
    authorColor: '#000000',
    font: 'didot'
  },
  {
    id: 'vintage',
    name: 'Vintage',
    background: '#F5F5DC',
    titleColor: '#8B4513',
    subtitleColor: '#A0522D',
    authorColor: '#8B4513',
    font: 'playfair',
    borderColor: '#D2B48C'
  }
];

const LoveStoryCoverStep = () => {
  const [coverTitle, setCoverTitle] = useState<string>('THE MAGIC IN');
  const [subtitle, setSubtitle] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('Timi Bliss');
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isGeneratingCover, setIsGeneratingCover] = useState<boolean>(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('classic');
  const [textTone, setTextTone] = useState<string>('romantic');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // 从localStorage获取标题、作者信息、样式和文本风格
    const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
    const savedAuthorName = localStorage.getItem('loveStoryAuthorName');
    const savedStyle = localStorage.getItem('loveStoryCoverStyle');
    const savedTone = localStorage.getItem('loveStoryTone');
    
    // 从Supabase获取已保存的封面图片
    loadCoverImagesFromSupabase();
    
    if (savedAuthorName) {
      setAuthorName(savedAuthorName);
    }
    
    if (savedTone) {
      setTextTone(savedTone);
    }
    
    if (savedStyle) {
      setSelectedStyle(savedStyle);
    }
    
    if (savedIdeas && savedIdeaIndex) {
      try {
        const ideas = JSON.parse(savedIdeas);
        const selectedIdea = ideas[parseInt(savedIdeaIndex)];
        if (selectedIdea) {
          // 保持主标题为"THE MAGIC IN"
          setCoverTitle('THE MAGIC IN');
          // 副标题设置为描述(现在不显示)
          setSubtitle(selectedIdea.description || '');
        }
      } catch (error) {
        console.error('Error parsing saved ideas:', error);
      }
    }
  }, []);

  // 从Supabase加载封面图片
  const loadCoverImagesFromSupabase = async () => {
    try {
      const images = await getAllImagesFromStorage('images');
      const coverImages = images.filter(img => img.name.includes('love-story-cover'));
      
      if (coverImages.length > 0) {
        // 按创建时间排序，最新的在前面
        const sortedImages = coverImages.sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        // 获取所有图片的URL
        const imageUrls = sortedImages.map(img => img.url);
        setCoverImages(imageUrls);
        
        // 设置当前显示的图片为第一张
        setCurrentImageIndex(0);
      }
    } catch (error) {
      console.error('Error loading cover images from Supabase:', error);
    }
  };

  // 删除所有旧的封面图片
  const deleteOldCoverImages = async () => {
    try {
      const images = await getAllImagesFromStorage('images');
      const coverImages = images.filter(img => img.name.includes('love-story-cover'));
      
      // 创建删除操作的Promise数组
      const deletePromises = coverImages.map(img => {
        const pathParts = img.name.split('/');
        const filename = pathParts[pathParts.length - 1];
        return deleteImageFromStorage(filename, 'images');
      });
      
      // 并行执行所有删除操作
      await Promise.all(deletePromises);
      console.log('All old cover images deleted successfully');
    } catch (error) {
      console.error('Error deleting old cover images:', error);
    }
  };

  // 处理样式选择
  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    localStorage.setItem('loveStoryCoverStyle', styleId);
  };

  // 编辑封面功能
  const handleEditCover = () => {
    toast({
      title: "Edit Cover",
      description: "Opening cover editor..."
    });
    // 这里未来可以实现打开编辑器的功能
  };

  // 切换到上一张图片
  const handlePreviousImage = () => {
    setCurrentImageIndex(prevIndex => 
      prevIndex === 0 ? coverImages.length - 1 : prevIndex - 1
    );
  };

  // 切换到下一张图片
  const handleNextImage = () => {
    setCurrentImageIndex(prevIndex => 
      prevIndex === coverImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  // 直接跳转到指定图片
  const handleDotClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  // 重新生成封面功能
  const handleRegenerateCover = async () => {
    setIsGeneratingCover(true);
    toast({
      title: "Regenerating cover",
      description: "Creating new covers for your love story..."
    });
    
    try {
      // 先删除所有旧的封面图片
      await deleteOldCoverImages();
      
      // 获取用户上传的图片
      const uploadedImage = localStorage.getItem('loveStoryPartnerPhoto');
      const savedTone = localStorage.getItem('loveStoryTone') || textTone;
      const personAge = localStorage.getItem('loveStoryPersonAge') || '0';
      const ageNumber = parseInt(personAge);
      
      // 根据年龄选择不同的 prompt
      let textPrompt = '';
      if (ageNumber <= 12) {
        // 儿童风格 prompt
        textPrompt = `the person as a cute cartoon character with big expressive eyes, simplified facial features, colorful background, cheerful expression, wearing bright colored clothes, ${savedTone} mood, centered composition`;
      } else {
        // 更成熟的风格 prompt
        textPrompt = `the person as a stylized character with semi-realistic features, detailed facial expression, dynamic lighting, modern outfit, ${savedTone} atmosphere, artistic composition, vibrant color palette`;
      }
      
      if (uploadedImage) {
        // 使用上传的图片处理
        // 第一步：调用generate-love-cover API增强图片
        const { data: enhancedData, error: enhancedError } = await supabase.functions.invoke('generate-love-cover', {
          body: { 
            photo: uploadedImage,
            style: "Disney Charactor", // 固定使用 Disney Charactor 样式
            type: 'cover',
            prompt: textPrompt // 将 textPrompt 改为 prompt
          }
        });
        
        if (enhancedError) throw enhancedError;
        
        // 检查并处理响应数据
        let enhancedImages: string[] = [];
        if (enhancedData?.output && enhancedData.output.length > 0) {
          enhancedImages = enhancedData.output;
        } else if (enhancedData?.coverImage && enhancedData.coverImage.length > 0) {
          enhancedImages = enhancedData.coverImage;
        } else {
          throw new Error("No enhanced image data in response");
        }
        
        // 处理并上传所有生成的图片
        const timestamp = Date.now();
        const processedImages: string[] = [];
        
        for (let i = 0; i < enhancedImages.length; i++) {
          try {
            // 第二步：调用remove-background API去除背景
            const { data: bgRemoveData, error: bgRemoveError } = await supabase.functions.invoke('remove-background', {
              body: { imageUrl: enhancedImages[i] }
            });
            
            if (bgRemoveError) throw bgRemoveError;
            
            if (!bgRemoveData?.success || !bgRemoveData?.image) {
              throw new Error(`Failed to remove background for image ${i}`);
            }
            
            const processedImage = bgRemoveData.image;
            
            // 第三步：上传到Supabase存储
            const storageUrl = await uploadImageToStorage(
              processedImage,
              'images',
              `love-story-cover-${i}-${timestamp}`
            );
            
            processedImages.push(processedImage);
          } catch (error) {
            console.error(`Error processing image ${i}:`, error);
          }
        }
        
        // 更新状态，显示处理后的图片
        if (processedImages.length > 0) {
          setCoverImages(processedImages);
          setCurrentImageIndex(0);
        }
      } else {
        // 没有上传图片，使用简单的背景颜色
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // 使用当前选定样式的背景色
          const currentStyle = coverStyles.find(style => style.id === selectedStyle) || coverStyles[0];
          ctx.fillStyle = currentStyle.background;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          try {
            const dataUrl = canvas.toDataURL('image/png');
            setCoverImages([dataUrl]);
            setCurrentImageIndex(0);
            
            // 上传到Supabase，但不存储到localStorage
            const timestamp = Date.now();
            await uploadImageToStorage(
              dataUrl,
              'images',
              `love-story-cover-${timestamp}`
            );
          } catch (error) {
            console.error('Error creating cover image:', error);
            throw error;
          }
        }
      }
      
      // 重新加载Supabase上的图片以获取最新上传的图片
      setTimeout(() => {
        loadCoverImagesFromSupabase();
      }, 1000);
      
      toast({
        title: "Covers regenerated",
        description: "Your new covers are ready! Use the arrows to browse them."
      });
    } catch (error) {
      console.error('Error generating cover:', error);
      toast({
        title: "Error",
        description: "Failed to generate new covers.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingCover(false);
    }
  };
  
  const handleContinue = () => {
    // 保存当前选中的封面图片到 localStorage
    if (coverImages.length > 0 && currentImageIndex >= 0 && currentImageIndex < coverImages.length) {
      const selectedCoverImage = coverImages[currentImageIndex];
      localStorage.setItem('loveStoryCoverImage', selectedCoverImage);
      
      // 如果图片是 Supabase Storage URL，也保存 URL
      if (selectedCoverImage.startsWith('http')) {
        localStorage.setItem('loveStoryCoverImage_url', selectedCoverImage);
      }
      
      console.log('Selected cover image saved:', selectedCoverImage);
    }
    
    toast({
      title: "Cover saved",
      description: "Moving to the next step..."
    });
    
    // 导航到下一步
    navigate('/create/love/love-story/debug-prompts');
  };

  // 获取收件人名称 - 这将作为主要角色名称显示
  const recipientName = localStorage.getItem('loveStoryPersonName') || 'SIERRA';

  // 获取当前选中的样式
  const currentStyle = coverStyles.find(style => style.id === selectedStyle) || coverStyles[0];

  // 当前显示的封面图片
  const currentCoverImage = coverImages.length > 0 ? coverImages[currentImageIndex] : undefined;

  return (
    <WizardStep 
      title="Design Your Book Cover" 
      description=""
      previousStep="/create/love/love-story/ideas" 
      currentStep={5} 
      totalSteps={7} 
      onNextClick={handleContinue}
    >
      <div className="max-w-4xl mx-auto">
        <div className="relative max-w-xl mx-auto">
          {/* 左箭头 */}
          {coverImages.length > 1 && (
            <button 
              onClick={handlePreviousImage}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -ml-10 bg-white/80 rounded-full p-2 shadow-md z-10 hover:bg-white transition-colors"
              disabled={isGeneratingCover}
            >
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          
          {/* 封面预览 */}
          <LoveStoryCoverPreview
            coverTitle={coverTitle}
            subtitle={subtitle}
            authorName={authorName}
            recipientName={recipientName}
            coverImage={currentCoverImage}
            selectedFont={currentStyle.font}
            style={currentStyle}
          />
          
          {/* 右箭头 */}
          {coverImages.length > 1 && (
            <button 
              onClick={handleNextImage}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 -mr-10 bg-white/80 rounded-full p-2 shadow-md z-10 hover:bg-white transition-colors"
              disabled={isGeneratingCover}
            >
              <ChevronRight className="w-6 h-6 text-gray-700" />
            </button>
          )}
          
          {/* 点状指示器 */}
          {coverImages.length > 1 && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
              {coverImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-3 h-3 rounded-full ${
                    index === currentImageIndex 
                      ? 'bg-[#FF7F50]' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  } transition-colors`}
                  aria-label={`View cover option ${index + 1}`}
                />
              ))}
            </div>
          )}
          
          {/* 操作按钮 */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            <Button
              variant="secondary"
              onClick={handleEditCover}
              disabled={isGeneratingCover}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit cover
            </Button>
            <Button
              variant="secondary"
              onClick={handleRegenerateCover}
              disabled={isGeneratingCover}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingCover ? 'animate-spin' : ''}`} />
              {isGeneratingCover ? 'Generating...' : 'Regenerate'}
            </Button>
          </div>
        </div>
        
        {/* 样式选择器 */}
        <div className="mt-10">
          <div className="flex justify-center gap-4 flex-wrap">
            {coverStyles.map((style) => (
              <div 
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                className={`relative w-24 h-24 rounded-full cursor-pointer flex items-center justify-center ${
                  selectedStyle === style.id ? 'ring-2 ring-offset-2 ring-[#FF7F50]' : ''
                }`}
                style={{
                  backgroundColor: style.background,
                  border: style.borderColor ? `3px solid ${style.borderColor}` : 'none'
                }}
              >
                <span 
                  className="text-4xl font-bold"
                  style={{ 
                    fontFamily: style.font === 'playfair' ? 'serif' 
                      : style.font === 'montserrat' ? 'sans-serif' 
                      : style.font === 'comic-sans' ? 'cursive' 
                      : style.font === 'didot' ? 'serif' 
                      : 'serif',
                    color: style.subtitleColor
                  }}
                >
                  Aa
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryCoverStep;