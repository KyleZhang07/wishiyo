
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Edit } from 'lucide-react';

const GenerateStep = () => {
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single');
  const coverCanvasRef = useRef<HTMLCanvasElement>(null);
  const contentCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    drawCover();
    drawContent();
  }, [viewMode]);

  const drawCover = () => {
    const canvas = coverCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 1200;

    // Draw background
    ctx.fillStyle = '#FFECD1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.font = 'bold 60px serif';
    ctx.fillStyle = '#C41E3A';
    ctx.textAlign = 'center';
    ctx.fillText('KK,', canvas.width/2, 200);
    ctx.fillText('I LOVE YOU', canvas.width/2, 280);

    // Draw author
    ctx.font = 'italic 36px serif';
    ctx.fillText('by ss', canvas.width/2, 350);

    // Draw subtitle banner
    ctx.font = '32px serif';
    ctx.fillText('On Our 15th Anniversary', canvas.width/2, 900);
  };

  const drawContent = () => {
    const canvas = contentCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on view mode
    const width = viewMode === 'single' ? 800 : 1600;
    canvas.width = width;
    canvas.height = 1200;

    // Draw background
    ctx.fillStyle = '#FFECD1';
    ctx.fillRect(0, 0, width, canvas.height);

    // Draw content
    ctx.font = '24px serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';

    const text = `Dear kk,

This book is full of the words I have chosen for you.
Thank you for making the story of us so beautiful.

Happy Anniversary!

Love,
ss`;

    const lines = text.split('\n');
    let y = 200;
    lines.forEach(line => {
      ctx.fillText(line, 100, y);
      y += 40;
    });
  };

  const handleEditCover = () => {
    toast({
      title: "Edit Cover",
      description: "Opening cover editor..."
    });
  };

  const handleEditContent = () => {
    toast({
      title: "Edit Content",
      description: "Opening content editor..."
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-end mb-4">
        <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'single' | 'double')}>
          <ToggleGroupItem value="single">One-page view</ToggleGroupItem>
          <ToggleGroupItem value="double">Two-page view</ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Card className="p-8 relative">
        <canvas
          ref={coverCanvasRef}
          className="w-full max-w-2xl mx-auto"
          style={{ aspectRatio: '3/4' }}
        />
        <Button
          variant="secondary"
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
          onClick={handleEditCover}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit cover
        </Button>
      </Card>

      <Card className="p-8 relative">
        <canvas
          ref={contentCanvasRef}
          className="w-full max-w-4xl mx-auto"
          style={{ aspectRatio: viewMode === 'single' ? '3/4' : '6/4' }}
        />
        <Button
          variant="secondary"
          className="absolute bottom-4 right-4"
          onClick={handleEditContent}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit dedication
        </Button>
      </Card>

      <div className="flex justify-center mt-8">
        <Button size="lg" className="w-full max-w-md">
          Generate Final Book
        </Button>
      </div>
    </div>
  );
};

export default GenerateStep;
