import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LoveStoryMomentsStep = () => {
  const [characterPhotos, setCharacterPhotos] = useState<string[]>([]);
  const characterFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const MAX_PHOTOS = 4;

  useEffect(() => {
    // 从localStorage获取已保存的照片
    const savedPhotos = localStorage.getItem('loveStoryPartnerPhotos');
    if (savedPhotos) {
      setCharacterPhotos(JSON.parse(savedPhotos));
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // 检查照片总数是否会超过最大限制
    if (characterPhotos.length + files.length > MAX_PHOTOS) {
      toast({
        variant: "destructive",
        title: "Too many photos",
        description: `You can only upload up to ${MAX_PHOTOS} photos in total.`
      });
      return;
    }

    // 处理所有选择的文件
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload image files only (PNG, JPG, etc.)"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setCharacterPhotos(prev => {
          const newPhotos = [...prev, dataUrl];
          localStorage.setItem('loveStoryPartnerPhotos', JSON.stringify(newPhotos));
          return newPhotos;
        });
      };
      reader.readAsDataURL(file);
    });

    // 成功上传提示
    toast({
      title: "Photos uploaded successfully",
      description: "Your character's photos have been saved"
    });

    // 清空文件输入，以便再次选择相同的文件
    if (characterFileInputRef.current) {
      characterFileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    characterFileInputRef.current?.click();
  };

  const handleRemovePhoto = (index: number) => {
    setCharacterPhotos(prev => {
      const newPhotos = prev.filter((_, i) => i !== index);
      localStorage.setItem('loveStoryPartnerPhotos', JSON.stringify(newPhotos));
      return newPhotos;
    });
  };

  return (
    <WizardStep
      title="Upload your character's photos"
      description="We'll use them on the cover (upload up to 4 photos)"
      previousStep="/create/love/love-story/questions"
      nextStep="/create/love/love-story/style"
      currentStep={3}
      totalSteps={6}
    >
      <div className="space-y-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-medium mb-4 text-center">Character's Photos</h3>
          <input 
            type="file"
            ref={characterFileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            multiple
          />
          
          <div className="flex flex-row gap-4 overflow-x-auto pb-2">
            {characterPhotos.map((photo, index) => (
              <div key={index} className="relative min-w-[150px] w-[150px] h-[150px] flex-shrink-0">
                <img 
                  src={photo} 
                  alt={`Character ${index + 1}`} 
                  className="w-full h-full object-cover rounded-lg border border-gray-300"
                />
                <button
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white"
                  aria-label="Remove photo"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            
            {characterPhotos.length < MAX_PHOTOS && (
              <button
                onClick={handleUploadClick}
                className="min-w-[150px] w-[150px] h-[150px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <ImagePlus className="h-8 w-8 text-gray-400" />
                <span className="text-gray-500 text-sm mt-2">Add photo</span>
              </button>
            )}
          </div>
          
          {characterPhotos.length === 0 && (
            <div className="text-center mt-4 text-gray-500">
              <p>Please upload at least one photo of your character.</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={handleUploadClick}
              >
                Upload Photos
              </Button>
            </div>
          )}
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryMomentsStep;
