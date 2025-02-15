
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import WizardStep from '@/components/wizard/WizardStep';
import QuestionDialog from '@/components/wizard/QuestionDialog';
import { PlusCircle, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useLocation } from 'react-router-dom';

interface QuestionAnswer {
  question: string;
  answer: string;
}

const getQuestionsByGenre = (genre: string) => {
  switch (genre) {
    case 'funny-biography':
      return [
        "What's the most embarrassing moment you've shared with your friend?",
        "What's the weirdest inside joke between you two?",
        "What's the most ridiculous adventure you've been on together?",
        "What's the funniest misunderstanding you've had?",
        "What's the most absurd thing your friend has convinced you to do?",
        "What's a running gag or nickname that only makes sense to you two?"
      ];
    case 'wild-fantasy':
      return [
        "If your friend was a mythical creature, what would they be and why?",
        "What magical powers would best suit your friend's personality?",
        "What's the most adventurous dream you've shared with your friend?",
        "If you could go on a fantasy quest together, what would it be?",
        "What mystical item would you give your friend and why?",
        "What legendary tale best describes your friendship?"
      ];
    case 'prank-book':
      return [
        "What's the best prank you've ever pulled on your friend?",
        "What's the most creative mischief you've gotten into together?",
        "What's the funniest reaction your friend has ever had to a surprise?",
        "What's the most elaborate scheme you've planned together?",
        "What's the silliest thing you've convinced your friend to believe?",
        "What's the most memorable practical joke between you two?"
      ];
    default:
      return [
        "How did you first meet?",
        "What makes your friendship special?",
        "What's your favorite memory together?",
        "What challenges have you overcome together?",
        "What do you admire most about your friend?",
        "What makes your friend unique?"
      ];
  }
};

const getTitleByGenre = (genre: string) => {
  switch (genre) {
    case 'funny-biography':
      return "Create a Hilarious Biography";
    case 'wild-fantasy':
      return "Craft a Magical Tale";
    case 'prank-book':
      return "Design Your Prank Chronicles";
    default:
      return "Share Your Story";
  }
};

const getDescriptionByGenre = (genre: string) => {
  switch (genre) {
    case 'funny-biography':
      return "Answer questions to create a laugh-out-loud biography of your friendship.";
    case 'wild-fantasy':
      return "Transform your friendship into an epic fantasy adventure.";
    case 'prank-book':
      return "Document your greatest pranks and mischievous moments together.";
    default:
      return "Answer questions to create your personalized book.";
  }
};

const FriendsQuestionStep = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState<QuestionAnswer[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const genre = searchParams.get('genre') || 'default';

  const handleSubmitAnswer = (question: string, answer: string) => {
    setQuestionsAndAnswers([...questionsAndAnswers, { question, answer }]);
  };

  const handleRemoveQA = (index: number) => {
    setQuestionsAndAnswers(questionsAndAnswers.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (questionsAndAnswers.length === 0) {
      toast({
        title: "No answers provided",
        description: "Please answer at least one question to continue.",
        variant: "destructive",
      });
      return;
    }

    navigate(`/create/friends/idea?genre=${genre}`);
  };

  const handleEditAnswer = (question: string) => {
    setSelectedQuestion(question);
    setIsDialogOpen(true);
  };

  const answeredQuestions = questionsAndAnswers.map(qa => qa.question);

  return (
    <WizardStep
      title={getTitleByGenre(genre)}
      description={getDescriptionByGenre(genre)}
      previousStep="/create/friends/author"
      currentStep={2}
      totalSteps={4}
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
            ? "Select a Question" 
            : "Add Another Question"}
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
        questions={getQuestionsByGenre(genre)}
      />
    </WizardStep>
  );
};

export default FriendsQuestionStep;
