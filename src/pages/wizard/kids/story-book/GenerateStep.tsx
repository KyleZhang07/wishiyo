
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';

const StoryBookGenerateStep = () => {
  return (
    <WizardStep
      title="Your Story Book"
      description="Preview your magical tale!"
      previousStep="/create/kids/story-book/characters"
      currentStep={4}
      totalSteps={4}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-black rounded-xl p-8 aspect-[3/4] relative flex flex-col">
          <div className="flex-1 flex flex-col justify-between">
            <div className="text-neon-green text-4xl font-bold mb-4">Magic Tales</div>
            <div className="space-y-4">
              <div className="text-white text-lg">A Magical Story for Kids</div>
              <div className="text-gray-400 text-sm">By [Author Name]</div>
            </div>
          </div>
          <div className="absolute top-4 right-4">
            <div className="bg-neon-green text-black font-bold rounded-full p-2 text-sm">
              MAGICAL
            </div>
          </div>
        </div>

        <div className="bg-black rounded-xl p-8 text-white">
          <h3 className="text-neon-green text-2xl font-bold mb-6">Book Preview</h3>
          <div className="space-y-6">
            <div className="border-l-4 border-neon-green pl-4">
              <p className="text-gray-300 mb-2">
                "A delightful story that sparks imagination."
              </p>
              <p className="text-sm text-gray-400">- Children's Book Weekly</p>
            </div>
            <div className="border-l-4 border-neon-green pl-4">
              <p className="text-gray-300 mb-2">
                "Perfect bedtime reading for young dreamers."
              </p>
              <p className="text-sm text-gray-400">- Parent's Choice Magazine</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Button 
            className="w-full bg-neon-green hover:bg-neon-green/90 text-black font-bold py-6 text-lg"
            onClick={() => {/* Generate book logic */}}
          >
            Generate Your Story Book
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default StoryBookGenerateStep;
