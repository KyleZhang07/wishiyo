import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StepProgressIndicator from './StepProgressIndicator';

interface WizardStepProps {
  title: string;
  description: React.ReactNode;
  children: ReactNode;
  previousStep?: string;
  nextStep?: string;
  currentStep: number;
  totalSteps: number;
  onNextClick?: () => void | Promise<void>;
  nextDisabled?: boolean;
  contentMaxWidth?: string;
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
  nextDisabled,
  contentMaxWidth = 'max-w-3xl'
}: WizardStepProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 判断当前是否在love category
  const isLoveCategory = location.pathname.includes('/love/');
  
  return (
    <div className="min-h-screen bg-[#FFFAF5]">
      <div className={`container mx-auto px-4 pt-8 pb-16 ${contentMaxWidth}`}>
        <div className="mb-8">
          <StepProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
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
                className={`w-[95%] bg-[#FF7F50] hover:bg-[#FF7F50]/80 text-white ${nextDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
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
