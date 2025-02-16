
import IdeaStep from '@/components/wizard/IdeaStep';

const PrankBookIdeasStep = () => {
  return (
    <IdeaStep
      category="friends"
      previousStep="/create/friends/prank-book/pranks"
      nextStep="/create/friends/prank-book/evidence"
    />
  );
};

export default PrankBookIdeasStep;
