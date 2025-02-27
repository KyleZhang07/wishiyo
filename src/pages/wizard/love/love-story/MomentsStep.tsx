import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, Plus, X } from "lucide-react";
import WizardStep from "@/components/wizard/WizardStep";
import { cn } from "@/lib/utils";

export function LoveStoryMomentsStep() {
  const [characterPhotos, setCharacterPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const MAX_PHOTOS = 4; // Maximum number of photos allowed

  // Check for existing character photos or migrate legacy photos on mount
  useEffect(() => {
    const savedPhotos = localStorage.getItem("love-story-character-photos");
    if (savedPhotos) {
      try {
        setCharacterPhotos(JSON.parse(savedPhotos));
      } catch (error) {
        console.error("Error parsing saved character photos:", error);
      }
    } else {
      // Check for legacy partner photo
      const legacyPhoto = localStorage.getItem("loveStoryPartnerPhoto");
      if (legacyPhoto) {
        // Migrate the legacy photo to the new format
        const migratedPhotos = [legacyPhoto];
        setCharacterPhotos(migratedPhotos);
        localStorage.setItem("love-story-character-photos", JSON.stringify(migratedPhotos));
      }
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if adding new photos would exceed the limit
    if (characterPhotos.length + files.length > MAX_PHOTOS) {
      toast({
        title: "Too many photos",
        description: `You can upload a maximum of ${MAX_PHOTOS} photos. Please select fewer images.`,
        variant: "destructive",
      });
      return;
    }

    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload only image files",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          const newPhotos = [...characterPhotos, e.target.result as string];
          setCharacterPhotos(newPhotos);
          localStorage.setItem("love-story-character-photos", JSON.stringify(newPhotos));
          
          toast({
            title: "Photo uploaded",
            description: `Character photo ${newPhotos.length} added successfully`,
          });
        }
      };

      reader.readAsDataURL(file);
    });

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = characterPhotos.filter((_, i) => i !== index);
    setCharacterPhotos(newPhotos);
    localStorage.setItem("love-story-character-photos", JSON.stringify(newPhotos));
    
    toast({
      title: "Photo removed",
      description: "Character photo removed successfully",
    });
  };

  return (
    <WizardStep
      title="Character Photos"
      description="Upload photos of the main character for your love story. These photos will be used to generate personalized story images."
      previousStep="/create/love/love-story/ideas"
      nextStep="/create/love/love-story/generate"
      currentStep={3}
      totalSteps={5}
    >
      <div className="flex flex-col max-w-[720px] mx-auto">
        <h2 className="text-lg font-medium mb-4">Upload Photos</h2>
        <p className="text-muted-foreground mb-6">
          For best results, upload 2-4 clear, close-up photos of the same person.
        </p>

        {/* Display existing photos */}
        {characterPhotos.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Uploaded Photos ({characterPhotos.length}/{MAX_PHOTOS})</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {characterPhotos.map((photo, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden border aspect-square">
                  <img 
                    src={photo} 
                    alt={`Character photo ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-8 h-8"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload new photo button */}
        {characterPhotos.length < MAX_PHOTOS && (
          <div className="mb-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Character Photo
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              {characterPhotos.length === 0 
                ? "Add at least one photo to continue. For best results, upload 2-4 photos." 
                : `${MAX_PHOTOS - characterPhotos.length} more photos can be added for better quality results.`}
            </p>
          </div>
        )}

        {/* Tips for good photos */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <h3 className="font-medium mb-2">Tips for best results:</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Use clear, well-lit photos of the same person</li>
            <li>Choose photos with different expressions</li>
            <li>Close-up face shots work best</li>
            <li>Avoid group photos or images with multiple people</li>
            <li>Upload 2-4 photos for higher quality results</li>
          </ul>
        </div>
      </div>
    </WizardStep>
  );
}
