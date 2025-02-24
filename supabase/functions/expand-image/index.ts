
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 正确的 LightX API 端点
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

    // 创建一个临时的 img 元素来获取图片尺寸
    const img = new Image();
    const imgLoaded = new Promise((resolve, reject) => {
      img.onload = () => resolve(null);
      img.onerror = () => reject(new Error('Failed to load image'));
    });
    img.src = URL.createObjectURL(imageBlob);
    await imgLoaded;

    // 计算需要扩展的像素值使其达到 1:2 的比例
    const width = img.width;
    const targetWidth = width * 2; // 目标宽度是原始宽度的2倍
    const paddingLeft = targetWidth - width; // 需要向左扩展的像素值

    // 准备 LightX API 请求数据
    const formData = new FormData();
    formData.append('imageFile', imageBlob, 'image.png');
    // 使用详细的提示词来确保生成干净的背景
    formData.append('textPrompt', 'clean minimalist background, solid color, empty space for text, no objects, no patterns, simple design, suitable for text overlay, pristine surface, clear area, uncluttered space');
    // 设置扩展参数：只向左扩展到1:2比例
    formData.append('leftPadding', paddingLeft.toString());
    formData.append('rightPadding', '0');
    formData.append('topPadding', '0');
    formData.append('bottomPadding', '0');

    const LIGHTX_API_KEY = Deno.env.get('LIGHTX_API_KEY');
    if (!LIGHTX_API_KEY) {
      throw new Error('LightX API key not configured');
    }

    console.log('Calling LightX API...');
    console.log('Left padding:', paddingLeft);
    
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
