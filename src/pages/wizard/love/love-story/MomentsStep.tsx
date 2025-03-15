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
    // 从 localStorage 加载所有照片
    const loadPhotos = () => {
      const photos = [];
      
      // 尝试加载主照片
      const mainPhoto = localStorage.getItem('loveStoryPartnerPhoto');
      if (mainPhoto) photos.push(mainPhoto);
      
      // 尝试加载额外照片
      for (let i = 2; i <= 4; i++) {
        const photo = localStorage.getItem(`loveStoryPartnerPhoto${i}`);
        if (photo) photos.push(photo);
      }
      
      setCharacterPhotos(photos);
    };
    
    loadPhotos();
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

    // 检查是否已达到最大图片数量
    if (characterPhotos.length >= 4) {
      toast({
        variant: "destructive",
        title: "Maximum photos reached",
        description: "You can upload a maximum of 4 photos. Please remove some before adding more."
      });
      return;
    }

    setIsLoading(true);

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
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "No face detected",
            description: "Please upload a photo that clearly shows a face."
          });
          return;
        }
        
        // Face detected, proceed with saving the image
        const newPhotos = [...characterPhotos, dataUrl];
        setCharacterPhotos(newPhotos);
        
        // 保存到 localStorage
        if (newPhotos.length === 1) {
          localStorage.setItem('loveStoryPartnerPhoto', dataUrl);
        } else {
          localStorage.setItem(`loveStoryPartnerPhoto${newPhotos.length}`, dataUrl);
        }
        
        setIsLoading(false);
      };
      
      img.onerror = () => {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Image loading error",
          description: "Failed to process the image. Please try another photo."
        });
      };
    };
    
    reader.onerror = () => {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "File reading error",
        description: "Failed to read the file. Please try again."
      });
    };
    
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    characterFileInputRef.current?.click();
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...characterPhotos];
    newPhotos.splice(index, 1);
    setCharacterPhotos(newPhotos);
    
    // 更新 localStorage
    // 首先清除所有照片
    localStorage.removeItem('loveStoryPartnerPhoto');
    for (let i = 2; i <= 4; i++) {
      localStorage.removeItem(`loveStoryPartnerPhoto${i}`);
    }
    
    // 然后重新保存剩余的照片
    newPhotos.forEach((photo, idx) => {
      if (idx === 0) {
        localStorage.setItem('loveStoryPartnerPhoto', photo);
      } else {
        localStorage.setItem(`loveStoryPartnerPhoto${idx + 1}`, photo);
      }
    });
  };

  return (
    <WizardStep
      title="Upload your character's photos"
      description="We'll use these to generate your love story (up to 4 photos)"
      previousStep="/create/love/love-story/questions"
      nextStep="/create/love/love-story/style"
      currentStep={3}
      totalSteps={6}
    >
      <div className="space-y-6">
        <div className="max-w-3xl mx-auto">
          <input 
            type="file"
            ref={characterFileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 显示已上传的照片 */}
            {characterPhotos.map((photo, index) => (
              <div 
                key={index}
                className="aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden border border-gray-200 relative group"
              >
                <img 
                  src={photo} 
                  alt={`Character photo ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            {/* 上传按钮，如果照片数量小于4 */}
            {characterPhotos.length < 4 && (
              <div 
                className="aspect-square w-full max-w-sm mx-auto border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                onClick={handleUploadClick}
              >
                <Plus className="h-8 w-8 text-gray-400" />
                <span className="text-gray-500 text-sm mt-2">Add photo ({characterPhotos.length}/4)</span>
              </div>
            )}
          </div>
          
          {characterPhotos.length === 0 && (
            <div className="text-center mt-4 text-gray-500">
              <p>Upload at least one photo to continue. More photos will improve the quality of your story.</p>
            </div>
          )}
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryMomentsStep;
