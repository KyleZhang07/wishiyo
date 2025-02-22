
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const LoveStoryAuthorStep = () => {
  const [partnerName, setPartnerName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedPartnerName = localStorage.getItem('loveStoryPartnerName');
    if (savedPartnerName) setPartnerName(savedPartnerName);
  }, []);

  const handleContinue = () => {
    if (!partnerName.trim()) {
      toast({
        variant: "destructive",
        title: "Partner's name required",
        description: "Please enter your partner's name to continue"
      });
      return;
    }

    localStorage.setItem('loveStoryPartnerName', partnerName.trim());
    navigate('/create/love/love-story/questions');
  };

  return (
    <WizardStep
      title="Begin Your Love Story"
      description="Let's start with your partner's name"
      previousStep="/love"
      currentStep={1}
      totalSteps={4}
      onNextClick={handleContinue}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Your Partner's Name</label>
          <Input
            placeholder="Enter your partner's name"
            value={partnerName}
            onChange={e => setPartnerName(e.target.value)}
          />
        </div>
        <p className="text-gray-600 text-center mt-4">
          Welcome to your love story journey. Enter your partner's name to begin creating your personalized story.
        </p>
      </div>
    </WizardStep>
  );
};

export default LoveStoryAuthorStep;
