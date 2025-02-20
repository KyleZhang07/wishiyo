
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const PictureAlbumAuthorStep = () => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Album title required",
        description: "Please enter a title for your album"
      });
      return;
    }

    navigate('/create/love/picture-album/photos');
  };

  return (
    <WizardStep
      title="Create Your Love Album"
      description="Give your album a meaningful title"
      previousStep="/love"
      currentStep={1}
      totalSteps={3}
      onNextClick={handleContinue}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Album Title</label>
          <Input
            placeholder="Our Love Story in Pictures"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Subtitle (Optional)</label>
          <Input
            placeholder="A journey of love and memories"
            value={subtitle}
            onChange={e => setSubtitle(e.target.value)}
          />
        </div>
      </div>
    </WizardStep>
  );
};

export default PictureAlbumAuthorStep;
