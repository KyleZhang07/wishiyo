
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PICSART_API_ENDPOINT = "https://genai-api.picsart.io/v1/painting/expand";

async function downloadImageAsBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  return await response.blob();
}

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binaryString = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binaryString);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    console.log("Received image URL:", imageUrl);

    if (!imageUrl) {
      throw new Error("No image URL provided");
    }

    console.log("Downloading image...");
    const imageBlob = await downloadImageAsBlob(imageUrl);
    
    const PICSART_API_KEY = Deno.env.get("PICSART_API_KEY");
    if (!PICSART_API_KEY) {
      throw new Error("PicsArt API key not configured");
    }

    const formData = new FormData();
    formData.append("image", imageBlob, "image.png");
    // 设置扩展后的图片尺寸为原图的2倍宽度
    formData.append("width", "2048");  // 这个值需要足够大以适应各种输入图片
    formData.append("height", "1024"); // 保持高度不变
    formData.append("direction", "left");
    formData.append("prompt", "clean, clear, empty background with solid colors and no objects, perfect for text overlay, minimalist design");

    console.log("Calling PicsArt API to expand image...");
    const picsartResponse = await fetch(PICSART_API_ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": PICSART_API_KEY,
      },
      body: formData,
    });

    if (!picsartResponse.ok) {
      const errorText = await picsartResponse.text();
      console.error("PicsArt API error:", errorText);
      throw new Error(`PicsArt API error: ${picsartResponse.status} ${picsartResponse.statusText}`);
    }

    const responseData = await picsartResponse.json();
    console.log("PicsArt API response:", responseData);

    if (!responseData.data?.images?.[0]) {
      throw new Error("No image data in PicsArt API response");
    }

    // 下载扩展后的图片
    const expandedImageUrl = responseData.data.images[0];
    console.log("Downloading expanded image...");
    const expandedImageBlob = await downloadImageAsBlob(expandedImageUrl);

    // 转换为Base64
    const base64Data = await blobToBase64(expandedImageBlob);
    const response = {
      imageData: `data:${expandedImageBlob.type};base64,${base64Data}`,
    };

    return new Response(JSON.stringify(response), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error in expand-image function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
