import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MAX_PHOTOS = 4;

const LoveStoryMomentsStep = () => {
  const [characterPhotos, setCharacterPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved photos from localStorage
    const savedPhotos = localStorage.getItem('loveStoryCharacterPhotos');
    if (savedPhotos) {
      try {
        setCharacterPhotos(JSON.parse(savedPhotos));
      } catch (e) {
        console.error('Error parsing saved character photos', e);
      }
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to array for easier handling
    const filesArray = Array.from(files);
    
    // Check if adding these would exceed the maximum
    if (characterPhotos.length + filesArray.length > MAX_PHOTOS) {
      toast({
        variant: "destructive",
        title: "Too many photos",
        description: `You can upload a maximum of ${MAX_PHOTOS} photos. Please select fewer images.`
      });
      return;
    }

    // Process each file
    const promises = filesArray.map(file => {
      return new Promise<string>((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
          reject(`File ${file.name} is not an image`);
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          resolve(dataUrl);
        };
        reader.onerror = () => reject(`Error reading file ${file.name}`);
        reader.readAsDataURL(file);
      });
    });

    // Process all files and update state
    Promise.allSettled(promises).then(results => {
      const newPhotos = results
        .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
        .map(result => result.value);

      if (newPhotos.length > 0) {
        const updatedPhotos = [...characterPhotos, ...newPhotos];
        setCharacterPhotos(updatedPhotos);
        localStorage.setItem('loveStoryCharacterPhotos', JSON.stringify(updatedPhotos));
        
        toast({
          title: "Photos uploaded successfully",
          description: `Added ${newPhotos.length} ${newPhotos.length === 1 ? 'photo' : 'photos'}`
        });
      }

      // Log failed uploads if any
      const failed = results.filter(result => result.status === 'rejected');
      if (failed.length > 0) {
        toast({
          variant: "destructive",
          title: "Some files could not be uploaded",
          description: `${failed.length} ${failed.length === 1 ? 'file' : 'files'} could not be processed`
        });
      }
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
    const updatedPhotos = characterPhotos.filter((_, i) => i !== index);
    setCharacterPhotos(updatedPhotos);
    localStorage.setItem('loveStoryCharacterPhotos', JSON.stringify(updatedPhotos));
    
    toast({
      title: "Photo removed",
      description: "The photo has been removed"
    });
  };

  return (
    <WizardStep
      title="Upload Character Photos"
      description="Add up to 4 photos of your story's character for better quality results"
      previousStep="/create/love/love-story/ideas"
      nextStep="/create/love/love-story/generate"
      currentStep={4}
      totalSteps={5}
    >
      <div className="space-y-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4 text-center">
            <h3 className="text-lg font-medium">Character Photos</h3>
            <p className="text-sm text-gray-500">
              For best results, upload 1-4 clear face photos of the same person
            </p>
          </div>
          
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            multiple
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Render existing photos */}
            {characterPhotos.map((photo, index) => (
              <div 
                key={index} 
                className="aspect-square border border-gray-300 rounded-lg relative group overflow-hidden"
              >
                <img 
                  src={photo} 
                  alt={`Character ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            {/* Add more photos button if under max limit */}
            {characterPhotos.length < MAX_PHOTOS && (
              <button
                className="aspect-square w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
                onClick={handleUploadClick}
              >
                <PlusCircle className="h-10 w-10 text-gray-400 mb-2" />
                <span className="text-gray-500 text-sm">
                  {characterPhotos.length === 0 
                    ? "Add character photos" 
                    : "Add more photos"}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  {characterPhotos.length}/{MAX_PHOTOS}
                </span>
              </button>
            )}
          </div>
          
          {characterPhotos.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                These photos will be used to create personalized images in your love story
              </p>
            </div>
          )}
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryMomentsStep;
