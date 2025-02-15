
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';

const PrankBookGenerateStep = () => {
  return (
    <WizardStep
      title="Create Your Epic Prank Book"
      description="Let's turn those pranks into an unforgettable story!"
      previousStep="/create/friends/prank-book/evidence"
      currentStep={4}
      totalSteps={4}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-medium text-lg mb-4">Your Prank Collection Includes:</h3>
          <ul className="space-y-2 text-gray-600">
            <li>✓ Hilarious Pranks</li>
            <li>✓ Epic Reactions</li>
            <li>✓ Prank Evidence Photos</li>
            <li>✓ Master Prankster Stories</li>
          </ul>
        </div>
        <Button 
          className="w-full py-6 text-lg"
          onClick={() => {/* Generate book logic */}}
        >
          Generate Your Prank Book
        </Button>
      </div>
    </WizardStep>
  );
};

export default PrankBookGenerateStep;
