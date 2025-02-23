
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

const FantasyBookMomentsStep = () => {
  const [moments, setMoments] = useState<string[]>(["", "", ""]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleMomentChange = (index: number, value: string) => {
    const newMoments = [...moments];
    newMoments[index] = value;
    setMoments(newMoments);
  };

  const handleContinue = () => {
    if (!moments.some(moment => moment.trim())) {
      toast({
        title: "At least one moment required",
        description: "Please describe at least one key moment to continue.",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("fantasyBookMoments", JSON.stringify(moments));
    navigate("/create/fantasy/fantasy-book/generate");
  };

  return (
    <WizardStep
      title="Key Story Moments"
      description="Describe some key moments that will happen in your story."
      previousStep="/create/fantasy/fantasy-book/ideas"
      currentStep={4}
      totalSteps={5}
      onNextClick={handleContinue}
    >
      <div className="space-y-6">
        {moments.map((moment, index) => (
          <div key={index} className="space-y-2">
            <h3 className="font-medium">Key Moment {index + 1}</h3>
            <Textarea
              placeholder="Describe a key moment in your story..."
              value={moment}
              onChange={(e) => handleMomentChange(index, e.target.value)}
            />
          </div>
        ))}
      </div>
    </WizardStep>
  );
};

export default FantasyBookMomentsStep;
