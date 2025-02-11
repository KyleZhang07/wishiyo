
import WizardStep from '@/components/wizard/WizardStep';

const LoveMessageStep = () => {
  return (
    <WizardStep
      title="Write Your Love Message"
      description="Express your feelings in words."
      previousStep="/create/love/style"
      nextStep="/create/love/moments"
      currentStep={2}
      totalSteps={4}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Your Message
          </label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            rows={6}
            placeholder="Write your heartfelt message here..."
          />
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveMessageStep;
