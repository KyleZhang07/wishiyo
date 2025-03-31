
import React from 'react';

interface StepProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepProgressIndicator = ({ currentStep, totalSteps }: StepProgressIndicatorProps) => {
  // Generate an array of step numbers from 1 to totalSteps
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="w-full">
      <div className="flex items-center justify-center">
        <div className="relative flex items-center w-full max-w-3xl">
          {/* Progress Bar Background */}
          <div className="absolute h-1 w-full bg-gray-200 rounded-full"></div>
          
          {/* Active Progress Bar */}
          <div 
            className="absolute h-1 bg-[#FF7F50] rounded-full transition-all duration-300 ease-in-out"
            style={{ 
              width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
              maxWidth: currentStep === totalSteps ? '100%' : `${((currentStep - 1) / (totalSteps - 1)) * 100}%`
            }}
          ></div>
          
          {/* Step Indicators */}
          {steps.map((step) => (
            <div 
              key={step} 
              className={`relative flex flex-col items-center flex-1 ${
                step === 1 ? 'items-start' : step === totalSteps ? 'items-end' : ''
              }`}
            >
              <div 
                className={`
                  z-10 flex items-center justify-center w-8 h-8 rounded-full 
                  transition-colors duration-300
                  ${step < currentStep 
                    ? 'bg-[#FF7F50] text-white' 
                    : step === currentStep 
                      ? 'bg-white border-2 border-[#FF7F50] text-[#FF7F50]' 
                      : 'bg-white border border-gray-300 text-gray-400'}
                `}
              >
                {step < currentStep ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path 
                      d="M20 6L9 17L4 12" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{step}</span>
                )}
              </div>
              
              {/* Step Label - Hidden on mobile for cleaner interface */}
              <span className="absolute mt-10 text-xs text-center hidden md:block">
                Step {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepProgressIndicator;
