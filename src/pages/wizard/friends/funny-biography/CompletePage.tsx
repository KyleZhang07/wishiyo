
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Book, RefreshCw } from 'lucide-react';

const CompletePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [chapterContent, setChapterContent] = useState('');
  const [chapter, setChapter] = useState<any>(null);
  
  const handleBackToHome = () => {
    navigate('/');
  };

  const generateChapterContent = async () => {
    setIsLoading(true);
    try {
      const savedAuthor = localStorage.getItem('funnyBiographyAuthorName');
      const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
      const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
      const savedAnswers = localStorage.getItem('funnyBiographyAnswers');
      const savedChapters = localStorage.getItem('funnyBiographyChapters');

      if (!savedChapters) {
        throw new Error("No chapters found");
      }

      const chapters = JSON.parse(savedChapters);
      const chapter1 = chapters[0];
      setChapter(chapter1);

      const answers = savedAnswers ? JSON.parse(savedAnswers) : [];
      const selectedIdea = savedIdeas && savedIdeaIndex ? 
        JSON.parse(savedIdeas)[parseInt(savedIdeaIndex)] : null;

      const { data, error } = await supabase.functions.invoke('generate-chapter-content', {
        body: {
          authorName: savedAuthor,
          bookTitle: selectedIdea?.title || '',
          selectedIdea,
          answers,
          chapter: chapter1
        }
      });

      if (error) throw error;
      
      if (data.content) {
        setChapterContent(data.content);
        localStorage.setItem('funnyBiographyChapter1Content', data.content);
      }
    } catch (error) {
      console.error('Error generating chapter content:', error);
      toast({
        title: "Error generating chapter content",
        description: "There was a problem generating your chapter. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedContent = localStorage.getItem('funnyBiographyChapter1Content');
    const savedChapters = localStorage.getItem('funnyBiographyChapters');
    
    if (savedChapters) {
      const chapters = JSON.parse(savedChapters);
      setChapter(chapters[0]);
    }
    
    if (savedContent) {
      setChapterContent(savedContent);
      setIsLoading(false);
    } else {
      generateChapterContent();
    }
  }, []);
  
  // Function to convert markdown headings to styled divs
  const renderContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-2xl font-bold mt-8 mb-4">
            {line.replace('## ', '')}
          </h2>
        );
      }
      return <p key={index} className="mb-4 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center p-4">
      <div className="glass-card max-w-4xl w-full p-8 rounded-2xl shadow-lg">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full"></div>
            <p className="mt-4 text-gray-600">Generating your chapter content...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold">Chapter 1: {chapter?.title}</h1>
                <p className="text-gray-600 mt-2">{chapter?.description}</p>
              </div>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={generateChapterContent}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </div>

            <div className="prose prose-lg max-w-none">
              {renderContent(chapterContent)}
            </div>

            <div className="flex justify-between mt-12 pt-8 border-t">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleBackToHome}
              >
                Back to Home
              </Button>
              <Button className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                <Book className="h-4 w-4" />
                Download Full Book
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompletePage;
