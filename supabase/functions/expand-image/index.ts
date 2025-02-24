
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PICSART_API_ENDPOINT = "https://api.picsart.io/tools/1.0/ai/background/generate";

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    console.log('Received request to expand image:', imageUrl);

    // 下载原始图片
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch original image: ${imageResponse.statusText}`);
    }

    // 获取图片数据
    const imageBlob = await imageResponse.blob();
    const formData = new FormData();
    formData.append('image', imageBlob);
    
    // 添加清晰的扩展提示
    formData.append('prompt', 'clean, clear, empty background with solid colors, no objects, perfect for text overlay');
    formData.append('format', 'json');

    // 设置扩展参数（向左扩展至1:2）
    formData.append('expand_ratio', '2');
    formData.append('expand_direction', 'left');

    const PICSART_API_KEY = Deno.env.get('PICSART_API_KEY');
    if (!PICSART_API_KEY) {
      throw new Error('Picsart API key not configured');
    }

    // 调用 Picsart API
    console.log('Calling Picsart API for image expansion...');
    const picsartResponse = await fetch(PICSART_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-picsart-api-key': PICSART_API_KEY
      },
      body: formData
    });

    if (!picsartResponse.ok) {
      const errorText = await picsartResponse.text();
      console.error('Picsart API error:', errorText);
      throw new Error(`Picsart API error: ${picsartResponse.status}`);
    }

    const expandedImageData = await picsartResponse.arrayBuffer();
    console.log('Successfully received expanded image');

    // 转换为 base64
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
