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
  const storageKey = 'loveStoryAnswers';

  useEffect(() => {
    const savedName = localStorage.getItem('loveStoryPersonName') || '';
    setPersonName(savedName);
    
    const savedAnswers = localStorage.getItem(storageKey);
    if (savedAnswers) {
      setQuestionsAndAnswers(JSON.parse(savedAnswers));
    }
  }, []);

  const getQuestions = (name: string) => [
    `What's a hobby or activity that ${name} is passionate about?`,
    `Where is ${name}'s favorite place to relax or unwind?`,
    `If ${name} could travel anywhere in the world, where would they go?`,
    `What's an outdoor activity ${name} enjoys?`,
    `Describe an outfit or style of clothing that ${name} looks particularly good in.`,
    `What kind of environment makes ${name} feel most at home? (Nature, city, etc.)`,
    `What's something ${name} does that always makes you smile?`,
    `If ${name} were a character in a fantasy world, what role would they play?`,
    `What's ${name}'s idea of a perfect evening?`,
    `What natural setting does ${name}'s personality remind you of? (Ocean, forest, mountains, etc.)`,
    `What's an achievement or moment in ${name}'s life they're particularly proud of?`,
    `Is there a specific season or time of year that reminds you of ${name}?`,
    `What kind of music does ${name} love to listen to or dance to?`,
    `If ${name} could have any superpower, what would it be?`,
    `What's a small, everyday gesture or habit that's uniquely ${name}?`,
    `What's a dream or goal ${name} is working towards?`,
    `If ${name} could be surrounded by one thing, what would it be?`,
    `What color or palette of colors represents ${name}'s personality?`,
    `What's a special talent or skill ${name} has?`,
    `If you could capture one perfect moment with ${name}, what would it be?`,
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
    navigate('/create/love/love-story/text-tone');
  };

  const handleSubmitAnswer = (question: string, answer: string) => {
    const existingIndex = questionsAndAnswers.findIndex(qa => qa.question === question);
    
    let newAnswers: QuestionAnswer[];
    
    if (existingIndex >= 0) {
      newAnswers = [...questionsAndAnswers];
      newAnswers[existingIndex] = { question, answer };
    } else {
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
      title="Share Your Story"
      description="Tell us about your journey together"
      previousStep="/create/love/love-story/author"
      currentStep={2}
      totalSteps={6}
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
        storageKey={storageKey}
      />
    </WizardStep>
  );
};

export default LoveStoryQuestionsStep;
