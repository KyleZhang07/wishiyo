import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LoveStoryMomentsStep = () => {
  const [partnerPhotos, setPartnerPhotos] = useState<string[]>([]);
  const fileInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];
  const { toast } = useToast();

  useEffect(() => {
    // Load all saved photos
    const photos = [];
    for (let i = 1; i <= 4; i++) {
      const savedPhoto = localStorage.getItem(`loveStoryPartnerPhoto${i}`);
      if (savedPhoto) {
        photos.push(savedPhoto);
      }
    }
    
    // Backward compatibility: If there's an old format photo, add it as the first photo
    const legacyPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (legacyPhoto && photos.length === 0) {
      photos.push(legacyPhoto);
      localStorage.setItem('loveStoryPartnerPhoto1', legacyPhoto);
    }
    
    setPartnerPhotos(photos);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
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
      
      const newPhotos = [...partnerPhotos];
      if (index < newPhotos.length) {
        newPhotos[index] = dataUrl;
      } else {
        newPhotos.push(dataUrl);
      }
      
      setPartnerPhotos(newPhotos);
      
      // Save to localStorage (both new format and legacy format for compatibility)
      localStorage.setItem(`loveStoryPartnerPhoto${index + 1}`, dataUrl);
      if (index === 0) {
        localStorage.setItem('loveStoryPartnerPhoto', dataUrl);
      }
      
      toast({
        title: "Photo uploaded successfully",
        description: `Photo ${index + 1} has been saved`
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = (index: number) => {
    fileInputRefs[index].current?.click();
  };

  const handleDeletePhoto = (index: number) => {
    const newPhotos = [...partnerPhotos];
    newPhotos.splice(index, 1);
    setPartnerPhotos(newPhotos);
    
    // Reorder localStorage
    newPhotos.forEach((photo, i) => {
      localStorage.setItem(`loveStoryPartnerPhoto${i + 1}`, photo);
    });
    
    // Clear any remaining slots
    for (let i = newPhotos.length + 1; i <= 4; i++) {
      localStorage.removeItem(`loveStoryPartnerPhoto${i}`);
    }
    
    // Update legacy storage
    if (newPhotos.length > 0) {
      localStorage.setItem('loveStoryPartnerPhoto', newPhotos[0]);
    } else {
      localStorage.removeItem('loveStoryPartnerPhoto');
    }
    
    toast({
      title: "Photo removed",
      description: `Photo ${index + 1} has been deleted`
    });
  };

  const canAddMorePhotos = partnerPhotos.length < 4;

  return (
    <WizardStep
      title="Upload your partner's photos"
      description="We'll use these to create personalized images"
      previousStep="/create/love/love-story/ideas"
      nextStep="/create/love/love-story/generate"
      currentStep={4}
      totalSteps={5}
    >
      <div className="space-y-6">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-medium mb-4 text-center">Partner's Photos (Up to 4)</h3>
          <p className="text-sm text-center text-gray-500 mb-6">
            Upload up to 4 photos for more varied images. The first photo will be used for the cover.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Existing photos */}
            {partnerPhotos.map((photo, index) => (
              <div key={index} className="relative">
                <input 
                  type="file"
                  ref={fileInputRefs[index]}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, index)}
                />
                <div className="aspect-square w-full border-2 border-gray-300 rounded-lg overflow-hidden">
                  <button
                    className="w-full h-full p-0 hover:opacity-90 transition-opacity relative group"
                    onClick={() => handleUploadClick(index)}
                  >
                    <img src={photo} alt={`Partner ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-medium">Replace photo {index + 1}</span>
                    </div>
                  </button>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-8 w-8 rounded-full"
                  onClick={() => handleDeletePhoto(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {/* Add new photo button */}
            {canAddMorePhotos && (
              <div>
                <input 
                  type="file"
                  ref={fileInputRefs[partnerPhotos.length]}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, partnerPhotos.length)}
                />
                <div className="aspect-square w-full border-2 border-dashed border-gray-300 rounded-lg">
                  <Button
                    variant="ghost"
                    className="w-full h-full flex flex-col items-center justify-center gap-4"
                    onClick={() => handleUploadClick(partnerPhotos.length)}
                  >
                    <Plus className="h-12 w-12 text-gray-400" />
                    <span className="text-gray-500">Add photo {partnerPhotos.length + 1}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {partnerPhotos.length === 0 && (
            <div className="mt-4 text-center text-sm text-amber-600">
              At least one photo is required to generate your love story.
            </div>
          )}
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryMomentsStep;
