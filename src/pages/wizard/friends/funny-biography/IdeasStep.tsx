
import BookIdeaStep from '@/components/wizard/BookIdeaStep';

const FunnyBiographyIdeasStep = () => {
  return (
    <BookIdeaStep
      genre="funny-biography"
      previousStep="/create/friends/funny-biography/stories"
      nextStep="/create/friends/funny-biography/generate"
      currentStep={3}
      totalSteps={4}
    />
  );
};

export default FunnyBiographyIdeasStep;
