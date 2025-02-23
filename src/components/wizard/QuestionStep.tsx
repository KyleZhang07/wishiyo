
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import WizardStep from './WizardStep';
import QuestionDialog from './QuestionDialog';
import { PlusCircle, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';

interface QuestionAnswer {
  question: string;
  answer: string;
}

interface QuestionStepProps {
  category: 'friends' | 'love' | 'kids';
  previousStep: string;
  nextStep: string;
}

const getDefaultQuestions = (category: 'friends' | 'love' | 'kids') => {
  switch (category) {
    case 'friends':
      return [
        "How did you first meet?",
        "What makes your friendship special?",
        "What's your favorite memory together?",
        "What challenges have you overcome together?",
        "What do you admire most about your friend?",
        "What makes your friend unique?"
      ];
    case 'love':
      return [
        "What's your favorite memory together?",
        "How did you first meet?",
        "What makes your relationship special?",
        "What's the funniest moment you've shared?",
        "What do you admire most about them?",
        "What's a challenge you've overcome together?"
      ];
    case 'kids':
      return [
        "What's your child's favorite story?",
        "What makes them laugh the most?",
        "What's their favorite adventure?",
        "What are their dreams and aspirations?",
        "What special talents do they have?",
        "What makes them unique and special?"
      ];
  }
};

const QuestionStep = ({ category, previousStep, nextStep }: QuestionStepProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState<QuestionAnswer[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmitAnswer = (question: string, answer: string) => {
    setQuestionsAndAnswers([...questionsAndAnswers, { question, answer }]);
  };

  const handleRemoveQA = (index: number) => {
    setQuestionsAndAnswers(questionsAndAnswers.filter((_, i) => i !== index));
  };

  const handleEditAnswer = (question: string) => {
    setSelectedQuestion(question);
    setIsDialogOpen(true);
  };

  const answeredQuestions = questionsAndAnswers.map(qa => qa.question);

  return (
    <WizardStep
      title="What's the Story?"
      description="Answer questions to create your personalized book."
      previousStep={previousStep}
      currentStep={2}
      totalSteps={4}
      onNextClick={() => {
        if (questionsAndAnswers.length === 0) {
          toast({
            title: "No answers provided",
            description: "Please answer at least one question to continue.",
            variant: "destructive",
          });
          return;
        }
        navigate(nextStep);
      }}
    >
      <div className="space-y-6">
        {questionsAndAnswers.map((qa, index) => (
          <div key={index} className="bg-white rounded-lg border p-4 relative transition-transform hover:scale-[1.02] cursor-pointer" onClick={() => handleEditAnswer(qa.question)}>
            <Button
              variant="ghost"
              size="icon"
              className="absolute -right-2 -top-2 rounded-full bg-white border shadow-sm hover:bg-gray-50 h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveQA(index);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            <h3 className="font-medium mb-2 text-gray-500">{qa.question}</h3>
            <p className="text-lg">{qa.answer}</p>
          </div>
        ))}
        <Button
          variant="outline"
          className="w-full h-16 border-dashed text-lg"
          onClick={() => {
            setSelectedQuestion(null);
            setIsDialogOpen(true);
          }}
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          {questionsAndAnswers.length === 0 
            ? "Select a Question and Answer It" 
            : "Add Another Question"}
        </Button>
      </div>
      <QuestionDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedQuestion(null);
        }}
        onSubmitAnswer={handleSubmitAnswer}
        answeredQuestions={answeredQuestions}
        initialQuestion={selectedQuestion}
        questions={getDefaultQuestions(category)}
      />
    </WizardStep>
  );
};

export default QuestionStep;
