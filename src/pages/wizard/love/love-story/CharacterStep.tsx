import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const LoveStoryCharacterStep = () => {
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [age, setAge] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedFirstName = localStorage.getItem('loveStoryPersonName');
    const savedGender = localStorage.getItem('loveStoryPersonGender');
    const savedAge = localStorage.getItem('loveStoryPersonAge');
    
    if (savedFirstName) setFirstName(savedFirstName);
    if (savedGender) setGender(savedGender as 'male' | 'female');
    if (savedAge) setAge(savedAge);
  }, []);

  const handleContinue = () => {
    if (!firstName.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter their name to continue"
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

    if (!age.trim()) {
      toast({
        variant: "destructive",
        title: "Age required",
        description: "Please enter their age to continue"
      });
      return;
    }

    // Validate age is a number and within reasonable range
    const ageNumber = parseInt(age);
    if (isNaN(ageNumber) || ageNumber < 1 || ageNumber > 120) {
      toast({
        variant: "destructive",
        title: "Invalid age",
        description: "Please enter a valid age between 1 and 120"
      });
      return;
    }

    localStorage.setItem('loveStoryPersonName', firstName.trim());
    localStorage.setItem('loveStoryPersonGender', gender);
    localStorage.setItem('loveStoryPersonAge', age);
    
    navigate('/create/love/love-story/author');
  };

  return (
    <WizardStep 
      title="Character Information" 
      description="Tell us about the main character of the story" 
      previousStep="/love" 
      currentStep={1} 
      totalSteps={5} 
      onNextClick={handleContinue}
    >
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Who is the main character?</label>
          <Input placeholder="Enter their name" value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Their gender</label>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              type="button" 
              variant={gender === 'male' ? 'default' : 'outline'} 
              className="w-full py-6 text-lg" 
              onClick={() => setGender('male')}
            >
              Male
            </Button>
            <Button 
              type="button" 
              variant={gender === 'female' ? 'default' : 'outline'} 
              className="w-full py-6 text-lg" 
              onClick={() => setGender('female')}
            >
              Female
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Their age</label>
          <Input 
            type="number" 
            placeholder="Enter their age" 
            value={age} 
            onChange={e => setAge(e.target.value)}
            min="1"
            max="120"
          />
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveStoryCharacterStep;