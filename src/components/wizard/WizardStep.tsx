
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface WizardStepProps {
  title: string;
  description: string;
  previousStep: string;
  nextStep?: string;  // Making nextStep optional since some steps might not have a next step
  currentStep: number;
  totalSteps: number;
  onNextClick?: () => void;
  children: React.ReactNode;
  showNextButton?: boolean;
}

const WizardStep: React.FC<WizardStepProps> = ({
  title,
  description,
  previousStep,
  nextStep,
  currentStep,
  totalSteps,
  onNextClick,
  children,
  showNextButton = true,
}) => {
  const navigate = useNavigate();

  const handleNext = () => {
    if (onNextClick) {
      onNextClick();
    } else if (nextStep) {
      navigate(nextStep);
    }
  };

  return (
    <div className="page-transition container mx-auto px-4 py-24">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-4">{title}</h1>
          <p className="text-gray-600">{description}</p>
        </div>

        {children}

        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => navigate(previousStep)}
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>
            {showNextButton ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : null}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Step {currentStep} of {totalSteps}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WizardStep;
