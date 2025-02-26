import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import WizardStep from '@/components/wizard/WizardStep';
import QuestionDialog from '@/components/wizard/QuestionDialog';
import { PlusCircle, X, Edit2, MessageSquare } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState<QuestionAnswer[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [authorName, setAuthorName] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const storageKey = 'funnyBiographyAnswers';

  useEffect(() => {
    const savedName = localStorage.getItem('funnyBiographyAuthorName') || '';
    setAuthorName(savedName);
    setQuestions(getQuestions(savedName));
    
    // Load saved answers
    const savedAnswers = localStorage.getItem(storageKey);
    if (savedAnswers) {
      setQuestionsAndAnswers(JSON.parse(savedAnswers));
    }
  }, []);

  const handleNext = () => {
    if (questionsAndAnswers.length === 0) {
      toast({
        title: "No funny stories added",
        description: "Come on, add at least one hilarious story!",
        variant: "destructive",
      });
      return;
    }
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

  // Animation variants for list items
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <WizardStep
      title={`What's ${authorName}'s Story?`}
      description="Time to spill the beans on all those funny moments!"
      previousStep="/create/friends/funny-biography/author"
      currentStep={2}
      totalSteps={4}
      onNextClick={handleNext}
    >
      <div className="glass-card rounded-2xl p-8">
        {questionsAndAnswers.length > 0 ? (
          <motion.div 
            className="space-y-6 mb-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <h3 className="text-lg font-medium text-gray-700 flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-primary" />
              {authorName}'s Stories
            </h3>
            
            {questionsAndAnswers.map((qa, index) => (
              <motion.div 
                key={index} 
                variants={item}
                className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-5 relative transition-all duration-200 
                           hover:shadow-md hover:border-primary/20 group"
              >
                <div className="absolute right-3 top-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white/80 border shadow-sm hover:bg-primary/10"
                    onClick={() => handleEditAnswer(qa.question)}
                  >
                    <Edit2 className="h-4 w-4 text-gray-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white/80 border shadow-sm hover:bg-red-50"
                    onClick={() => handleRemoveQA(index)}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <h3 className="font-medium mb-3 text-primary/80 text-sm uppercase tracking-wide">{qa.question}</h3>
                <p className="text-lg text-gray-800">{qa.answer}</p>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-40" />
            <p className="text-lg">No stories added yet.</p>
            <p className="text-sm">Start by selecting a question below.</p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            className="w-full py-6 border-2 border-dashed bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/20 
                     text-lg font-medium text-gray-700 hover:text-primary transition-all duration-300 shadow-sm hover:shadow"
            onClick={() => {
              setSelectedQuestion(null);
              setIsDialogOpen(true);
            }}
          >
            <PlusCircle className="mr-3 h-5 w-5 text-primary" />
            {questionsAndAnswers.length === 0 
              ? "Select a Question and Share a Story" 
              : "Add Another Story"}
          </Button>
        </motion.div>
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
        storageKey={storageKey}
      />
    </WizardStep>
  );
};

export default FunnyBiographyStoriesStep;
