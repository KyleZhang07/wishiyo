
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MessageSquare, Check } from 'lucide-react';
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
  // 根据category选择颜色
  const accentColor = isLoveCategory ? '#FF7F50' : '#F6C744';
  const hoverColor = isLoveCategory ? '#FF7F50/80' : '#E5B73E';
  
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
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl bg-white/95 backdrop-blur-sm border-gray-200 shadow-xl">
        <DialogHeader className="relative border-b pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center justify-center">
            {selectedQuestion ? (
              <>
                <Button 
                  variant="ghost" 
                  className="absolute left-0 p-2 text-gray-600 hover:text-[#F97316] hover:bg-[#F97316]/10 rounded-full"
                  onClick={() => setSelectedQuestion(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <MessageSquare className="mr-2 h-6 w-6 text-[#F97316]" />
                Share a Story
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-6 w-6 text-[#F97316]" />
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
                        group rounded-xl border p-4 hover:border-[#F97316]/60 transition-all cursor-pointer
                        ${isAnswered 
                          ? 'bg-[#F97316]/10 border-[#F97316]/20'
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
                          <span className="ml-3 flex-shrink-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#F97316]/20 text-[#F97316]/90">
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
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                <p className="font-medium text-lg text-gray-800">{selectedQuestion}</p>
              </div>
              
              <Textarea 
                placeholder="Write your answer here..." 
                value={answer} 
                onChange={e => setAnswer(e.target.value)} 
                className="min-h-[220px] text-lg border-gray-200 focus:border-[#F97316] focus:ring-[#F97316]"
              />
              
              <div className="flex justify-end space-x-4 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedQuestion(null)}
                  className="border-gray-200 text-gray-700 px-6 py-5 text-base"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!answer.trim()}
                  className="bg-[#F97316] hover:bg-[#F97316]/80 px-6 py-5 text-base"
                >
                  Save Story
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
