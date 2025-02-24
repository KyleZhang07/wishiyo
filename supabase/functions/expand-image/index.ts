
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LIGHTX_API_ENDPOINT = "https://api.lightxeditor.com/external/api/v1/expand-photo";

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

    // 构建 LightX API 请求数据，使用正确的字段名
    const formData = new FormData();
    formData.append('imageFile', imageBlob, 'image.png');
    formData.append('prompt', 'extend image to the left: generate a clean, clear, empty background with solid colors and no objects, perfect for text overlay');
    formData.append('expand_ratio', '2.0');  // 扩展到原图的2倍宽度
    formData.append('expand_direction', 'left');  // 向左扩展

    const LIGHTX_API_KEY = Deno.env.get('LIGHTX_API_KEY');
    if (!LIGHTX_API_KEY) {
      throw new Error('LightX API key not configured');
    }

    console.log('Calling LightX API with params:', {
      expand_ratio: '2.0',
      expand_direction: 'left',
      prompt: formData.get('prompt')
    });
    
    const lightXResponse = await fetch(LIGHTX_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': LIGHTX_API_KEY,
      },
      body: formData,
    });

    if (!lightXResponse.ok) {
      const errorText = await lightXResponse.text();
      console.error('LightX API error:', errorText);
      throw new Error(`LightX API error: ${lightXResponse.status} ${lightXResponse.statusText}`);
    }

    console.log('Successfully received expanded image from LightX API');
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
