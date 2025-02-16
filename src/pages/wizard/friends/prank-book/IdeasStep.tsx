
import BookIdeaStep from '@/components/wizard/BookIdeaStep';

const PrankBookIdeasStep = () => {
  return (
    <BookIdeaStep
      genre="prank-book"
      previousStep="/create/friends/prank-book/pranks"
      nextStep="/create/friends/prank-book/generate"
      currentStep={3}
      totalSteps={4}
    />
  );
};

export default PrankBookIdeasStep;
