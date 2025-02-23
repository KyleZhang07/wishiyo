
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const FunnyBiographyGenerateStep = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  return (
    <WizardStep
      title="Generate Your Funny Biography"
      description="Ready to create your hilarious life story?"
      previousStep="/create/fun/funny-biography/photos"
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
          {isGenerating ? "Generating..." : "Generate My Funny Biography"}
        </Button>
      </div>
    </WizardStep>
  );
};

export default FunnyBiographyGenerateStep;
