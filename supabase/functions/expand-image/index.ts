
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PHOT_AI_ENDPOINT = "https://api.phot.ai/v1/outpaint";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    console.log('Received request to expand image:', imageUrl);

    const PHOT_AI_API_KEY = Deno.env.get('PHOT_AI_API_KEY');
    if (!PHOT_AI_API_KEY) {
      throw new Error('Phot.ai API key not configured');
    }

    // Call Phot.ai API to expand the image
    const photResponse = await fetch(PHOT_AI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PHOT_AI_API_KEY}`
      },
      body: JSON.stringify({
        imageUrl,
        prompt: "clean minimalist solid background suitable for text overlay, no objects or patterns, seamless extension",
        targetWidth: 2048,  // Double the width
        targetHeight: 1024, // Keep original height
        outpaintDirection: "left" // Expand to the left
      })
    });

    if (!photResponse.ok) {
      const errorText = await photResponse.text();
      console.error('Phot.ai API error:', errorText);
      throw new Error(`Phot.ai API error: ${photResponse.status}`);
    }

    const result = await photResponse.json();
    console.log('Successfully received expanded image result');

    // Check if we have a taskId that needs polling
    if (result.taskId) {
      console.log('Got taskId, polling for completion:', result.taskId);
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const statusResponse = await fetch(`${PHOT_AI_ENDPOINT}/status/${result.taskId}`, {
          headers: {
            'Authorization': `Bearer ${PHOT_AI_API_KEY}`
          }
        });

        if (!statusResponse.ok) {
          throw new Error('Failed to check status');
        }

        const statusResult = await statusResponse.json();
        console.log('Status check result:', statusResult.status);

        if (statusResult.status === 'completed') {
          result.outputUrl = statusResult.outputUrl;
          break;
        }
        
        if (statusResult.status === 'failed') {
          throw new Error('Image expansion failed');
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      if (attempts >= maxAttempts) {
        throw new Error('Expansion timed out');
      }
    }

    // Get the expanded image
    const outputUrl = result.outputUrl || result.url;
    if (!outputUrl) {
      throw new Error('No output URL in response');
    }

    // Download the expanded image
    const expandedResponse = await fetch(outputUrl);
    if (!expandedResponse.ok) {
      throw new Error('Failed to fetch expanded image');
    }

    const expandedBlob = await expandedResponse.blob();
    const arrayBuffer = await expandedBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    return new Response(
      JSON.stringify({ 
        imageData: `data:${expandedBlob.type};base64,${base64}`
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
