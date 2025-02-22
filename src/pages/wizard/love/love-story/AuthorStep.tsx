
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const LoveStoryAuthorStep = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/create/love/love-story/questions');
  };

  return (
    <WizardStep
      title="Begin Your Love Story"
      description="Let's create something magical together"
      previousStep="/love"
      currentStep={1}
      totalSteps={4}
      onNextClick={handleContinue}
    >
      <div className="space-y-4 text-center">
        <p className="text-gray-600">
          Welcome to your love story journey. Click continue to start creating your personalized story.
        </p>
      </div>
    </WizardStep>
  );
};

export default LoveStoryAuthorStep;
