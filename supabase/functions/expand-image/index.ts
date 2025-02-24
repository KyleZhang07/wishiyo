
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
      return new Response(
        JSON.stringify({ error: "No image URL provided" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    console.log("Downloading image...");
    let imageBlob;
    try {
      imageBlob = await downloadImageAsBlob(imageUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      return new Response(
        JSON.stringify({ error: "Failed to download image" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    const PICSART_API_KEY = Deno.env.get("PICSART_API_KEY");
    if (!PICSART_API_KEY) {
      return new Response(
        JSON.stringify({ error: "PicsArt API key not configured" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    const formData = new FormData();
    formData.append("image", imageBlob, "image.png");
    // 设置宽度为原图的2倍，保持高度不变
    formData.append("width", "2048");
    formData.append("height", "1024");
    formData.append("direction", "left");
    formData.append("prompt", "clean, clear, empty background with solid colors and no objects, perfect for text overlay, minimalist design");

    console.log("Calling PicsArt API to expand image...");
    let picsartResponse;
    try {
      picsartResponse = await fetch(PICSART_API_ENDPOINT, {
        method: "POST",
        headers: {
          "x-api-key": PICSART_API_KEY,
        },
        body: formData,
      });
    } catch (error) {
      console.error("Network error calling PicsArt API:", error);
      return new Response(
        JSON.stringify({ error: "Failed to connect to PicsArt API" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    if (!picsartResponse.ok) {
      const errorText = await picsartResponse.text();
      console.error("PicsArt API error:", errorText);
      return new Response(
        JSON.stringify({ 
          error: `PicsArt API error: ${picsartResponse.status} ${picsartResponse.statusText}`,
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
      responseData = await picsartResponse.json();
    } catch (error) {
      console.error("Error parsing PicsArt API response:", error);
      return new Response(
        JSON.stringify({ error: "Invalid response from PicsArt API" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    console.log("PicsArt API response:", responseData);

    if (!responseData.data?.images?.[0]) {
      return new Response(
        JSON.stringify({ error: "No image data in PicsArt API response" }), 
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500 
        }
      );
    }

    const expandedImageUrl = responseData.data.images[0];
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
