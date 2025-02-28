import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { storeData, getDataFromStore } from '@/utils/indexedDB';

const LoveStoryMomentsStep = () => {
  const [characterPhoto, setCharacterPhoto] = useState<string | null>(null);
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const characterFileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        // Load main character photo
        const photoFromIDB = await getDataFromStore('loveStoryCharacterPhoto');
        if (photoFromIDB) {
          setCharacterPhoto(photoFromIDB);
        } else {
          // If IndexedDB doesn't have it, try localStorage
          const savedCharacterPhoto = localStorage.getItem('loveStoryCharacterPhoto');
          // Backward compatibility: check for old key name
          const savedPartnerPhoto = savedCharacterPhoto || localStorage.getItem('loveStoryPartnerPhoto');
          if (savedPartnerPhoto) {
            setCharacterPhoto(savedPartnerPhoto);
            // Migrate from localStorage to IndexedDB
            await storeData('loveStoryCharacterPhoto', savedPartnerPhoto);
            // Update localStorage key name
            if (!savedCharacterPhoto) {
              localStorage.setItem('loveStoryCharacterPhoto', savedPartnerPhoto);
              console.log('Updated localStorage key from loveStoryPartnerPhoto to loveStoryCharacterPhoto');
            }
            console.log('Migrated character photo from localStorage to IndexedDB');
          }
        }

        // Load additional photos (up to 3 more)
        const additionalImages: string[] = [];
        for (let i = 2; i <= 4; i++) {
          const key = `loveStoryInputImage${i}`;
          const image = await getDataFromStore(key);
          if (image) {
            additionalImages.push(image);
          }
        }
        
        if (additionalImages.length > 0) {
          setAdditionalPhotos(additionalImages);
        }
      } catch (error) {
        console.error('Error loading photos:', error);
      }
    };
    
    loadPhotos();
  }, []);

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
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 10MB"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setCharacterPhoto(dataUrl);
        
        // Store in IndexedDB and localStorage
        await storeData('loveStoryCharacterPhoto', dataUrl);
        localStorage.setItem('loveStoryCharacterPhoto', dataUrl);
        
        toast({
          title: "Photo uploaded successfully",
          description: "Your character photo has been saved"
        });
        setIsLoading(false);
      };
      
      reader.onerror = () => {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: "There was an error reading the file"
        });
        setIsLoading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error processing the file"
      });
      setIsLoading(false);
    }
  };

  const handleAdditionalFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 10MB"
      });
      return;
    }

    // Don't allow more than 3 additional photos (4 total including main character)
    if (additionalPhotos.length >= 3) {
      toast({
        variant: "destructive",
        title: "Maximum photos reached",
        description: "You can upload up to 3 additional photos"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const newAdditionalPhotos = [...additionalPhotos, dataUrl];
        setAdditionalPhotos(newAdditionalPhotos);
        
        // Store in IndexedDB with appropriate key (input_image2, input_image3, input_image4)
        const imageNumber = newAdditionalPhotos.length + 1;
        await storeData(`loveStoryInputImage${imageNumber}`, dataUrl);
        
        toast({
          title: "Additional photo uploaded",
          description: `Photo ${imageNumber} has been saved`
        });
        setIsLoading(false);
      };
      
      reader.onerror = () => {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: "There was an error reading the file"
        });
        setIsLoading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error processing the file"
      });
      setIsLoading(false);
    }
  };

  const handleRemoveAdditionalPhoto = async (index: number) => {
    // Create a copy of the current photos array
    const newAdditionalPhotos = [...additionalPhotos];
    
    // Remove the photo at the specified index
    newAdditionalPhotos.splice(index, 1);
    
    // Update state
    setAdditionalPhotos(newAdditionalPhotos);
    
    // Reorganize storage 
    for (let i = 0; i < newAdditionalPhotos.length; i++) {
      await storeData(`loveStoryInputImage${i+2}`, newAdditionalPhotos[i]);
    }
    
    // Clean up the last key if we've reduced the count
    if (newAdditionalPhotos.length < additionalPhotos.length) {
      const keyToRemove = `loveStoryInputImage${additionalPhotos.length+1}`;
      await storeData(keyToRemove, null); // Set to null to remove it
    }
    
    toast({
      title: "Photo removed",
      description: "The additional photo has been removed"
    });
  };

  const handleUploadClick = () => {
    characterFileInputRef.current?.click();
  };

  const handleAdditionalUploadClick = () => {
    additionalFileInputRef.current?.click();
  };

  return (
    <WizardStep
      title="Upload your character photos"
      description="We'll use these to generate your story images"
      previousStep="/create/love/love-story/ideas"
      nextStep="/create/love/love-story/generate"
      currentStep={4}
      totalSteps={5}
    >
      <div className="space-y-6">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-medium mb-4 text-center">Main Character Photo</h3>
          <input 
            type="file"
            ref={characterFileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
          <div className="aspect-square w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
            {!characterPhoto ? (
              <Button
                variant="ghost"
                className="w-full h-full flex flex-col items-center justify-center gap-4"
                onClick={handleUploadClick}
                disabled={isLoading}
              >
                <ImagePlus className="h-12 w-12 text-gray-400" />
                <span className="text-gray-500">
                  {isLoading ? "Processing..." : "Click to upload main character photo"}
                </span>
              </Button>
            ) : (
              <button
                className="w-full h-full p-0 hover:opacity-90 transition-opacity relative group"
                onClick={handleUploadClick}
                disabled={isLoading}
              >
                <img src={characterPhoto} alt="Character" className="w-full h-full object-cover rounded-lg" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                  <span className="text-white font-medium">
                    {isLoading ? "Processing..." : "Click to replace photo"}
                  </span>
                </div>
              </button>
            )}
          </div>
          
          <p className="text-sm text-gray-500 mt-2 text-center">
            This is your main character photo that will be used on the cover.
          </p>
        </div>

        {/* Additional Photos Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium mb-4 text-center">Additional Photos (Optional)</h3>
          <p className="text-sm text-gray-500 mb-4 text-center">
            You can upload up to 3 additional photos to enhance your story. These will be used for generating more diverse images.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            {/* Display existing additional photos */}
            {additionalPhotos.map((photo, index) => (
              <div key={index} className="relative w-24 h-24 sm:w-32 sm:h-32">
                <img 
                  src={photo} 
                  alt={`Additional ${index+1}`} 
                  className="w-full h-full object-cover rounded-lg border border-gray-300"
                />
                <button 
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  onClick={() => handleRemoveAdditionalPhoto(index)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {/* Upload button for additional photos (only show if less than 3 additional photos) */}
            {additionalPhotos.length < 3 && (
              <>
                <input 
                  type="file"
                  ref={additionalFileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAdditionalFileSelect}
                />
                <button
                  className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center"
                  onClick={handleAdditionalUploadClick}
                  disabled={isLoading}
                >
                  <ImagePlus className="h-8 w-8 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-2 text-center">
                    {isLoading ? "Processing..." : "Add Photo"}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryMomentsStep;
