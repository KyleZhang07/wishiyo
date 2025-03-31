
import { cn } from "@/lib/utils";

interface StepProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepProgressIndicator = ({ currentStep, totalSteps }: StepProgressIndicatorProps) => {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="w-full max-w-[250px] mx-auto">
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-[#FF7F50] rounded-full" 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
};

export default StepProgressIndicator;
