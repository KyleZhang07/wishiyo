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

    // Parse request body once
    const requestBody = await req.json();
    const { prompt, contentPrompt, content2Prompt, photos, photo, style } = requestBody;
    
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

    // Handle both legacy single photo or new multiple photos format
    let photoArray: string[] = [];
    
    // Check for 'photos' in array form first
    if (Array.isArray(photos) && photos.length > 0) {
      photoArray = photos;
    } 
    // Check for 'photos' as a single string
    else if (typeof photos === 'string') {
      photoArray = [photos];
    }
    // Fallback to 'photo' parameter for legacy support
    else if (typeof photo === 'string') {
      photoArray = [photo];
    }
    
    if (photoArray.length === 0) {
      throw new Error("No character photos provided. Please add at least one photo.");
    }
    
    console.log(`Processing with ${photoArray.length} character photo(s), using first photo for API call`);
    // Always use the first photo for the API call since PhotoMaker only accepts a single image
    const photoToUse = photoArray[0];

    // 仅生成封面
    if (!contentPrompt && !content2Prompt && prompt && photoArray.length > 0) {
      console.log("Generating single cover image with prompt:", prompt);
      const output = await replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            prompt: `${prompt} img`,
            num_steps: 40,
            style_name: styleName,
            input_image: photoToUse, // Always use the first photo
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
    if (!prompt && !content2Prompt && contentPrompt && photoArray.length > 0) {
      console.log("Generating content image 1 with prompt:", contentPrompt);
      const contentImage = await replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            prompt: `${contentPrompt} single-person img, story moment`,
            num_steps: 40,
            style_name: styleName,
            input_image: photoToUse, // Always use the first photo
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
    if (!prompt && !contentPrompt && content2Prompt && photoArray.length > 0) {
      console.log("Generating content image 2 with prompt:", content2Prompt);
      const contentImage2 = await replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            prompt: `${content2Prompt} single-person img, story moment`,
            num_steps: 40,
            style_name: styleName,
            input_image: photoToUse, // Always use the first photo
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

    // Handle dynamic content image generation (contentXPrompt)
    for (let i = 3; i <= 11; i++) {
      const contentPromptKey = `content${i}Prompt`;
      if (requestBody[contentPromptKey] && photoArray.length > 0) {
        console.log(`Generating content image ${i} with prompt:`, requestBody[contentPromptKey]);
        const result = await replicate.run(
          "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
          {
            input: {
              prompt: `${requestBody[contentPromptKey]} single-person img, story moment`,
              num_steps: 40,
              style_name: styleName,
              input_image: photoToUse, // Always use the first photo
              num_outputs: 1,
              guidance_scale: 5.0,
              style_strength_ratio: 20,
              negative_prompt:
                "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
            },
          }
        );

        const responseKey = `contentImage${i}`;
        return new Response(
          JSON.stringify({ [responseKey]: result }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 同时生成封面、内容1、内容2
    console.log("Generating all images...");
    console.log("Cover prompt:", prompt);
    console.log("Content 1 prompt:", contentPrompt);
    console.log("Content 2 prompt:", content2Prompt);
    console.log("Using style:", styleName);
    console.log("Using photo:", photoToUse.substring(0, 50) + "...");

    try {
      const [output, contentImage, contentImage2] = await Promise.all([
        replicate.run(
          "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
          {
            input: {
              prompt: `${prompt} img`,
              num_steps: 40,
              style_name: styleName,
              input_image: photoToUse, // Always use the first photo
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
              input_image: photoToUse, // Always use the first photo
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
              input_image: photoToUse, // Always use the first photo
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
      // Handle the API error properly to avoid cyclic structure serialization
      console.error("Error in API call:", error.message || "Unknown error");
      return new Response(
        JSON.stringify({ 
          error: error.message || "Unknown error",
          details: error.detail || null
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
  } catch (error) {
    // Safe error serialization to avoid cyclic structure issues
    console.error("Error in replicate function:", error.message || "Unknown error");
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error",
        details: error.detail || null
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
