
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const styles = [
  {
    id: 'romantic',
    title: 'Romantic',
    description: 'Classical love poems with heartfelt expressions'
  },
  {
    id: 'modern',
    title: 'Modern',
    description: 'Contemporary style with fresh metaphors'
  },
  {
    id: 'playful',
    title: 'Playful',
    description: 'Fun and lighthearted love poems'
  }
];

const LovePoemsStyleStep = () => {
  const [selectedStyle, setSelectedStyle] = useState('');
  const navigate = useNavigate();

  return (
    <WizardStep
      title="Choose Your Poetry Style"
      description="Select the style that best expresses your love"
      previousStep="/create/love/love-poems/feelings"
      nextStep="/create/love/love-poems/generate"
      currentStep={3}
      totalSteps={4}
    >
      <div className="space-y-4">
        {styles.map((style) => (
          <button
            key={style.id}
            className={`w-full p-4 text-left rounded-lg border transition-all ${
              selectedStyle === style.id 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 hover:border-primary/50'
            }`}
            onClick={() => setSelectedStyle(style.id)}
          >
            <h3 className="font-medium text-lg mb-1">{style.title}</h3>
            <p className="text-gray-600">{style.description}</p>
          </button>
        ))}
      </div>
    </WizardStep>
  );
};

export default LovePoemsStyleStep;
