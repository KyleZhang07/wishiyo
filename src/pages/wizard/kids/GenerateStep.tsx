
import WizardStep from '@/components/wizard/WizardStep';

const KidsGenerateStep = () => {
  return (
    <WizardStep
      title="Create Your Children's Book"
      description="Review your story and create the book."
      previousStep="/create/kids/story"
      currentStep={4}
      totalSteps={4}
    >
      <div className="space-y-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Story Summary</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Character Created</li>
            <li>Setting Chosen</li>
            <li>Story Elements Added</li>
          </ul>
        </div>
        <button className="w-full px-6 py-3 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors">
          Generate Book
        </button>
      </div>
    </WizardStep>
  );
};

export default KidsGenerateStep;
