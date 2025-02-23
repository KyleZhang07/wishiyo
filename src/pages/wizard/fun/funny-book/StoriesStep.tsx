
import QuestionStep from "@/components/wizard/QuestionStep";

const FunnyBookStoriesStep = () => {
  return (
    <QuestionStep
      title="Share Your Funny Stories"
      description="Tell us about some funny moments or stories that you want to include in your book."
      storageKey="funnyBookAnswers"
      previousStep="/create/fun/funny-book/author"
      nextStep="/create/fun/funny-book/ideas"
      currentStep={2}
      totalSteps={5}
      questions={[
        {
          question: "What's the funniest thing that's ever happened to you?",
          placeholder: "Share your story...",
          maxLength: 500,
        },
        {
          question: "Tell us about a time you made someone laugh really hard",
          placeholder: "Share your story...",
          maxLength: 500,
        },
        {
          question: "What's your most embarrassing but funny moment?",
          placeholder: "Share your story...",
          maxLength: 500,
        },
      ]}
    />
  );
};

export default FunnyBookStoriesStep;
