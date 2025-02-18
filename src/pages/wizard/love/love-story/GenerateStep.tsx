
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';

const LoveStoryGenerateStep = () => {
  return (
    <WizardStep
      title="Create Your Love Story"
      description="Let's turn your beautiful moments into a timeless story"
      previousStep="/create/love/love-story/moments"
      currentStep={4}
      totalSteps={4}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-medium text-lg mb-4">Your Love Story Includes:</h3>
          <ul className="space-y-2 text-gray-600">
            <li>✓ Your Journey Together</li>
            <li>✓ Special Moments</li>
            <li>✓ Beautiful Photos</li>
            <li>✓ Romantic Memories</li>
          </ul>
        </div>
        <Button 
          className="w-full py-6 text-lg"
          onClick={() => {/* Generate book logic */}}
        >
          Generate Your Love Story
        </Button>
      </div>
    </WizardStep>
  );
};

export default LoveStoryGenerateStep;
