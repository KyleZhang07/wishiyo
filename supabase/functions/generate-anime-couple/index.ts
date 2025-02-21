
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
      console.error('GETIMG_API_KEY not found in environment variables')
      throw new Error('API key not configured')
    }
    
    console.log('Received prompt:', prompt)
    
    const response = await fetch('https://api.getimg.ai/v1/stable-diffusion/text-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Book cover art style, centered composition, ${prompt}, anime art style, romantic couple illustration, high quality, detailed, soft lighting, beautiful atmosphere`,
        negative_prompt: "nsfw, low quality, bad anatomy, text, watermark, signature, blurry, multiple couples, group photo",
        width: 768,
        height: 1024,
        steps: 30,
        guidance_scale: 7.5,
        model_id: "stable-diffusion-v1-5",
        scheduler: "dpmsolver++",
        samples: 1
      }),
    })

    const responseText = await response.text()
    console.log('API Response:', responseText)

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${responseText}`)
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse API response:', e)
      throw new Error('Invalid response from image generation API')
    }

    if (!result?.output?.image) {
      console.error('No image in response:', result)
      throw new Error('No image generated')
    }

    console.log('Successfully generated image')

    return new Response(
      JSON.stringify({ 
        success: true,
        image: result.output.image 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-anime-couple function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
