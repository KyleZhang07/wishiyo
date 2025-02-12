import WizardStep from '@/components/wizard/WizardStep';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface QuestionStepProps {
  title: string;
  description: string;
  previousStep: string;
  nextStep: string;
  currentStep: number;
  totalSteps: number;
  question: string;
  onAnswerSubmit: (answer: string) => Promise<void>;
}

const QuestionStep = ({
  title,
  description,
  previousStep,
  nextStep,
  currentStep,
  totalSteps,
  question,
  onAnswerSubmit,
}: QuestionStepProps) => {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onAnswerSubmit(answer);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WizardStep
      title={title}
      description={description}
      previousStep={previousStep}
      nextStep={nextStep}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNextClick={handleSubmit}
    >
      <div>
        <p className="mb-4">{question}</p>
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Write your answer here..."
          className="mb-4"
        />
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </Button>
      </div>
    </WizardStep>
  );
};

export default QuestionStep;
