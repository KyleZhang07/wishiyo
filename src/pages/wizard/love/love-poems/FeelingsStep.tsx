import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import QuestionDialog from '@/components/wizard/QuestionDialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface QuestionAnswer {
  question: string;
  answer: string;
}

const LovePoemsFeelingsStep = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState<QuestionAnswer[]>([]);
  const [partnerName, setPartnerName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedName = localStorage.getItem('lovePoemsPartnerName') || '';
    setPartnerName(savedName);
    
    // Load saved answers
    const savedAnswers = localStorage.getItem('lovePoemsAnswers');
    if (savedAnswers) {
      setQuestionsAndAnswers(JSON.parse(savedAnswers));
    }
  }, []);

  const questions = [
    "How did you first meet?",
    `What was your first impression of ${partnerName}?`,
    "What was your first date?",
    `What is the cutest thing ${partnerName} does without realizing?`,
    "What's your favorite way to spend time together?",
    "What's a small thing they do that always makes your day better?",
    `What is a food ${partnerName} loves?`,
    `What's the cutest nickname you have for ${partnerName}?`,
    `What's one thing ${partnerName} always beats you at?`,
    `What's the most romantic thing ${partnerName} has ever done for you?`,
    `What's one moment that made you fall even more in love with ${partnerName}?`,
    `What's something you never get tired of hearing ${partnerName} say?`,
    `What's ${partnerName}'s favorite song?`,
    "If you could go on a dream vacation together, where would it be?",
    "What do you think makes your relationship so special?",
    `What's one promise you want to make to ${partnerName} forever?`
  ];

  const handleNext = () => {
    if (questionsAndAnswers.length === 0) {
      toast({
        title: "No feelings shared",
        description: "Please share at least one feeling or moment",
        variant: "destructive",
      });
      return;
    }
    navigate('/create/love/love-poems/style');
  };

  const handleSubmitAnswer = (question: string, answer: string) => {
    const newAnswers = [...questionsAndAnswers, { question, answer }];
    setQuestionsAndAnswers(newAnswers);
    localStorage.setItem('lovePoemsAnswers', JSON.stringify(newAnswers));
  };

  const handleRemoveQA = (index: number) => {
    const newAnswers = questionsAndAnswers.filter((_, i) => i !== index);
    setQuestionsAndAnswers(newAnswers);
    localStorage.setItem('lovePoemsAnswers', JSON.stringify(newAnswers));
  };

  const handleEditAnswer = (question: string) => {
    setSelectedQuestion(question);
    setIsDialogOpen(true);
  };

  const answeredQuestions = questionsAndAnswers.map(qa => qa.question);

  return (
    <WizardStep
      title="Share Your Love Story"
      description="Tell us about your journey together"
      previousStep="/create/love/love-poems/author"
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

export default LovePoemsFeelingsStep;
