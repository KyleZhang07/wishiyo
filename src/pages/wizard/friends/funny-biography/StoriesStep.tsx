import { useState, useEffect, useMemo } from 'react';
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
  // 直接在状态初始化时从 localStorage 加载数据，避免闪烁
  const storageKey = 'funnyBiographyAnswers';
  const [authorName, setAuthorName] = useState<string>(() => {
    return localStorage.getItem('funnyBiographyAuthorName') || '';
  });
  const [questions, setQuestions] = useState<string[]>(() => {
    const savedName = localStorage.getItem('funnyBiographyAuthorName') || '';
    return getQuestions(savedName);
  });
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState<QuestionAnswer[]>(() => {
    const savedAnswers = localStorage.getItem(storageKey);
    return savedAnswers ? JSON.parse(savedAnswers) : [];
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleNext = () => {
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

  // Update answered card questions when authorName changes
  const genericQuestionParts = useMemo(
    () => getQuestions('{name}').map(q => q.split('{name}')),
    []
  );

  useEffect(() => {
    if (questionsAndAnswers.length === 0) return;
    const updatedAnswers = questionsAndAnswers.map(qa => {
      const match = genericQuestionParts.find(
        ([prefix, suffix]) => qa.question.startsWith(prefix) && qa.question.endsWith(suffix)
      );
      if (!match) return qa;
      const [prefix, suffix] = match;
      return { question: `${prefix}${authorName}${suffix}`, answer: qa.answer };
    });
    if (JSON.stringify(updatedAnswers) !== JSON.stringify(questionsAndAnswers)) {
      setQuestionsAndAnswers(updatedAnswers);
      localStorage.setItem(storageKey, JSON.stringify(updatedAnswers));
    }
  }, [authorName]);

  // 关闭问题弹窗
  const closeQuestionDialog = () => {
    setTimeout(() => {
      setIsDialogOpen(false);
      setSelectedQuestion(null);
    }, 0);
  };

  return (
    <WizardStep
      title={`What's ${authorName}'s Story?`}
      description="Answer more questions to create a richer, more personal book!"
      previousStep="/create/friends/funny-biography/author"
      currentStep={2}
      totalSteps={7}
      onNextClick={handleNext}
      nextDisabled={questionsAndAnswers.length === 0}
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
            className="w-full h-16 border-dashed text-lg text-gray-700"
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
        onClose={closeQuestionDialog}
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
