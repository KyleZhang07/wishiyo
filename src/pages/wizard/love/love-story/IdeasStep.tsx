
import { useState, useEffect } from 'react';
import WizardStep from '@/components/wizard/WizardStep';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Chapter {
  title: string;
  description: string;
}

interface BookIdea {
  title: string;
  author: string;
  description: string;
  chapters: Chapter[];
}

const LoveStoryIdeasStep = () => {
  const [idea, setIdea] = useState<BookIdea | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkPreviousSteps = () => {
    const partnerName = localStorage.getItem('loveStoryPartnerName');
    const answers = localStorage.getItem('loveStoryAnswers');

    if (!partnerName || !answers) {
      toast({
        title: "Missing information",
        description: "Please complete the previous steps first.",
        variant: "destructive",
      });
      navigate('/create/love/love-story/author');
      return false;
    }
    return true;
  };

  const generateIdea = async () => {
    if (!checkPreviousSteps()) {
      return;
    }

    setIsLoading(true);
    try {
      const partnerName = localStorage.getItem('loveStoryPartnerName');
      const savedAnswers = localStorage.getItem('loveStoryAnswers');
      
      let stories;
      try {
        stories = JSON.parse(savedAnswers!);
      } catch (error) {
        console.error('Error parsing saved answers:', error);
        toast({
          title: "Error",
          description: "Invalid saved answers format. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-ideas', {
        body: { 
          authorName: partnerName,
          stories,
          bookType: 'love-story',
          category: 'love'
        }
      });

      if (error) throw error;

      if (!data || !data.idea || !data.idea.chapters) {
        throw new Error('Invalid response format from server');
      }

      setIdea(data.idea);
      localStorage.setItem('loveStoryGeneratedIdea', JSON.stringify(data.idea));
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error generating ideas",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!idea) {
      toast({
        title: "No story generated",
        description: "Please generate a story before continuing.",
        variant: "destructive",
      });
      return;
    }
    navigate('/create/love/love-story/moments');
  };

  useEffect(() => {
    const savedIdea = localStorage.getItem('loveStoryGeneratedIdea');
    if (savedIdea) {
      try {
        const parsed = JSON.parse(savedIdea);
        if (parsed && typeof parsed === 'object') {
          setIdea(parsed);
        }
      } catch (error) {
        console.error('Error parsing saved idea:', error);
        // If there's an error parsing the saved data, generate new idea
        generateIdea();
      }
    } else {
      generateIdea();
    }
  }, []);

  return (
    <WizardStep
      title="Your Love Story Outline"
      description="Review your AI-generated love story outline or regenerate for a different version."
      previousStep="/create/love/love-story/questions"
      currentStep={3}
      totalSteps={4}
      onNextClick={handleContinue}
    >
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            className="bg-black text-white hover:bg-black/90" 
            onClick={generateIdea}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Generating...' : 'Regenerate'}
          </Button>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4" />
            <p className="text-gray-500">Creating your love story...</p>
          </div>
        )}

        {idea && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-1">{idea.title}</h3>
              <p className="text-gray-600 text-sm mb-4">By {idea.author}</p>
              <p className="text-gray-800 mb-6">{idea.description}</p>
              
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3">Table of Contents</h4>
                <div className="space-y-3">
                  {idea.chapters?.map((chapter, idx) => (
                    <div key={idx} className="border-b pb-3">
                      <h5 className="font-medium">Chapter {idx + 1}: {chapter.title}</h5>
                      <p className="text-gray-600 text-sm mt-1">{chapter.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </WizardStep>
  );
};

export default LoveStoryIdeasStep;
