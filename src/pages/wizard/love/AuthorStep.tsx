
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const LoveAuthorStep = () => {
  const [authorName, setAuthorName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!authorName.trim()) {
      toast({
        variant: "destructive",
        title: "Author name required",
        description: "Please enter the author name to continue"
      });
      return;
    }

    navigate('/create/love/question');
  };

  return (
    <WizardStep
      title="Who is creating this love book?"
      description="Enter your name as it will appear in the book."
      previousStep="/love"
      currentStep={1}
      totalSteps={3}
      onNextClick={handleContinue}
    >
      <div className="space-y-4">
        <div>
          <Input
            id="authorName"
            placeholder="Enter your name"
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
          />
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveAuthorStep;
