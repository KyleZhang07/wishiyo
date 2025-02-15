
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const LearningJourneyAuthorStep = () => {
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!childName.trim() || !childAge.trim()) {
      toast({
        variant: "destructive",
        title: "Information required",
        description: "Please enter your child's name and age"
      });
      return;
    }

    navigate('/create/kids/learning/subject');
  };

  return (
    <WizardStep
      title="Start a Learning Journey"
      description="Let's create an educational adventure"
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

export default LearningJourneyAuthorStep;
