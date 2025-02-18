
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import CoverPreview from '@/components/cover-generator/CoverPreview';
import FontSelector from '@/components/cover-generator/FontSelector';

const FunnyBiographyGenerateStep = () => {
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [selectedFont, setSelectedFont] = useState('font-sans');

  useEffect(() => {
    // Load data from localStorage
    const savedAuthor = localStorage.getItem('authorName');
    const savedIdea = localStorage.getItem('selectedIdea');
    const savedPhotos = localStorage.getItem('uploadedPhotos');

    if (savedAuthor) {
      setAuthorName(savedAuthor);
    }

    if (savedIdea) {
      const idea = JSON.parse(savedIdea);
      setCoverTitle(idea.title || '');
      setSubtitle(idea.subtitle || '');
    }

    if (savedPhotos) {
      const photos = JSON.parse(savedPhotos);
      if (photos.length > 0) {
        setCoverImage(photos[0]);
      }
    }
  }, []);

  return (
    <WizardStep
      title="Create Your Book Cover"
      description="Design the perfect cover for your funny biography"
      previousStep="/create/friends/funny-biography/photos"
      currentStep={4}
      totalSteps={4}
    >
      <div className="glass-card rounded-2xl p-8 py-[40px]">
        <div className="max-w-xl mx-auto space-y-8">
          <CoverPreview
            coverTitle={coverTitle}
            subtitle={subtitle}
            authorName={authorName}
            coverImage={coverImage}
            selectedFont={selectedFont}
          />
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-center">Choose Your Font Style</h3>
            <FontSelector
              selectedFont={selectedFont}
              onSelectFont={setSelectedFont}
            />
          </div>

          <Button 
            className="w-full py-6 text-lg"
            onClick={() => {/* Generate book logic */}}
          >
            Generate Your Book
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default FunnyBiographyGenerateStep;
