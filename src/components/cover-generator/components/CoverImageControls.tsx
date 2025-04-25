
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ImageAdjustDialog from '../ImageAdjustDialog';

interface CoverImageControlsProps {
  coverImage: string;
  imagePosition: { x: number; y: number };
  imageScale: number;
  onImageAdjust: (position: { x: number; y: number }, scale: number) => void;
}

const CoverImageControls = ({
  coverImage,
  imagePosition,
  imageScale,
  onImageAdjust
}: CoverImageControlsProps) => {
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false);

  return (
    <div>
      <Button
        variant="outline"
        onClick={() => setIsAdjustDialogOpen(true)}
        className="w-full"
      >
        Drag Image
      </Button>

      <ImageAdjustDialog
        open={isAdjustDialogOpen}
        onOpenChange={setIsAdjustDialogOpen}
        onSave={onImageAdjust}
        initialPosition={imagePosition}
        initialScale={imageScale}
        coverImage={coverImage}
      />
    </div>
  );
};

export default CoverImageControls;
