
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LIGHTX_API_ENDPOINT = "https://api.lightxeditor.com/external/api/v1/expand-photo";
const LIGHTX_STATUS_ENDPOINT = "https://api.lightxeditor.com/external/api/v1/expand-photo/status";

async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binaryString = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binaryString);
}

async function waitForCompletion(orderId: string, apiKey: string, maxRetries = 10): Promise<string> {
  let retries = 0;
  
  while (retries < maxRetries) {
    console.log(`Checking status for orderId: ${orderId}, attempt ${retries + 1}/${maxRetries}`);
    
    const statusResponse = await fetch(`${LIGHTX_STATUS_ENDPOINT}/${orderId}`, {
      headers: {
        "x-api-key": apiKey,
      },
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error(`Error checking status: ${errorText}`);
      throw new Error(`Failed to check status: ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();
    console.log("Status response:", statusData);

    if (statusData.status === "done" || statusData.status === "complete") {
      if (statusData.data?.url || statusData.url) {
        return statusData.data?.url || statusData.url;
      }
      throw new Error("Status is complete but no URL found");
    }

    if (statusData.status === "failed") {
      throw new Error("Image expansion failed");
    }

    // Wait for 3 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 3000));
    retries++;
  }

  throw new Error("Timeout waiting for image expansion");
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

    console.log("Initiating LightX image expansion...");
    const initResponse = await fetch(LIGHTX_API_ENDPOINT, {
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

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error("LightX API error:", errorText);
      return new Response(
        JSON.stringify({
          error: `LightX API error: ${initResponse.status} ${initResponse.statusText}`,
          details: errorText,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const initData = await initResponse.json();
    console.log("LightX API init response:", initData);

    if (initData.statusCode !== 2000 || !initData.body?.orderId) {
      throw new Error("Invalid response from LightX API");
    }

    // Wait for the image expansion to complete
    const expandedImageUrl = await waitForCompletion(initData.body.orderId, LIGHTX_API_KEY);

    console.log("Downloading expanded image from:", expandedImageUrl);
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
