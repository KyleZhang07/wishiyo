
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const apiKey = Deno.env.get('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    console.log('Making request to DALL-E with prompt:', prompt);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `Create a romantic, anime-style illustration of ${prompt}. The image should be high quality and suitable for a book cover, with clear character details and expressions.`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid"
      }),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('DALL-E API error:', responseData);
      throw new Error(responseData.error?.message || 'Failed to generate image');
    }

    if (!responseData.data?.[0]?.url) {
      throw new Error('No image URL in response');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        image: responseData.data[0].url 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        }
      }
    );

  } catch (error) {
    console.error('Error in generate-anime-couple function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
