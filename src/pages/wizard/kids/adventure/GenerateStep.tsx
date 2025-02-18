
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';

const KidsAdventureGenerateStep = () => {
  return (
    <WizardStep
      title="Create the Adventure Book"
      description="Let's bring your child's adventure to life!"
      previousStep="/create/kids/adventure/story"
      currentStep={4}
      totalSteps={4}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-medium text-lg mb-4">Your Adventure Book Includes:</h3>
          <ul className="space-y-2 text-gray-600">
            <li>✓ Personalized Hero</li>
            <li>✓ Magical Adventure</li>
            <li>✓ Custom Illustrations</li>
            <li>✓ Special Powers</li>
          </ul>
        </div>
        <Button 
          className="w-full py-6 text-lg"
          onClick={() => {/* Generate book logic */}}
        >
          Generate Adventure Book
        </Button>
      </div>
    </WizardStep>
  );
};

export default KidsAdventureGenerateStep;
