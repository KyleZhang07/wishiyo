
import IdeaStep from '@/components/wizard/IdeaStep';

const LoveStoryIdeasStep = () => {
  return (
    <IdeaStep
      category="love"
      previousStep="/create/love/travel-book/questions"
      nextStep="/create/love/travel-book/moments"
    />
  );
};

export default LoveStoryIdeasStep;
