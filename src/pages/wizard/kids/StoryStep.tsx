
import WizardStep from '@/components/wizard/WizardStep';

const KidsStoryStep = () => {
  return (
    <WizardStep
      title="Create the Story"
      description="Tell us what happens in your character's adventure."
      previousStep="/create/kids/idea"
      nextStep="/create/kids/generate"
      currentStep={3}
      totalSteps={4}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Story Challenge
          </label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            rows={3}
            placeholder="What problem does your character need to solve?"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Special Helper
          </label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            rows={3}
            placeholder="Who helps your character along the way?"
          />
        </div>
      </div>
    </WizardStep>
  );
};

export default KidsStoryStep;
