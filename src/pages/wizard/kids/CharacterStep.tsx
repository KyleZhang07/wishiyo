
import WizardStep from '@/components/wizard/WizardStep';

const KidsCharacterStep = () => {
  return (
    <WizardStep
      title="Create Your Child's Character"
      description="Let's create the main character of the story."
      previousStep="/"
      nextStep="/create/kids/setting"
      currentStep={1}
      totalSteps={4}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Character Name
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Enter character name"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Special Power or Talent
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="What makes them special?"
          />
        </div>
      </div>
    </WizardStep>
  );
};

export default KidsCharacterStep;
