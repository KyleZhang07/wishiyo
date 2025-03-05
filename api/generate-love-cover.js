import { Replicate } from 'replicate';

// CORS headers to allow cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Map of style names from UI to API style names
const styleMap = {
  "Comic Book": "Comic book",
  "Line Art": "Line art",
  "Fantasy Art": "Fantasy art",
  "Photographic": "Photographic (Default)",
  "Cinematic": "Cinematic",
};

// Default style if none is specified
const DEFAULT_STYLE = "Photographic (Default)";

// Valid API style names for reference
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

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).set(corsHeaders).end();
    return;
  }
  
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, please use POST' });
  }

  try {
    const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
    if (!REPLICATE_API_KEY) {
      throw new Error("REPLICATE_API_KEY is not set");
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    });

    const { prompt, contentPrompt, content2Prompt, photo, photos, style } = req.body;
    
    // Get the style name to use with the API
    console.log(`Requested style from client: "${style}"`);
    
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

    // 获取要使用的照片
    let inputPhoto;
    let inputPhotos;
    
    if (photos && Array.isArray(photos) && photos.length > 0) {
      // 使用多张照片
      inputPhotos = photos;
      inputPhoto = photos[0]; // 保留单张照片兼容性
      console.log(`Using ${inputPhotos.length} photos for processing`);
    } else if (photo) {
      // 兼容旧版本，使用单张照片
      inputPhoto = photo;
      inputPhotos = [photo];
      console.log("Using single photo for processing");
    } else {
      throw new Error("No photos provided");
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
            input_images: inputPhotos, // 使用多张照片
            num_outputs: 1,
            guidance_scale: 5.0,
            style_strength_ratio: 20,
            negative_prompt:
              "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
          },
        }
      );

      return res.status(200).json({ output });
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
            input_images: inputPhotos, // 使用多张照片
            num_outputs: 1,
            guidance_scale: 5.0,
            style_strength_ratio: 20,
            negative_prompt:
              "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
          },
        }
      );

      return res.status(200).json({ contentImage });
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
            input_images: inputPhotos, // 使用多张照片
            num_outputs: 1,
            guidance_scale: 5.0,
            style_strength_ratio: 20,
            negative_prompt:
              "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
          },
        }
      );

      return res.status(200).json({ contentImage2 });
    }

    // 同时生成封面、内容1、内容2
    console.log("Generating all images...");
    console.log("Cover prompt:", prompt);
    console.log("Content 1 prompt:", contentPrompt);
    console.log("Content 2 prompt:", content2Prompt);
    console.log("Using style:", styleName);
    console.log(`Using ${inputPhotos.length} photos`);

    const [output, contentImage, contentImage2] = await Promise.all([
      replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            prompt: `${prompt} img`,
            num_steps: 40,
            style_name: styleName,
            input_images: inputPhotos, // 使用多张照片
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
            input_images: inputPhotos, // 使用多张照片
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
            input_images: inputPhotos, // 使用多张照片
            num_outputs: 1,
            guidance_scale: 5.0,
            style_strength_ratio: 20,
            negative_prompt:
              "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
          },
        }
      ),
    ]);

    return res.status(200).json({
      output,
      contentImage,
      contentImage2,
    });
  } catch (error) {
    console.error("Error in replicate function:", error);
    return res.status(500).json({ error: error.message });
  }
} 