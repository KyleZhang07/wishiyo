import { Button } from '@/components/ui/button';
import { Edit, RefreshCw } from 'lucide-react';
import LoveStoryCoverPreview from '@/components/cover-generator/LoveStoryCoverPreview';

interface CoverPreviewCardProps {
  coverTitle: string;
  subtitle: string;
  authorName: string;
  coverImage?: string;
  backCoverText: string;
  isGeneratingCover: boolean;
  onEditCover: () => void;
  onRegenerateCover: () => void;
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
  // Get recipient name from localStorage
  const recipientName = localStorage.getItem('loveStoryPersonName') || 'My Love';

  return (
    <div className="relative">
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
            onClick={onRegenerateCover}
            disabled={isGeneratingCover}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingCover ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </div>
      </div>
    </div>
  );
};
