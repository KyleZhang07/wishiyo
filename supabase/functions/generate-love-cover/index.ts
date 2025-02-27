
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
    const { prompt, contentPrompt, content2Prompt, photo, style } = await req.json();

    // Log the style parameter for debugging
    console.log("Using style:", style);

    // Default placeholder image URL
    let coverImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    let contentImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    let contentImage2Url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    // Get all additional photos
    const additionalPhotos = [];
    try {
      const additionalPhotosStr = req.headers.get('x-additional-photos') || '[]';
      const parsed = JSON.parse(additionalPhotosStr);
      if (Array.isArray(parsed)) {
        additionalPhotos.push(...parsed);
      }
    } catch (e) {
      console.error("Error parsing additional photos:", e);
    }

    // Process cover image
    if (photo && prompt) {
      try {
        coverImageUrl = await generateImage(photo, prompt, style);
      } catch (error) {
        console.error("Error generating cover image:", error);
      }
    }

    // Process content image 1
    if (photo && contentPrompt) {
      try {
        contentImageUrl = await generateImage(photo, contentPrompt, style);
      } catch (error) {
        console.error("Error generating content image 1:", error);
      }
    }

    // Process content image 2
    if (photo && content2Prompt) {
      try {
        contentImage2Url = await generateImage(photo, content2Prompt, style);
      } catch (error) {
        console.error("Error generating content image 2:", error);
      }
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

// Simplified image generation function using PhotoRoom API for reliability
async function generateImage(photoBase64: string, promptText: string, style?: string): Promise<string> {
  const photoRoomApiKey = Deno.env.get("PHOTOROOM_API_KEY");
  if (!photoRoomApiKey) {
    throw new Error("PhotoRoom API key not configured");
  }

  // Style modifier based on selected style
  let styleModifier = "";
  if (style) {
    const styleMap: Record<string, string> = {
      'Comic book': 'in comic book style with bold outlines and vibrant colors',
      'Line art': 'as minimalist line art with clean outlines',
      'Fantasy art': 'in fantasy art style with magical, dreamlike quality',
      'Photographic (Default)': 'as a high-quality, realistic photograph',
      'Cinematic': 'as a cinematic shot with dramatic lighting'
    };
    styleModifier = styleMap[style] || '';
  }

  // Enhance prompt with style
  const enhancedPrompt = styleModifier 
    ? `${promptText}, ${styleModifier}` 
    : promptText;

  // Remove data:image/... prefix if present
  const base64Data = photoBase64.includes("base64,")
    ? photoBase64.split("base64,")[1]
    : photoBase64;

  try {
    const response = await fetch("https://api.photoroom.com/v1/custom-generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${photoRoomApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        image_base64: base64Data,
        negative_prompt: "blurry, bad quality, distorted, deformed",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PhotoRoom API error:", errorText);
      throw new Error(`PhotoRoom API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result_image_url || data.result_image_base64;
  } catch (error) {
    console.error("Error in PhotoRoom API call:", error);
    throw error;
  }
}
