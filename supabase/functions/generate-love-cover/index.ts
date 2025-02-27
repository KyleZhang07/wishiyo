
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
    const { prompt, contentPrompt, content2Prompt, photo, imageStyle } = await req.json();

    // Translate our style selections to PhotoRoom API styles
    const styleModifier = getStyleModifier(imageStyle);
    
    // Default placeholder image URL
    let coverImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    let contentImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    let contentImage2Url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    // Process images with PhotoRoom API
    if (photo && prompt) {
      coverImageUrl = await generateImageWithPhotoRoom(photo, prompt, styleModifier);
    }

    if (photo && contentPrompt) {
      contentImageUrl = await generateImageWithPhotoRoom(photo, contentPrompt, styleModifier);
    }

    if (photo && content2Prompt) {
      contentImage2Url = await generateImageWithPhotoRoom(photo, content2Prompt, styleModifier);
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

// Helper function to map our style selections to appropriate PhotoRoom prompts
function getStyleModifier(style: string): string {
  const styleMap: Record<string, string> = {
    'comic': 'in comic book style with bold lines and vibrant colors',
    'line-art': 'as minimalist line art with clean outlines',
    'fantasy': 'in fantasy art style with magical, dreamlike quality',
    'photographic': 'as a high-quality, realistic photograph',
    'cinematic': 'as a cinematic shot with dramatic lighting'
  };

  return styleMap[style] || '';
}

async function generateImageWithPhotoRoom(photoBase64: string, promptText: string, styleModifier: string): Promise<string> {
  const photoRoomApiKey = Deno.env.get("PHOTOROOM_API_KEY");
  if (!photoRoomApiKey) {
    throw new Error("PhotoRoom API key not configured");
  }

  // Add style modifier to the prompt if provided
  const enhancedPrompt = styleModifier ? `${promptText}, ${styleModifier}` : promptText;
  
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
