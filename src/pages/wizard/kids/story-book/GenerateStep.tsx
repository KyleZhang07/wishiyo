
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';

const StoryBookGenerateStep = () => {
  return (
    <WizardStep
      title="Create Your Story Book"
      description="Let's bring your story to life!"
      previousStep="/create/kids/story-book/characters"
      currentStep={4}
      totalSteps={4}
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-medium text-lg mb-4">Your Story Book Includes:</h3>
          <ul className="space-y-2 text-gray-600">
            <li>✓ Engaging Plot</li>
            <li>✓ Colorful Characters</li>
            <li>✓ Beautiful Illustrations</li>
            <li>✓ Age-Appropriate Language</li>
          </ul>
        </div>
        <Button 
          className="w-full py-6 text-lg"
          onClick={() => {/* Generate story logic */}}
        >
          Generate Story Book
        </Button>
      </div>
    </WizardStep>
  );
};

export default StoryBookGenerateStep;
