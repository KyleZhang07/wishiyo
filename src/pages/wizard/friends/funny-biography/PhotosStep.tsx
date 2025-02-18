
import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_DIMENSION = 1200;

const FunnyBiographyPhotosStep = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedPhoto = localStorage.getItem('funnyBiographyPhoto');
      if (savedPhoto) {
        setPhoto(savedPhoto);
      }
    } catch (error) {
      console.error('Error loading photo from localStorage:', error);
    }
  }, []);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_IMAGE_DIMENSION) {
            height *= MAX_IMAGE_DIMENSION / width;
            width = MAX_IMAGE_DIMENSION;
          }
        } else {
          if (height > MAX_IMAGE_DIMENSION) {
            width *= MAX_IMAGE_DIMENSION / height;
            height = MAX_IMAGE_DIMENSION;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedDataUrl);
      };
      
      img.onerror = reject;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 5MB"
      });
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      setPhoto(compressedDataUrl);
      
      try {
        // Store the original photo and remove any previously processed photo
        localStorage.setItem('funnyBiographyPhoto', compressedDataUrl);
        localStorage.removeItem('funnyBiographyProcessedPhoto'); // Clear processed photo
        
        toast({
          title: "Photo uploaded successfully",
          description: "Your photo has been saved"
        });
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        toast({
          variant: "destructive",
          title: "Storage error",
          description: "Could not save the photo. Please try a smaller image."
        });
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not process the image. Please try another one."
      });
    }
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
            <button
              className="w-full h-full p-0 hover:opacity-90 transition-opacity relative group"
              onClick={handleUploadClick}
            >
              <img src={photo} alt="" className="w-full h-full object-cover rounded-lg" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <span className="text-white font-medium">Click to replace photo</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </WizardStep>
  );
};

export default FunnyBiographyPhotosStep;
