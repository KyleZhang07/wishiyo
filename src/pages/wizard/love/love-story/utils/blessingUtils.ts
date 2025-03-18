
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage } from '@/integrations/supabase/storage';

/**
 * Generates a blessing message using OpenAI
 */
export const generateBlessing = async (
  characterName?: string,
  partnerName?: string,
  style?: string,
  tone: string = 'loving'
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-blessing', {
      body: {
        characterName,
        partnerName,
        style,
        tone
      }
    });

    if (error) {
      console.error('Error generating blessing:', error);
      throw new Error(error.message || 'Failed to generate blessing');
    }

    return data?.blessing || '';
  } catch (error) {
    console.error('Error in generateBlessing:', error);
    throw error;
  }
};

/**
 * Renders a blessing text to a canvas and returns a base64 image
 */
export const renderBlessingToImage = (text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Set canvas dimensions (A4 proportions with high resolution)
      canvas.width = 2480; // A4 width at 300 DPI
      canvas.height = 3508; // A4 height at 300 DPI
      
      // Fill background with a light cream color
      ctx.fillStyle = '#fcf9ed';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw some decorative elements - light yellow butterflies and stars
      drawDecorativeElements(ctx, canvas.width, canvas.height);
      
      // Split the text by lines 
      const textParts = text.split('\n').filter(line => line.trim() !== '');
      
      // Determine if we have a greeting, body, and signature by examining the text
      let greeting = '';
      let body = '';
      let signature = '';
      
      if (textParts.length >= 3) {
        // Assume first line is greeting, last line is signature, everything else is body
        greeting = textParts[0];
        signature = textParts[textParts.length - 1];
        body = textParts.slice(1, textParts.length - 1).join('\n');
      } else if (textParts.length === 2) {
        // Assume first line is greeting, last line contains both body and signature
        greeting = textParts[0];
        body = textParts[1];
      } else if (textParts.length === 1) {
        // Only one line, use it as body
        body = textParts[0];
      }
      
      // Set font styles
      const greetingFont = 'italic 65px Georgia';
      const bodyFont = '45px Georgia';
      const signatureFont = 'italic 55px Georgia';
      
      // Text color - dark gray
      ctx.fillStyle = '#333333';
      
      // Draw greeting
      if (greeting) {
        ctx.font = greetingFont;
        ctx.textAlign = 'center';
        ctx.fillText(greeting, canvas.width / 2, canvas.height / 3);
      }
      
      // Draw body text (with line wrapping)
      if (body) {
        ctx.font = bodyFont;
        ctx.textAlign = 'center';
        const lines = wrapText(ctx, body, canvas.width * 0.7, 55);
        
        let y = canvas.height / 2;
        lines.forEach(line => {
          ctx.fillText(line, canvas.width / 2, y);
          y += 70; // Line spacing
        });
      }
      
      // Draw signature
      if (signature) {
        ctx.font = signatureFont;
        ctx.textAlign = 'center';
        ctx.fillText(signature, canvas.width / 2, canvas.height * 0.75);
      }
      
      // Convert canvas to base64 image
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve(dataUrl);
    } catch (error) {
      console.error('Error rendering blessing to image:', error);
      reject(error);
    }
  });
};

/**
 * Draws decorative elements on the canvas
 */
const drawDecorativeElements = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  // Draw small butterflies and stars in light yellow
  ctx.fillStyle = 'rgba(255, 235, 156, 0.3)';
  
  // Top-left butterfly
  drawButterfly(ctx, width * 0.15, height * 0.15, 30);
  
  // Bottom-right butterfly
  drawButterfly(ctx, width * 0.85, height * 0.85, 30);
  
  // Random scattered stars
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 5 + Math.random() * 10;
    drawStar(ctx, x, y, size);
  }
};

/**
 * Draws a simple butterfly shape
 */
const drawButterfly = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  ctx.save();
  ctx.translate(x, y);
  
  // Draw butterfly wings
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size, -size, size * 2, -size, size, 0);
  ctx.bezierCurveTo(size * 2, size, size, size, 0, 0);
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-size, -size, -size * 2, -size, -size, 0);
  ctx.bezierCurveTo(-size * 2, size, -size, size, 0, 0);
  ctx.fill();
  
  // Draw butterfly body
  ctx.strokeStyle = 'rgba(200, 175, 120, 0.5)';
  ctx.lineWidth = size / 10;
  ctx.beginPath();
  ctx.moveTo(0, -size / 2);
  ctx.lineTo(0, size / 2);
  ctx.stroke();
  
  ctx.restore();
};

/**
 * Draws a simple star
 */
const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
  ctx.save();
  ctx.translate(x, y);
  
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    ctx.lineTo(
      Math.cos((i * 4 * Math.PI) / 5 - Math.PI / 2) * size,
      Math.sin((i * 4 * Math.PI) / 5 - Math.PI / 2) * size
    );
    ctx.lineTo(
      Math.cos(((i * 4 + 1) * Math.PI) / 5 - Math.PI / 2) * (size / 2),
      Math.sin(((i * 4 + 1) * Math.PI) / 5 - Math.PI / 2) * (size / 2)
    );
  }
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
};

/**
 * Wraps text to fit within a certain width
 */
const wrapText = (
  ctx: CanvasRenderingContext2D, 
  text: string, 
  maxWidth: number,
  lineHeight: number
): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && i > 0) {
      lines.push(currentLine.trim());
      currentLine = words[i] + ' ';
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine.trim().length > 0) {
    lines.push(currentLine.trim());
  }
  
  return lines;
};

/**
 * Renders and uploads the blessing image to Supabase
 */
export const renderAndUploadBlessing = async (
  blessing: string
): Promise<string> => {
  try {
    // Render the blessing to an image
    const imageData = await renderBlessingToImage(blessing);
    
    // Generate a timestamp for the filename
    const timestamp = Date.now();
    
    // Upload the image to Supabase Storage
    const storageUrl = await uploadImageToStorage(
      imageData,
      'images',
      `love-story-intro-blessing-${timestamp}`
    );
    
    return storageUrl;
  } catch (error) {
    console.error('Error rendering and uploading blessing:', error);
    throw error;
  }
};
