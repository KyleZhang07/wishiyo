
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
    `How did you and ${partnerName} first meet?`,
    "Do you have any special nicknames for each other?",
    `What is the most romantic thing ${partnerName} has ever done to you?`,
    `Describe ${partnerName} in three words.`,
    `What is the cutest thing ${partnerName} does without realizing?`,
    "Do you have any unique habits or small rituals in your relationship?",
    "If you could add a small hidden detail (Easter egg) in the book, what would it be?",
    `Would you like to leave a special message for ${partnerName} at the end of the story?`,
    "Does your partner prefer the story in the book to be romantic or adventurous?",
    "Does your partner prefer a modern city or a classic historical setting?",
    "Does your partner prefer a warm and gentle atmosphere or a passionate and intense scene?",
    "Would your partner like to include some mystical or fantasy elements (such as magic, otherworldly adventures)?"
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
      title="Share Your Love Story"
      description="Tell us about your journey together"
      previousStep="/create/love/love-story/author"
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
