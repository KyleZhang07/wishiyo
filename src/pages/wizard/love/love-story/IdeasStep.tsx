
import IdeaStep from '@/components/wizard/IdeaStep';

const LoveStoryIdeasStep = () => {
  return (
    <IdeaStep
      category="love"
      previousStep="/create/love/love-story/questions"
      nextStep="/create/love/love-story/moments"
    />
  );
};

export default LoveStoryIdeasStep;
