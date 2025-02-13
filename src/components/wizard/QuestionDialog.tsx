
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface QuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion: (question: string) => void;
}

const QuestionDialog = ({ isOpen, onClose, onSelectQuestion }: QuestionDialogProps) => {
  const questions = [
    "What's your favorite memory together?",
    "How did you first meet?",
    "What makes your relationship special?",
    "What's the funniest moment you've shared?",
    "What do you admire most about them?",
    "What's a challenge you've overcome together?",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pick a Question</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          {questions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              className="justify-start h-auto py-3 px-4 whitespace-normal text-left"
              onClick={() => onSelectQuestion(question)}
            >
              {question}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestionDialog;
