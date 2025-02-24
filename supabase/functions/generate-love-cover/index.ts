
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Replicate from "https://esm.sh/replicate@0.25.2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY')
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY is not set')
    }

    const replicate = new Replicate({
      auth: REPLICATE_API_KEY,
    })

    const { prompt, contentPrompt, content2Prompt, photo } = await req.json()

    // If only generating one image
    if (!contentPrompt && !content2Prompt && prompt && photo) {
      console.log("Generating single cover image with prompt:", prompt)
      const output = await replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            prompt: `${prompt} img`,
            num_steps: 20,
            style_name: "Photographic (Default)",
            input_image: photo,
            num_outputs: 1,
            guidance_scale: 5.0,
            style_strength_ratio: 20,
            negative_prompt: "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
          }
        }
      )
      return new Response(JSON.stringify({ output }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // If only generating content image 1
    if (!prompt && !content2Prompt && contentPrompt && photo) {
      console.log("Generating content image 1 with prompt:", contentPrompt)
      const contentImage = await replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            prompt: `${contentPrompt} img, story moment, emotional scene`,
            num_steps: 20,
            style_name: "Photographic (Default)",
            input_image: photo,
            num_outputs: 1,
            guidance_scale: 5.0,
            style_strength_ratio: 20,
            negative_prompt: "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
          }
        }
      )
      return new Response(JSON.stringify({ contentImage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // If only generating content image 2
    if (!prompt && !contentPrompt && content2Prompt && photo) {
      console.log("Generating content image 2 with prompt:", content2Prompt)
      const contentImage2 = await replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            prompt: `${content2Prompt} img, story moment, emotional scene`,
            num_steps: 20,
            style_name: "Photographic (Default)",
            input_image: photo,
            num_outputs: 1,
            guidance_scale: 5.0,
            style_strength_ratio: 20,
            negative_prompt: "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
          }
        }
      )
      return new Response(JSON.stringify({ contentImage2 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate all images if all prompts are provided
    console.log("Generating all images")
    console.log("Cover prompt:", prompt)
    console.log("Content 1 prompt:", contentPrompt)
    console.log("Content 2 prompt:", content2Prompt)

    const [output, contentImage, contentImage2] = await Promise.all([
      replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            prompt: `${prompt} img`,
            num_steps: 20,
            style_name: "Photographic (Default)",
            input_image: photo,
            num_outputs: 1,
            guidance_scale: 5.0,
            style_strength_ratio: 20,
            negative_prompt: "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
          }
        }
      ),
      replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            prompt: `${contentPrompt} img, story moment, emotional scene`,
            num_steps: 20,
            style_name: "Photographic (Default)",
            input_image: photo,
            num_outputs: 1,
            guidance_scale: 5.0,
            style_strength_ratio: 20,
            negative_prompt: "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
          }
        }
      ),
      replicate.run(
        "tencentarc/photomaker:ddfc2b08d209f9fa8c1eca692712918bd449f695dabb4a958da31802a9570fe4",
        {
          input: {
            prompt: `${content2Prompt} img, story moment, emotional scene`,
            num_steps: 20,
            style_name: "Photographic (Default)",
            input_image: photo,
            num_outputs: 1,
            guidance_scale: 5.0,
            style_strength_ratio: 20,
            negative_prompt: "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
          }
        }
      )
    ])

    return new Response(JSON.stringify({ 
      output,
      contentImage,
      contentImage2
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in replicate function:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
