
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';

const LearningJourneyGenerateStep = () => {
  return (
    <WizardStep
      title="Your Learning Journey"
      description="Preview your educational adventure!"
      previousStep="/create/kids/learning/style"
      currentStep={4}
      totalSteps={4}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-black rounded-xl p-8 aspect-[3/4] relative flex flex-col">
          <div className="flex-1 flex flex-col justify-between">
            <div className="text-neon-green text-4xl font-bold mb-4">Learn & Grow</div>
            <div className="space-y-4">
              <div className="text-white text-lg">An Educational Adventure</div>
              <div className="text-gray-400 text-sm">By [Author Name]</div>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <div className="bg-neon-green text-black font-bold rounded-full p-2 text-sm">
              EDUCATIONAL
            </div>
          </div>
        </div>

        <div className="bg-black rounded-xl p-8 text-white">
          <h3 className="text-neon-green text-2xl font-bold mb-6">Book Preview</h3>
          <div className="space-y-6">
            <div className="border-l-4 border-neon-green pl-4">
              <p className="text-gray-300 mb-2">
                "Makes learning fun and engaging for kids."
              </p>
              <p className="text-sm text-gray-400">- Educational Review</p>
            </div>
            <div className="border-l-4 border-neon-green pl-4">
              <p className="text-gray-300 mb-2">
                "A perfect blend of education and entertainment."
              </p>
              <p className="text-sm text-gray-400">- Learning Today Magazine</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Button 
            className="w-full bg-neon-green hover:bg-neon-green/90 text-black font-bold py-6 text-lg"
            onClick={() => {/* Generate book logic */}}
          >
            Generate Your Learning Book
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default LearningJourneyGenerateStep;
