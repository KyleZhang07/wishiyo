
import React from 'react';
import { ContentImageCard } from './ContentImageCard';
import { ImageText } from '../hooks/useImageGeneration';

interface StoryContentSectionProps {
  contentImages: {[key: number]: string | undefined};
  isGeneratingContent: {[key: number]: boolean};
  imageTexts: ImageText[];
  onRegenerateImage: (index: number, style?: string) => void;
  onUpdateText: (index: number, text: string) => void;
}

const StoryContentSection: React.FC<StoryContentSectionProps> = ({
  contentImages,
  isGeneratingContent,
  imageTexts,
  onRegenerateImage,
  onUpdateText
}) => {
  const renderContentImage = (imageIndex: number) => {
    const image = contentImages[imageIndex];
    const isLoading = isGeneratingContent[imageIndex] || false;
    
    let imageText = null;
    if (imageTexts && imageTexts.length > imageIndex) {
      imageText = imageTexts[imageIndex]?.text;
    }
    
    console.log(`Rendering content image ${imageIndex} with text:`, imageText);
    
    const title = `Moment ${imageIndex}`;
    
    return (
      <div className="mb-10" key={`content-image-${imageIndex}`}>
        <ContentImageCard 
          image={image} 
          isGenerating={isLoading}
          onRegenerate={(style) => onRegenerateImage(imageIndex, style)}
          index={imageIndex}
          onEditText={() => {}}
          onTextUpdate={(text) => onUpdateText(imageIndex, text)}
          text={imageText}
          title={title}
        />
      </div>
    );
  };

  return (
    <div className="border-t-2 border-gray-200 pt-8">
      <h2 className="text-2xl font-bold mb-6">Story Moments</h2>
      <div className="space-y-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(index => renderContentImage(index))}
      </div>
    </div>
  );
};

export default StoryContentSection;
