
import { Button } from '@/components/ui/button';
import { Edit, RefreshCw } from 'lucide-react';

interface ContentImageCardProps {
  image?: string;
  isGenerating: boolean;
  onEditText: () => void;
  onRegenerate: () => void;
  index: number;
  authorName?: string;
  coverTitle?: string;
  showDedicationText?: boolean;
}

export const ContentImageCard = ({
  image,
  isGenerating,
  onEditText,
  onRegenerate,
  index,
  authorName,
  coverTitle,
  showDedicationText = false
}: ContentImageCardProps) => {
  return (
    <div className="glass-card rounded-2xl p-8 py-[40px] relative">
      <div className="max-w-xl mx-auto">
        <div className="aspect-[2/1] bg-[#FFECD1] rounded-lg p-8 relative">
          <div className="h-full flex flex-col justify-center items-center text-center space-y-6">
            {image && (
              <div className="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center">
                <img 
                  src={image} 
                  alt={`Content ${index}`}
                  className="w-auto h-full object-contain max-w-full"
                />
                <div className="absolute inset-0 bg-[#FFECD1] opacity-40" />
              </div>
            )}
            {showDedicationText && (
              <div className="space-y-4 relative z-10">
                <p className="text-lg">Dear {coverTitle?.split(',')[0]},</p>
                <p className="text-lg">
                  This book is full of the words I have chosen for you.<br/>
                  Thank you for making the story of us so beautiful.
                </p>
                <p className="text-lg">Happy Anniversary!</p>
                <p className="text-lg">Love,<br/>{authorName}</p>
              </div>
            )}
          </div>
        </div>
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            onClick={onEditText}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit text
          </Button>
          <Button
            variant="secondary"
            onClick={onRegenerate}
            disabled={isGenerating}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate image
          </Button>
        </div>
      </div>
    </div>
  );
};
