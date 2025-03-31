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

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        
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

  const detectFaces = async (imageElement: HTMLImageElement): Promise<boolean> => {
    if (!isModelLoaded) {
      console.warn('Face detection models not loaded yet');
      return true;
    }

    try {
      const detections = await faceapi.detectAllFaces(
        imageElement,
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
      ).withFaceLandmarks();
      
      return detections.length > 0;
    } catch (error) {
      console.error('Error during face detection:', error);
      return true;
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
      
      const img = new Image();
      img.src = dataUrl;
      
      img.onload = async () => {
        const hasFace = await detectFaces(img);
        
        if (!hasFace) {
          setIsLoading(false);
          localStorage.removeItem('loveStoryPartnerPhoto');
          setCharacterPhoto(null);
          toast({
            variant: "destructive",
            title: "No face detected",
            description: "Please upload a photo that clearly shows a face."
          });
          return;
        }
        
        setCharacterPhoto(dataUrl);
        localStorage.setItem('loveStoryPartnerPhoto', dataUrl);
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

  return (
    <WizardStep
      title="Upload your character's photo"
      description="We'll use it on the cover"
      previousStep="/create/love/love-story/questions"
      nextStep="/create/love/love-story/style"
      currentStep={3}
      totalSteps={8}
    >
      <div className="space-y-6">
        <div className="max-w-md mx-auto">
          <input 
            type="file"
            ref={characterFileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
          {!characterPhoto ? (
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
                src={characterPhoto} 
                alt="" 
                className="w-full h-full object-cover" 
                ref={imageRef}
              />
            </div>
          )}
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryMomentsStep;
