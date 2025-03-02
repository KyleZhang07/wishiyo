import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Edit, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import WizardStep from '@/components/wizard/WizardStep';
import LoveStoryCoverPreview from '@/components/cover-generator/LoveStoryCoverPreview';

const LoveStoryCoverStep = () => {
  const [coverTitle, setCoverTitle] = useState<string>('Your Love Story');
  const [subtitle, setSubtitle] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('Anonymous');
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [isGeneratingCover, setIsGeneratingCover] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // 从localStorage获取标题和作者信息
    const savedIdeas = localStorage.getItem('loveStoryGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('loveStorySelectedIdea');
    const savedAuthorName = localStorage.getItem('loveStoryAuthorName');
    
    // 获取已保存的封面图片
    const savedCoverImage = localStorage.getItem('loveStoryCoverImage');
    
    if (savedAuthorName) {
      setAuthorName(savedAuthorName);
    }
    
    if (savedCoverImage) {
      setCoverImage(savedCoverImage);
    }
    
    if (savedIdeas && savedIdeaIndex) {
      try {
        const ideas = JSON.parse(savedIdeas);
        const selectedIdea = ideas[parseInt(savedIdeaIndex)];
        if (selectedIdea) {
          setCoverTitle(selectedIdea.title || 'Your Love Story');
          setSubtitle(selectedIdea.description || '');
        }
      } catch (error) {
        console.error('Error parsing saved ideas:', error);
      }
    }
  }, []);

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
      
      // 在真实实现中，这里会调用API生成新封面
      // 暂时使用一个简单的随机颜色作为新封面背景
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // 绘制随机颜色渐变背景
        const r1 = Math.floor(Math.random() * 255);
        const g1 = Math.floor(Math.random() * 255);
        const b1 = Math.floor(Math.random() * 255);
        const r2 = Math.floor(Math.random() * 255);
        const g2 = Math.floor(Math.random() * 255);
        const b2 = Math.floor(Math.random() * 255);
        
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
        gradient.addColorStop(1, `rgb(${r2}, ${g2}, ${b2})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 将新生成的canvas转为dataURL
        const newCoverImage = canvas.toDataURL('image/png');
        setCoverImage(newCoverImage);
        localStorage.setItem('loveStoryCoverImage', newCoverImage);
      }
      
      toast({
        title: "Cover regenerated",
        description: "New cover has been created successfully"
      });
    } catch (error) {
      console.error('Error regenerating cover:', error);
      toast({
        variant: "destructive",
        title: "Regeneration failed",
        description: "Failed to create a new cover. Please try again."
      });
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleContinue = () => {
    // 保存当前的封面图像
    if (coverImage) {
      localStorage.setItem('loveStoryCoverImage', coverImage);
    }
    
    // 导航到下一步
    navigate('/create/love/love-story/debug-prompts');
  };

  // 获取收件人名称
  const recipientName = localStorage.getItem('loveStoryPersonName') || 'My Love';

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
              selectedFont="playfair"
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
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryCoverStep; 