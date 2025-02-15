
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const LovePoemsAuthorStep = () => {
  const [name, setName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!name.trim() || !partnerName.trim()) {
      toast({
        variant: "destructive",
        title: "Names required",
        description: "Please enter both names to continue"
      });
      return;
    }

    navigate('/create/love/love-poems/feelings');
  };

  return (
    <WizardStep
      title="Create Love Poems"
      description="Let's start with your names"
      previousStep="/love"
      currentStep={1}
      totalSteps={4}
      onNextClick={handleContinue}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Your Name</label>
          <Input
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Your Partner's Name</label>
          <Input
            placeholder="Enter your partner's name"
            value={partnerName}
            onChange={e => setPartnerName(e.target.value)}
          />
        </div>
      </div>
    </WizardStep>
  );
};

export default LovePoemsAuthorStep;
