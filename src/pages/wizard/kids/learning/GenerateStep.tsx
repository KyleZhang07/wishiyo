
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';

const LearningJourneyGenerateStep = () => {
  return (
    <WizardStep
      title="Create Learning Journey"
      description="Let's make learning fun and exciting!"
      previousStep="/create/kids/learning/style"
      currentStep={4}
      totalSteps={4}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-medium text-lg mb-4">Your Learning Journey Includes:</h3>
          <ul className="space-y-2 text-gray-600">
            <li>✓ Educational Content</li>
            <li>✓ Fun Activities</li>
            <li>✓ Colorful Illustrations</li>
            <li>✓ Interactive Elements</li>
          </ul>
        </div>
        <Button 
          className="w-full py-6 text-lg"
          onClick={() => {/* Generate learning journey logic */}}
        >
          Generate Learning Journey
        </Button>
      </div>
    </WizardStep>
  );
};

export default LearningJourneyGenerateStep;
