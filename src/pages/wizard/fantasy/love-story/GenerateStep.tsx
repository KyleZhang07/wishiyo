
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const LoveStoryGenerateStep = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  return (
    <WizardStep
      title="Generate Your Love Story"
      description="Ready to bring your love story to life?"
      previousStep="/create/fantasy/love-story/moments"
      currentStep={5}
      totalSteps={5}
      showNextButton={false}
    >
      <div className="space-y-6">
        <Button 
          className="w-full" 
          size="lg"
          disabled={isGenerating}
          onClick={() => setIsGenerating(true)}
        >
          {isGenerating ? "Creating your story..." : "Generate My Love Story"}
        </Button>
      </div>
    </WizardStep>
  );
};

export default LoveStoryGenerateStep;
