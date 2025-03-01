import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LoveStoryMomentsStep = () => {
  const [partnerPhoto, setPartnerPhoto] = useState<string | null>(null);
  const partnerFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedPartnerPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedPartnerPhoto) {
      setPartnerPhoto(savedPartnerPhoto);
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
      setPartnerPhoto(dataUrl);
      localStorage.setItem('loveStoryPartnerPhoto', dataUrl);
      toast({
        title: "Photo uploaded successfully",
        description: "Your partner's photo has been saved"
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    partnerFileInputRef.current?.click();
  };

  return (
    <WizardStep
      title="Upload your partner's photo"
      description="We'll use it on the cover"
      previousStep="/create/love/love-story/text-tone"
      nextStep="/create/love/love-story/ideas"
      currentStep={4}
      totalSteps={6}
    >
      <div className="space-y-6">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-medium mb-4 text-center">Partner's Photo</h3>
          <input 
            type="file"
            ref={partnerFileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
          <div className="aspect-square w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
            {!partnerPhoto ? (
              <Button
                variant="ghost"
                className="w-full h-full flex flex-col items-center justify-center gap-4"
                onClick={handleUploadClick}
              >
                <ImagePlus className="h-12 w-12 text-gray-400" />
                <span className="text-gray-500">Click to upload partner's photo</span>
              </Button>
            ) : (
              <button
                className="w-full h-full p-0 hover:opacity-90 transition-opacity relative group"
                onClick={handleUploadClick}
              >
                <img src={partnerPhoto} alt="Partner" className="w-full h-full object-cover rounded-lg" />
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
