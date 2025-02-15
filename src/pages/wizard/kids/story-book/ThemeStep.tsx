
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const themes = [
  {
    id: 'fantasy',
    title: 'Magical Fantasy',
    description: 'A world of magic, dragons, and adventure'
  },
  {
    id: 'animals',
    title: 'Animal Friends',
    description: 'Fun stories with lovable animal characters'
  },
  {
    id: 'space',
    title: 'Space Adventure',
    description: 'Exciting journeys through the stars'
  }
];

const StoryBookThemeStep = () => {
  const [selectedTheme, setSelectedTheme] = useState('');
  const navigate = useNavigate();

  return (
    <WizardStep
      title="Choose Your Story Theme"
      description="Select a magical world for your story"
      previousStep="/create/kids/story-book/author"
      nextStep="/create/kids/story-book/characters"
      currentStep={2}
      totalSteps={4}
    >
      <div className="space-y-4">
        {themes.map((theme) => (
          <button
            key={theme.id}
            className={`w-full p-4 text-left rounded-lg border transition-all ${
              selectedTheme === theme.id 
                ? 'border-primary bg-primary/5' 
                : 'border-gray-200 hover:border-primary/50'
            }`}
            onClick={() => setSelectedTheme(theme.id)}
          >
            <h3 className="font-medium text-lg mb-1">{theme.title}</h3>
            <p className="text-gray-600">{theme.description}</p>
          </button>
        ))}
      </div>
    </WizardStep>
  );
};

export default StoryBookThemeStep;
