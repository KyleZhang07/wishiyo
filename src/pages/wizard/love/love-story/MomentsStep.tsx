import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as faceapi from 'face-api.js';

const LoveStoryMomentsStep = () => {
  const [characterPhoto, setCharacterPhoto] = useState<string | null>(null);
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
    const savedCharacterPhoto = localStorage.getItem('loveStoryPartnerPhoto');
    if (savedCharacterPhoto) {
      setCharacterPhoto(savedCharacterPhoto);
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
          // 删除之前可能存在的照片数据
          localStorage.removeItem('loveStoryPartnerPhoto');
          setCharacterPhoto(null);
          toast({
            variant: "destructive",
            title: "No face detected",
            description: "Please upload a photo that clearly shows a face."
          });
          return;
        }
        
        // Face detected, proceed with saving the image
        setCharacterPhoto(dataUrl);
        localStorage.setItem('loveStoryPartnerPhoto', dataUrl);
        setIsLoading(false);
        toast({
          title: "Photo uploaded successfully",
          description: "Your character's photo has been saved"
        });
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

  return (
    <WizardStep
      title="Upload your character's photo"
      description="We'll use it on the cover"
      previousStep="/create/love/love-story/questions"
      nextStep="/create/love/love-story/style"
      currentStep={3}
      totalSteps={6}
    >
      <div className="space-y-6">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-medium mb-4 text-center">Character's Photo</h3>
          <input 
            type="file"
            ref={characterFileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
          <div className="aspect-square w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center relative">
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
                <div className="text-white">Processing image...</div>
              </div>
            )}
            {!characterPhoto ? (
              <Button
                variant="ghost"
                className="w-full h-full flex flex-col items-center justify-center gap-4"
                onClick={handleUploadClick}
                disabled={isLoading}
              >
                <ImagePlus className="h-12 w-12 text-gray-400" />
                <span className="text-gray-500">Click to upload character's photo</span>
                <span className="text-xs text-gray-400">Photo must contain a clear face</span>
              </Button>
            ) : (
              <button
                className="w-full h-full p-0 hover:opacity-90 transition-opacity relative group"
                onClick={handleUploadClick}
                disabled={isLoading}
              >
                <img 
                  src={characterPhoto} 
                  alt="Character" 
                  className="w-full h-full object-cover rounded-lg" 
                  ref={imageRef}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                  <span className="text-white font-medium">Click to replace photo</span>
                </div>
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            For best results, upload a photo with a clear face and good lighting
          </p>
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryMomentsStep;
