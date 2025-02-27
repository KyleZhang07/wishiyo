import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Replicate from "https://esm.sh/replicate@0.25.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Map of style names from UI to API style names
const styleMap: { [key: string]: string } = {
  "Comic Book": "Comic book",
  "Line Art": "Line art",
  "Fantasy Art": "Fantasy art",
  "Photographic": "Photographic (Default)",
  "Cinematic": "Cinematic",
};

// Default style if none is specified
const DEFAULT_STYLE = "Photographic (Default)";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get("REPLICATE_API_KEY");
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not set");
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    const { 
      prompt, 
      contentPrompt, 
      content2Prompt, 
      photo, 
      photos, 
      style 
    } = await req.json();
    
    // Get the style name to use with the API
    console.log(`Requested style from client: "${style}"`);
    
    // Define valid API style names for reference
    const validApiStyles = [
      "(No style)", 
      "Cinematic", 
      "Disney Charactor", 
      "Digital Art", 
      "Photographic (Default)", 
      "Fantasy art", 
      "Neonpunk", 
      "Enhance", 
      "Comic book", 
      "Lowpoly", 
      "Line art"
    ];
    
    // Find appropriate style or use default
    let styleName = DEFAULT_STYLE;
    
    if (style) {
      // First try the mapping
      if (styleMap[style]) {
        styleName = styleMap[style];
      } 
      // If the exact style name is in valid styles, use it directly
      else if (validApiStyles.includes(style)) {
        styleName = style;
      }
      // Check for case insensitive matches as fallback
      else {
        const lowerStyle = style.toLowerCase();
        const matchingStyle = validApiStyles.find(s => s.toLowerCase() === lowerStyle);
        if (matchingStyle) {
          styleName = matchingStyle;
        }
      }
    }
    
    console.log(`Mapped to API style_name: "${styleName}"`);
    
    // Process photo inputs - maintain backward compatibility
    // For single photo mode, use the 'photo' parameter
    // For multi-photo mode, use the 'photos' array
    const photoInputs: { [key: string]: string } = {};
    
    try {
      // Primary photo (required)
      if (photo) {
        if (typeof photo === 'string') {
          photoInputs.input_image = photo;
        } else {
          console.warn("Photo parameter is not a string, trying to stringify");
          photoInputs.input_image = String(photo);
        }
      } else if (photos && Array.isArray(photos) && photos.length > 0) {
        // Ensure we have valid string photos
        const validPhotos = photos.filter(p => typeof p === 'string');
        console.log(`Received ${photos.length} photos, ${validPhotos.length} are valid strings`);
        
        if (validPhotos.length > 0) {
          photoInputs.input_image = validPhotos[0];
          
          // Additional photos (optional)
          if (validPhotos.length > 1) photoInputs.input_image2 = validPhotos[1];
          if (validPhotos.length > 2) photoInputs.input_image3 = validPhotos[2];
          if (validPhotos.length > 3) photoInputs.input_image4 = validPhotos[3];
        } else {
          throw new Error("No valid photo strings found in photos array");
        }
      } else {
        throw new Error("At least one photo is required");
      }
      
      console.log(`Processing with ${Object.keys(photoInputs).length} photos`);
    } catch (photoError) {
      console.error("Error processing photos:", photoError);
      throw new Error(`Failed to process photos: ${photoError.message}`);
    }

    // 仅生成封面
    if (!contentPrompt && !content2Prompt && prompt) {
      console.log("Generating single cover image with prompt:", prompt);
      const output = await replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            prompt: `${prompt} img`,
            num_steps: 40,
            style_name: styleName,
            ...photoInputs,
            num_outputs: 1,
            guidance_scale: 5.0,
            style_strength_ratio: 20,
            negative_prompt:
              "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
          },
        }
      );

      return new Response(
        JSON.stringify({ output }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 仅生成内容图1
    if (!prompt && !content2Prompt && contentPrompt) {
      console.log("Generating content image 1 with prompt:", contentPrompt);
      const contentImage = await replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            prompt: `${contentPrompt} single-person img, story moment`,
            num_steps: 40,
            style_name: styleName,
            ...photoInputs,
            num_outputs: 1,
            guidance_scale: 5.0,
            style_strength_ratio: 20,
            negative_prompt:
              "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
          },
        }
      );

      return new Response(
        JSON.stringify({ contentImage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 仅生成内容图2
    if (!prompt && !contentPrompt && content2Prompt) {
      console.log("Generating content image 2 with prompt:", content2Prompt);
      const contentImage2 = await replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            prompt: `${content2Prompt} single-person img, story moment`,
            num_steps: 40,
            style_name: styleName,
            ...photoInputs,
            num_outputs: 1,
            guidance_scale: 5.0,
            style_strength_ratio: 20,
            negative_prompt:
              "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
          },
        }
      );

      return new Response(
        JSON.stringify({ contentImage2 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 包含多个图像的生成
    if (prompt && contentPrompt && content2Prompt) {
      console.log("Generating multiple images with prompts");
      
      const [outputResult, contentImageResult, contentImage2Result] = await Promise.all([
        replicate.run(
          "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
          {
            input: {
              prompt: `${prompt} img`,
              num_steps: 40,
              style_name: styleName,
              ...photoInputs,
              num_outputs: 1,
              guidance_scale: 5.0,
              style_strength_ratio: 20,
              negative_prompt:
                "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
            },
          }
        ),
        replicate.run(
          "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
          {
            input: {
              prompt: `${contentPrompt} single-person img, story moment`,
              num_steps: 40,
              style_name: styleName,
              ...photoInputs,
              num_outputs: 1,
              guidance_scale: 5.0,
              style_strength_ratio: 20,
              negative_prompt:
                "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
            },
          }
        ),
        replicate.run(
          "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
          {
            input: {
              prompt: `${content2Prompt} single-person img, story moment`,
              num_steps: 40,
              style_name: styleName,
              ...photoInputs,
              num_outputs: 1,
              guidance_scale: 5.0,
              style_strength_ratio: 20,
              negative_prompt:
                "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
            },
          }
        ),
      ]);

      return new Response(
        JSON.stringify({
          output: outputResult,
          contentImage: contentImageResult,
          contentImage2: contentImage2Result,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid parameters");
  } catch (error) {
    console.error("Error in replicate function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
