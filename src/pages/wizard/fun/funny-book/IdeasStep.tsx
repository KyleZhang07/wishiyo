
import IdeaStep from '@/components/wizard/IdeaStep';

const FunnyBookIdeasStep = () => {
  return (
    <IdeaStep
      category="fun"
      previousStep="/create/fun/funny-book/stories"
      nextStep="/create/fun/funny-book/photos"
    />
  );
};

export default FunnyBookIdeasStep;
