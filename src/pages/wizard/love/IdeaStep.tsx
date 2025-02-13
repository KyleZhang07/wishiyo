
import IdeaStep from '@/components/wizard/IdeaStep';

const LoveIdeaStep = () => {
  return (
    <IdeaStep
      category="love"
      previousStep="/create/love/question"
      nextStep="/create/love/moments"
    />
  );
};

export default LoveIdeaStep;
