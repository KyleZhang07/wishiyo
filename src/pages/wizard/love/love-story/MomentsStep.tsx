
import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 4;

const LoveStoryMomentsStep = () => {
  const [recipientPhotos, setRecipientPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load previously saved photos
    try {
      const mainPhoto = localStorage.getItem('loveStoryPartnerPhoto');
      const additionalPhotos = localStorage.getItem('loveStoryAdditionalPhotos');
      
      let photos: string[] = [];
      
      if (mainPhoto) {
        photos.push(mainPhoto);
      }
      
      if (additionalPhotos) {
        const parsedPhotos = JSON.parse(additionalPhotos);
        if (Array.isArray(parsedPhotos)) {
          photos = [...photos, ...parsedPhotos];
        }
      }
      
      if (photos.length > 0) {
        setRecipientPhotos(photos.slice(0, MAX_IMAGES));
      }
    } catch (error) {
      console.error('Error loading photos from localStorage:', error);
    }
  }, []);

  // Save photos to localStorage
  const savePhotos = (photos: string[]) => {
    if (photos.length > 0) {
      // Save the first photo as the main photo for backward compatibility
      localStorage.setItem('loveStoryPartnerPhoto', photos[0]);
      
      // Save additional photos if there are any
      if (photos.length > 1) {
        localStorage.setItem('loveStoryAdditionalPhotos', JSON.stringify(photos.slice(1)));
      } else {
        localStorage.removeItem('loveStoryAdditionalPhotos');
      }
    } else {
      localStorage.removeItem('loveStoryPartnerPhoto');
      localStorage.removeItem('loveStoryAdditionalPhotos');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Limit the number of files we process
    const availableSlots = MAX_IMAGES - recipientPhotos.length;
    const filesToProcess = Math.min(files.length, availableSlots);
    
    if (filesToProcess <= 0) {
      toast({
        variant: "destructive",
        title: "Maximum photos reached",
        description: `You can only upload up to ${MAX_IMAGES} photos.`
      });
      return;
    }

    let processedCount = 0;
    const newPhotos = [...recipientPhotos];

    Array.from(files).slice(0, filesToProcess).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload image files only (PNG, JPG, etc.)"
        });
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload images smaller than 5MB"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        newPhotos.push(dataUrl);
        processedCount++;
        
        // When all files are processed, update state and localStorage
        if (processedCount === filesToProcess) {
          setRecipientPhotos(newPhotos);
          savePhotos(newPhotos);
          
          toast({
            title: "Photos uploaded successfully",
            description: `${processedCount} photo${processedCount !== 1 ? 's' : ''} added`
          });
        }
      };

      reader.readAsDataURL(file);
    });

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = recipientPhotos.filter((_, i) => i !== index);
    setRecipientPhotos(updatedPhotos);
    savePhotos(updatedPhotos);
    
    toast({
      title: "Photo removed",
      description: "The selected photo has been removed"
    });
  };

  return (
    <WizardStep
      title="Upload recipient photos"
      description="We'll use these to generate personalized images"
      previousStep="/create/love/love-story/ideas"
      nextStep="/create/love/love-story/generate"
      currentStep={4}
      totalSteps={5}
    >
      <div className="space-y-6">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-lg font-medium mb-4 text-center">Recipient Photos</h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            Upload up to {MAX_IMAGES} photos of the person receiving this love story. More photos help create better quality images.
          </p>
          
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            multiple
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Render existing photos */}
            {recipientPhotos.map((photo, index) => (
              <div 
                key={index} 
                className="aspect-square w-full border-2 border-gray-300 rounded-lg relative overflow-hidden"
              >
                <img 
                  src={photo} 
                  alt={`Recipient ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                <button
                  className="absolute top-2 right-2 p-1 bg-white/80 rounded-full hover:bg-white"
                  onClick={() => removePhoto(index)}
                >
                  <X className="h-5 w-5 text-red-500" />
                </button>
              </div>
            ))}
            
            {/* Add more photos button */}
            {recipientPhotos.length < MAX_IMAGES && (
              <div 
                className="aspect-square w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                onClick={handleUploadClick}
              >
                <Plus className="h-10 w-10 text-gray-400 mb-2" />
                <span className="text-gray-500">Add photo</span>
              </div>
            )}
          </div>

          {recipientPhotos.length === 0 && (
            <div className="aspect-square w-full max-w-md mx-auto border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
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
          
          {recipientPhotos.length > 0 && recipientPhotos.length < MAX_IMAGES && (
            <div className="text-center mt-6">
              <Button 
                variant="outline" 
                onClick={handleUploadClick}
                className="gap-2"
              >
                <ImagePlus className="h-4 w-4" />
                Upload more photos
              </Button>
            </div>
          )}
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryMomentsStep;
