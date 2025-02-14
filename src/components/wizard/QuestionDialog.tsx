
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from 'lucide-react';

interface QuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitAnswer: (question: string, answer: string) => void;
}

const QuestionDialog = ({
  isOpen,
  onClose,
  onSubmitAnswer
}: QuestionDialogProps) => {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const questions = ["What's your favorite memory together?", "How did you first meet?", "What makes your relationship special?", "What's the funniest moment you've shared?", "What do you admire most about them?", "What's a challenge you've overcome together?"];
  
  const handleQuestionSelect = (question: string) => {
    setSelectedQuestion(question);
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
          {!selectedQuestion ? questions.map((question, index) => <Button key={index} variant="outline" className="justify-start h-auto py-3 px-4 whitespace-normal text-left text-base" onClick={() => handleQuestionSelect(question)}>
                {question}
              </Button>) : <div className="space-y-4">
                <p className="text-base font-medium">{selectedQuestion}</p>
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
