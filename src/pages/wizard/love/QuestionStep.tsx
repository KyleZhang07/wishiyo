
import QuestionStep from '@/components/wizard/QuestionStep';

const LoveQuestionStep = () => {
  return (
    <QuestionStep
      category="love"
      previousStep="/create/love/author"
      nextStep="/create/love/moments"
    />
  );
};

export default LoveQuestionStep;
