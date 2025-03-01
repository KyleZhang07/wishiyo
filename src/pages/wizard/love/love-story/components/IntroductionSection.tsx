
import React from 'react';
import { ContentImageCard } from './ContentImageCard';
import { ImageText } from '../hooks/useImageGeneration';

interface IntroductionSectionProps {
  introImage?: string;
  isGeneratingIntro: boolean;
  imageTexts: ImageText[];
  onRegenerateIntro: (style?: string) => void;
  onUpdateText: (index: number, text: string) => void;
}

const IntroductionSection: React.FC<IntroductionSectionProps> = ({
  introImage,
  isGeneratingIntro,
  imageTexts,
  onRegenerateIntro,
  onUpdateText
}) => {
  const introText = imageTexts && imageTexts.length > 0 ? imageTexts[0]?.text : undefined;

  return (
    <div className="mb-12 border-t-2 border-gray-200 pt-8">
      <h2 className="text-2xl font-bold mb-6">Introduction</h2>
      <div className="mb-10">
        <ContentImageCard 
          image={introImage} 
          isGenerating={isGeneratingIntro}
          onRegenerate={onRegenerateIntro}
          index={0}
          onEditText={() => {}}
          onTextUpdate={(text) => onUpdateText(0, text)}
          text={introText}
          title="Introduction"
        />
      </div>
    </div>
  );
};

export default IntroductionSection;
