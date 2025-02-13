
import WizardStep from '@/components/wizard/WizardStep';

const KidsStyleStep = () => {
  return (
    <WizardStep
      title="Choose Your Kids Story Style"
      description="Select a style that best suits your story."
      previousStep="/kids"
      nextStep="/create/kids/question"
      currentStep={1}
      totalSteps={4}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
          <h3 className="font-medium">Adventure Tale</h3>
          <p className="text-sm text-gray-600">An exciting journey filled with discovery</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
          <h3 className="font-medium">Educational Story</h3>
          <p className="text-sm text-gray-600">Learning through fun and engaging narratives</p>
        </div>
      </div>
    </WizardStep>
  );
};

export default KidsStyleStep;
