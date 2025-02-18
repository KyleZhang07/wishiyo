
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';

const KidsAdventureGenerateStep = () => {
  return (
    <WizardStep
      title="Your Adventure Book"
      description="Preview your exciting journey!"
      previousStep="/create/kids/adventure/story"
      currentStep={4}
      totalSteps={4}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-black rounded-xl p-8 aspect-[3/4] relative flex flex-col">
          <div className="flex-1 flex flex-col justify-between">
            <div className="text-neon-green text-4xl font-bold mb-4">Adventure Time</div>
            <div className="space-y-4">
              <div className="text-white text-lg">An Epic Kids Adventure</div>
              <div className="text-gray-400 text-sm">By [Author Name]</div>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <div className="bg-neon-green text-black font-bold rounded-full p-2 text-sm">
              EXCITING
            </div>
          </div>
        </div>

        <div className="bg-black rounded-xl p-8 text-white">
          <h3 className="text-neon-green text-2xl font-bold mb-6">Book Preview</h3>
          <div className="space-y-6">
            <div className="border-l-4 border-neon-green pl-4">
              <p className="text-gray-300 mb-2">
                "A magical adventure that will captivate young readers."
              </p>
              <p className="text-sm text-gray-400">- Kids Book Review</p>
            </div>
            <div className="border-l-4 border-neon-green pl-4">
              <p className="text-gray-300 mb-2">
                "Full of excitement, wonder, and valuable lessons."
              </p>
              <p className="text-sm text-gray-400">- Young Readers Monthly</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Button 
            className="w-full bg-neon-green hover:bg-neon-green/90 text-black font-bold py-6 text-lg"
            onClick={() => {/* Generate book logic */}}
          >
            Generate Your Adventure Book
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default KidsAdventureGenerateStep;
