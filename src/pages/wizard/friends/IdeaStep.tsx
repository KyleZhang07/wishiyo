
import IdeaStep from '@/components/wizard/IdeaStep';

const FriendsIdeaStep = () => {
  return (
    <IdeaStep
      category="friends"
      previousStep="/create/friends/question"
      nextStep="/create/friends/photos"
    />
  );
};

export default FriendsIdeaStep;
