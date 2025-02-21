
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

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
    const apiKey = Deno.env.get('OPENAI_API_KEY')

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set')
    }

    console.log('Making request to DALL-E with prompt:', prompt)

    // Call OpenAI's DALL-E 3 API to generate image
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `Create a romantic, anime-style illustration of ${prompt}. The image should be high quality and suitable for a book cover, with clear character details and expressions.`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid"
      }),
    })

    let errorMessage = ''
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('DALL-E API error response:', errorData)
      
      if (errorData?.error?.message) {
        errorMessage = errorData.error.message
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }
      
      throw new Error(`DALL-E API error: ${errorMessage}`)
    }

    const result = await response.json()
    console.log('Generated image successfully:', result)

    if (!result.data?.[0]?.url) {
      throw new Error('No image URL in DALL-E response')
    }

    // Return the image URL from DALL-E
    return new Response(
      JSON.stringify({ 
        success: true,
        image: result.data[0].url 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Error in generate-anime-couple function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Image generation failed', 
        details: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    )
  }
})
