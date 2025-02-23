
import QuestionStep from "@/components/wizard/QuestionStep";

const FantasyBookQuestionsStep = () => {
  return (
    <QuestionStep
      title="Share Your Fantasy Story"
      description="Tell us about the fantasy world and characters you want to create."
      storageKey="fantasyBookAnswers"
      previousStep="/create/fantasy/fantasy-book/author"
      nextStep="/create/fantasy/fantasy-book/ideas"
      currentStep={2}
      totalSteps={5}
      questions={[
        {
          question: "Describe your fantasy world and its unique features",
          placeholder: "Tell us about the world...",
          maxLength: 500,
        },
        {
          question: "Who is the main character and what makes them special?",
          placeholder: "Describe your protagonist...",
          maxLength: 500,
        },
        {
          question: "What is the main conflict or quest in your story?",
          placeholder: "Share the central challenge...",
          maxLength: 500,
        },
      ]}
    />
  );
};

export default FantasyBookQuestionsStep;
