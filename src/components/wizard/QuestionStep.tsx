
import { useState, useEffect } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [bookAuthorId, setBookAuthorId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsLoading(false);
          return;
        }

        // First, try to get the existing book author for this category
        const { data: authorData, error: authorError } = await supabase
          .from('book_authors')
          .select('id')
          .eq('user_id', user.id)
          .eq('category', category)
          .single();

        if (authorError && authorError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw authorError;
        }

        if (authorData) {
          setBookAuthorId(authorData.id);

          // If we found an author, get their questions and answers
          const { data: questionsData, error: questionsError } = await supabase
            .from('book_questions')
            .select('question, answer')
            .eq('book_author_id', authorData.id);

          if (questionsError) throw questionsError;

          if (questionsData) {
            setQuestionsAndAnswers(questionsData);
          }
        }
      } catch (error) {
        console.error('Error fetching existing data:', error);
        toast({
          title: "Error",
          description: "Failed to load existing data. Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingData();
  }, [category, toast]);

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

      let currentBookAuthorId = bookAuthorId;

      // If we don't have a book author yet, create one
      if (!currentBookAuthorId) {
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
        currentBookAuthorId = authorData.id;
      }

      // Save all questions and answers
      const questionsData = questionsAndAnswers.map(qa => ({
        book_author_id: currentBookAuthorId,
        question: qa.question,
        answer: qa.answer
      }));

      // First delete any existing questions for this author
      if (currentBookAuthorId) {
        const { error: deleteError } = await supabase
          .from('book_questions')
          .delete()
          .eq('book_author_id', currentBookAuthorId);

        if (deleteError) throw deleteError;
      }

      // Then insert the new questions
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

  if (isLoading) {
    return (
      <WizardStep
        title="Share Your Story"
        description="Loading your previous answers..."
        previousStep={previousStep}
        currentStep={2}
        totalSteps={4}
        onNextClick={handleNext}
      >
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </WizardStep>
    );
  }

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
