
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
    const apiKey = Deno.env.get('GETIMG_API_KEY')

    if (!apiKey) {
      throw new Error('GETIMG_API_KEY is not set')
    }

    console.log('Making request to getimg.ai with prompt:', prompt)

    // Call getimg.ai API to generate anime couple image
    const response = await fetch('https://api.getimg.ai/v1/stable-diffusion/text-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anime-style',
        prompt,
        negative_prompt: "nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
        width: 1024,
        height: 1024,
        steps: 30,
        guidance_scale: 7.5,
        scheduler: "dpmsolver++",
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('getimg.ai API error response:', error)
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
