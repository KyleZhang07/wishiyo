import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Edit, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import WizardStep from '@/components/wizard/WizardStep';
import LoveStoryCoverPreview from '@/components/cover-generator/LoveStoryCoverPreview';

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
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // 从localStorage获取标题、作者信息和样式
    const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
    const savedAuthorName = localStorage.getItem('loveStoryAuthorName');
    const savedStyle = localStorage.getItem('loveStoryCoverStyle');
    
    // 获取已保存的封面图片
    const savedCoverImage = localStorage.getItem('loveStoryCoverImage');
    
    if (savedAuthorName) {
      setAuthorName(savedAuthorName);
    }
    
    if (savedCoverImage) {
      setCoverImage(savedCoverImage);
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
      // 模拟生成过程
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 这里我们只改变背景颜色的逻辑不变，但不再需要绘制复杂的渐变
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // 使用当前选定样式的背景色
        const currentStyle = coverStyles.find(style => style.id === selectedStyle) || coverStyles[0];
        ctx.fillStyle = currentStyle.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 保存新的封面图片
        try {
          const dataUrl = canvas.toDataURL('image/png');
          localStorage.setItem('loveStoryCoverImage', dataUrl);
          setCoverImage(dataUrl);
          
          toast({
            title: "Cover regenerated",
            description: "Your new cover is ready!"
          });
        } catch (error) {
          console.error('Error saving cover image:', error);
          toast({
            title: "Error",
            description: "Failed to save the new cover.",
            variant: "destructive"
          });
        }
      }
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
      description="Preview and customize your love story cover" 
      previousStep="/create/love/love-story/ideas" 
      currentStep={5} 
      totalSteps={7} 
      onNextClick={handleContinue}
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Cover Preview</h3>
          <p className="text-gray-500 mb-6">
            This is a preview of your book cover based on your story information.
          </p>
          
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
            <h3 className="text-2xl font-bold text-center mb-8">Choose Your Style</h3>
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
      </div>
    </WizardStep>
  );
};

export default LoveStoryCoverStep; 