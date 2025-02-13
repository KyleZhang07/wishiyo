
import IdeaStep from '@/components/wizard/IdeaStep';

const KidsIdeaStep = () => {
  return (
    <IdeaStep
      category="kids"
      previousStep="/create/kids/question"
      nextStep="/create/kids/story"
    />
  );
};

export default KidsIdeaStep;
