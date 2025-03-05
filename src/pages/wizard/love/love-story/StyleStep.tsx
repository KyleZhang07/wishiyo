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
      currentStep={4} 
      totalSteps={7} 
      onNextClick={handleContinue}
    >
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Select a Text Tone</h3>
          <p className="text-gray-500 mb-6">
            This determines the writing style of your love story.
          </p>
          
          <div className="space-y-4">
            {TONE_OPTIONS.map((tone) => (
              <div 
                key={tone}
                onClick={() => handleToneSelect(tone)}
                className={`
                  flex items-center p-4 rounded-md cursor-pointer transition-all
                  ${selectedTone === tone 
                    ? 'bg-[#FF7F50]/10 border border-[#FF7F50]' 
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}
                `}
              >
                <div className="flex-shrink-0 mr-3">
                  {selectedTone === tone ? (
                    <div className="w-5 h-5 rounded-full bg-[#FF7F50] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{tone}</h4>
                  <p className="text-sm text-gray-500">
                    {tone === 'Playful' && 'Light-hearted and fun expression'}
                    {tone === 'Heartfelt' && 'Sincere and deeply emotional'}
                    {tone === 'Inspirational' && 'Uplifting and motivational'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-medium mb-2">Tone Examples</h3>
            <p className="text-gray-500 mb-4">
              Here's how each tone might influence your story
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-video bg-gray-100 rounded-sm flex items-center justify-center">
                <p className="text-gray-400 text-sm">Heartfelt example</p>
              </div>
              <div className="aspect-video bg-gray-100 rounded-sm flex items-center justify-center">
                <p className="text-gray-400 text-sm">Playful example</p>
              </div>
              <div className="aspect-video bg-gray-100 rounded-sm flex items-center justify-center">
                <p className="text-gray-400 text-sm">Inspirational example</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryStyleStep; 