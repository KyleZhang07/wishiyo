
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const styles = [
  {
    id: 'interactive',
    title: 'Interactive Learning',
    description: 'With puzzles and activities'
  },
  {
    id: 'story',
    title: 'Story-based Learning',
    description: 'Learn through engaging stories'
  },
  {
    id: 'visual',
    title: 'Visual Learning',
    description: 'With lots of pictures and diagrams'
  }
];

const LearningJourneyStyleStep = () => {
  const [selectedStyle, setSelectedStyle] = useState('');
  const navigate = useNavigate();

  return (
    <WizardStep
      title="Choose Learning Style"
      description="Select how your child will learn"
      previousStep="/create/kids/learning/subject"
      nextStep="/create/kids/learning/generate"
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

export default LearningJourneyStyleStep;
