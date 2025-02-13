
import QuestionStep from '@/components/wizard/QuestionStep';

const FriendsQuestionStep = () => {
  return (
    <QuestionStep
      category="friends"
      previousStep="/create/friends/style"
      nextStep="/create/friends/photos"
    />
  );
};

export default FriendsQuestionStep;
