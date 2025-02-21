
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
    
    console.log('Generating image with prompt:', prompt)
    
    const response = await fetch('https://api.getimg.ai/v1/stable-diffusion/text-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GETIMG_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Book cover art, ${prompt}, anime art style, romantic couple illustration, high quality, detailed, centered composition, soft lighting, beautiful atmosphere, book cover worthy`,
        negative_prompt: "nsfw, low quality, bad anatomy, text, watermark, signature, blurry",
        width: 768,
        height: 1024,
        steps: 30,
        guidance_scale: 7.5,
        model_id: "stable-diffusion-v1-5"
      }),
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${await response.text()}`)
    }

    const result = await response.json()
    console.log('Successfully generated image')

    return new Response(
      JSON.stringify({ 
        success: true,
        image: result.output.image 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
