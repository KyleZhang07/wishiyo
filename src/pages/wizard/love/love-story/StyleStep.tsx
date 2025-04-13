import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import WizardStep from '@/components/wizard/WizardStep';
import FourPointStar from '@/components/icons/FourPointStar';

// Text tone options for love story
const TONE_OPTIONS = [
  'Heartfelt',
  'Playful',
  'Inspirational'
];

const LoveStoryStyleStep = () => {
  // 从 localStorage 读取语调或使用默认值，避免闪烁
  const [selectedTone, setSelectedTone] = useState<string>(() => {
    const savedTone = localStorage.getItem('loveStoryTone');
    return savedTone || 'Heartfelt';
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // 不需要在这里设置 selectedTone，因为我们已经在初始化时设置了
    // 只需要确保如果没有保存的语调，将默认值保存到 localStorage
    const savedTone = localStorage.getItem('loveStoryTone');
    if (!savedTone) {
      console.log('No saved tone found, saving default Heartfelt to localStorage');
      localStorage.setItem('loveStoryTone', 'Heartfelt');
    }
  }, []);

  const handleToneSelect = (tone: string) => {
    setSelectedTone(tone);
  };

  const handleContinue = () => {
    if (!selectedTone) {
      toast({
        variant: "destructive",
        title: "Tone required",
        description: "Please select a text tone to continue"
      });
      return;
    }

    // 保存tone到localStorage
    localStorage.setItem('loveStoryTone', selectedTone);

    // 导航到下一步
    navigate('/create/love/love-story/ideas');
  };

  return (
    <WizardStep
      title="Tone Selection"
      description="Choose a writing tone for your book"
      previousStep="/create/love/love-story/moments"
      currentStep={4}
      totalSteps={7}
      onNextClick={handleContinue}
    >
      <div className="max-w-2xl mx-auto">
        <div className="space-y-5 mt-6">
          {TONE_OPTIONS.map((tone) => (
            <div
              key={tone}
              onClick={() => handleToneSelect(tone)}
              className={`
                overflow-hidden rounded-lg cursor-pointer transition-all duration-300
                ${selectedTone === tone
                  ? 'ring-2 ring-[#FF7F50] shadow-lg'
                  : 'border border-gray-200 hover:shadow-md'}
              `}
            >
              <div className={`p-5 ${selectedTone === tone ? 'bg-[#FF7F50]/10' : ''}`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <div className="mr-3 text-[#FF7F50]">
                      {tone === 'Heartfelt' && <Heart className="w-6 h-6" fill="currentColor" />}
                      {tone === 'Playful' && <div className="w-6 h-6">🎈</div>}
                      {tone === 'Inspirational' && <FourPointStar className="w-6 h-6" fill="#F7DC6F" />}
                    </div>
                    <h4 className="font-medium text-lg md:text-[1.15rem]">{tone}</h4>
                  </div>
                  {selectedTone === tone && (
                    <div className="w-6 h-6 rounded-full bg-[#FF7F50] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-sm md:text-base text-gray-700 italic mb-2">
                  {tone === 'Playful' && '"Your daily adventures are like a fun roller coaster ride..."'}
                  {tone === 'Heartfelt' && '"You are so special and loved more than words can say..."'}
                  {tone === 'Inspirational' && '"Each challenge overcome reveals new strength and beauty..."'}
                </p>
                <p className="text-xs text-gray-500">
                  {tone === 'Playful' && 'Light-hearted and fun expression'}
                  {tone === 'Heartfelt' && 'Sincere and deeply emotional'}
                  {tone === 'Inspirational' && 'Uplifting and motivational'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryStyleStep;