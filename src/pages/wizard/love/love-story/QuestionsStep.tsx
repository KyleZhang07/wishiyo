import { useState, useEffect, useMemo } from 'react';
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
  const storageKey = 'loveStoryAnswers';

  // 直接在状态初始化时从 localStorage 加载数据，避免闪烁
  const [personName, setPersonName] = useState<string>(() => {
    return localStorage.getItem('loveStoryPersonName') || '';
  });

  const [questionsAndAnswers, setQuestionsAndAnswers] = useState<QuestionAnswer[]>(() => {
    const savedAnswers = localStorage.getItem(storageKey);
    return savedAnswers ? JSON.parse(savedAnswers) : [];
  });

  const { toast } = useToast();
  const navigate = useNavigate();

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
    navigate('/create/love/love-story/moments');
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

  // Update answered card questions when personName changes
  const genericQuestionParts = useMemo(
    () => getQuestions('{name}').map(q => q.split('{name}')),
    []
  );

  useEffect(() => {
    if (questionsAndAnswers.length === 0) return;
    const updated = questionsAndAnswers.map(qa => {
      const match = genericQuestionParts.find(
        ([pre, suf]) => qa.question.startsWith(pre) && qa.question.endsWith(suf)
      );
      if (!match) return qa;
      const [pre, suf] = match;
      return { question: `${pre}${personName}${suf}`, answer: qa.answer };
    });
    if (JSON.stringify(updated) !== JSON.stringify(questionsAndAnswers)) {
      setQuestionsAndAnswers(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
  }, [personName]);

  return (
    <WizardStep
      title="Share the Story"
      description="The more you answer, the richer and better the book will be."
      previousStep="/create/love/love-story/character"
      currentStep={2}
      totalSteps={6}
      onNextClick={handleNext}
      nextDisabled={questionsAndAnswers.length === 0}
    >
      <div className="space-y-6 flex flex-col items-center">
        <div className="w-[95%] space-y-6">
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
            <PlusCircle className="mr-2 h-5 w-5 text-[#FF7F50]" />
            {questionsAndAnswers.length === 0
              ? "Share Your First Memory"
              : "Add Another Memory"}
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

export default LoveStoryQuestionsStep;
