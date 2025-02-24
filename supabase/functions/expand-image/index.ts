
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LIGHTX_API_ENDPOINT = "https://api.lightxeditor.com/external/api/v1/expand-photo";

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
    console.log("Received image URL for expansion:", imageUrl);

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "No image URL provided" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const LIGHTX_API_KEY = Deno.env.get("LIGHTX_API_KEY");
    if (!LIGHTX_API_KEY) {
      throw new Error("LightX API key not configured");
    }

    const leftPadding = 1024;

    console.log("Calling LightX API to expand image...");
    const lightxResponse = await fetch(LIGHTX_API_ENDPOINT, {
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
        textPrompt:
          "clean, clear, empty background with solid colors and no objects, perfect for text overlay, minimalist design",
      }),
    });

    if (!lightxResponse.ok) {
      const errorText = await lightxResponse.text();
      console.error("LightX API error:", errorText);
      return new Response(
        JSON.stringify({
          error: `LightX API error: ${lightxResponse.status} ${lightxResponse.statusText}`,
          details: errorText,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const responseData = await lightxResponse.json();
    console.log("LightX API response data:", responseData);

    const expandedImageUrl = responseData.data?.url || responseData.url;
    if (!expandedImageUrl) {
      return new Response(
        JSON.stringify({ error: "No image URL found in LightX response" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("Downloading expanded image...");
    const downloadResp = await fetch(expandedImageUrl);
    if (!downloadResp.ok) {
      throw new Error(`Failed to download expanded image: ${downloadResp.statusText}`);
    }
    const expandedBlob = await downloadResp.blob();

    const base64Data = await blobToBase64(expandedBlob);
    const finalResp = {
      imageData: `data:${expandedBlob.type};base64,${base64Data}`,
    };

    return new Response(
      JSON.stringify(finalResp),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in expand-image function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
