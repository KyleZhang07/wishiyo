
import { Button } from '@/components/ui/button';
import { Edit, RefreshCw } from 'lucide-react';
import CanvasCoverPreview from '@/components/cover-generator/CanvasCoverPreview';

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
  return (
    <div className="glass-card rounded-2xl p-8 py-[40px] relative">
      <div className="max-w-xl mx-auto">
        <CanvasCoverPreview
          coverTitle={coverTitle}
          subtitle={subtitle}
          authorName={authorName}
          coverImage={coverImage}
          selectedFont="playfair"
          selectedTemplate="modern"
          selectedLayout="centered"
          backCoverText={backCoverText}
          category="love"
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
            Regenerate cover
          </Button>
        </div>
      </div>
    </div>
  );
};
