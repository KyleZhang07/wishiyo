
import QuestionStep from '@/components/wizard/QuestionStep';

const LoveStoryQuestionsStep = () => {
  return (
    <QuestionStep
      category="fantasy"
      previousStep="/create/fantasy/love-story/author"
      nextStep="/create/fantasy/love-story/ideas"
    />
  );
};

export default LoveStoryQuestionsStep;
