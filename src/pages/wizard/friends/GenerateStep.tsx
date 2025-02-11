
import WizardStep from '@/components/wizard/WizardStep';

const FriendsGenerateStep = () => {
  return (
    <WizardStep
      title="Generate Your Friendship Book"
      description="Review your selections and create your personalized book."
      previousStep="/create/friends/photos"
      currentStep={4}
      totalSteps={4}
    >
      <div className="space-y-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Book Summary</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Style: Memory Album</li>
            <li>Memories Added: 2</li>
            <li>Photos Selected: 0</li>
          </ul>
        </div>
        <button className="w-full px-6 py-3 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
          Generate Book
        </button>
      </div>
    </WizardStep>
  );
};

export default FriendsGenerateStep;
