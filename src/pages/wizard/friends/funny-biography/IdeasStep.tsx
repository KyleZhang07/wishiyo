
import IdeaStep from '@/components/wizard/IdeaStep';

const FunnyBiographyIdeasStep = () => {
  return (
    <IdeaStep
      category="friends"
      previousStep="/create/friends/funny-biography/stories"
      nextStep="/create/friends/funny-biography/photos"
      bookType="funny-biography"
    />
  );
};

export default FunnyBiographyIdeasStep;
