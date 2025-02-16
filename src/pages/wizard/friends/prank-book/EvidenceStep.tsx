
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus, X } from 'lucide-react';

const PrankBookEvidenceStep = () => {
  const [photos, setPhotos] = useState<string[]>([]);

  return (
    <WizardStep
      title="Add Your Prank Evidence"
      description="Upload photos of your greatest pranks in action!"
      previousStep="/create/friends/prank-book/ideas"
      nextStep="/create/friends/prank-book/generate"
      currentStep={4}
      totalSteps={5}
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
          Tip: Choose photos that capture the funniest moments of your pranks!
        </p>
      </div>
    </WizardStep>
  );
};

export default PrankBookEvidenceStep;
