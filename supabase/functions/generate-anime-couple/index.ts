
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
        prompt: `Create a high-quality, artistic anime-style illustration of ${prompt}. The style should be romantic and emotionally expressive, with attention to character details and expressions. Make it suitable for a book cover.`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "vivid"
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DALL-E API error response:', errorText)
      throw new Error(`DALL-E API error: ${response.statusText}. Details: ${errorText}`)
    }

    const result = await response.json()
    console.log('Generated image successfully')

    // DALL-E returns an array of image data objects with urls
    return new Response(
      JSON.stringify({ image: result.data[0].url }),
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
