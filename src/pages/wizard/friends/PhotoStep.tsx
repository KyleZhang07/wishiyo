
import WizardStep from '@/components/wizard/WizardStep';

const FriendsPhotoStep = () => {
  return (
    <WizardStep
      title="Add Photos of Your Friendship"
      description="Upload photos that capture your special moments together."
      previousStep="/create/friends/memories"
      nextStep="/create/friends/generate"
      currentStep={3}
      totalSteps={4}
    >
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
          <div className="space-y-2">
            <p className="text-gray-600">
              Drag and drop your photos here, or click to select files
            </p>
            <button className="px-4 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors">
              Select Photos
            </button>
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default FriendsPhotoStep;
