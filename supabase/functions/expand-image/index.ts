
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LIGHTX_API_ENDPOINT = "https://api.lightxeditor.com/external/api/v1/expand-photo";

// Helper function to convert Blob to Base64
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
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    console.log("Received image URL:", imageUrl);

    if (!imageUrl) {
      throw new Error("No image URL provided");
    }

    console.log("Fetching image from URL...");
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageBlob = await imageResponse.blob();
    console.log("Image downloaded successfully");

    const formData = new FormData();
    formData.append("imageFile", imageBlob, "image.png");
    formData.append(
      "prompt",
      "extend image to the left: generate a clean, clear, empty background with solid colors and no objects, perfect for text overlay"
    );
    formData.append("expand_ratio", "2.0");
    formData.append("expand_direction", "left");

    const LIGHTX_API_KEY = Deno.env.get("LIGHTX_API_KEY");
    if (!LIGHTX_API_KEY) {
      throw new Error("LightX API key not configured");
    }

    console.log("Calling LightX API with params:", {
      expand_ratio: "2.0",
      expand_direction: "left",
      prompt: formData.get("prompt"),
    });

    const lightXResponse = await fetch(LIGHTX_API_ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": LIGHTX_API_KEY,
      },
      body: formData,
    });

    if (!lightXResponse.ok) {
      const errorText = await lightXResponse.text();
      console.error("LightX API error:", errorText);
      throw new Error(
        `LightX API error: ${lightXResponse.status} ${lightXResponse.statusText}`
      );
    }

    console.log("Successfully received expanded image from LightX API");
    const expandedImageBlob = await lightXResponse.blob();

    // Convert Blob to Base64
    const base64Data = await blobToBase64(expandedImageBlob);

    // Return complete data URI
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
