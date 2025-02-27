
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, contentPrompt, content2Prompt, photo, photos, style } = await req.json();

    // Get primary photo and additional photos
    let mainPhoto = photo;
    let additionalPhotos: string[] = [];
    
    // If photos array is provided, use it instead
    if (photos && Array.isArray(photos) && photos.length > 0) {
      mainPhoto = photos[0]; // Use first photo as main photo
      additionalPhotos = photos.slice(1); // Use remaining photos as additional input
    }

    if (!mainPhoto) {
      throw new Error("No photos provided for image generation");
    }

    // Map style name to API format if needed
    const styleName = mapStyleName(style || "Photographic (Default)");
    
    // Default placeholder image URL
    let coverImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    let contentImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    let contentImage2Url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    // Process cover image
    if (mainPhoto && prompt) {
      coverImageUrl = await generateImageWithReplicate(
        mainPhoto, 
        additionalPhotos, 
        prompt,
        styleName
      );
    }

    // Process content image 1
    if (mainPhoto && contentPrompt) {
      contentImageUrl = await generateImageWithReplicate(
        mainPhoto, 
        additionalPhotos, 
        contentPrompt,
        styleName
      );
    }

    // Process content image 2
    if (mainPhoto && content2Prompt) {
      contentImage2Url = await generateImageWithReplicate(
        mainPhoto, 
        additionalPhotos, 
        content2Prompt,
        styleName
      );
    }

    return new Response(
      JSON.stringify({
        output: [coverImageUrl],
        contentImage: [contentImageUrl],
        contentImage2: [contentImage2Url],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating cover:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// Map style name to the API-compatible format
function mapStyleName(style: string): string {
  // Some APIs might use different style names, map to consistent format
  const styleMap: Record<string, string> = {
    "Comic Book": "Comic book",
    "Line Art": "Line art",
    "Fantasy Art": "Fantasy art",
    "Photographic": "Photographic (Default)",
    "Cinematic": "Cinematic"
  };
  
  return styleMap[style] || style;
}

async function generateImageWithReplicate(
  mainPhoto: string,
  additionalPhotos: string[] = [],
  promptText: string,
  styleName: string
): Promise<string> {
  const replicateApiKey = Deno.env.get("REPLICATE_API_KEY");
  if (!replicateApiKey) {
    throw new Error("Replicate API key not configured");
  }

  // This API requires base64 without the prefix
  const cleanBase64 = (dataUrl: string) => {
    return dataUrl.includes("base64,") ? dataUrl.split("base64,")[1] : dataUrl;
  };

  // Process the main photo
  const mainPhotoBase64 = cleanBase64(mainPhoto);
  
  // Process additional photos if available
  const additionalPhotosBase64 = additionalPhotos.map(cleanBase64);
  
  // Create the request payload
  const payload: Record<string, any> = {
    input: {
      prompt: `${promptText} img`,
      input_image: `data:image/jpeg;base64,${mainPhotoBase64}`,
      style_name: styleName,
      negative_prompt: "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry"
    }
  };
  
  // Add additional photos if available
  if (additionalPhotosBase64.length > 0 && additionalPhotosBase64[0]) {
    payload.input.input_image2 = `data:image/jpeg;base64,${additionalPhotosBase64[0]}`;
  }
  
  if (additionalPhotosBase64.length > 1 && additionalPhotosBase64[1]) {
    payload.input.input_image3 = `data:image/jpeg;base64,${additionalPhotosBase64[1]}`;
  }
  
  if (additionalPhotosBase64.length > 2 && additionalPhotosBase64[2]) {
    payload.input.input_image4 = `data:image/jpeg;base64,${additionalPhotosBase64[2]}`;
  }

  // Use the Replicate API
  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${replicateApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "ce5ff613b0060029a5aad07fe97bf5ad8e086197c9a7ed3f7c3b52d1ea9c539a", // Stable Diffusion XL IP Adapter with Face Restoration
        input: payload.input,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Replicate API error:", errorText);
      throw new Error(`Replicate API error: ${response.statusText}`);
    }

    const prediction = await response.json();
    console.log("Prediction ID:", prediction.id);

    // Poll for results
    let result = await pollForResults(prediction.id, replicateApiKey);
    
    // Return the image URL
    if (result && result.output && result.output.length > 0) {
      return result.output[0];
    } else {
      throw new Error("No output generated by image API");
    }
  } catch (error) {
    console.error("Error in image generation API call:", error);
    throw error;
  }
}

// Poll for results until the prediction is complete
async function pollForResults(predictionId: string, apiKey: string, maxAttempts = 30): Promise<any> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        method: "GET",
        headers: {
          "Authorization": `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const prediction = await response.json();
      
      if (prediction.status === "succeeded") {
        return prediction;
      } else if (prediction.status === "failed") {
        throw new Error(`Prediction failed: ${prediction.error || "Unknown error"}`);
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error("Error polling for prediction:", error);
      throw error;
    }
  }
  
  throw new Error("Prediction timed out");
}
