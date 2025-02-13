
import QuestionStep from '@/components/wizard/QuestionStep';

const LoveQuestionStep = () => {
  return (
    <QuestionStep
      category="love"
      previousStep="/create/love/style"
      nextStep="/create/love/moments"
    />
  );
};

export default LoveQuestionStep;
