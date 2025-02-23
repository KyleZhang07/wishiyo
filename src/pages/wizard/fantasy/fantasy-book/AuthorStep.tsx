
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import WizardStep from "@/components/wizard/WizardStep";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const FantasyBookAuthorStep = () => {
  const [authorName, setAuthorName] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleContinue = () => {
    if (!authorName.trim()) {
      toast({
        title: "Author name required",
        description: "Please enter your name to continue.",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("fantasyBookAuthorName", authorName);
    navigate("/create/fantasy/fantasy-book/questions");
  };

  return (
    <WizardStep
      title="Let's start with your name"
      description="This will appear as the author name on your book."
      currentStep={1}
      totalSteps={5}
      onNextClick={handleContinue}
    >
      <div className="space-y-4">
        <Input
          placeholder="Enter your name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />
      </div>
    </WizardStep>
  );
};

export default FantasyBookAuthorStep;
