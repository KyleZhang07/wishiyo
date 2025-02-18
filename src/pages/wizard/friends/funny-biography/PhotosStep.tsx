
import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FunnyBiographyPhotosStep = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedPhoto = localStorage.getItem('funnyBiographyPhoto');
    if (savedPhoto) {
      setPhoto(savedPhoto);
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc.)"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhoto(dataUrl);
      localStorage.setItem('funnyBiographyPhoto', dataUrl);
      toast({
        title: "Photo uploaded successfully",
        description: "Your photo has been saved"
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <WizardStep
      title="Upload a photo"
      description="We'll use it on the cover"
      previousStep="/create/friends/funny-biography/ideas"
      nextStep="/create/friends/funny-biography/generate"
      currentStep={3}
      totalSteps={4}
    >
      <div className="space-y-6">
        <input 
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
        />
        <div className="aspect-square w-full max-w-md mx-auto border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
          {!photo ? (
            <Button
              variant="ghost"
              className="w-full h-full flex flex-col items-center justify-center gap-4"
              onClick={handleUploadClick}
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

export default FunnyBiographyPhotosStep;
