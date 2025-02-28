import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { storeData, getDataFromStore } from '@/utils/indexedDB';

const LoveStoryMomentsStep = () => {
  const [characterPhoto, setCharacterPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const characterFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadCharacterPhoto = async () => {
      try {
        // 先尝试从IndexedDB获取照片
        const photoFromIDB = await getDataFromStore('loveStoryCharacterPhoto');
        if (photoFromIDB) {
          setCharacterPhoto(photoFromIDB);
          return;
        }
        
        // 如果IndexedDB中没有，则回退到localStorage
        const savedCharacterPhoto = localStorage.getItem('loveStoryCharacterPhoto');
        // 向后兼容：检查旧的键名
        const savedPartnerPhoto = savedCharacterPhoto || localStorage.getItem('loveStoryPartnerPhoto');
        if (savedPartnerPhoto) {
          setCharacterPhoto(savedPartnerPhoto);
          // 将照片从localStorage迁移到IndexedDB
          await storeData('loveStoryCharacterPhoto', savedPartnerPhoto);
          // 同时更新localStorage中的键名
          if (!savedCharacterPhoto) {
            localStorage.setItem('loveStoryCharacterPhoto', savedPartnerPhoto);
            console.log('Updated localStorage key from loveStoryPartnerPhoto to loveStoryCharacterPhoto');
          }
          console.log('Migrated character photo from localStorage to IndexedDB');
        }
      } catch (error) {
        console.error('Error loading character photo:', error);
      }
    };
    
    loadCharacterPhoto();
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
    
    // 检查文件大小（10MB上限）
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
        
        // 存储到IndexedDB和localStorage
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

  const handleUploadClick = () => {
    characterFileInputRef.current?.click();
  };

  return (
    <WizardStep
      title="Upload your character photo"
      description="We'll use it on the cover"
      previousStep="/create/love/love-story/ideas"
      nextStep="/create/love/love-story/generate"
      currentStep={4}
      totalSteps={5}
    >
      <div className="space-y-6">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-medium mb-4 text-center">Character Photo</h3>
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
                  {isLoading ? "Processing..." : "Click to upload character photo"}
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
            This photo will be used to generate personalized story images.
          </p>
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryMomentsStep;
