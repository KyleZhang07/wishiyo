
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const FunnyBiographyGenerateStep = () => {
  const navigate = useNavigate();

  return (
    <WizardStep
      title="Create Your Hilarious Biography"
      description="Let's turn those funny stories into an unforgettable book!"
      previousStep="/create/friends/funny-biography/photos"
      currentStep={4}
      totalSteps={4}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-medium text-lg mb-4">Your Comedy Collection Includes:</h3>
          <ul className="space-y-2 text-gray-600">
            <li>✓ Embarrassing Stories</li>
            <li>✓ Inside Jokes</li>
            <li>✓ Funny Photos</li>
            <li>✓ Ridiculous Adventures</li>
          </ul>
        </div>
        <Button 
          className="w-full py-6 text-lg"
          onClick={() => {/* Generate book logic */}}
        >
          Generate Your Funny Biography
        </Button>
      </div>
    </WizardStep>
  );
};

export default FunnyBiographyGenerateStep;
