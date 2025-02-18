
import { useState } from 'react';
import ImageControls from './ImageControls';
import CoverContent from './CoverContent';
import { coverTemplates } from './types';

interface CoverPreviewProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  coverImage?: string;
  selectedFont: string;
  selectedTemplate?: string;
}

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
        <CoverContent
          coverTitle={coverTitle}
          subtitle={subtitle}
          authorName={authorName}
          selectedFont={selectedFont}
          template={template}
        />
      </div>
      
      {coverImage && (
        <ImageControls
          imageScale={imageScale}
          onScaleChange={setImageScale}
          onReset={() => setImageScale(100)}
          onCenter={() => setImagePosition({ x: 0, y: 0 })}
        />
      )}
    </div>
  );
};

export default CoverPreview;
