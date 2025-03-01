import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface ToneOption {
  value: string;
  label: string;
  description: string;
  emoji: string;
}

const LoveStoryTextToneStep = () => {
  const [selectedTone, setSelectedTone] = useState<string>('Heartfelt');
  
  useEffect(() => {
    const savedTone = localStorage.getItem('loveStoryTone');
    if (savedTone) {
      setSelectedTone(savedTone);
    }
  }, []);

  const handleToneChange = (value: string) => {
    setSelectedTone(value);
    localStorage.setItem('loveStoryTone', value);
  };

  const toneOptions: ToneOption[] = [
    {
      value: 'Humorous',
      label: 'Humorous',
      description: 'Witty and fun expressions with a touch of humor',
      emoji: '😄'
    },
    {
      value: 'Poetic',
      label: 'Poetic',
      description: 'Elegant, metaphorical language that flows like poetry',
      emoji: '🌹'
    },
    {
      value: 'Dramatic',
      label: 'Dramatic',
      description: 'Intense and emotionally impactful expressions',
      emoji: '🎭'
    },
    {
      value: 'Heartfelt',
      label: 'Heartfelt',
      description: 'Sincere and emotionally authentic expressions of love',
      emoji: '❤️'
    },
    {
      value: 'Encouraging',
      label: 'Encouraging',
      description: 'Uplifting and supportive expressions of affection',
      emoji: '✨'
    }
  ];

  return (
    <WizardStep
      title="Select a Text Tone"
      description="Choose the emotional style for your story"
      previousStep="/create/love/love-story/questions"
      nextStep="/create/love/love-story/moments"
      currentStep={3}
      totalSteps={6}
    >
      <div className="space-y-6">
        <p className="text-gray-600">
          The tone will influence how your love story feels. Choose one that best captures your relationship.
        </p>
        
        <RadioGroup
          value={selectedTone}
          onValueChange={handleToneChange}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {toneOptions.map((tone) => (
            <div key={tone.value} className="relative">
              <RadioGroupItem
                value={tone.value}
                id={`tone-${tone.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`tone-${tone.value}`}
                className="flex flex-col p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors 
                peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tone.emoji}</span>
                  <span className="font-medium text-lg">{tone.label}</span>
                </div>
                <p className="mt-2 text-gray-600">{tone.description}</p>
              </Label>
            </div>
          ))}
        </RadioGroup>

        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-blue-800">
            <span className="font-medium">Note:</span> You can always change the tone later in your story settings.
          </p>
        </Card>
      </div>
    </WizardStep>
  );
};

export default LoveStoryTextToneStep; 