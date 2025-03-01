import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const LoveStoryAuthorStep = () => {
  const [authorName, setAuthorName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedAuthorName = localStorage.getItem('loveStoryAuthorName');
    if (savedAuthorName) setAuthorName(savedAuthorName);
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
    navigate('/create/love/love-story/questions');
  };

  return (
    <WizardStep 
      title="Author Information" 
      description="Tell us about yourself" 
      previousStep="/create/love/love-story/character" 
      currentStep={2} 
      totalSteps={5} 
      onNextClick={handleContinue}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Author name</label>
          <Input placeholder="Enter your name" value={authorName} onChange={e => setAuthorName(e.target.value)} />
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryAuthorStep;