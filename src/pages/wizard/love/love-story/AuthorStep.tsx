
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const LoveStoryAuthorStep = () => {
  const [personName, setPersonName] = useState('');
  const [authorName, setAuthorName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedPersonName = localStorage.getItem('loveStoryPersonName');
    const savedAuthorName = localStorage.getItem('loveStoryAuthorName');
    if (savedPersonName) setPersonName(savedPersonName);
    if (savedAuthorName) setAuthorName(savedAuthorName);
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

    if (!authorName.trim()) {
      toast({
        variant: "destructive",
        title: "Author name required",
        description: "Please enter your name to continue"
      });
      return;
    }

    localStorage.setItem('loveStoryPersonName', personName.trim());
    localStorage.setItem('loveStoryAuthorName', authorName.trim());
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
        <div>
          <label className="block text-sm font-medium mb-2">Your Name</label>
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
