
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import WizardStep from '@/components/wizard/WizardStep';
import QuestionDialog from '@/components/wizard/QuestionDialog';
import { PlusCircle, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';

interface QuestionAnswer {
  question: string;
  answer: string;
}

const PrankBookPranksStep = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState<QuestionAnswer[]>([]);
  const [authorName, setAuthorName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedName = localStorage.getItem('prankBookAuthorName');
    if (savedName) {
      setAuthorName(savedName);
    }
  }, []);

  const questions = [
    `What is ${authorName}'s job?`,
    `What is ${authorName}'s biggest talent?`,
    `What is ${authorName}'s worst habit?`,
    `What's something ${authorName} always says?`,
    `If ${authorName} were a top-secret agent, what would their secret mission be?`,
    `What's ${authorName}'s go-to excuse when they mess up?`,
    `What's one thing ${authorName} is weirdly obsessed with?`,
    `What's the one thing ${authorName} should never be trusted with?`,
    `What's the most ridiculous conspiracy theory about ${authorName}?`,
    `If ${authorName} had a superpower, what would it be?`,
    `If ${authorName} were an animal, which one would they be?`,
    `What's ${authorName}'s go-to survival strategy in an apocalypse?`,
    `If ${authorName} had to live in one store forever, which one would it be?`,
    `If ${authorName} got arrested, what's the dumbest reason it would be for?`,
    `What's ${authorName}'s most likely cause of worldwide fame?`,
    `What's the one thing ${authorName} can't go a day without?`
  ];

  const handleNext = () => {
    if (questionsAndAnswers.length === 0) {
      toast({
        title: "No answers added",
        description: "Share at least one story!",
        variant: "destructive",
      });
      return;
    }
    navigate('/create/friends/prank-book/evidence');
  };

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
      title="Tell Us About Your Friend"
      description="Share some fun details about your friend!"
      previousStep="/create/friends/prank-book/author"
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
            ? "Add Your First Answer" 
            : "Add Another Answer"}
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
        questions={questions}
      />
    </WizardStep>
  );
};

export default PrankBookPranksStep;
