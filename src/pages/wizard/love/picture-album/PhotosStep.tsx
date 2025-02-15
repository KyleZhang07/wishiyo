
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { ImagePlus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface PhotoEntry {
  url: string;
  caption: string;
  date: string;
}

const PictureAlbumPhotosStep = () => {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<PhotoEntry | null>(null);

  const handleAddPhoto = () => {
    if (currentPhoto) {
      setPhotos([...photos, currentPhoto]);
      setCurrentPhoto(null);
    }
  };

  return (
    <WizardStep
      title="Add Your Love Photos"
      description="Create a beautiful collection of your memories"
      previousStep="/create/love/picture-album/author"
      nextStep="/create/love/picture-album/generate"
      currentStep={2}
      totalSteps={3}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative">
              <div className="aspect-square">
                <img src={photo.url} alt="" className="w-full h-full object-cover rounded-lg" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-2 -top-2 rounded-full bg-white border shadow-sm hover:bg-gray-50 h-8 w-8 p-0"
                onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="mt-2 text-sm">
                <p className="font-medium">{photo.date}</p>
                <p className="text-gray-600">{photo.caption}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-4">Add New Photo</h3>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full aspect-video flex flex-col items-center justify-center border-dashed"
              onClick={() => {/* Photo upload logic */}}
            >
              <ImagePlus className="h-8 w-8 mb-2" />
              <span className="text-sm">Upload Photo</span>
            </Button>
            
            <Input
              type="date"
              placeholder="Date"
              onChange={e => setCurrentPhoto(prev => ({ ...prev!, date: e.target.value }))}
            />
            
            <Textarea
              placeholder="Write a caption for this memory..."
              onChange={e => setCurrentPhoto(prev => ({ ...prev!, caption: e.target.value }))}
            />
            
            <Button 
              className="w-full"
              onClick={handleAddPhoto}
              disabled={!currentPhoto}
            >
              Add to Album
            </Button>
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default PictureAlbumPhotosStep;
