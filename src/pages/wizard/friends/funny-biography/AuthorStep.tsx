
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const FunnyBiographyAuthorStep = () => {
  const [authorName, setAuthorName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!authorName.trim()) {
      toast({
        variant: "destructive",
        title: "Author name required",
        description: "Please enter your name to continue"
      });
      return;
    }

    navigate('/create/friends/funny-biography/stories');
  };

  return (
    <WizardStep
      title="Who's Writing This Funny Biography?"
      description="Let's start with your name - you're about to create something hilarious!"
      previousStep="/friends"
      currentStep={1}
      totalSteps={4}
      onNextClick={handleContinue}
    >
      <div className="space-y-4">
        <div>
          <Input
            id="authorName"
            placeholder="Enter your name (aka Chief Comedy Officer)"
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
          />
        </div>
      </div>
    </WizardStep>
  );
};

export default FunnyBiographyAuthorStep;
