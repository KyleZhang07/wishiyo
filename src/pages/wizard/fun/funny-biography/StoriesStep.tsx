
import { useState } from 'react';
import QuestionStep from '@/components/wizard/QuestionStep';

const FunnyBiographyStoriesStep = () => {
  return (
    <QuestionStep
      category="fun"
      previousStep="/create/fun/funny-biography/author"
      nextStep="/create/fun/funny-biography/ideas"
    />
  );
};

export default FunnyBiographyStoriesStep;
