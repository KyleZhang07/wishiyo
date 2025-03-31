
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import WizardStep from '@/components/wizard/WizardStep';

// Text tone options for love story
const TONE_OPTIONS = [
  'Heartfelt',
  'Playful',
  'Inspirational'
];

const LoveStoryStyleStep = () => {
  const [selectedTone, setSelectedTone] = useState<string>('Heartfelt');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // 从localStorage加载已保存的tone
    const savedTone = localStorage.getItem('loveStoryTone');
    if (savedTone) {
      setSelectedTone(savedTone);
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
      title="Text Tone Selection" 
      description="Choose a writing tone for your love story" 
      previousStep="/create/love/love-story/moments" 
      nextStep="/create/love/love-story/ideas"
      currentStep={4} 
      totalSteps={8} 
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
              <div className={`
                px-5 py-4 flex justify-between items-center
                ${selectedTone === tone ? 'bg-[#FF7F50]/10' : 'bg-gray-50'}
              `}>
                <h4 className="font-medium text-lg">{tone}</h4>
                {selectedTone === tone && (
                  <div className="w-6 h-6 rounded-full bg-[#FF7F50] flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              
              <div className="p-5 bg-white">
                <p className="text-sm text-gray-700 italic mb-2">
                  {tone === 'Playful' && '"Every moment with you feels like a delightful adventure..."'}
                  {tone === 'Heartfelt' && '"Your love has touched the deepest corners of my soul..."'}
                  {tone === 'Inspirational' && '"Together we\'ve risen above challenges to build something beautiful..."'}
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
