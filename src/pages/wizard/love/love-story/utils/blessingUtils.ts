
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage } from '@/integrations/supabase/storage';

/**
 * Generate a personalized blessing using OpenAI
 * 
 * @param characterName The name of the main character
 * @param partnerName The name of the partner
 * @param style The selected style for the book
 * @returns A personalized blessing text
 */
export const generateBlessing = async (
  characterName: string,
  partnerName: string,
  style: string
): Promise<string> => {
  try {
    console.log('Generating blessing with parameters:', {
      characterName,
      partnerName,
      style
    });

    const { data, error } = await supabase.functions.invoke('generate-blessing', {
      body: { 
        characterName,
        partnerName,
        style,
        tone: 'loving'
      }
    });

    if (error) throw error;
    
    if (!data?.blessing) {
      throw new Error('No blessing text returned from API');
    }
    
    console.log('Generated blessing:', data.blessing);
    return data.blessing;
  } catch (err) {
    console.error('Error generating blessing:', err);
    throw err;
  }
};

/**
 * Render blessing text as an image and upload to Supabase
 * 
 * @param blessingText The blessing text to render
 * @returns URL of the uploaded blessing image
 */
export const renderAndUploadBlessing = async (blessingText: string): Promise<string> => {
  try {
    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }
    
    // Set background color - light cream color
    ctx.fillStyle = '#FFF8E8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw decorative border
    ctx.strokeStyle = '#D4AF37'; // Gold color
    ctx.lineWidth = 15;
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
    
    // Add subtle decorative corners
    const cornerSize = 80;
    const drawCorner = (x: number, y: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation * Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(cornerSize, 0);
      ctx.arcTo(0, 0, 0, cornerSize, cornerSize);
      ctx.stroke();
      ctx.restore();
    };
    
    // Draw corners
    ctx.lineWidth = 5;
    drawCorner(50, 50, 0); // Top left
    drawCorner(canvas.width - 50, 50, 1); // Top right
    drawCorner(canvas.width - 50, canvas.height - 50, 2); // Bottom right
    drawCorner(50, canvas.height - 50, 3); // Bottom left
    
    // Add decorative line under title
    ctx.beginPath();
    ctx.moveTo(300, 250);
    ctx.lineTo(900, 250);
    ctx.stroke();
    
    // Draw title
    ctx.fillStyle = '#8B4513'; // Dark brown
    ctx.font = 'bold 72px serif';
    ctx.textAlign = 'center';
    ctx.fillText("Our Love Story", canvas.width / 2, 180);
    
    // Prepare main text font
    ctx.fillStyle = '#333333';
    ctx.font = 'italic 36px serif';
    ctx.textAlign = 'center';
    
    // Word wrap and draw the blessing text
    const words = blessingText.split(' ');
    const maxWidth = 900;
    const lineHeight = 50;
    let line = '';
    let y = 500; // Starting Y position
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, canvas.width / 2, y);
        line = words[i] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    
    // Draw the last line
    ctx.fillText(line, canvas.width / 2, y);
    
    // Draw decorative flourish at the bottom
    const flourishY = Math.min(y + 200, canvas.height - 200);
    
    // Draw curved decorative line
    ctx.beginPath();
    ctx.moveTo(300, flourishY);
    ctx.bezierCurveTo(
      500, flourishY - 50,
      700, flourishY - 50,
      900, flourishY
    );
    ctx.stroke();
    
    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    
    // Upload to Supabase Storage with a timestamp to ensure unique filenames
    const timestamp = Date.now();
    const storageUrl = await uploadImageToStorage(
      dataUrl, 
      'images', 
      `love-story-intro-blessing-${timestamp}`
    );
    
    return storageUrl;
  } catch (err) {
    console.error('Error rendering and uploading blessing:', err);
    throw err;
  }
};
