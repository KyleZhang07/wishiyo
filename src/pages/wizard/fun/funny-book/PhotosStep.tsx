
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const FunnyBookPhotosStep = () => {
  const [photos, setPhotos] = useState<File[]>([]);
  const navigate = useNavigate();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleContinue = () => {
    navigate("/create/fun/funny-book/generate");
  };

  return (
    <WizardStep
      title="Add Photos (Optional)"
      description="Upload photos to include in your book."
      previousStep="/create/fun/funny-book/ideas"
      currentStep={4}
      totalSteps={5}
      onNextClick={handleContinue}
    >
      <div className="space-y-4">
        <Button variant="outline" className="w-full" asChild>
          <label>
            Choose Photos
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </label>
        </Button>
        
        {photos.length > 0 && (
          <p className="text-sm text-gray-600">
            {photos.length} photo{photos.length === 1 ? '' : 's'} selected
          </p>
        )}
      </div>
    </WizardStep>
  );
};

export default FunnyBookPhotosStep;
