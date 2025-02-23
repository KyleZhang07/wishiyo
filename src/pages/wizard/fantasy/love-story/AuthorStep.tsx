
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const LoveStoryAuthorStep = () => {
  const [authorName, setAuthorName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedName = localStorage.getItem('loveStoryAuthorName');
    if (savedName) {
      setAuthorName(savedName);
    }
  }, []);

  const handleContinue = () => {
    if (!authorName.trim()) {
      toast({
        variant: "destructive",
        title: "Author name required",
        description: "Please enter your name to continue"
      });
      return;
    }

    localStorage.setItem('loveStoryAuthorName', authorName.trim());
    navigate('/create/fantasy/love-story/questions');
  };

  return (
    <WizardStep
      title="Start Your Love Story"
      description="Let's begin with your name as the author"
      previousStep="/fantasy"
      currentStep={1}
      totalSteps={5}
      onNextClick={handleContinue}
    >
      <div className="space-y-4">
        <div>
          <Input
            placeholder="Enter your name"
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
          />
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryAuthorStep;
