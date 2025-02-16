
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const WildFantasyAuthorStep = () => {
  const [authorName, setAuthorName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedName = localStorage.getItem('wildFantasyAuthorName');
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

    localStorage.setItem('wildFantasyAuthorName', authorName.trim());
    navigate('/create/friends/wild-fantasy/adventure');
  };

  return (
    <WizardStep
      title="Begin Your Magical Journey"
      description="Enter your name, brave storyteller!"
      previousStep="/friends"
      currentStep={1}
      totalSteps={4}
      onNextClick={handleContinue}
    >
      <div className="space-y-4">
        <div>
          <Input
            id="authorName"
            placeholder="Enter your name (Keeper of Tales)"
            value={authorName}
            onChange={e => setAuthorName(e.target.value)}
          />
        </div>
      </div>
    </WizardStep>
  );
};

export default WildFantasyAuthorStep;
