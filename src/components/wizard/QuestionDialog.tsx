import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare, Check, Lightbulb } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from 'react-router-dom';

interface QuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitAnswer: (question: string, answer: string) => void;
  answeredQuestions?: string[];
  initialQuestion?: string | null;
  questions: string[];
  storageKey?: string;
}

const QuestionDialog = ({
  isOpen,
  onClose,
  onSubmitAnswer,
  answeredQuestions = [],
  initialQuestion = null,
  questions,
  storageKey = 'funnyBiographyAnswers'
}: QuestionDialogProps) => {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const location = useLocation();

  // 判断当前是否在love category
  const isLoveCategory = location.pathname.includes('/love/');
  const isFunnyBiography = location.pathname.includes('/friends/funny-biography/');
  // 使用橙色作为主题色
  const accentColor = '#FF7F50';
  const hoverColor = '#FF7F50/80';

  // 获取问题对应的提示
  const getTipForQuestion = (question: string): string => {
    // Love Story 问题提示 - 全部移除
    if (isLoveCategory) {
      return '';
    }

    // Funny Biography 问题提示
    if (isFunnyBiography) {
      // 需要提示的问题
      if (question.includes('best friends')) {
        return 'Include name, age, gender and relation to the author. Separate each person with a period.';
      } else if (question.includes('family members')) {
        return 'Include name, age, gender and relation to the author. Separate each person with a period.';
      } else if (question.includes('dream')) {
        return 'The more outlandish or specific, the funnier it will be!';
      } else if (question.includes('says too often')) {
        return 'Use their exact words and describe when they typically say this.';
      } else if (question.includes('funny habit')) {
        return 'Describe a specific, unique behavior others might not notice.';
      } else if (question.includes('secret talent')) {
        return 'Focus on an unexpected or unusually specific ability they possess.';
      }
      // 其他问题不需要提示
      return '';
    }

    // 默认情况下不提供提示
    return '';
  };

  useEffect(() => {
    if (initialQuestion) {
      setSelectedQuestion(initialQuestion);
      // Find the existing answer for this question
      if (answeredQuestions.includes(initialQuestion)) {
        const savedAnswers = localStorage.getItem(storageKey);
        if (savedAnswers) {
          try {
            const answers = JSON.parse(savedAnswers);
            const existingAnswer = answers.find((qa: any) => qa.question === initialQuestion);
            if (existingAnswer) {
              setAnswer(existingAnswer.answer);
            }
          } catch (error) {
            console.error('Error parsing saved answers:', error);
          }
        }
      }
    }
  }, [initialQuestion, answeredQuestions, storageKey]);

  const handleQuestionSelect = (question: string) => {
    setSelectedQuestion(question);
    // Find existing answer if this question was already answered
    const savedAnswers = localStorage.getItem(storageKey);
    if (savedAnswers) {
      try {
        const answers = JSON.parse(savedAnswers);
        const existingAnswer = answers.find((qa: any) => qa.question === question);
        if (existingAnswer) {
          setAnswer(existingAnswer.answer);
        } else {
          setAnswer('');
        }
      } catch (error) {
        console.error('Error parsing saved answers:', error);
        setAnswer('');
      }
    } else {
      setAnswer('');
    }
  };

  const handleSubmit = () => {
    if (selectedQuestion && answer.trim()) {
      onSubmitAnswer(selectedQuestion, answer.trim());
      setSelectedQuestion(null);
      setAnswer('');
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedQuestion(null);
    setAnswer('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white/95 backdrop-blur-sm border-gray-200 shadow-xl p-4">
        <DialogHeader className="relative border-b pb-3">
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center">
            {selectedQuestion ? (
              <>
                <Button
                  variant="ghost"
                  className="absolute left-0 p-2 text-gray-600 hover:text-[#FF7F50] hover:bg-[#FF7F50]/10 rounded-full"
                  onClick={() => setSelectedQuestion(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                Share a Story
              </>
            ) : (
              <>
                Pick a Question
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 pt-4">
          {!selectedQuestion ? (
            <ScrollArea className="h-[420px] pr-4">
              <div className="grid grid-cols-1 gap-4">
                {questions.map((question, index) => {
                  const isAnswered = answeredQuestions.includes(question);
                  return (
                    <div
                      key={index}
                      className={`
                        group rounded-xl border p-4 hover:border-[#FF7F50]/60 transition-all cursor-pointer
                        ${isAnswered
                          ? 'bg-[#FF7F50]/10 border-[#FF7F50]/20'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                        }
                      `}
                      onClick={() => handleQuestionSelect(question)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <p className="text-lg text-gray-800 font-medium">{question}</p>
                        </div>
                        {isAnswered && (
                          <span className="ml-3 flex-shrink-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#FF7F50]/20 text-[#FF7F50]/90">
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Answered
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="space-y-6 py-2">
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="font-medium text-lg text-gray-800">{selectedQuestion}</p>
                </div>

                {getTipForQuestion(selectedQuestion) && (
                  <div className="bg-[#FFF3F0] p-4 rounded-lg border border-[#FFDED5] flex items-center">
                    <div className="text-[#FF7F50] mr-2">
                      <Lightbulb className="h-5 w-5" />
                    </div>
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-[#FF6B35] mr-1.5">Tip:</p>
                      <p className="text-sm text-gray-700">{getTipForQuestion(selectedQuestion)}</p>
                    </div>
                  </div>
                )}
              </div>

              <Textarea
                placeholder="Add specific and funny details..."
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                className="min-h-[180px] text-lg border-gray-200 focus:border-[#FF7F50] resize-none"
              />

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!answer.trim()}
                  className="bg-[#FF7F50] hover:bg-[#FF7F50]/80 px-10 py-5 text-base font-medium w-32"
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionDialog;
