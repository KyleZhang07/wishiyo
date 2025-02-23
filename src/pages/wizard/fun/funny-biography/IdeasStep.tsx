
import IdeaStep from '@/components/wizard/IdeaStep';

const FunnyBiographyIdeasStep = () => {
  return (
    <IdeaStep
      category="fun"
      previousStep="/create/fun/funny-biography/stories"
      nextStep="/create/fun/funny-biography/photos"
    />
  );
};

export default FunnyBiographyIdeasStep;
