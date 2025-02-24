
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PICSART_API_ENDPOINT = "https://genai-api.picsart.io/v1/painting/expand";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    console.log('Received request to expand image:', imageUrl);

    // Download original image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch original image: ${imageResponse.statusText}`);
    }

    // Get image blob
    const imageBlob = await imageResponse.blob();
    
    // Get image dimensions
    const imgData = await createImageBitmap(imageBlob);
    const originalWidth = imgData.width;
    const originalHeight = imgData.height;
    console.log(`Original image dimensions: ${originalWidth}x${originalHeight}`);

    const formData = new FormData();
    formData.append('image', imageBlob);
    formData.append('width', String(originalWidth * 2)); // Double the width
    formData.append('height', String(originalHeight));   // Keep height the same
    formData.append('direction', 'left');               // Expand to the left
    formData.append('prompt', 'clean minimalist solid color background, perfect for text overlay'); // Prompt for clean expansion

    const PICSART_API_KEY = Deno.env.get('PICSART_API_KEY');
    if (!PICSART_API_KEY) {
      throw new Error('Picsart API key not configured');
    }

    // Call Picsart API
    console.log('Calling Picsart API for image expansion...');
    const picsartResponse = await fetch(PICSART_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-Picsart-API-Key': PICSART_API_KEY
      },
      body: formData
    });

    if (!picsartResponse.ok) {
      const errorText = await picsartResponse.text();
      console.error('Picsart API error:', errorText);
      throw new Error(`Picsart API error: ${picsartResponse.status}`);
    }

    const result = await picsartResponse.json();
    console.log('Successfully received expanded image data');

    if (!result.url) {
      throw new Error('No image URL in Picsart response');
    }

    // Download the expanded image
    const expandedImageResponse = await fetch(result.url);
    if (!expandedImageResponse.ok) {
      throw new Error('Failed to fetch expanded image from Picsart');
    }

    const expandedImageData = await expandedImageResponse.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(expandedImageData)));
    
    return new Response(
      JSON.stringify({ 
        imageData: `data:image/png;base64,${base64}`
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in expand-image function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
