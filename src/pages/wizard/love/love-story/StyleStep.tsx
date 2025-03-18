
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import WizardStep from '@/components/wizard/WizardStep';

// Text tone options for love story
const TONE_OPTIONS = [
  {
    id: 'Heartfelt',
    title: 'Heartfelt',
    description: 'Sincere and deeply emotional',
    example: '"Your love has touched the deepest corners of my soul..."'
  },
  {
    id: 'Playful',
    title: 'Playful',
    description: 'Light-hearted and fun expression',
    example: '"Every moment with you feels like a delightful adventure..."'
  },
  {
    id: 'Inspirational',
    title: 'Inspirational',
    description: 'Uplifting and motivational',
    example: '"Together we\'ve risen above challenges to build something beautiful..."'
  }
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
      title="Blessing Style Selection" 
      description="Choose a writing tone for your love story dedication" 
      previousStep="/create/love/love-story/moments" 
      currentStep={4} 
      totalSteps={7} 
      onNextClick={handleContinue}
    >
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <p className="text-gray-600">
            The style you select will determine how the dedication message in your book is written. This dedication appears at the beginning of your love story.
          </p>
        </div>
        
        <div className="space-y-5 mt-6">
          {TONE_OPTIONS.map((tone) => (
            <div 
              key={tone.id}
              onClick={() => handleToneSelect(tone.id)}
              className={`
                overflow-hidden rounded-lg cursor-pointer transition-all duration-300
                ${selectedTone === tone.id 
                  ? 'ring-2 ring-[#FF7F50] shadow-lg' 
                  : 'border border-gray-200 hover:shadow-md'}
              `}
            >
              <div className={`
                px-5 py-4 flex justify-between items-center
                ${selectedTone === tone.id ? 'bg-[#FF7F50]/10' : 'bg-gray-50'}
              `}>
                <h4 className="font-medium text-lg">{tone.title}</h4>
                {selectedTone === tone.id && (
                  <div className="w-6 h-6 rounded-full bg-[#FF7F50] flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              
              <div className="p-5 bg-white">
                <p className="text-sm text-gray-700 italic mb-2">{tone.example}</p>
                <p className="text-xs text-gray-500">{tone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryStyleStep; 
