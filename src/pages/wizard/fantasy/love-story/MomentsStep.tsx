
import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LoveStoryMomentsStep = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedPhoto = localStorage.getItem('loveStoryPhoto');
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
      localStorage.setItem('loveStoryPhoto', dataUrl);
      toast({
        title: "Photo uploaded successfully",
        description: "Your precious moment has been saved"
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <WizardStep
      title="Capture the Moment"
      description="Upload a special photo that represents your love story"
      previousStep="/create/fantasy/love-story/ideas"
      nextStep="/create/fantasy/love-story/generate"
      currentStep={4}
      totalSteps={5}
    >
      <div className="space-y-6">
        <div className="max-w-md mx-auto">
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
          <div className="aspect-square w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
            {!photo ? (
              <Button
                variant="ghost"
                className="w-full h-full flex flex-col items-center justify-center gap-4"
                onClick={handleUploadClick}
              >
                <ImagePlus className="h-12 w-12 text-gray-400" />
                <span className="text-gray-500">Click to upload a special moment</span>
              </Button>
            ) : (
              <button
                className="w-full h-full p-0 hover:opacity-90 transition-opacity relative group"
                onClick={handleUploadClick}
              >
                <img src={photo} alt="Special moment" className="w-full h-full object-cover rounded-lg" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                  <span className="text-white font-medium">Click to replace photo</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryMomentsStep;
