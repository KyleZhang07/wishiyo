import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import WizardStep from '@/components/wizard/WizardStep';

// Image style options for love story
const STYLE_OPTIONS = [
  'Comic Book',
  'Line Art',
  'Fantasy Art',
  'Photographic',
  'Cinematic'
];

const LoveStoryStyleStep = () => {
  const [selectedStyle, setSelectedStyle] = useState<string>('Photographic');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // 从localStorage加载已保存的样式
    const savedStyle = localStorage.getItem('loveStoryStyle');
    if (savedStyle) {
      setSelectedStyle(savedStyle);
    }
  }, []);

  const handleStyleSelect = (style: string) => {
    setSelectedStyle(style);
  };

  const handleContinue = () => {
    if (!selectedStyle) {
      toast({
        variant: "destructive",
        title: "Style required",
        description: "Please select an image style to continue"
      });
      return;
    }

    // 保存样式到localStorage
    localStorage.setItem('loveStoryStyle', selectedStyle);
    
    // 导航到下一步
    navigate('/create/love/love-story/ideas');
  };

  return (
    <WizardStep 
      title="Image Style Selection" 
      description="Choose a visual style for your love story images" 
      previousStep="/create/love/love-story/moments" 
      currentStep={4} 
      totalSteps={6} 
      onNextClick={handleContinue}
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Select an Image Style</h3>
          <p className="text-gray-500 mb-6">
            This determines the visual aesthetic of all the generated images in your love story.
          </p>
          
          <div className="space-y-4">
            {STYLE_OPTIONS.map((style) => (
              <div 
                key={style}
                onClick={() => handleStyleSelect(style)}
                className={`
                  flex items-center p-4 rounded-md cursor-pointer transition-all
                  ${selectedStyle === style 
                    ? 'bg-primary/10 border border-primary' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}
                `}
              >
                <div className="flex-shrink-0 mr-3">
                  {selectedStyle === style ? (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{style}</h4>
                  <p className="text-sm text-gray-500">
                    {style === 'Comic Book' && 'Bold outlines and vibrant colors'}
                    {style === 'Line Art' && 'Elegant, minimalist black and white illustration'}
                    {style === 'Fantasy Art' && 'Dreamlike and magical aesthetic'}
                    {style === 'Photographic' && 'Realistic, photography-like images'}
                    {style === 'Cinematic' && 'Film-like with dramatic lighting and composition'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-medium mb-2">Style Examples</h3>
            <p className="text-gray-500 mb-4">
              Here's how each style might look in your final images
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-video bg-gray-100 rounded-sm flex items-center justify-center">
                <p className="text-gray-400 text-sm">Comic Book example</p>
              </div>
              <div className="aspect-video bg-gray-100 rounded-sm flex items-center justify-center">
                <p className="text-gray-400 text-sm">Line Art example</p>
              </div>
              <div className="aspect-video bg-gray-100 rounded-sm flex items-center justify-center">
                <p className="text-gray-400 text-sm">Fantasy Art example</p>
              </div>
              <div className="aspect-video bg-gray-100 rounded-sm flex items-center justify-center">
                <p className="text-gray-400 text-sm">Photographic example</p>
              </div>
              <div className="aspect-video bg-gray-100 rounded-sm flex items-center justify-center">
                <p className="text-gray-400 text-sm">Cinematic example</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryStyleStep; 