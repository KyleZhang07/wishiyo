import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WizardStep from '@/components/wizard/WizardStep';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';
import { Button } from '@/components/ui/button';

interface Chapter {
  title: string;
  description: string;
}

const PreviewStep = () => {
  const navigate = useNavigate();
  const [coverTitle, setCoverTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [coverImage, setCoverImage] = useState<string>();
  const [selectedStyle, setSelectedStyle] = useState('modern-green');
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(100);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    // Load data from localStorage
    const savedAuthor = localStorage.getItem('funnyBiographyAuthorName');
    const savedIdeas = localStorage.getItem('funnyBiographyGeneratedIdeas');
    const savedIdeaIndex = localStorage.getItem('funnyBiographySelectedIdea');
    const savedPhotos = localStorage.getItem('funnyBiographyPhoto');
    const savedStyle = localStorage.getItem('funnyBiographySelectedStyle');
    
    if (savedAuthor) {
      setAuthorName(savedAuthor);
    }

    if (savedIdeas && savedIdeaIndex) {
      const ideas = JSON.parse(savedIdeas);
      const selectedIdea = ideas[parseInt(savedIdeaIndex)];
      if (selectedIdea) {
        setCoverTitle(selectedIdea.title || '');
        setSubtitle(selectedIdea.description || '');
        // Always use the authorName from localStorage
        if (savedAuthor) {
          setAuthorName(savedAuthor);
        }
      }
    }

    if (savedPhotos) {
      setCoverImage(savedPhotos);
    }

    if (savedStyle) {
      setSelectedStyle(savedStyle);
    }

    // Mock chapters data - this would be replaced with real generated chapters
    setChapters([
      {
        title: "Early Days: The Making of a Legend",
        description: "Childhood adventures and formative experiences that shaped the quirky personality everyone knows today."
      },
      {
        title: "The College Years: Academic Chaos",
        description: "From late-night study sessions to legendary parties, how education took a backseat to life lessons."
      },
      {
        title: "Professional Mishaps and Triumphs",
        description: "Career highlights featuring ingenious solutions to workplace problems and remarkable failures turned into wins."
      },
      {
        title: "Relationships: Hearts Broken and Mended",
        description: "A candid look at romantic escapades, friendship dramas, and family feuds that define human connections."
      },
      {
        title: "Legacy of Laughter: Life Philosophies",
        description: "Words of wisdom, terrible advice, and the unique outlook on life that makes this biography worth reading."
      }
    ]);
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
              <p className="mt-2 text-gray-500">180 pages</p>
            </div>
          </div>

          {/* Table of Contents */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-center">Table of Contents</h2>
            <div className="space-y-6">
              {chapters.map((chapter, index) => (
                <div key={index} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold">Chapter {index + 1}: {chapter.title}</h3>
                      <p className="text-gray-600 mt-2">{chapter.description}</p>
                    </div>
                    <span className="text-gray-400">pg. {(index * 30) + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button 
            className="w-full py-6 text-lg mt-8"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </WizardStep>
  );
};

export default PreviewStep; 