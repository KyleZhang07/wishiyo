
import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WizardStepProps {
  title: string;
  description: string;
  children: ReactNode;
  previousStep?: string;
  nextStep?: string;
  currentStep: number;
  totalSteps: number;
  onNextClick?: () => void | Promise<void>;
  nextDisabled?: boolean;
}

const WizardStep = ({
  title,
  description,
  children,
  previousStep,
  nextStep,
  currentStep,
  totalSteps,
  onNextClick,
  nextDisabled
}: WizardStepProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-[#FFFAF5]">
      <div className="container mx-auto px-4 pt-8 pb-16 max-w-3xl">
        <div className="text-center mb-8">
          <p className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</p>
        </div>
        
        <div className="relative mb-8">
          {previousStep && (
            <button 
              onClick={() => navigate(previousStep)} 
              className="absolute left-0 top-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-3xl font-display font-bold text-center px-12">
            {title}
          </h1>
        </div>
        
        {description && (
          <p className="text-gray-600 text-center mb-14">{description}</p>
        )}

        <div className="space-y-8">
          {children}

          <div className="flex justify-center pt-8 w-full">
            {(nextStep || onNextClick) && (
              <Button 
                variant="default"
                size="lg"
                className={`w-[95%] bg-[#F97316] hover:bg-[#EA580C] text-white ${nextDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={onNextClick ? onNextClick : () => nextStep && navigate(nextStep)}
                disabled={nextDisabled}
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WizardStep;
