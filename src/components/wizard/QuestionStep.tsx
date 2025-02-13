
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import WizardStep from './WizardStep';
import QuestionDialog from './QuestionDialog';
import { PlusCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface QuestionStepProps {
  category: 'friends' | 'love' | 'kids';
  previousStep: string;
  nextStep: string;
}

const QuestionStep = ({ category, previousStep, nextStep }: QuestionStepProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const { toast } = useToast();

  const handleSelectQuestion = (question: string) => {
    setSelectedQuestion(question);
    setIsDialogOpen(false);
  };

  const handleNext = async () => {
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
            user_id: user.id  // Set the user_id
          }
        ])
        .select()
        .single();

      if (authorError) throw authorError;

      // Then save the question and answer
      const { error: questionError } = await supabase
        .from('book_questions')
        .insert([
          {
            book_author_id: authorData.id,
            question: selectedQuestion,
            answer: answer
          }
        ]);

      if (questionError) throw questionError;

      window.location.href = nextStep;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your answer. Please try again.",
        variant: "destructive",
      });
      console.error('Error:', error);
    }
  };

  return (
    <WizardStep
      title="Share Your Story"
      description="Select a question and share your thoughts."
      previousStep={previousStep}
      currentStep={2}
      totalSteps={4}
      onNextClick={handleNext}
    >
      <div className="space-y-6">
        {!selectedQuestion ? (
          <Button
            variant="outline"
            className="w-full h-24 border-dashed"
            onClick={() => setIsDialogOpen(true)}
          >
            <PlusCircle className="mr-2" />
            Select a Question
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Selected Question:</h3>
              <p>{selectedQuestion}</p>
            </div>
            <Textarea
              placeholder="Write your answer here..."
              className="min-h-[200px]"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsDialogOpen(true)}
            >
              Change Question
            </Button>
          </div>
        )}
      </div>
      <QuestionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSelectQuestion={handleSelectQuestion}
      />
    </WizardStep>
  );
};

export default QuestionStep;
