
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LIGHTX_API_ENDPOINT = "https://api.lightxeditor.com/external/api/v1/expand-photo";

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
      return new Response(
        JSON.stringify({ error: "No image URL provided" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    const LIGHTX_API_KEY = Deno.env.get("LIGHTX_API_KEY");
    if (!LIGHTX_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LightX API key not configured" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    // 计算需要扩展的像素数
    // 假设原图是 1024x1024，我们想要扩展到 2048x1024
    const leftPadding = 1024; // 向左扩展一倍宽度

    console.log("Calling LightX API to expand image...");
    let lightxResponse;
    try {
      lightxResponse = await fetch(LIGHTX_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": LIGHTX_API_KEY,
        },
        body: JSON.stringify({
          imageUrl,
          leftPadding,
          rightPadding: 0,
          topPadding: 0,
          bottomPadding: 0,
          textPrompt: "clean, clear, empty background with solid colors and no objects, perfect for text overlay, minimalist design"
        })
      });
    } catch (error) {
      console.error("Network error calling LightX API:", error);
      return new Response(
        JSON.stringify({ error: "Failed to connect to LightX API" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    if (!lightxResponse.ok) {
      const errorText = await lightxResponse.text();
      console.error("LightX API error:", errorText);
      return new Response(
        JSON.stringify({ 
          error: `LightX API error: ${lightxResponse.status} ${lightxResponse.statusText}`,
          details: errorText 
        }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    let responseData;
    try {
      responseData = await lightxResponse.json();
    } catch (error) {
      console.error("Error parsing LightX API response:", error);
      return new Response(
        JSON.stringify({ error: "Invalid response from LightX API" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    console.log("LightX API response:", responseData);

    // 获取扩展后的图片URL（根据LightX API的实际响应格式调整）
    const expandedImageUrl = responseData.outputUrl || responseData.url;
    if (!expandedImageUrl) {
      return new Response(
        JSON.stringify({ error: "No image URL in LightX API response" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    console.log("Downloading expanded image...");
    let expandedImageBlob;
    try {
      expandedImageBlob = await downloadImageAsBlob(expandedImageUrl);
    } catch (error) {
      console.error("Error downloading expanded image:", error);
      return new Response(
        JSON.stringify({ error: "Failed to download expanded image" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    try {
      const base64Data = await blobToBase64(expandedImageBlob);
      const response = {
        imageData: `data:${expandedImageBlob.type};base64,${base64Data}`,
      };

      return new Response(
        JSON.stringify(response), 
        {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json" 
          }
        }
      );
    } catch (error) {
      console.error("Error converting image to base64:", error);
      return new Response(
        JSON.stringify({ error: "Failed to convert image to base64" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }
  } catch (error) {
    console.error("Error in expand-image function:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
