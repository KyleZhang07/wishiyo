
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const KidsAdventureAuthorStep = () => {
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedName = localStorage.getItem('kidsAdventureChildName');
    const savedAge = localStorage.getItem('kidsAdventureChildAge');
    if (savedName) setChildName(savedName);
    if (savedAge) setChildAge(savedAge);
  }, []);

  const handleContinue = () => {
    if (!childName.trim() || !childAge.trim()) {
      toast({
        variant: "destructive",
        title: "Information required",
        description: "Please enter your child's name and age"
      });
      return;
    }

    localStorage.setItem('kidsAdventureChildName', childName.trim());
    localStorage.setItem('kidsAdventureChildAge', childAge.trim());
    navigate('/create/kids/adventure/character');
  };

  return (
    <WizardStep
      title="Create Your Child's Adventure"
      description="Let's make your child the hero of their own story!"
      previousStep="/kids"
      currentStep={1}
      totalSteps={4}
      onNextClick={handleContinue}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Child's Name</label>
          <Input
            placeholder="Enter child's name"
            value={childName}
            onChange={e => setChildName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Child's Age</label>
          <Input
            type="number"
            placeholder="Enter age"
            value={childAge}
            onChange={e => setChildAge(e.target.value)}
            min="1"
            max="12"
          />
        </div>
      </div>
    </WizardStep>
  );
};

export default KidsAdventureAuthorStep;
