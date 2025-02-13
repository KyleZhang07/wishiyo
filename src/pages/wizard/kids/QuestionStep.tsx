
import QuestionStep from '@/components/wizard/QuestionStep';

const KidsQuestionStep = () => {
  return (
    <QuestionStep
      category="kids"
      previousStep="/create/kids/author"
      nextStep="/create/kids/story"
    />
  );
};

export default KidsQuestionStep;
