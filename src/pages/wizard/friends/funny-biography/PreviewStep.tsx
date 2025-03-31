
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

// 定义赞美语接口
interface Praise {
  source: string;
  text: string;
}

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
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [frontCoverImage, setFrontCoverImage] = useState<string | undefined>();
  const [selectedStyle, setSelectedStyle] = useState('modern-green');
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(100);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [praises, setPraises] = useState<Praise[]>([]);
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
      const savedImagePosition = localStorage.getItem('funnyBiographyCoverImagePosition');
      const savedImageScale = localStorage.getItem('funnyBiographyCoverImageScale');
      const savedFrontCover = localStorage.getItem('funnyBiographyFrontCoverImage');
      
      if (savedAuthor) {
        setAuthorName(savedAuthor);
      }

      if (savedIdeas && savedIdeaIndex) {
        const ideas = JSON.parse(savedIdeas);
        const selectedIdea = ideas[parseInt(savedIdeaIndex)];
        if (selectedIdea) {
          setCoverTitle(selectedIdea.title || '');
          setSubtitle(selectedIdea.description || '');
          
          // 获取赞美语
          if (selectedIdea.praises && Array.isArray(selectedIdea.praises)) {
            setPraises(selectedIdea.praises);
          }
        }
      }

      if (savedPhotos) {
        setCoverImage(savedPhotos);
      }

      if (savedFrontCover) {
        setFrontCoverImage(savedFrontCover);
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
    navigate('/create/friends/funny-biography/format');
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
      description=""
      previousStep="/create/friends/funny-biography/generate"
      currentStep={6}
      totalSteps={7}
      onNextClick={handleContinue}
    >
      <div className="w-full">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Book Cover */}
          <div className="flex flex-col items-center mb-4">
            <div className="book-container">
              <div className="book">
                {frontCoverImage ? (
                  <img 
                    src={frontCoverImage} 
                    alt="Book Cover"
                  />
                ) : (
                  <div className="canvas-container">
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
                      previewMode={true}
                      scaleFactor={0.4}
                      praises={praises}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Book Details */}
          <div className="flex flex-col items-center">
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold">{coverTitle}</h1>
              <div className="flex items-center justify-center mt-2">
                <span>by <span className="font-medium">{authorName}</span></span>
                <span className="mx-2">•</span>
                <span className="text-gray-500">240 pages</span>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="w-[95%] mx-auto mt-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">Table of Contents</h2>
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
              <div className="text-center py-6">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full"></div>
                <p className="mt-3 text-gray-600">Generating your chapter outlines...</p>
              </div>
            ) : (
              <div className="space-y-5">
                {chapters.map((chapter, index) => (
                  <div key={index} className="pb-3">
                    <div className="flex justify-between items-baseline">
                      <div className="w-full">
                        <h3 className="text-lg font-bold mb-1.5">Chapter {index + 1}: {chapter.title.replace(/^Chapter \d+:?\s*/i, '')}</h3>
                        <p className="text-gray-600 pr-4 text-base">{chapter.description}</p>
                      </div>
                      <span className="text-gray-500 font-normal ml-3 whitespace-nowrap">{chapter.startPage}</span>
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
