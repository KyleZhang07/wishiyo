
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useRef, useEffect, useState } from "react";

interface ImageAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (position: { x: number; y: number }, scale: number) => void;
  initialPosition: { x: number; y: number };
  initialScale: number;
  coverImage?: string;
}

const ImageAdjustDialog = ({
  open,
  onOpenChange,
  onSave,
  initialPosition,
  initialScale,
  coverImage
}: ImageAdjustDialogProps) => {
  const [position, setPosition] = useState(initialPosition);
  const [scale, setScale] = useState(initialScale);
  const gridRef = useRef<HTMLDivElement>(null);

  // 当 initialPosition 或 initialScale 变化时更新内部状态
  useEffect(() => {
    setPosition(initialPosition);
    setScale(initialScale);
  }, [initialPosition, initialScale]);

  // 只保留点击调整位置的逻辑
  const updatePosition = (event: React.MouseEvent) => {
    if (!gridRef.current) return;

    const rect = gridRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    setPosition({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y))
    });
  };

  // 简化为只有点击事件
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    updatePosition(event);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle className="text-center text-2xl mb-4">
          Adjust image
        </DialogTitle>

        <div
          ref={gridRef}
          className="relative aspect-[4/3] mb-6 bg-gray-900 rounded-lg overflow-hidden cursor-pointer"
          onClick={handleClick}
        >
          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array(9).fill(null).map((_, i) => (
              <div
                key={i}
                className="border border-gray-600"
              />
            ))}
          </div>

          {/* Preview image */}
          {coverImage && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${position.x * 50}%, ${position.y * 50}%) scale(${scale / 100})`
              }}
            >
              <img
                src={coverImage}
                alt="Cover preview"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Image size</label>
            <Slider
              value={[scale]}
              onValueChange={(values) => setScale(values[0])}
              min={60}
              max={180}
              step={1}
              className="w-full"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSave(position, scale);
                onOpenChange(false);
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageAdjustDialog;
