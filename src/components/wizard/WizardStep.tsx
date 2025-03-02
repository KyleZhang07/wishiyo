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
}

const WizardStep = ({
  title,
  description,
  children,
  previousStep,
  nextStep,
  currentStep,
  totalSteps,
  onNextClick
}: WizardStepProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 根据路径判断是love还是friends类别
  const isLoveCategory = location.pathname.includes('/love/');
  const buttonColor = isLoveCategory 
    ? "bg-[#D88373] hover:bg-[#C57164]" 
    : "bg-[#F6C744] hover:bg-[#E5B73E]";
  
  return (
    <div className="min-h-screen bg-[#FFFAF5]">
      <div className="container mx-auto px-4 pt-8 pb-16 max-w-4xl">
        <div className="text-center mb-8">
          <p className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</p>
        </div>
        
        <div className="relative mb-12">
          {previousStep && (
            <button 
              onClick={() => navigate(previousStep)} 
              className="absolute left-0 top-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-4xl font-display font-bold text-center px-16">
            {title}
          </h1>
        </div>
        
        {description && (
          <p className="text-gray-600 text-center mb-10">{description}</p>
        )}

        <div className="space-y-8">
          {children}

          <div className="flex justify-center pt-8 w-full">
            {(nextStep || onNextClick) && (
              <Button 
                variant="default"
                size="lg"
                className={`w-full ${buttonColor} text-white`}
                onClick={onNextClick ? onNextClick : () => nextStep && navigate(nextStep)}
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
