
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const LoveStoryAuthorStep = () => {
  const [personName, setPersonName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedPersonName = localStorage.getItem('loveStoryPersonName');
    if (savedPersonName) setPersonName(savedPersonName);
  }, []);

  const handleContinue = () => {
    if (!personName.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter their name to continue"
      });
      return;
    }

    localStorage.setItem('loveStoryPersonName', personName.trim());
    navigate('/create/love/love-story/questions');
  };

  return (
    <WizardStep
      title="Begin Your Story"
      description="Let's start with some basic information"
      previousStep="/love"
      currentStep={1}
      totalSteps={4}
      onNextClick={handleContinue}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Their Name</label>
          <Input
            placeholder="Enter their name"
            value={personName}
            onChange={e => setPersonName(e.target.value)}
          />
        </div>
        <p className="text-gray-600 text-center mt-4">
          Welcome to your story journey. Enter the name of the person you want to create this story for.
        </p>
      </div>
    </WizardStep>
  );
};

export default LoveStoryAuthorStep;
