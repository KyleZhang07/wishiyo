
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const FunnyBiographyAuthorStep = () => {
  const [authorName, setAuthorName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedName = localStorage.getItem('funnyBiographyAuthorName');
    if (savedName) {
      setAuthorName(savedName);
    }
  }, []);

  const handleContinue = () => {
    localStorage.setItem('funnyBiographyAuthorName', authorName.trim());
    navigate('/create/friends/funny-biography/stories');
  };

  return (
    <WizardStep
      title="Who's writing this book?"
      description="It can be a friend, family member, or even your pet - anyone you want to create a story about!"
      previousStep="/friends"
      currentStep={1}
      totalSteps={7}
      onNextClick={handleContinue}
      nextDisabled={!authorName.trim()}
    >
      <div className="space-y-4">
        <div>
          <Input
            id="authorName"
            placeholder="Author's name"
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
          />
        </div>
      </div>
    </WizardStep>
  );
};

export default FunnyBiographyAuthorStep;
