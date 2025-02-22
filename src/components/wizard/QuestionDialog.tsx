
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitAnswer: (question: string, answer: string) => void;
  answeredQuestions?: string[];
  initialQuestion?: string | null;
  questions: string[];
}

const QuestionDialog = ({
  isOpen,
  onClose,
  onSubmitAnswer,
  answeredQuestions = [],
  initialQuestion = null,
  questions
}: QuestionDialogProps) => {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  
  useEffect(() => {
    if (initialQuestion) {
      setSelectedQuestion(initialQuestion);
      // Find the existing answer for this question
      const existingQA = answeredQuestions.includes(initialQuestion);
      if (existingQA) {
        const savedAnswers = localStorage.getItem('funnyBiographyAnswers');
        if (savedAnswers) {
          const answers = JSON.parse(savedAnswers);
          const existingAnswer = answers.find((qa: any) => qa.question === initialQuestion);
          if (existingAnswer) {
            setAnswer(existingAnswer.answer);
          }
        }
      }
    }
  }, [initialQuestion, answeredQuestions]);

  const handleQuestionSelect = (question: string) => {
    setSelectedQuestion(question);
    // Find existing answer if this question was already answered
    const savedAnswers = localStorage.getItem('funnyBiographyAnswers');
    if (savedAnswers) {
      const answers = JSON.parse(savedAnswers);
      const existingAnswer = answers.find((qa: any) => qa.question === question);
      if (existingAnswer) {
        setAnswer(existingAnswer.answer);
      } else {
        setAnswer('');
      }
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl text-center">
            {selectedQuestion ? (
              <>
                <Button 
                  variant="ghost" 
                  className="absolute -top-1 left-0 p-2" 
                  onClick={() => setSelectedQuestion(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                Enter Your Answer
              </>
            ) : "Pick a Question"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          {!selectedQuestion ? (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {questions.map((question, index) => {
                  const isAnswered = answeredQuestions.includes(question);
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className={`justify-start h-auto py-3 px-4 whitespace-normal text-left text-base w-full
                        ${isAnswered 
                          ? 'bg-gray-50 text-gray-400 cursor-default pointer-events-none hover:bg-gray-50' 
                          : 'transition-transform hover:scale-[1.02] active:scale-100'
                        }
                      `}
                      onClick={() => !isAnswered && handleQuestionSelect(question)}
                    >
                      {question}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="space-y-4">
              <p className="font-medium text-lg">{selectedQuestion}</p>
              <Textarea 
                placeholder="Write your answer here..." 
                value={answer} 
                onChange={e => setAnswer(e.target.value)} 
                className="min-h-[150px]" 
              />
              <div className="flex justify-end">
                <Button onClick={handleSubmit}>Submit</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionDialog;
