
import WizardStep from '@/components/wizard/WizardStep';

const LoveGenerateStep = () => {
  return (
    <WizardStep
      title="Create Your Love Story"
      description="Review your love story and generate your book."
      previousStep="/create/love/moments"
      currentStep={4}
      totalSteps={4}
    >
      <div className="space-y-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Story Summary</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Style: Romantic Letters</li>
            <li>Message: Added</li>
            <li>Special Moments: 2</li>
          </ul>
        </div>
        <button className="w-full px-6 py-3 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
          Generate Book
        </button>
      </div>
    </WizardStep>
  );
};

export default LoveGenerateStep;
