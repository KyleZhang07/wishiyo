
import IdeaStep from '@/components/wizard/IdeaStep';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useEffect } from 'react';

const LoveStoryIdeasStep = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have the required information
    const firstName = localStorage.getItem('loveStoryPersonName');
    const gender = localStorage.getItem('loveStoryPersonGender');
    const authorName = localStorage.getItem('loveStoryAuthorName');

    if (!firstName || !gender || !authorName) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please complete the previous step first"
      });
      navigate('/create/love/love-story/author');
    }
  }, [navigate, toast]);

  return (
    <IdeaStep
      category="love"
      previousStep="/create/love/love-story/questions"
      nextStep="/create/love/love-story/debug-prompts"
    />
  );
};

export default LoveStoryIdeasStep;
