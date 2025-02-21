
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()

    // Call getimg.ai API to generate anime couple image
    const response = await fetch('https://api.getimg.ai/v1/stable-diffusion/text-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GETIMG_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: 'anime-style',
        negative_prompt: "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
        width: 1024,
        height: 1024,
        steps: 30,
        guidance_scale: 7.5,
        scheduler: "dpmsolver++",
      }),
    })

    if (!response.ok) {
      throw new Error(`getimg.ai API error: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('Generated anime image successfully')

    return new Response(
      JSON.stringify({ image: result.image.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
