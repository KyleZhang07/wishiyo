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

  // 拖动相关状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragStartImagePos, setDragStartImagePos] = useState({ x: 0, y: 0 });

  // 更新位置的逻辑 - 支持鼠标和触摸事件
  const updatePosition = (clientX: number, clientY: number) => {
    if (!gridRef.current || !isDragging) return;

    const rect = gridRef.current.getBoundingClientRect();

    // 计算位置偏移
    const deltaX = (clientX - dragStartPos.x) / rect.width * 2;
    const deltaY = (clientY - dragStartPos.y) / rect.height * 2;

    // 基于拖动起始位置计算新位置
    const newX = dragStartImagePos.x + deltaX;
    const newY = dragStartImagePos.y + deltaY;

    setPosition({
      x: Math.max(-1, Math.min(1, newX)),
      y: Math.max(-1, Math.min(1, newY))
    });
  };

  // 鼠标事件处理函数
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    // 只在点击图片时才开始拖动
    if (event.target instanceof HTMLImageElement) {
      setIsDragging(true);
      setDragStartPos({ x: event.clientX, y: event.clientY });
      setDragStartImagePos({ ...position });

      // 防止默认行为和文本选择
      event.preventDefault();
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      updatePosition(event.clientX, event.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 添加鼠标离开事件处理
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // 触摸事件处理函数
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    // 只在触摸图片时才开始拖动，并且只处理单点触摸
    if (event.target instanceof HTMLImageElement && event.touches.length === 1) {
      const touch = event.touches[0];
      setIsDragging(true);
      setDragStartPos({ x: touch.clientX, y: touch.clientY });
      setDragStartImagePos({ ...position });

      // 防止默认行为和事件冒泡
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging && event.touches.length === 1) {
      const touch = event.touches[0];
      updatePosition(touch.clientX, touch.clientY);
      // 防止页面滚动和默认行为
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(false);
    // 防止默认行为
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle className="text-center text-2xl mb-4">
          Drag image
        </DialogTitle>

        <div
          ref={gridRef}
          className="relative aspect-[4/3] mb-6 bg-gray-900 rounded-lg overflow-hidden touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
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
                className="max-w-full max-h-full object-contain cursor-move"
                style={{ userSelect: 'none' }}
                draggable="false"
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
