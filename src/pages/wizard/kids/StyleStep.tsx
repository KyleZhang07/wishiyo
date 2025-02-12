import WizardStep from '@/components/wizard/WizardStep';

const KidsStyleStep = () => {
  return (
    <WizardStep
      title="Choose Your Kids Book Style"
      description="Select a style that best captures your child's personality and adventures."
      previousStep="/"
      nextStep="/create/kids/stories"
      currentStep={1}
      totalSteps={4}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
          <h3 className="font-medium">Adventure Book</h3>
          <p className="text-sm text-gray-600">Document your child's exciting escapades and discoveries</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
          <h3 className="font-medium">Growth Journal</h3>
          <p className="text-sm text-gray-600">Record milestones, funny moments, and personal growth</p>
        </div>
      </div>
    </WizardStep>
  );
};

export default KidsStyleStep;

