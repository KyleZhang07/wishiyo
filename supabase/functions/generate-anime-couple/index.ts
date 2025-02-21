
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()
    const apiKey = Deno.env.get('GETIMG_API_KEY')

    if (!apiKey) {
      console.error('GETIMG_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'API key not configured'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }
    
    console.log('Processing prompt:', prompt)

    // Enhanced prompt for better image generation
    const enhancedPrompt = `High quality book cover art, ${prompt}, 
      romantic couple in center frame, dramatic lighting, professional photography style, 
      cinematic composition, 8k resolution`

    console.log('Enhanced prompt:', enhancedPrompt)
    
    const response = await fetch('https://api.getimg.ai/v1/stable-diffusion/text-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: enhancedPrompt,
        negative_prompt: "nsfw, low quality, bad anatomy, text, watermark, signature, blurry, multiple couples, group photo, distorted faces, unrealistic proportions",
        width: 768,
        height: 1024,
        steps: 35,
        guidance_scale: 8,
        model_id: "stable-diffusion-v1-5",
        scheduler: "dpmsolver++",
        samples: 1,
        seed: Math.floor(Math.random() * 1000000) // Random seed for variety
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GetImg API error:', response.status, errorText)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Image generation API error: ${response.status}`,
          details: errorText
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
    }

    const result = await response.json()

    if (!result?.output?.image) {
      console.error('No image in response:', result)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No image generated',
          details: JSON.stringify(result)
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      )
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
