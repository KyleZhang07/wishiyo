
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import WizardStep from '../WizardStep';
import QuestionDialog from '../QuestionDialog';
import { PlusCircle, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';

interface QuestionAnswer {
  question: string;
  answer: string;
}

const KidsQuestionStep = () => {
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

  const handleNext = () => {
    if (questionsAndAnswers.length === 0) {
      toast({
        title: "No answers provided",
        description: "Please answer at least one question to continue.",
        variant: "destructive",
      });
      return;
    }

    navigate('/create/kids/idea');
  };

  const handleEditAnswer = (question: string) => {
    setSelectedQuestion(question);
    setIsDialogOpen(true);
  };

  const answeredQuestions = questionsAndAnswers.map(qa => qa.question);
  const kidsQuestions = [
    "What's your child's name and age?",
    "What are their favorite activities or hobbies?",
    "What makes them smile or laugh the most?",
    "What's their favorite animal or character?",
    "What's their biggest dream or wish?",
    "What makes your child unique and special?"
  ];

  return (
    <WizardStep
      title="Tell Us About Your Child"
      description="Answer questions to create a personalized book for your child."
      previousStep="/create/kids/author"
      currentStep={2}
      totalSteps={4}
      onNextClick={handleNext}
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
            ? "Select a Question" 
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
        questions={kidsQuestions}
      />
    </WizardStep>
  );
};

export default KidsQuestionStep;
