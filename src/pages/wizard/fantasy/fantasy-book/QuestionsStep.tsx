
import QuestionStep from '@/components/wizard/QuestionStep';

const FantasyBookQuestionsStep = () => {
  return (
    <QuestionStep
      category="fantasy"
      previousStep="/create/fantasy/fantasy-book/author"
      nextStep="/create/fantasy/fantasy-book/ideas"
    />
  );
};

export default FantasyBookQuestionsStep;
