
import { useState } from 'react';
import WizardStep from './WizardStep';
import QuestionDialog from './QuestionDialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface QuestionAnswer {
  question: string;
  answer: string;
}

interface QuestionStepProps {
  category: 'fun' | 'fantasy' | 'kids';
  previousStep: string;
  nextStep: string;
}

const QuestionStep = ({
  category,
  previousStep,
  nextStep
}: QuestionStepProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState<QuestionAnswer[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleNext = () => {
    if (questionsAndAnswers.length === 0) {
      toast({
        title: "No answers provided",
        description: "Please share at least one story",
        variant: "destructive",
      });
      return;
    }

    const storageKey = category === 'fun' ? 'funnyBookAnswers' : 'fantasyBookAnswers';
    localStorage.setItem(storageKey, JSON.stringify(questionsAndAnswers));
    navigate(nextStep);
  };

  const handleSubmitAnswer = (question: string, answer: string) => {
    const newAnswers = [...questionsAndAnswers, { question, answer }];
    setQuestionsAndAnswers(newAnswers);
  };

  const handleRemoveQA = (index: number) => {
    const newAnswers = questionsAndAnswers.filter((_, i) => i !== index);
    setQuestionsAndAnswers(newAnswers);
  };

  const handleEditAnswer = (question: string) => {
    setSelectedQuestion(question);
    setIsDialogOpen(true);
  };

  const getQuestions = () => {
    if (category === 'fun') {
      return [
        "What's the funniest thing that's ever happened to you?",
        "Tell us about a time you made someone laugh really hard",
        "What's your most embarrassing but funny moment?",
        "What's your go-to funny story?",
        "Share a hilarious misunderstanding",
      ];
    } else {
      return [
        "Describe your fantasy world and its unique features",
        "Who is the main character and what makes them special?",
        "What is the main conflict or quest in your story?",
        "Tell us about the magical elements in your story",
        "Describe an exciting scene from your story",
      ];
    }
  };

  const answeredQuestions = questionsAndAnswers.map(qa => qa.question);

  return (
    <WizardStep
      title={category === 'fun' ? "Share Your Funny Stories" : "Share Your Fantasy Story"}
      description={category === 'fun' 
        ? "Tell us about some funny moments or stories that you want to include in your book."
        : "Tell us about the fantasy world and characters you want to create."}
      previousStep={previousStep}
      currentStep={2}
      totalSteps={5}
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
            ? "Share Your First Story" 
            : "Add Another Story"}
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
        questions={getQuestions()}
      />
    </WizardStep>
  );
};

export default QuestionStep;
