
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PICSART_API_ENDPOINT = "https://api.picsart.io/tools/1.0/photos/enhance";

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

    const PICSART_API_KEY = Deno.env.get("PICSART_API_KEY");
    if (!PICSART_API_KEY) {
      throw new Error("PicsArt API key not configured");
    }

    console.log("Calling PicsArt API to expand image...");
    const picsartResponse = await fetch(PICSART_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-picsart-api-key": PICSART_API_KEY,
      },
      body: JSON.stringify({
        image_url: imageUrl,
        format: "json",
        output_type: "url",
        upscale: 2
      }),
    });

    if (!picsartResponse.ok) {
      const errorText = await picsartResponse.text();
      console.error("PicsArt API error:", errorText);
      return new Response(
        JSON.stringify({
          error: `PicsArt API error: ${picsartResponse.status} ${picsartResponse.statusText}`,
          details: errorText,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const responseData = await picsartResponse.json();
    console.log("PicsArt API response data:", responseData);

    const expandedImageUrl = responseData.data?.url;
    if (!expandedImageUrl) {
      return new Response(
        JSON.stringify({ error: "No image URL found in PicsArt response" }),
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
