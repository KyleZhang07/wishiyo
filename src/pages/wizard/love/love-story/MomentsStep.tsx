import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const LoveStoryMomentsStep = () => {
  const [characterPhotos, setCharacterPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load previously saved character photos
    for (let i = 1; i <= 4; i++) {
      const savedPhoto = localStorage.getItem(`loveStoryCharacterPhoto${i}`);
      if (savedPhoto) {
        setCharacterPhotos(prev => {
          const newPhotos = [...prev];
          newPhotos[i-1] = savedPhoto;
          return newPhotos;
        });
      }
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

    // Check if we already have 4 photos
    if (characterPhotos.filter(Boolean).length >= 4) {
      toast({
        variant: "destructive",
        title: "Maximum photos reached",
        description: "You can upload a maximum of 4 photos. Please remove one before adding another."
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      setCharacterPhotos(prev => {
        const newPhotos = [...prev];
        // Find the first empty slot
        const emptyIndex = newPhotos.findIndex(photo => !photo);
        const index = emptyIndex !== -1 ? emptyIndex : newPhotos.length;
        
        // Add the new photo
        newPhotos[index] = dataUrl;
        
        // Save to localStorage
        localStorage.setItem(`loveStoryCharacterPhoto${index + 1}`, dataUrl);
        
        // Also save the first photo to the old key for backward compatibility
        if (index === 0) {
          localStorage.setItem('loveStoryPartnerPhoto', dataUrl);
        }
        
        return newPhotos;
      });

      toast({
        title: "Photo uploaded successfully",
        description: "Your character photo has been saved"
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (index: number) => {
    setCharacterPhotos(prev => {
      const newPhotos = [...prev];
      newPhotos[index] = '';
      
      // Remove from localStorage
      localStorage.removeItem(`loveStoryCharacterPhoto${index + 1}`);
      
      // Also remove from the old key if it's the first photo
      if (index === 0) {
        localStorage.removeItem('loveStoryPartnerPhoto');
      }
      
      return newPhotos;
    });

    toast({
      title: "Photo removed",
      description: "The character photo has been removed"
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <WizardStep
      title="Upload character photos"
      description="Add up to 4 photos of your character for better quality generated images"
      previousStep="/create/love/love-story/ideas"
      nextStep="/create/love/love-story/generate"
      currentStep={4}
      totalSteps={5}
    >
      <div className="space-y-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-medium text-center">Character Photos</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-2">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Upload up to 4 different photos of the same person. 
                    Multiple photos help create better quality images. 
                    At least one photo is required.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Display existing photos and upload button */}
            {[...Array(4)].map((_, index) => (
              <div key={index} className="aspect-square w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center relative">
                {!characterPhotos[index] ? (
                  <Button
                    variant="ghost"
                    className="w-full h-full flex flex-col items-center justify-center gap-4"
                    onClick={handleUploadClick}
                  >
                    <ImagePlus className="h-12 w-12 text-gray-400" />
                    <span className="text-gray-500">{index === 0 ? "Upload primary photo (required)" : "Add another photo"}</span>
                  </Button>
                ) : (
                  <div className="w-full h-full relative group">
                    <img src={characterPhotos[index]} alt={`Character ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                    
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 rounded-full h-8 w-8 p-0 opacity-70 hover:opacity-100"
                      onClick={() => handleRemovePhoto(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    <div 
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg cursor-pointer"
                      onClick={handleUploadClick}
                    >
                      <span className="text-white font-medium">Click to replace photo</span>
                    </div>
                  </div>
                )}
                
                {index === 0 && (
                  <div className="absolute -top-3 -left-1 bg-primary text-white text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {characterPhotos.filter(Boolean).length === 0 && (
            <div className="mt-6 text-center text-yellow-600 bg-yellow-50 p-4 rounded-lg">
              <p>At least one character photo is required to generate images</p>
            </div>
          )}
          
          {characterPhotos.filter(Boolean).length > 0 && (
            <div className="mt-6 text-center text-green-600 bg-green-50 p-4 rounded-lg">
              <p>{characterPhotos.filter(Boolean).length} of 4 photos uploaded. {characterPhotos.filter(Boolean).length > 1 ? "Multiple photos will help generate better quality images." : "Adding more photos will help generate better quality images."}</p>
            </div>
          )}
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryMomentsStep;
