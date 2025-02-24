
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    // 下载图片
    console.log('Fetching image from URL...');
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageBlob = await imageResponse.blob();
    console.log('Image downloaded successfully');
    
    // 构建 PhotoRoom API 的 FormData 数据
    const formData = new FormData();
    formData.append('imageFile', imageBlob, 'image.png');
    formData.append('outputSize', '2048x1024'); // 输出尺寸（格式为 "宽x高"，可根据需求修改）
    formData.append('referenceBox', 'originalImage');
    formData.append('removeBackground', 'false');
    formData.append('expand.mode', 'ai.auto');
    formData.append('horizontalAlignment', 'right'); // 可选值：left, center, right
    formData.append('verticalAlignment', 'top');       // 可选值：top, center, bottom
    
    console.log('Calling PhotoRoom API...');
    const PHOTOROOM_API_KEY = Deno.env.get('PHOTOROOM_API_KEY');
    if (!PHOTOROOM_API_KEY) {
      throw new Error('PhotoRoom API key not configured');
    }
    
    // 调用正确的 PhotoRoom API 端点（v2）
    const photoRoomResponse = await fetch('https://image-api.photoroom.com/v2/edit', {
      method: 'POST',
      headers: {
        'x-api-key': PHOTOROOM_API_KEY,
      },
      body: formData,
    });
    
    if (!photoRoomResponse.ok) {
      const errorText = await photoRoomResponse.text();
      console.error('PhotoRoom API error:', errorText);
      throw new Error(`PhotoRoom API error: ${photoRoomResponse.status} ${photoRoomResponse.statusText}`);
    }
    console.log('Successfully received expanded image');
    
    // 返回处理后的图片
    return new Response(await photoRoomResponse.blob(), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png'
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
