
import IdeaStep from '@/components/wizard/IdeaStep';

const FantasyBookIdeasStep = () => {
  return (
    <IdeaStep
      category="fantasy"
      previousStep="/create/fantasy/fantasy-book/questions"
      nextStep="/create/fantasy/fantasy-book/moments"
    />
  );
};

export default FantasyBookIdeasStep;
