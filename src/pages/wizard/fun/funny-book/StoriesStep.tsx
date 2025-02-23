
import QuestionStep from '@/components/wizard/QuestionStep';

const FunnyBookStoriesStep = () => {
  return (
    <QuestionStep
      category="fun"
      previousStep="/create/fun/funny-book/author"
      nextStep="/create/fun/funny-book/ideas"
    />
  );
};

export default FunnyBookStoriesStep;
