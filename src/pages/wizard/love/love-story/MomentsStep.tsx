import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LoveStoryMomentsStep = () => {
  const [recipientPhotos, setRecipientPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedPhotos = localStorage.getItem('loveStoryRecipientPhotos');
    if (savedPhotos) {
      setRecipientPhotos(JSON.parse(savedPhotos));
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const invalidFile = fileArray.find(file => !file.type.startsWith('image/'));
    
    if (invalidFile) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload image files only (PNG, JPG, etc.)"
      });
      return;
    }

    const fileReadPromises = fileArray.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          resolve(dataUrl);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(fileReadPromises).then(newPhotos => {
      const updatedPhotos = [...recipientPhotos, ...newPhotos];
      setRecipientPhotos(updatedPhotos);
      localStorage.setItem('loveStoryRecipientPhotos', JSON.stringify(updatedPhotos));
      localStorage.setItem('loveStoryPartnerPhoto', updatedPhotos[0]); // For backward compatibility
      
      toast({
        title: "Photos uploaded successfully",
        description: `${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''} have been saved`
      });
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = recipientPhotos.filter((_, i) => i !== index);
    setRecipientPhotos(updatedPhotos);
    localStorage.setItem('loveStoryRecipientPhotos', JSON.stringify(updatedPhotos));
    
    // Update the legacy key for backward compatibility
    if (updatedPhotos.length > 0) {
      localStorage.setItem('loveStoryPartnerPhoto', updatedPhotos[0]);
    } else {
      localStorage.removeItem('loveStoryPartnerPhoto');
    }
    
    toast({
      title: "Photo removed",
      description: "The selected photo has been removed"
    });
  };

  return (
    <WizardStep
      title="Upload recipient photos"
      description="We'll use these on the cover and throughout the book"
      previousStep="/create/love/love-story/ideas"
      nextStep="/create/love/love-story/generate"
      currentStep={4}
      totalSteps={5}
    >
      <div className="space-y-6">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-medium mb-4 text-center">Recipient Photos</h3>
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            multiple
          />
          
          {recipientPhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {recipientPhotos.map((photo, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden aspect-square">
                  <img 
                    src={photo} 
                    alt={`Recipient ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  <button
                    className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-black/80"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              
              <button
                className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center aspect-square hover:bg-gray-50"
                onClick={handleUploadClick}
              >
                <Plus className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Add more photos</span>
              </button>
            </div>
          ) : (
            <div className="aspect-square w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
              <Button
                variant="ghost"
                className="w-full h-full flex flex-col items-center justify-center gap-4"
                onClick={handleUploadClick}
              >
                <ImagePlus className="h-12 w-12 text-gray-400" />
                <span className="text-gray-500">Click to upload recipient photos</span>
              </Button>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-500 mt-2">
            For best results, upload 3-4 clear photos of the recipient's face from different angles
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryMomentsStep;
