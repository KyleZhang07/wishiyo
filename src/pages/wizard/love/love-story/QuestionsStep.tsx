
import { useState, useEffect } from 'react';
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
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState<QuestionAnswer[]>([]);
  const [personName, setPersonName] = useState('');
  const [relationship, setRelationship] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedName = localStorage.getItem('loveStoryPersonName') || '';
    const savedRelationship = localStorage.getItem('loveStoryRelationship') || '';
    setPersonName(savedName);
    setRelationship(savedRelationship);
    
    const savedAnswers = localStorage.getItem('loveStoryAnswers');
    if (savedAnswers) {
      setQuestionsAndAnswers(JSON.parse(savedAnswers));
    }
  }, []);

  const getQuestions = (name: string, relationship: string) => {
    const commonQuestions = [
      `How did you and ${name} first meet?`,
      "What qualities do you admire most about them?",
      "What is your favorite memory together?",
      `Describe ${name} in three words.`,
      "If you could add a small hidden detail (Easter egg) in the book, what would it be?",
      `Would you like to leave a special message for ${name} at the end of the story?`,
    ];

    const relationshipSpecificQuestions: Record<string, string[]> = {
      partner: [
        "Do you have any special nicknames for each other?",
        `What is the most romantic thing ${name} has ever done?`,
        `What is the cutest thing ${name} does without realizing?`,
        "Do you have any unique habits or small rituals together?",
      ],
      friend: [
        "What adventures have you shared together?",
        "What inside jokes do you share?",
        "What makes your friendship special?",
        "What challenges have you overcome together?",
      ],
      child: [
        "What makes them unique and special?",
        "What are their current interests and passions?",
        "What dreams do you have for their future?",
        "What life lessons would you like to share with them?",
      ],
      parent: [
        "What wisdom have they shared with you?",
        "What family traditions do you cherish most?",
        "What life lessons have they taught you?",
        "What sacrifices have they made for you?",
      ],
      sibling: [
        "What childhood memories do you share?",
        "What adventures have you had together?",
        "How has your relationship grown over the years?",
        "What makes your sibling bond special?",
      ],
      mentor: [
        "What valuable lessons have they taught you?",
        "How have they influenced your growth?",
        "What challenges have they helped you overcome?",
        "What wisdom would you like to share with them?",
      ],
      mentee: [
        "What potential do you see in them?",
        "What growth have you witnessed?",
        "What hopes do you have for their future?",
        "What makes them stand out?",
      ],
      other: [
        "What makes your relationship unique?",
        "What impact have they had on your life?",
        "What memories do you cherish most?",
        "What would you like them to know?",
      ],
    };

    return [
      ...commonQuestions,
      ...(relationshipSpecificQuestions[relationship] || relationshipSpecificQuestions.other)
    ];
  };

  const questions = getQuestions(personName, relationship);

  const handleNext = () => {
    if (questionsAndAnswers.length === 0) {
      toast({
        title: "No answers provided",
        description: "Please share at least one story",
        variant: "destructive",
      });
      return;
    }
    navigate('/create/love/love-story/ideas');
  };

  const handleSubmitAnswer = (question: string, answer: string) => {
    const newAnswers = [...questionsAndAnswers, { question, answer }];
    setQuestionsAndAnswers(newAnswers);
    localStorage.setItem('loveStoryAnswers', JSON.stringify(newAnswers));
  };

  const handleRemoveQA = (index: number) => {
    const newAnswers = questionsAndAnswers.filter((_, i) => i !== index);
    setQuestionsAndAnswers(newAnswers);
    localStorage.setItem('loveStoryAnswers', JSON.stringify(newAnswers));
  };

  const handleEditAnswer = (question: string) => {
    setSelectedQuestion(question);
    setIsDialogOpen(true);
  };

  const answeredQuestions = questionsAndAnswers.map(qa => qa.question);

  return (
    <WizardStep
      title="Share Your Story"
      description="Tell us about your journey together"
      previousStep="/create/love/love-story/author"
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
            ? "Share Your First Memory" 
            : "Add Another Memory"}
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
        questions={questions}
      />
    </WizardStep>
  );
};

export default LoveStoryQuestionsStep;
