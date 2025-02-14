
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

interface QuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitAnswer: (question: string, answer: string) => void;
  answeredQuestions?: string[];
  initialQuestion?: string | null;
}

const QuestionDialog = ({
  isOpen,
  onClose,
  onSubmitAnswer,
  answeredQuestions = [],
  initialQuestion = null
}: QuestionDialogProps) => {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const questions = ["What's your favorite memory together?", "How did you first meet?", "What makes your relationship special?", "What's the funniest moment you've shared?", "What do you admire most about them?", "What's a challenge you've overcome together?"];
  
  useEffect(() => {
    if (initialQuestion) {
      setSelectedQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  const handleQuestionSelect = (question: string) => {
    if (!answeredQuestions.includes(question)) {
      setSelectedQuestion(question);
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
  
  return <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
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
          {!selectedQuestion ? questions.map((question, index) => {
            const isAnswered = answeredQuestions.includes(question);
            return (
              <Button
                key={index}
                variant="outline"
                className={`justify-start h-auto py-3 px-4 whitespace-normal text-left text-base relative
                  ${isAnswered ? 'opacity-50 cursor-default' : 'transition-transform hover:scale-[1.02] active:scale-100'}
                `}
                onClick={() => handleQuestionSelect(question)}
                disabled={isAnswered}
              >
                {question}
                {isAnswered && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />}
              </Button>
            );
          }) : <div className="space-y-4">
                <p className="font-medium text-lg">{selectedQuestion}</p>
                <Textarea placeholder="Write your answer here..." value={answer} onChange={e => setAnswer(e.target.value)} className="min-h-[150px]" />
                <div className="flex justify-end">
                  <Button onClick={handleSubmit}>Submit</Button>
                </div>
              </div>}
        </div>
      </DialogContent>
    </Dialog>;
};

export default QuestionDialog;
