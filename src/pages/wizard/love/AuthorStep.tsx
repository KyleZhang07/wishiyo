
import { useState } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const LoveAuthorStep = () => {
  const [authorName, setAuthorName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContinue = async () => {
    if (!authorName.trim()) {
      toast({
        variant: "destructive",
        title: "Author name required",
        description: "Please enter the author name to continue",
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

      const { error } = await supabase
        .from('book_authors')
        .insert([
          { 
            full_name: authorName.trim(), 
            category: 'love',
            user_id: user.id
          }
        ]);

      if (error) throw error;

      navigate('/create/love/style');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save author information. Please try again.",
      });
      console.error('Error:', error);
    }
  };

  return (
    <WizardStep
      title="Who is creating this love book?"
      description="Enter your name as it will appear in the book."
      previousStep="/love"
      currentStep={1}
      totalSteps={4}
      onNextClick={handleContinue}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-1">
            Author Name
          </label>
          <Input
            id="authorName"
            placeholder="Enter your name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
          />
        </div>
      </div>
    </WizardStep>
  );
};

export default LoveAuthorStep;
