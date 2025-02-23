
import WizardStep from '@/components/wizard/WizardStep';

const FriendsMemoriesStep = () => {
  return (
    <WizardStep
      title="What's the Story"
      description="Tell us about the special moments you've shared together."
      previousStep="/create/friends/style"
      nextStep="/create/friends/photos"
      currentStep={2}
      totalSteps={4}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            How did you meet?
          </label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            rows={3}
            placeholder="Share the story of how your friendship began..."
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Favorite Memory Together
          </label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            rows={3}
            placeholder="What's your most cherished memory with your friend?"
          />
        </div>
      </div>
    </WizardStep>
  );
};

export default FriendsMemoriesStep;
