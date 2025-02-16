
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus, X } from 'lucide-react';

const FunnyBiographyPhotosStep = () => {
  const [photos, setPhotos] = useState<string[]>([]);

  return (
    <WizardStep
      title="Add Your Funniest Photos"
      description="Upload those embarrassing photos that always make you laugh!"
      previousStep="/create/friends/funny-biography/stories"
      nextStep="/create/friends/funny-biography/generate"
      currentStep={3}
      totalSteps={4}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square">
              <img src={photo} alt="" className="w-full h-full object-cover rounded-lg" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-2 -top-2 rounded-full bg-white border shadow-sm hover:bg-gray-50 h-8 w-8 p-0"
                onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            className="aspect-square flex flex-col items-center justify-center border-dashed"
            onClick={() => {/* Photo upload logic */}}
          >
            <ImagePlus className="h-8 w-8 mb-2" />
            <span className="text-sm">Add Photo</span>
          </Button>
        </div>
        <p className="text-sm text-gray-500 text-center">
          Tip: Choose photos that capture the most hilarious moments!
        </p>
      </div>
    </WizardStep>
  );
};

export default FunnyBiographyPhotosStep;
