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

    const { prompt, contentPrompt, content2Prompt, photos, style } = await req.json();
    
    // Handle legacy single photo format
    let photoArray: string[] = [];
    if (Array.isArray(photos)) {
      photoArray = photos;
    } else if (req.json().photo) {
      // For backward compatibility
      photoArray = [req.json().photo];
    } else {
      throw new Error("No photos provided");
    }

    // Validate photos
    if (photoArray.length === 0) {
      throw new Error("At least one photo is required");
    }
    
    console.log(`Number of character photos provided: ${photoArray.length}`);
    
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

    // Prepare the common input parameters
    const baseInputParams = {
      num_steps: 40,
      style_name: styleName,
      // Using all uploaded photos for better quality
      input_image: photoArray[0], // Primary image (required)
      additional_input_images: photoArray.length > 1 ? photoArray.slice(1) : undefined, // Only include if we have multiple photos
      num_outputs: 1,
      guidance_scale: 5.0,
      style_strength_ratio: 20,
      negative_prompt:
        "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
    };

    // 仅生成封面
    if (!contentPrompt && !content2Prompt && prompt) {
      console.log("Generating single cover image with prompt:", prompt);
      const output = await replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            ...baseInputParams,
            prompt: `${prompt} img`,
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
            ...baseInputParams,
            prompt: `${contentPrompt} single-person img, story moment`,
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
            ...baseInputParams,
            prompt: `${content2Prompt} single-person img, story moment`,
          },
        }
      );

      return new Response(
        JSON.stringify({ contentImage2 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 同时生成封面、内容1、内容2
    console.log("Generating all images...");
    console.log("Cover prompt:", prompt);
    console.log("Content 1 prompt:", contentPrompt);
    console.log("Content 2 prompt:", content2Prompt);
    console.log("Using style:", styleName);

    const [output, contentImage, contentImage2] = await Promise.all([
      replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            ...baseInputParams,
            prompt: `${prompt} img`,
          },
        }
      ),
      replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            ...baseInputParams,
            prompt: `${contentPrompt} single-person img, story moment`,
          },
        }
      ),
      replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            ...baseInputParams,
            prompt: `${content2Prompt} single-person img, story moment`,
          },
        }
      ),
    ]);

    return new Response(
      JSON.stringify({
        output,
        contentImage,
        contentImage2,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
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
