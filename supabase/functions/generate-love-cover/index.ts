
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

    const { prompt, photo, contentPrompt } = await req.json()

    if (!prompt || !photo) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: prompt and photo are required" }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    console.log("Generating cover image with prompt:", prompt)
    console.log("Generating content image with prompt:", contentPrompt)

    // Generate both images in parallel
    const [coverOutput, contentOutput] = await Promise.all([
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
            prompt: `${contentPrompt || prompt} img, story moment, emotional scene`,
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

    console.log("Generation response for cover:", coverOutput)
    console.log("Generation response for content:", contentOutput)

    return new Response(JSON.stringify({ 
      output: coverOutput,
      contentImage: contentOutput
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
