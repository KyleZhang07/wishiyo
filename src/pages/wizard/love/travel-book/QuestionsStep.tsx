
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
  const [partnerName, setPartnerName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedName = localStorage.getItem('loveStoryPartnerName') || '';
    setPartnerName(savedName);
    
    // Load saved answers
    const savedAnswers = localStorage.getItem('loveStoryAnswers');
    if (savedAnswers) {
      setQuestionsAndAnswers(JSON.parse(savedAnswers));
    }
  }, []);

  const questions = [
    "Are you drawn to cities, nature, or cultural landmarks?",
    "Which climate excites you the most?",
    "Would you prefer historical, futuristic, fantasy, or dreamlike destinations?",
    "Is there a specific country or culture you've always wanted to experience with your partner?",
    "Which element of travel feels the most romantic to you?",
    "What type of romantic experiences excite you?",
    "Would you rather explore hidden alleys of an old European town or stargaze in the middle of the desert?",
    "Are you more into grand romantic gestures or intimate, quiet moments?",
    "If your love were a movie, which travel scene would it include?",
    "What's a dream experience you'd love to share with your partner?",
    "To describe your dream trip as a love story, what mood should it capture?"
  ];

  const handleNext = () => {
    if (questionsAndAnswers.length === 0) {
      toast({
        title: "No answers provided",
        description: "Please share at least one story about your love",
        variant: "destructive",
      });
      return;
    }
    localStorage.setItem('loveStoryAnswers', JSON.stringify(questionsAndAnswers));
    navigate('/create/love/travel-book/ideas');
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
      title="Share Your Travel Dreams"
      description="Tell us about your dream destinations together"
      previousStep="/create/love/travel-book/author"
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
            ? "Share Your First Dream" 
            : "Add Another Dream"}
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
