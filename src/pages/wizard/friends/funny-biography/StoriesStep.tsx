
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
  const storageKey = 'funnyBiographyAnswers';

  useEffect(() => {
    const savedName = localStorage.getItem('funnyBiographyAuthorName') || '';
    setAuthorName(savedName);
    setQuestions(getQuestions(savedName));
    
    // Load saved answers
    const savedAnswers = localStorage.getItem(storageKey);
    if (savedAnswers) {
      setQuestionsAndAnswers(JSON.parse(savedAnswers));
    }
  }, []);

  const handleNext = () => {
    if (questionsAndAnswers.length === 0) {
      toast({
        title: "No funny stories added",
        description: "Come on, add at least one hilarious story!",
        variant: "destructive",
      });
      return;
    }
    navigate('/create/friends/funny-biography/ideas');
  };

  const handleSubmitAnswer = (question: string, answer: string) => {
    // Check if the question has already been answered
    const existingIndex = questionsAndAnswers.findIndex(qa => qa.question === question);
    
    let newAnswers: QuestionAnswer[];
    
    if (existingIndex !== -1) {
      // Update existing answer
      newAnswers = [...questionsAndAnswers];
      newAnswers[existingIndex] = { question, answer };
    } else {
      // Add new answer
      newAnswers = [...questionsAndAnswers, { question, answer }];
    }
    
    setQuestionsAndAnswers(newAnswers);
    localStorage.setItem(storageKey, JSON.stringify(newAnswers));
  };

  const handleRemoveQA = (index: number) => {
    const newAnswers = questionsAndAnswers.filter((_, i) => i !== index);
    setQuestionsAndAnswers(newAnswers);
    localStorage.setItem(storageKey, JSON.stringify(newAnswers));
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
      totalSteps={7}
      onNextClick={handleNext}
    >
      <div className="flex justify-center w-full">
        <div className="space-y-6 w-[95%]">
          {questionsAndAnswers.map((qa, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg border p-3.5 relative transition-transform hover:scale-[1.02] cursor-pointer" 
              onClick={() => handleEditAnswer(qa.question)}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute -right-2 -top-2 rounded-full bg-white border shadow-sm hover:bg-[#FF7F50]/10 h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveQA(index);
                }}
              >
                <X className="h-4 w-4 text-[#FF7F50]" />
              </Button>
              <h3 className="font-medium mb-1.5 text-gray-700">{qa.question}</h3>
              <p className="text-base">{qa.answer}</p>
            </div>
          ))}
          
          <Button
            variant="outline"
            className="w-full h-16 border-dashed text-lg bg-gradient-to-r from-[#FF7F50]/10 to-[#FF7F50]/20 hover:from-[#FF7F50]/20 hover:to-[#FF7F50]/30 text-gray-700"
            onClick={() => {
              setSelectedQuestion(null);
              setIsDialogOpen(true);
            }}
          >
            <PlusCircle className="mr-2 h-5 w-5 text-[#FF7F50]" />
            {questionsAndAnswers.length === 0 
              ? "Select a Question and Share a Story" 
              : "Add Another Story"}
          </Button>
        </div>
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
        storageKey={storageKey}
      />
    </WizardStep>
  );
};

export default FunnyBiographyStoriesStep;
