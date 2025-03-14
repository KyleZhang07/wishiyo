import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Edit, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import WizardStep from '@/components/wizard/WizardStep';
import LoveStoryCoverPreview from '@/components/cover-generator/LoveStoryCoverPreview';
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage, getClientId, getAllImagesFromStorage } from '@/integrations/supabase/storage';

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
    background: '#f5f5f0',
    titleColor: '#5a5a5a',
    subtitleColor: '#633d63',
    authorColor: '#333333',
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
    background: '#5B4B49',
    titleColor: '#D4AF37',
    subtitleColor: '#F2F2F2',
    authorColor: '#D4AF37',
    font: 'didot'
  },
  {
    id: 'pastel',
    name: 'Pastel',
    background: '#FADADD',
    titleColor: '#333333',
    subtitleColor: '#6A7B8B',
    authorColor: '#333333',
    font: 'georgia',
    borderColor: '#DBDBF5'
  }
];

const LoveStoryCoverStep = () => {
  const [coverTitle, setCoverTitle] = useState<string>('THE MAGIC IN');
  const [subtitle, setSubtitle] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('Timi Bliss');
  const [coverImage, setCoverImage] = useState<string | undefined>();
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
    loadCoverImageFromSupabase();
    
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
  const loadCoverImageFromSupabase = async () => {
    try {
      const images = await getAllImagesFromStorage('images');
      const coverImages = images.filter(img => img.name.includes('love-story-cover'));
      
      if (coverImages.length > 0) {
        // 使用最新的图片
        const latestImage = coverImages.sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })[0];
        
        setCoverImage(latestImage.url);
      }
    } catch (error) {
      console.error('Error loading cover image from Supabase:', error);
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

  // 重新生成封面功能
  const handleRegenerateCover = async () => {
    setIsGeneratingCover(true);
    toast({
      title: "Regenerating cover",
      description: "Creating a new cover for your love story..."
    });
    
    try {
      // 获取用户上传的图片
      const uploadedImage = localStorage.getItem('loveStoryPartnerPhoto');
      const savedTone = localStorage.getItem('loveStoryTone') || textTone;
      
      if (uploadedImage) {
        // 使用上传的图片处理
        // 第一步：调用generate-love-cover API增强图片
        const { data: enhancedData, error: enhancedError } = await supabase.functions.invoke('generate-love-cover', {
          body: { 
            photo: uploadedImage,
            style: selectedStyle,
            type: 'cover',
            textPrompt: `the person's single person img, but wearing more brilliant clothes, but in a ${savedTone} way.`
          }
        });
        
        if (enhancedError) throw enhancedError;
        
        // 检查并处理响应数据
        let enhancedImage = '';
        if (enhancedData?.output && enhancedData.output.length > 0) {
          enhancedImage = enhancedData.output[0];
        } else if (enhancedData?.coverImage && enhancedData.coverImage.length > 0) {
          enhancedImage = enhancedData.coverImage[0];
        } else {
          throw new Error("No enhanced image data in response");
        }
        
        // 第二步：调用remove-background API去除背景
        const { data: bgRemoveData, error: bgRemoveError } = await supabase.functions.invoke('remove-background', {
          body: { imageUrl: enhancedImage }
        });
        
        if (bgRemoveError) throw bgRemoveError;
        
        if (!bgRemoveData?.success || !bgRemoveData?.image) {
          throw new Error("Failed to remove background");
        }
        
        const processedImage = bgRemoveData.image;
        
        // 第三步：上传到Supabase存储
        const timestamp = Date.now();
        const storageUrl = await uploadImageToStorage(
          processedImage,
          'images',
          `love-story-cover-${timestamp}`
        );
        
        // 仅保存到状态中用于显示，不存储到localStorage
        setCoverImage(processedImage);
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
            setCoverImage(dataUrl);
            
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
        loadCoverImageFromSupabase();
      }, 1000);
      
      toast({
        title: "Cover regenerated",
        description: "Your new cover is ready!"
      });
    } catch (error) {
      console.error('Error generating cover:', error);
      toast({
        title: "Error",
        description: "Failed to generate a new cover.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingCover(false);
    }
  };
  
  const handleContinue = () => {
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
          <LoveStoryCoverPreview
            coverTitle={coverTitle}
            subtitle={subtitle}
            authorName={authorName}
            recipientName={recipientName}
            coverImage={coverImage}
            selectedFont={currentStyle.font}
            style={currentStyle}
          />
          
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