
import IdeaStep from '@/components/wizard/IdeaStep';

const LoveStoryIdeasStep = () => {
  return (
    <IdeaStep
      category="love"
      previousStep="/create/love/love-story/moments"
      nextStep="/create/love/love-story/debug-prompts"
    />
  );
};

export default LoveStoryIdeasStep;
