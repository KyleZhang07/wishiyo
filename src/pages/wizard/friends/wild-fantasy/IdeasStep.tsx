
import IdeaStep from '@/components/wizard/IdeaStep';

const WildFantasyIdeasStep = () => {
  return (
    <IdeaStep
      category="friends"
      previousStep="/create/friends/wild-fantasy/adventure"
      nextStep="/create/friends/wild-fantasy/photos"
    />
  );
};

export default WildFantasyIdeasStep;
