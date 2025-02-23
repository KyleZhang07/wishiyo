
import IdeaStep from '@/components/wizard/IdeaStep';

const LoveStoryIdeasStep = () => {
  return (
    <IdeaStep
      category="fantasy"
      previousStep="/create/fantasy/love-story/questions"
      nextStep="/create/fantasy/love-story/moments"
    />
  );
};

export default LoveStoryIdeasStep;
