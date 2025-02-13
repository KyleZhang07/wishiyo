
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const KidsAuthorStep = () => {
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

    navigate('/create/kids/question');
  };

  return (
    <WizardStep
      title="Who is creating this children's book?"
      description="Enter your name as it will appear in the book."
      previousStep="/kids"
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

export default KidsAuthorStep;
