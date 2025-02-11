
import WizardStep from '@/components/wizard/WizardStep';

const LoveStyleStep = () => {
  return (
    <WizardStep
      title="Choose Your Love Story Style"
      description="Select how you want to express your love."
      previousStep="/"
      nextStep="/create/love/message"
      currentStep={1}
      totalSteps={4}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
          <h3 className="font-medium">Romantic Letters</h3>
          <p className="text-sm text-gray-600">Express your feelings through heartfelt letters</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
          <h3 className="font-medium">Our Journey</h3>
          <p className="text-sm text-gray-600">Tell the story of your relationship</p>
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStyleStep;
