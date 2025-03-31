
import IdeaStep from '@/components/wizard/IdeaStep';

const LoveStoryIdeasStep = () => {
  return (
    <IdeaStep
      category="love"
      previousStep="/create/love/love-story/style"
      nextStep="/create/love/love-story/cover"
      currentStep={5}
      totalSteps={8}
    />
  );
};

export default LoveStoryIdeasStep;
