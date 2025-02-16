
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

const getQuestions = (authorName: string) => [
  `What is ${authorName}'s job?`,
  `Who are ${authorName}'s best friends?`,
  `What is ${authorName}'s dream?`,
  `What are ${authorName}'s hobbies?`,
  `What is something ${authorName} says too often?`,
  `What is ${authorName}'s favorite place or destination?`,
  `What is a funny habit ${authorName} has?`,
  `What is ${authorName}'s go-to excuse for being late?`,
  `What is ${authorName}'s secret talent?`,
  `What is ${authorName}'s biggest weakness?`,
  `What is ${authorName}'s favorite food?`,
  `What would ${authorName} do with a million dollars?`,
  `If ${authorName} could have dinner with anyone, who would it be?`
];

const FunnyBiographyStoriesStep = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState<QuestionAnswer[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [authorName, setAuthorName] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedName = localStorage.getItem('authorName') || 'your friend';
    setAuthorName(savedName);
    setQuestions(getQuestions(savedName));

    // Load saved answers from localStorage
    const savedAnswers = localStorage.getItem('funnyBiographyAnswers');
    if (savedAnswers) {
      setQuestionsAndAnswers(JSON.parse(savedAnswers));
    }
  }, []);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('funnyBiographyAnswers', JSON.stringify(questionsAndAnswers));
  }, [questionsAndAnswers]);

  const handleNext = () => {
    if (questionsAndAnswers.length === 0) {
      toast({
        title: "No funny stories added",
        description: "Come on, add at least one hilarious story!",
        variant: "destructive",
      });
      return;
    }
    navigate('/create/friends/funny-biography/photos');
  };

  const handleSubmitAnswer = (question: string, answer: string) => {
    const newQuestionsAndAnswers = [...questionsAndAnswers, { question, answer }];
    setQuestionsAndAnswers(newQuestionsAndAnswers);
  };

  const handleRemoveQA = (index: number) => {
    const newQuestionsAndAnswers = questionsAndAnswers.filter((_, i) => i !== index);
    setQuestionsAndAnswers(newQuestionsAndAnswers);
  };

  const handleEditAnswer = (question: string) => {
    setSelectedQuestion(question);
    setIsDialogOpen(true);
  };

  const answeredQuestions = questionsAndAnswers.map(qa => qa.question);

  return (
    <WizardStep
      title={`What's ${authorName}'s Story?`}
      description="Time to spill the beans on all those funny moments!"
      previousStep="/create/friends/funny-biography/author"
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
            ? "Select a Question and Answer It" 
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
        questions={questions}
      />
    </WizardStep>
  );
};

export default FunnyBiographyStoriesStep;
