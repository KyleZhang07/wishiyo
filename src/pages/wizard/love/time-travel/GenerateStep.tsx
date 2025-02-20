
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';

const LovePoemsGenerateStep = () => {
  return (
    <WizardStep
      title="Create Your Love Poems"
      description="Let's transform your feelings into beautiful poetry"
      previousStep="/create/love/love-poems/style"
      currentStep={4}
      totalSteps={4}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-medium text-lg mb-4">Your Poetry Collection Includes:</h3>
          <ul className="space-y-2 text-gray-600">
            <li>✓ Personalized Love Poems</li>
            <li>✓ Romantic Expressions</li>
            <li>✓ Beautiful Metaphors</li>
            <li>✓ Heartfelt Messages</li>
          </ul>
        </div>
        <Button 
          className="w-full py-6 text-lg"
          onClick={() => {/* Generate poems logic */}}
        >
          Generate Love Poems
        </Button>
      </div>
    </WizardStep>
  );
};

export default LovePoemsGenerateStep;
