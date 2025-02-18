
import { useState, useRef, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to always download models
env.allowLocalModels = false;
env.useBrowserCache = false;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_DIMENSION = 1200;

const FunnyBiographyPhotosStep = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedPhoto = localStorage.getItem('funnyBiographyPhoto');
      if (savedPhoto) {
        setPhoto(savedPhoto);
      }
    } catch (error) {
      console.error('Error loading photo from localStorage:', error);
    }
  }, []);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
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

  const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
    try {
      console.log('Starting background removal process...');
      const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
        device: 'webgpu',
      });
      
      // Convert HTMLImageElement to canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      ctx.drawImage(imageElement, 0, 0);
      
      // Get image data as base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      console.log('Image converted to base64');
      
      // Process the image with the segmentation model
      console.log('Processing with segmentation model...');
      const result = await segmenter(imageData);
      
      console.log('Segmentation result:', result);
      
      if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
        throw new Error('Invalid segmentation result');
      }
      
      // Create a new canvas for the masked image
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = canvas.width;
      outputCanvas.height = canvas.height;
      const outputCtx = outputCanvas.getContext('2d');
      
      if (!outputCtx) throw new Error('Could not get output canvas context');
      
      // Draw original image
      outputCtx.drawImage(canvas, 0, 0);
      
      // Apply the mask
      const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
      const data = outputImageData.data;
      
      // Apply inverted mask to alpha channel
      for (let i = 0; i < result[0].mask.data.length; i++) {
        const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
        data[i * 4 + 3] = alpha;
      }
      
      outputCtx.putImageData(outputImageData, 0, 0);
      
      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        outputCanvas.toBlob(
          (blob) => {
            if (blob) {
              console.log('Successfully created final blob');
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/png',
          1.0
        );
      });
    } catch (error) {
      console.error('Error removing background:', error);
      throw error;
    }
  };

  const loadImage = (file: Blob): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
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

    setIsProcessing(true);
    try {
      const compressedDataUrl = await compressImage(file);
      
      // Convert base64 to blob
      const response = await fetch(compressedDataUrl);
      const blob = await response.blob();
      
      // Load image for processing
      const img = await loadImage(blob);
      
      // Remove background
      toast({
        title: "Processing image",
        description: "Removing background... Please wait"
      });
      
      const processedBlob = await removeBackground(img);
      const processedUrl = URL.createObjectURL(processedBlob);
      
      setPhoto(processedUrl);
      
      try {
        localStorage.setItem('funnyBiographyPhoto', processedUrl);
        toast({
          title: "Photo uploaded successfully",
          description: "Background removed and photo saved"
        });
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
    } finally {
      setIsProcessing(false);
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
      currentStep={3}
      totalSteps={4}
    >
      <div className="space-y-6">
        <input 
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isProcessing}
        />
        <div className="aspect-square w-full max-w-md mx-auto border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center">
          {!photo ? (
            <Button
              variant="ghost"
              className="w-full h-full flex flex-col items-center justify-center gap-4"
              onClick={handleUploadClick}
              disabled={isProcessing}
            >
              <ImagePlus className="h-12 w-12 text-gray-400" />
              <span className="text-gray-500">
                {isProcessing ? "Processing..." : "Click to upload"}
              </span>
            </Button>
          ) : (
            <button
              className="w-full h-full p-0 hover:opacity-90 transition-opacity relative group"
              onClick={handleUploadClick}
              disabled={isProcessing}
            >
              <img src={photo} alt="" className="w-full h-full object-cover rounded-lg" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <span className="text-white font-medium">
                  {isProcessing ? "Processing..." : "Click to replace photo"}
                </span>
              </div>
            </button>
          )}
        </div>
      </div>
    </WizardStep>
  );
};

export default FunnyBiographyPhotosStep;
