
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import WizardStep from './WizardStep';
import QuestionDialog from './QuestionDialog';
import { PlusCircle, X } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface QuestionAnswer {
  question: string;
  answer: string;
}

interface QuestionStepProps {
  category: 'friends' | 'love' | 'kids';
  previousStep: string;
  nextStep: string;
}

const QuestionStep = ({ category, previousStep, nextStep }: QuestionStepProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState<QuestionAnswer[]>([]);
  const { toast } = useToast();

  const handleSubmitAnswer = (question: string, answer: string) => {
    setQuestionsAndAnswers([...questionsAndAnswers, { question, answer }]);
  };

  const handleRemoveQA = (index: number) => {
    setQuestionsAndAnswers(questionsAndAnswers.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    if (questionsAndAnswers.length === 0) {
      toast({
        title: "No answers provided",
        description: "Please answer at least one question to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to continue.",
          variant: "destructive",
        });
        return;
      }

      // First create the book author with user_id
      const { data: authorData, error: authorError } = await supabase
        .from('book_authors')
        .insert([
          { 
            category, 
            full_name: 'Anonymous',
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (authorError) throw authorError;

      // Then save all questions and answers
      const questionsData = questionsAndAnswers.map(qa => ({
        book_author_id: authorData.id,
        question: qa.question,
        answer: qa.answer
      }));

      const { error: questionsError } = await supabase
        .from('book_questions')
        .insert(questionsData);

      if (questionsError) throw questionsError;

      window.location.href = nextStep;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your answers. Please try again.",
        variant: "destructive",
      });
      console.error('Error:', error);
    }
  };

  return (
    <WizardStep
      title="Share Your Story"
      description="Answer questions to create your personalized book."
      previousStep={previousStep}
      currentStep={2}
      totalSteps={4}
      onNextClick={handleNext}
    >
      <div className="space-y-6">
        {questionsAndAnswers.map((qa, index) => (
          <div key={index} className="bg-white rounded-lg border p-4 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => handleRemoveQA(index)}
            >
              <X className="h-4 w-4" />
            </Button>
            <h3 className="font-medium mb-2">{qa.question}</h3>
            <p className="text-sm text-gray-600">{qa.answer}</p>
          </div>
        ))}
        <Button
          variant="outline"
          className="w-full h-24 border-dashed"
          onClick={() => setIsDialogOpen(true)}
        >
          <PlusCircle className="mr-2" />
          {questionsAndAnswers.length === 0 
            ? "Select a Question" 
            : "Add Another Question"}
        </Button>
      </div>
      <QuestionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmitAnswer={handleSubmitAnswer}
      />
    </WizardStep>
  );
};

export default QuestionStep;
