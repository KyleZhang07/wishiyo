
import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_DIMENSION = 1200;

const FunnyBiographyPhotosStep = () => {
  // 直接在状态初始化时从 localStorage 加载数据，避免闪烁
  const [photo, setPhoto] = useState<string | null>(() => {
    try {
      const savedPhoto = localStorage.getItem('funnyBiographyPhoto');
      return savedPhoto || null;
    } catch (error) {
      console.error('Error loading photo from localStorage:', error);
      return null;
    }
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
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

        // Compress as JPG with 0.7 quality
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
        localStorage.setItem('funnyBiographyPhoto', compressedDataUrl);
        // 重置生成状态，确保GenerateStep会重新生成
        localStorage.removeItem('funnyBiographyGenerationComplete');
        // 清除已生成的图片，确保会重新生成
        localStorage.removeItem('funnyBiographyFrontCoverImage');
        localStorage.removeItem('funnyBiographyBackCoverImage');
        localStorage.removeItem('funnyBiographySpineImage');
        // 清除已处理的图片，确保会重新进行背景去除
        localStorage.removeItem('funnyBiographyProcessedPhoto');
        console.log('上传新照片，清除已处理的图片缓存');
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
      currentStep={4}
      totalSteps={7}
      onNextClick={photo ? undefined : () => {}}
      nextDisabled={!photo}
    >
      <div className="space-y-6">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
        />
        {!photo ? (
          <div
            className="aspect-square w-full max-w-sm mx-auto border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:scale-[1.02] transition-all duration-300"
            onClick={handleUploadClick}
          >
            <ImagePlus className="h-8 w-8 text-gray-400" />
            <span className="text-gray-500 text-sm mt-2">Click to upload</span>
          </div>
        ) : (
          <div
            className="aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden border border-gray-200 hover:scale-[1.02] transition-all duration-300"
            onClick={handleUploadClick}
          >
            <img
              src={photo}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </WizardStep>
  );
};

export default FunnyBiographyPhotosStep;
