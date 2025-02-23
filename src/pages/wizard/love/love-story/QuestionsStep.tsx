
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import QuestionDialog from '@/components/wizard/QuestionDialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface QuestionAnswer {
  question: string;
  answer: string;
}

const LoveStoryQuestionsStep = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState<QuestionAnswer[]>([]);
  const [personName, setPersonName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedName = localStorage.getItem('loveStoryPersonName') || '';
    setPersonName(savedName);
    
    const savedAnswers = localStorage.getItem('loveStoryAnswers');
    if (savedAnswers) {
      setQuestionsAndAnswers(JSON.parse(savedAnswers));
    }
  }, []);

  const getQuestions = (name: string) => [
    `How did you and ${name} first meet?`,
    "What qualities do you admire most about them?",
    "What is your favorite memory together?",
    `Describe ${name} in three words.`,
    "What makes them special to you?",
    "What memories do you cherish most?",
    "What impact have they had on your life?",
    `What would you like ${name} to know?`,
    "What dreams and hopes do you have for them?",
    `Would you like to leave a special message for ${name}?`,
  ];

  const questions = getQuestions(personName);

  const handleNext = () => {
    if (questionsAndAnswers.length === 0) {
      toast({
        title: "No answers provided",
        description: "Please share at least one story",
        variant: "destructive",
      });
      return;
    }
    navigate('/create/love/love-story/ideas');
  };

  const handleSubmitAnswer = (question: string, answer: string) => {
    const newAnswers = [...questionsAndAnswers, { question, answer }];
    setQuestionsAndAnswers(newAnswers);
    localStorage.setItem('loveStoryAnswers', JSON.stringify(newAnswers));
  };

  const handleRemoveQA = (index: number) => {
    const newAnswers = questionsAndAnswers.filter((_, i) => i !== index);
    setQuestionsAndAnswers(newAnswers);
    localStorage.setItem('loveStoryAnswers', JSON.stringify(newAnswers));
  };

  const handleEditAnswer = (question: string) => {
    setSelectedQuestion(question);
    setIsDialogOpen(true);
  };

  const answeredQuestions = questionsAndAnswers.map(qa => qa.question);

  return (
    <WizardStep
      title="Share Your Story"
      description="Tell us about your journey together"
      previousStep="/create/love/love-story/author"
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
            ? "Share Your First Memory" 
            : "Add Another Memory"}
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

export default LoveStoryQuestionsStep;
