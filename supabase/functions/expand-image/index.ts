
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LIGHTX_API_ENDPOINT = "https://api.lightx.ai/v1/image-editing/expand-image";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    console.log('Received image URL:', imageUrl);
    
    if (!imageUrl) {
      throw new Error('No image URL provided');
    }

    console.log('Fetching image from URL...');
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageBlob = await imageResponse.blob();
    console.log('Image downloaded successfully');

    // 准备 LightX API 请求数据
    const formData = new FormData();
    formData.append('image', imageBlob);
    formData.append('prompt', 'clean background, empty space, suitable for text, minimal, simple, no objects, no distractions, solid colors');
    formData.append('expand_ratio', '2');
    formData.append('expand_direction', 'left');

    const LIGHTX_API_KEY = Deno.env.get('LIGHTX_API_KEY');
    if (!LIGHTX_API_KEY) {
      throw new Error('LightX API key not configured');
    }

    console.log('Calling LightX API...');
    const lightXResponse = await fetch(LIGHTX_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LIGHTX_API_KEY}`,
      },
      body: formData,
    });

    if (!lightXResponse.ok) {
      const errorText = await lightXResponse.text();
      console.error('LightX API error:', errorText);
      throw new Error(`LightX API error: ${lightXResponse.status} ${lightXResponse.statusText}`);
    }

    console.log('Successfully received expanded image');
    const expandedImage = await lightXResponse.blob();
    
    return new Response(expandedImage, {
      headers: {
        ...corsHeaders,
        'Content-Type': expandedImage.type,
      }
    });
  } catch (error) {
    console.error('Error in expand-image function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
