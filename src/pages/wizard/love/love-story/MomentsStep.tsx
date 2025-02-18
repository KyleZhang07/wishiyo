import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';

const LoveStoryMomentsStep = () => {
  const [photo, setPhoto] = useState<string | null>(null);

  return (
    <WizardStep
      title="Upload a photo"
      description="We'll use it on the cover"
      previousStep="/create/love/love-story/questions"
      nextStep="/create/love/love-story/generate"
      currentStep={3}
      totalSteps={4}
    >
      <div className="space-y-6">
        <div className="aspect-square w-full max-w-md mx-auto border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
          {!photo ? (
            <Button
              variant="ghost"
              className="w-full h-full flex flex-col items-center justify-center gap-4"
              onClick={() => {/* Photo upload logic */}}
            >
              <ImagePlus className="h-12 w-12 text-gray-400" />
              <span className="text-gray-500">Click to upload</span>
            </Button>
          ) : (
            <img src={photo} alt="" className="w-full h-full object-cover rounded-lg" />
          )}
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryMomentsStep;
