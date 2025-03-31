
import { Button } from '@/components/ui/button';
import { Edit, RefreshCw } from 'lucide-react';
import LoveStoryCoverPreview from '@/components/cover-generator/LoveStoryCoverPreview';
import { useEffect, useState } from 'react';

// Style interface definition
interface CoverStyle {
  id: string;
  name: string;
  background: string;
  titleColor: string;
  subtitleColor: string;
  authorColor: string;
  font: string;
  borderColor?: string;
}

// Predefined cover styles
const coverStyles: CoverStyle[] = [
  {
    id: 'classic',
    name: '经典',
    background: '#f5f5f0',
    titleColor: '#5a5a5a',
    subtitleColor: '#633d63',
    authorColor: '#333333',
    font: 'playfair'
  },
  {
    id: 'modern',
    name: '现代',
    background: '#e8f4f8',
    titleColor: '#2c3e50',
    subtitleColor: '#16a085',
    authorColor: '#34495e',
    font: 'montserrat'
  },
  {
    id: 'elegant',
    name: '优雅',
    background: '#f9f3f0',
    titleColor: '#8e44ad',
    subtitleColor: '#d35400',
    authorColor: '#7f8c8d',
    font: 'didot'
  },
  {
    id: 'playful',
    name: '活泼',
    background: '#f0f9e8',
    titleColor: '#27ae60',
    subtitleColor: '#e74c3c',
    authorColor: '#3498db',
    font: 'comic-sans'
  },
  {
    id: 'vintage',
    name: '复古',
    background: '#f5e8d0',
    titleColor: '#c0392b',
    subtitleColor: '#8e44ad',
    authorColor: '#2c3e50',
    font: 'georgia'
  }
];

interface CoverPreviewCardProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  coverImage?: string;
  backCoverText: string;
  isGeneratingCover: boolean;
}

export const CoverPreviewCard = ({
  coverTitle,
  subtitle,
  authorName,
  coverImage,
  backCoverText,
  isGeneratingCover
}: CoverPreviewCardProps) => {
  // Get recipient name from localStorage
  const recipientName = localStorage.getItem('loveStoryPersonName') || 'My Love';
  
  // Get user selected style
  const [selectedStyle, setSelectedStyle] = useState<CoverStyle | undefined>(coverStyles[0]);
  
  useEffect(() => {
    // Read style from localStorage
    const savedStyleId = localStorage.getItem('loveStoryCoverStyle');
    if (savedStyleId) {
      const style = coverStyles.find(style => style.id === savedStyleId);
      if (style) {
        setSelectedStyle(style);
      }
    }
  }, []);

  // Format data for LoveStoryCoverPreview
  const titleData = {
    mainTitle: coverTitle,
    subTitle: subtitle,
    thirdLine: '',
    fullTitle: coverTitle
  };

  return (
    <div className="relative">
      <div className="max-w-xl mx-auto">
        <LoveStoryCoverPreview
          titleData={titleData}
          subtitle={subtitle}
          authorName={authorName}
          recipientName={recipientName}
          coverImage={coverImage}
          selectedFont={selectedStyle?.font || "playfair"}
          style={selectedStyle}
        />
      </div>
    </div>
  );
};
