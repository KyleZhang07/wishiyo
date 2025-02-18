
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ImageIcon, ZoomInIcon, ZoomOutIcon } from 'lucide-react';

interface CoverPreviewProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  coverImage?: string;
  selectedFont: string;
  selectedTemplate?: string;
}

type TemplateType = {
  id: string;
  name: string;
  backgroundColor: string;
  titleStyle: {
    color: string;
    fontSize: string;
    fontWeight: string;
    textAlign: 'left' | 'center' | 'right';
  };
  subtitleStyle: {
    color: string;
    fontSize: string;
    fontWeight: string;
  };
  authorStyle: {
    color: string;
    fontSize: string;
  };
  imageStyle: {
    filter: string;
    opacity: string;
  };
};

const coverTemplates: { [key: string]: TemplateType } = {
  modern: {
    id: 'modern',
    name: 'Modern',
    backgroundColor: '#1A1F2C',
    titleStyle: {
      color: '#ffffff',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textAlign: 'center'
    },
    subtitleStyle: {
      color: '#D6BCFA',
      fontSize: '1.25rem',
      fontWeight: 'normal'
    },
    authorStyle: {
      color: '#9b87f5',
      fontSize: '1rem'
    },
    imageStyle: {
      filter: 'brightness(0.7)',
      opacity: '0.9'
    }
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    backgroundColor: '#F1F0FB',
    titleStyle: {
      color: '#1A1F2C',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textAlign: 'center'
    },
    subtitleStyle: {
      color: '#6E59A5',
      fontSize: '1.25rem',
      fontWeight: 'normal'
    },
    authorStyle: {
      color: '#7E69AB',
      fontSize: '1rem'
    },
    imageStyle: {
      filter: 'brightness(0.9)',
      opacity: '0.8'
    }
  },
  vibrant: {
    id: 'vibrant',
    name: 'Vibrant',
    backgroundColor: '#8B5CF6',
    titleStyle: {
      color: '#ffffff',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      textAlign: 'center'
    },
    subtitleStyle: {
      color: '#FDE1D3',
      fontSize: '1.25rem',
      fontWeight: 'normal'
    },
    authorStyle: {
      color: '#F2FCE2',
      fontSize: '1rem'
    },
    imageStyle: {
      filter: 'brightness(0.6) contrast(1.2)',
      opacity: '0.85'
    }
  }
};

const CoverPreview = ({
  coverTitle,
  subtitle,
  authorName,
  coverImage,
  selectedFont,
  selectedTemplate = 'modern'
}: CoverPreviewProps) => {
  const [imageScale, setImageScale] = useState(100);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const template = coverTemplates[selectedTemplate];

  return (
    <div className="space-y-4">
      <div 
        className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-xl"
        style={{ backgroundColor: template.backgroundColor }}
      >
        {coverImage && (
          <div 
            className="absolute inset-0 bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${coverImage})`,
              backgroundSize: `${imageScale}%`,
              backgroundPosition: `${50 + imagePosition.x}% ${50 + imagePosition.y}%`,
              ...template.imageStyle
            }}
          />
        )}
        <div className="relative z-10 h-full flex flex-col justify-between p-8">
          <div className="space-y-2 text-center">
            <h1 
              className={`${selectedFont}`}
              style={template.titleStyle}
            >
              {coverTitle}
            </h1>
            <p 
              className={`${selectedFont}`}
              style={template.subtitleStyle}
            >
              {subtitle}
            </p>
          </div>
          <div className="text-center">
            <p 
              className={`${selectedFont}`}
              style={template.authorStyle}
            >
              By {authorName}
            </p>
          </div>
        </div>
      </div>
      
      {coverImage && (
        <div className="space-y-4 p-4 bg-gray-900 rounded-lg">
          <div className="flex items-center justify-between text-white">
            <ZoomOutIcon className="h-4 w-4" />
            <Slider
              value={[imageScale]}
              onValueChange={(value) => setImageScale(value[0])}
              min={50}
              max={150}
              step={1}
              className="w-full mx-4"
            />
            <ZoomInIcon className="h-4 w-4" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImageScale(100)}
              className="text-white"
            >
              Reset Zoom
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImagePosition({ x: 0, y: 0 })}
              className="text-white"
            >
              Center Image
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverPreview;
