
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LIGHTX_API_ENDPOINT = "https://api.lightxeditor.com/external/api/v1/expand-photo";

// 将 Blob 转为 Base64 的辅助函数
async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    console.log('Processing image URL:', imageUrl);
    
    if (!imageUrl) {
      throw new Error('No image URL provided');
    }

    // 下载原始图片
    console.log('Downloading original image...');
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    
    const imageBlob = await imageResponse.blob();
    console.log('Original image downloaded, size:', imageBlob.size);

    // 准备LightX请求
    const formData = new FormData();
    formData.append('imageFile', imageBlob, 'image.png');
    formData.append('prompt', 'extend image to the left: generate a clean, clear, empty background with solid colors and no objects, perfect for text overlay');
    formData.append('expand_ratio', '2.0');
    formData.append('expand_direction', 'left');

    const LIGHTX_API_KEY = Deno.env.get('LIGHTX_API_KEY');
    if (!LIGHTX_API_KEY) {
      throw new Error('LightX API key not configured');
    }

    // 调用LightX API
    console.log('Calling LightX API...');
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

    // 处理扩展后的图片
    const expandedBlob = await lightXResponse.blob();
    console.log('Expanded image received, size:', expandedBlob.size);

    // 转换为Base64（不带前缀）
    const base64Data = await blobToBase64(expandedBlob);
    const contentType = expandedBlob.type || 'image/png';
    
    console.log('Successfully converted to Base64');

    // 返回Base64数据和内容类型
    return new Response(
      JSON.stringify({
        base64: base64Data,
        contentType
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
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
