
import BookIdeaStep from '@/components/wizard/BookIdeaStep';

const WildFantasyIdeasStep = () => {
  return (
    <BookIdeaStep
      genre="wild-fantasy"
      previousStep="/create/friends/wild-fantasy/adventure"
      nextStep="/create/friends/wild-fantasy/generate"
      currentStep={3}
      totalSteps={4}
    />
  );
};

export default WildFantasyIdeasStep;
