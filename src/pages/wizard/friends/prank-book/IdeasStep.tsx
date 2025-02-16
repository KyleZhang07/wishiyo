
import BookIdeaStep from '@/components/wizard/BookIdeaStep';

const PrankBookIdeasStep = () => {
  return (
    <BookIdeaStep
      genre="prank-book"
      previousStep="/create/friends/prank-book/pranks"
      nextStep="/create/friends/prank-book/photos"
      currentStep={3}
      totalSteps={5}
    />
  );
};

export default PrankBookIdeasStep;
