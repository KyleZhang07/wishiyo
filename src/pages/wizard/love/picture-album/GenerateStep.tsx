
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';

const PictureAlbumGenerateStep = () => {
  return (
    <WizardStep
      title="Create Your Picture Album"
      description="Let's bring your memories to life"
      previousStep="/create/love/picture-album/photos"
      currentStep={3}
      totalSteps={3}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-medium text-lg mb-4">Your Album Includes:</h3>
          <ul className="space-y-2 text-gray-600">
            <li>✓ Beautiful Layout</li>
            <li>✓ Photo Captions</li>
            <li>✓ Date Labels</li>
            <li>✓ Memory Timeline</li>
          </ul>
        </div>
        <Button 
          className="w-full py-6 text-lg"
          onClick={() => {/* Generate album logic */}}
        >
          Generate Picture Album
        </Button>
      </div>
    </WizardStep>
  );
};

export default PictureAlbumGenerateStep;
