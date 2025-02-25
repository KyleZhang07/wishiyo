
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface Chapter {
  title: string;
  description: string;
  startPage: number;
}

const PreviewStep = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [selectedStyle, setSelectedStyle] = useState('modern-green');
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(100);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateChapters = async () => {
    setIsLoading(true);
    try {
      const savedAuthor = localStorage.getItem('funnyBiographyAuthorName');
      const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
      const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
      const savedAnswers = localStorage.getItem('funnyBiographyAnswers');

      const answers = savedAnswers ? JSON.parse(savedAnswers) : [];
      const selectedIdea = savedIdeas && savedIdeaIndex ? 
        JSON.parse(savedIdeas)[parseInt(savedIdeaIndex)] : null;

      const { data, error } = await supabase.functions.invoke('generate-chapters', {
        body: {
          authorName: savedAuthor,
          bookTitle: coverTitle,
          selectedIdea,
          answers
        }
      });

      if (error) throw error;
      
      if (data.chapters) {
        setChapters(data.chapters);
        localStorage.setItem('funnyBiographyChapters', JSON.stringify(data.chapters));
        toast({
          title: "Chapters generated successfully",
          description: "Your table of contents has been updated.",
        });
      }
    } catch (error) {
      console.error('Error generating chapters:', error);
      toast({
        title: "Error generating chapters",
        description: "There was a problem generating your book chapters. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const savedAuthor = localStorage.getItem('funnyBiographyAuthorName');
      const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
      const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
      const savedPhotos = localStorage.getItem('funnyBiographyPhoto');
      const savedStyle = localStorage.getItem('funnyBiographySelectedStyle');
      const savedChapters = localStorage.getItem('funnyBiographyChapters');
      
      if (savedAuthor) {
        setAuthorName(savedAuthor);
      }

      if (savedIdeas && savedIdeaIndex) {
        const ideas = JSON.parse(savedIdeas);
        const selectedIdea = ideas[parseInt(savedIdeaIndex)];
        if (selectedIdea) {
          setCoverTitle(selectedIdea.title || '');
          setSubtitle(selectedIdea.description || '');
        }
      }

      if (savedPhotos) {
        setCoverImage(savedPhotos);
      }

      if (savedStyle) {
        setSelectedStyle(savedStyle);
      }

      if (savedChapters) {
        setChapters(JSON.parse(savedChapters));
      } else {
        generateChapters();
      }
    };

    loadData();
  }, []);

  const handleContinue = () => {
    navigate('/create/friends/funny-biography/complete');
  };

  // Get the current style preset
  const getCurrentStyle = () => {
    const stylePresets = [
      {
        id: 'modern-green',
        name: 'Modern Green',
        font: 'playfair',
        template: 'vibrant-green',
        layout: 'classic-centered'
      },
      {
        id: 'classic-elegant',
        name: 'Classic Elegant',
        font: 'merriweather',
        template: 'classic',
        layout: 'left-align'
      },
      {
        id: 'bold-vibrant',
        name: 'Bold Vibrant',
        font: 'montserrat',
        template: 'vibrant',
        layout: 'bold-header'
      },
      {
        id: 'minimal-clean',
        name: 'Minimal Clean',
        font: 'roboto',
        template: 'minimal',
        layout: 'minimal-frame'
      }
    ];
    return stylePresets.find(style => style.id === selectedStyle) || stylePresets[0];
  };

  const currentStyle = getCurrentStyle();

  return (
    <WizardStep
      title="Your Book Preview"
      description="Review your book cover and table of contents"
      previousStep="/create/friends/funny-biography/generate"
      currentStep={5}
      totalSteps={5}
      onNextClick={handleContinue}
    >
      <div className="glass-card rounded-2xl p-8 py-[40px]">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Book Cover */}
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-6">Book Cover</h2>
            <div className="max-w-md w-full">
              <CanvasCoverPreview
                coverTitle={coverTitle}
                subtitle={subtitle}
                authorName={authorName}
                coverImage={coverImage}
                selectedFont={currentStyle.font}
                selectedTemplate={currentStyle.template}
                selectedLayout={currentStyle.layout}
                category="friends"
                imagePosition={imagePosition}
                imageScale={imageScale}
              />
            </div>
          </div>

          {/* Book Details */}
          <div className="flex flex-col items-center">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold">{coverTitle}</h1>
              <p className="text-xl mt-2 text-gray-600">{subtitle}</p>
              <p className="mt-4">by <span className="font-medium">{authorName}</span></p>
              <p className="mt-2 text-gray-500">240 pages</p>
            </div>
          </div>

          {/* Table of Contents */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Table of Contents</h2>
              <Button
                onClick={generateChapters}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Regenerate Chapters
              </Button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full"></div>
                <p className="mt-4 text-gray-600">Generating your chapter outlines...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {chapters.map((chapter, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold">Chapter {index + 1}: {chapter.title}</h3>
                        <p className="text-gray-600 mt-2">{chapter.description}</p>
                      </div>
                      <span className="text-gray-400">pg. {chapter.startPage}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </WizardStep>
  );
};

export default PreviewStep;
