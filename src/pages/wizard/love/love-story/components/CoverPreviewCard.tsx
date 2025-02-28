import { Button } from '@/components/ui/button';
import { Edit, RefreshCw } from 'lucide-react';
import LoveStoryCoverPreview from '@/components/cover-generator/LoveStoryCoverPreview';
import { useState, useEffect } from 'react';
import { getDataFromStore } from '@/utils/indexedDB';

interface CoverPreviewCardProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  coverImage?: string;
  backCoverText: string;
  isGeneratingCover: boolean;
  onEditCover: () => void;
  onRegenerateCover: (style?: string) => void;
}

export const CoverPreviewCard = ({
  coverTitle,
  subtitle,
  authorName,
  coverImage,
  backCoverText,
  isGeneratingCover,
  onEditCover,
  onRegenerateCover
}: CoverPreviewCardProps) => {
  const [recipientName, setRecipientName] = useState<string>('My Love');
  
  useEffect(() => {
    // First try to get from localStorage, as text data is still in localStorage
    const savedRecipient = localStorage.getItem('loveStoryRecipientName');
    if (savedRecipient) {
      setRecipientName(savedRecipient);
    } else {
      // As a fallback, try to get from IndexedDB
      const loadRecipientName = async () => {
        try {
          const storedRecipient = await getDataFromStore('loveStoryRecipientName');
          if (storedRecipient) {
            setRecipientName(storedRecipient);
          }
        } catch (error) {
          console.error('Error loading recipient name from IndexedDB:', error);
        }
      };
      
      loadRecipientName();
    }
  }, []);

  return (
    <div className="glass-card rounded-2xl p-8 py-[40px] relative">
      <div className="max-w-xl mx-auto">
        <LoveStoryCoverPreview
          coverTitle={coverTitle}
          subtitle={subtitle}
          authorName={authorName}
          recipientName={recipientName}
          coverImage={coverImage}
          selectedFont="playfair"
        />
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          <Button
            variant="secondary"
            onClick={onEditCover}
            disabled={isGeneratingCover}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit cover
          </Button>
          <Button
            variant="secondary"
            onClick={() => onRegenerateCover()}
            disabled={isGeneratingCover}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingCover ? 'animate-spin' : ''}`} />
            Regenerate cover
          </Button>
        </div>
      </div>
    </div>
  );
};
