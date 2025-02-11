
import WizardStep from '@/components/wizard/WizardStep';

const LoveMomentsStep = () => {
  return (
    <WizardStep
      title="Share Special Moments"
      description="Tell us about the moments that define your love story."
      previousStep="/create/love/message"
      nextStep="/create/love/generate"
      currentStep={3}
      totalSteps={4}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            First Meeting
          </label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            rows={3}
            placeholder="How did you first meet?"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Most Memorable Date
          </label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            rows={3}
            placeholder="Tell us about your most special date..."
          />
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveMomentsStep;
