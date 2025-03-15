import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as faceapi from 'face-api.js';

const LoveStoryMomentsStep = () => {
  const [characterPhotos, setCharacterPhotos] = useState<string[]>([]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const characterFileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  // Load face-api models on component mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        // Models should be in the public folder
        const MODEL_URL = '/models';
        
        // Load required models for face detection
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);
        
        setIsModelLoaded(true);
        console.log('Face detection models loaded successfully');
      } catch (error) {
        console.error('Error loading face detection models:', error);
        toast({
          variant: "destructive",
          title: "Model loading error",
          description: "Could not load face detection models. Please try again later."
        });
      }
    };

    loadModels();
  }, [toast]);

  useEffect(() => {
    // 从 localStorage 加载已保存的照片
    const savedPhotos = localStorage.getItem('loveStoryPartnerPhotos');
    if (savedPhotos) {
      try {
        const parsedPhotos = JSON.parse(savedPhotos);
        if (Array.isArray(parsedPhotos) && parsedPhotos.length > 0) {
          setCharacterPhotos(parsedPhotos);
        } else {
          // 向后兼容：检查旧版单照片存储
          const singlePhoto = localStorage.getItem('loveStoryPartnerPhoto');
          if (singlePhoto) {
            setCharacterPhotos([singlePhoto]);
            // 迁移到新格式
            localStorage.setItem('loveStoryPartnerPhotos', JSON.stringify([singlePhoto]));
          }
        }
      } catch (error) {
        console.error('Error parsing saved photos:', error);
      }
    } else {
      // 向后兼容：检查旧版单照片存储
      const singlePhoto = localStorage.getItem('loveStoryPartnerPhoto');
      if (singlePhoto) {
        setCharacterPhotos([singlePhoto]);
        // 迁移到新格式
        localStorage.setItem('loveStoryPartnerPhotos', JSON.stringify([singlePhoto]));
      }
    }
  }, []);

  // Function to detect faces in an image
  const detectFaces = async (imageElement: HTMLImageElement): Promise<boolean> => {
    if (!isModelLoaded) {
      console.warn('Face detection models not loaded yet');
      return true; // Allow the upload if models aren't loaded
    }

    try {
      // Detect faces using TinyFaceDetector (fast and efficient)
      const detections = await faceapi.detectAllFaces(
        imageElement,
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
      ).withFaceLandmarks();
      
      // Return true if at least one face is detected
      return detections.length > 0;
    } catch (error) {
      console.error('Error during face detection:', error);
      return true; // Allow upload on error to avoid blocking users
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);

    // 处理单个文件
    const processFile = async (file: File): Promise<string | null> => {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload an image file (PNG, JPG, etc.)"
        });
        return null;
      }

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          
          // Create an image element for face detection
          const img = new Image();
          img.src = dataUrl;
          
          img.onload = async () => {
            // Check if the image contains a face
            const hasFace = await detectFaces(img);
            
            if (!hasFace) {
              toast({
                variant: "destructive",
                title: "No face detected",
                description: "Please upload a photo that clearly shows a face."
              });
              resolve(null);
              return;
            }
            
            // Face detected, return the image data
            resolve(dataUrl);
          };
          
          img.onerror = () => {
            toast({
              variant: "destructive",
              title: "Image loading error",
              description: "Failed to process the image. Please try another photo."
            });
            resolve(null);
          };
        };
        
        reader.onerror = () => {
          toast({
            variant: "destructive",
            title: "File reading error",
            description: "Failed to read the file. Please try again."
          });
          resolve(null);
        };
        
        reader.readAsDataURL(file);
      });
    };

    // 处理所有选择的文件
    const newPhotos: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const result = await processFile(files[i]);
      if (result) {
        newPhotos.push(result);
      }
    }

    if (newPhotos.length > 0) {
      // 添加新照片到现有照片列表
      const updatedPhotos = [...characterPhotos, ...newPhotos];
      // 限制最多5张照片
      const limitedPhotos = updatedPhotos.slice(0, 5);
      
      setCharacterPhotos(limitedPhotos);
      localStorage.setItem('loveStoryPartnerPhotos', JSON.stringify(limitedPhotos));
      
      // 为了向后兼容，也保存第一张照片到旧的键
      if (limitedPhotos.length > 0) {
        localStorage.setItem('loveStoryPartnerPhoto', limitedPhotos[0]);
      }
    }

    setIsLoading(false);
    // 清空文件输入，以便可以再次选择相同的文件
    if (characterFileInputRef.current) {
      characterFileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    characterFileInputRef.current?.click();
  };

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = characterPhotos.filter((_, i) => i !== index);
    setCharacterPhotos(updatedPhotos);
    localStorage.setItem('loveStoryPartnerPhotos', JSON.stringify(updatedPhotos));
    
    // 为了向后兼容，也更新旧的键
    if (updatedPhotos.length > 0) {
      localStorage.setItem('loveStoryPartnerPhoto', updatedPhotos[0]);
    } else {
      localStorage.removeItem('loveStoryPartnerPhoto');
    }
  };

  return (
    <WizardStep
      title="Upload your character's photos"
      description="Upload up to 5 photos to create a more accurate character"
      previousStep="/create/love/love-story/questions"
      nextStep="/create/love/love-story/style"
      currentStep={3}
      totalSteps={6}
    >
      <div className="space-y-6">
        <div className="max-w-4xl mx-auto">
          <input 
            type="file"
            ref={characterFileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
            multiple // 允许选择多个文件
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 现有照片 */}
            {characterPhotos.map((photo, index) => (
              <div 
                key={index}
                className="aspect-square w-full border border-gray-200 rounded-lg overflow-hidden relative"
              >
                <img 
                  src={photo} 
                  alt={`Character ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                <button
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  onClick={() => handleRemovePhoto(index)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            {/* 添加照片按钮 */}
            {characterPhotos.length < 5 && (
              <div 
                className="aspect-square w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-all cursor-pointer"
                onClick={handleUploadClick}
              >
                <Plus className="h-8 w-8 text-gray-400" />
                <span className="text-gray-500 text-sm mt-2">Add photo</span>
              </div>
            )}
          </div>
          
          {characterPhotos.length === 0 && (
            <div className="text-center mt-4">
              <p className="text-gray-500 mb-4">No photos uploaded yet. Upload at least one photo to continue.</p>
              <Button onClick={handleUploadClick} disabled={isLoading}>
                <ImagePlus className="h-4 w-4 mr-2" />
                {isLoading ? 'Uploading...' : 'Upload Photos'}
              </Button>
            </div>
          )}
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>For best results, upload clear photos showing the person's face from different angles.</p>
            <p className="mt-1">We'll use these photos to create a more accurate character in your story.</p>
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryMomentsStep;
