
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
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
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (isOpen && initialQuestion) {
      // We're in edit mode
      setIsEditMode(true);
      setSelectedQuestion(initialQuestion);
      
      // Get the correct storage key based on current route
      const path = window.location.pathname;
      const storageKey = path.includes('funny-biography') 
        ? 'funnyBiographyAnswers' 
        : path.includes('wild-fantasy')
          ? 'wildFantasyAnswers'
          : path.includes('prank-book')
            ? 'prankBookAnswers'
            : path.includes('love-poems')
              ? 'lovePoemsAnswers'
              : path.includes('love-story')
                ? 'loveStoryAnswers'
                : path.includes('picture-album')
                  ? 'pictureAlbumAnswers'
                  : path.includes('adventure')
                    ? 'kidsAdventureAnswers'
                    : path.includes('story-book')
                      ? 'kidsStoryAnswers'
                      : path.includes('learning')
                        ? 'learningJourneyAnswers'
                        : 'answers';

      // Find existing answer
      const savedAnswers = localStorage.getItem(storageKey);
      if (savedAnswers) {
        const answers = JSON.parse(savedAnswers);
        const existingAnswer = answers.find((qa: any) => qa.question === initialQuestion);
        if (existingAnswer) {
          setAnswer(existingAnswer.answer);
        }
      }
    } else if (isOpen) {
      // We're in new question mode
      setIsEditMode(false);
      setSelectedQuestion(null);
      setAnswer('');
    }
  }, [isOpen, initialQuestion]);

  const handleQuestionSelect = (question: string) => {
    if (answeredQuestions.includes(question)) {
      // If question is already answered, treat it as an edit
      setIsEditMode(true);
      setSelectedQuestion(question);
      
      // Get the correct storage key based on current route
      const path = window.location.pathname;
      const storageKey = path.includes('funny-biography') 
        ? 'funnyBiographyAnswers' 
        : path.includes('wild-fantasy')
          ? 'wildFantasyAnswers'
          : path.includes('prank-book')
            ? 'prankBookAnswers'
            : path.includes('love-poems')
              ? 'lovePoemsAnswers'
              : path.includes('love-story')
                ? 'loveStoryAnswers'
                : path.includes('picture-album')
                  ? 'pictureAlbumAnswers'
                  : path.includes('adventure')
                    ? 'kidsAdventureAnswers'
                    : path.includes('story-book')
                      ? 'kidsStoryAnswers'
                      : path.includes('learning')
                        ? 'learningJourneyAnswers'
                        : 'answers';

      const savedAnswers = localStorage.getItem(storageKey);
      if (savedAnswers) {
        const answers = JSON.parse(savedAnswers);
        const existingAnswer = answers.find((qa: any) => qa.question === question);
        if (existingAnswer) {
          setAnswer(existingAnswer.answer);
        }
      }
    } else {
      // New question
      setIsEditMode(false);
      setSelectedQuestion(question);
      setAnswer('');
    }
  };
  
  const handleSubmit = () => {
    if (selectedQuestion && answer.trim()) {
      onSubmitAnswer(selectedQuestion, answer.trim());
      setSelectedQuestion(null);
      setAnswer('');
      setIsEditMode(false);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedQuestion(null);
    setAnswer('');
    setIsEditMode(false);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl text-center">
            {isEditMode ? (
              "Edit Your Answer"
            ) : selectedQuestion ? (
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
            ) : (
              "Pick a Question"
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          {!isEditMode && !selectedQuestion ? (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {questions.map((question, index) => {
                  const isAnswered = answeredQuestions.includes(question);
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className={`justify-start h-auto py-3 px-4 whitespace-normal text-left text-base relative w-full
                        ${isAnswered ? 'bg-gray-50' : 'transition-transform hover:scale-[1.02] active:scale-100'}
                      `}
                      onClick={() => handleQuestionSelect(question)}
                    >
                      {question}
                      {isAnswered && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />}
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
                <Button onClick={handleSubmit}>
                  {isEditMode ? "Update" : "Submit"}
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
