
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const FunnyBookGenerateStep = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = () => {
    setIsGenerating(true);
    // Add generation logic here
  };

  return (
    <WizardStep
      title="Generate Your Book"
      description="We're ready to create your funny book!"
      previousStep="/create/fun/funny-book/photos"
      currentStep={5}
      totalSteps={5}
    >
      <div className="space-y-6">
        <Button 
          className="w-full" 
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Book'}
        </Button>
      </div>
    </WizardStep>
  );
};

export default FunnyBookGenerateStep;
