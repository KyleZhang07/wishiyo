
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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
  const progress = (currentStep / totalSteps) * 100;

  return <div className="page-transition container mx-auto px-4 py-24">
      <div className="max-w-2xl mx-auto">
        <div className="glass-card rounded-2xl p-8 py-[40px]">
          <div className="absolute left-1/2 transform -translate-x-1/2 -top-4 w-48">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-gray-500 mt-1">
              {currentStep} / {totalSteps}
            </p>
          </div>

          {previousStep && <button onClick={() => navigate(previousStep)} className="mb-6 p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>}
          
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold mb-4 py-0">
              {title}
            </h1>
          </div>

          <div className="space-y-6">
            {children}

            <div className="flex justify-center pt-6 w-full">
              {(nextStep || onNextClick) && <button onClick={onNextClick ? onNextClick : () => nextStep && navigate(nextStep)} className="w-full px-6 py-3 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
                  Continue
                </button>}
            </div>
          </div>
        </div>
      </div>
    </div>;
};

export default WizardStep;
