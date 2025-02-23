
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LoveStoryAuthorStep = () => {
  const [personName, setPersonName] = useState('');
  const [relationship, setRelationship] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedPersonName = localStorage.getItem('loveStoryPersonName');
    const savedRelationship = localStorage.getItem('loveStoryRelationship');
    if (savedPersonName) setPersonName(savedPersonName);
    if (savedRelationship) setRelationship(savedRelationship);
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

    if (!relationship) {
      toast({
        variant: "destructive",
        title: "Relationship required",
        description: "Please select your relationship to continue"
      });
      return;
    }

    localStorage.setItem('loveStoryPersonName', personName.trim());
    localStorage.setItem('loveStoryRelationship', relationship);
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
          <label className="block text-sm font-medium mb-2">Your Relationship</label>
          <Select value={relationship} onValueChange={setRelationship}>
            <SelectTrigger>
              <SelectValue placeholder="Select your relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="partner">Partner/Spouse</SelectItem>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
                <SelectItem value="mentor">Mentor</SelectItem>
                <SelectItem value="mentee">Mentee</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <p className="text-gray-600 text-center mt-4">
          Welcome to your story journey. Enter the name of the person you want to create this story for, and select your relationship with them.
        </p>
      </div>
    </WizardStep>
  );
};

export default LoveStoryAuthorStep;
