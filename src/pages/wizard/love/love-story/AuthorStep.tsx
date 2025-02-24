import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
const LoveStoryAuthorStep = () => {
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [authorName, setAuthorName] = useState('');
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  useEffect(() => {
    const savedFirstName = localStorage.getItem('loveStoryPersonName');
    const savedGender = localStorage.getItem('loveStoryPersonGender');
    const savedAuthorName = localStorage.getItem('loveStoryAuthorName');
    if (savedFirstName) setFirstName(savedFirstName);
    if (savedGender) setGender(savedGender as 'male' | 'female');
    if (savedAuthorName) setAuthorName(savedAuthorName);
  }, []);
  const handleContinue = () => {
    if (!firstName.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter their first name to continue"
      });
      return;
    }
    if (!gender) {
      toast({
        variant: "destructive",
        title: "Gender required",
        description: "Please select their gender to continue"
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
    localStorage.setItem('loveStoryPersonName', firstName.trim());
    localStorage.setItem('loveStoryPersonGender', gender);
    localStorage.setItem('loveStoryAuthorName', authorName.trim());
    navigate('/create/love/love-story/questions');
  };
  return <WizardStep title="Begin Your Story" description="Let's start with some basic information" previousStep="/love" currentStep={1} totalSteps={4} onNextClick={handleContinue}>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Recipient's Name</label>
          <Input placeholder="Enter their first name" value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button type="button" variant={gender === 'male' ? 'default' : 'outline'} className="w-full py-6 text-lg" onClick={() => setGender('male')}>
              Male
            </Button>
            <Button type="button" variant={gender === 'female' ? 'default' : 'outline'} className="w-full py-6 text-lg" onClick={() => setGender('female')}>
              Female
            </Button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Your Name</label>
          <Input placeholder="Enter your name" value={authorName} onChange={e => setAuthorName(e.target.value)} />
        </div>
      </div>
    </WizardStep>;
};
export default LoveStoryAuthorStep;