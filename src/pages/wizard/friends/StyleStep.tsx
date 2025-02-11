
import WizardStep from '@/components/wizard/WizardStep';

const FriendsStyleStep = () => {
  return (
    <WizardStep
      title="Choose Your Friendship Book Style"
      description="Select a style that best represents your friendship."
      previousStep="/"
      nextStep="/create/friends/memories"
      currentStep={1}
      totalSteps={4}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
          <h3 className="font-medium">Memory Album</h3>
          <p className="text-sm text-gray-600">A collection of your best moments together</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary transition-colors">
          <h3 className="font-medium">Adventure Journal</h3>
          <p className="text-sm text-gray-600">Chronicle your shared adventures and experiences</p>
        </div>
      </div>
    </WizardStep>
  );
};

export default FriendsStyleStep;
