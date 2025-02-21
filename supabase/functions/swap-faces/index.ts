
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
    const { targetImage, userFace, partnerFace } = await req.json()

    // Call PhotoRoom API to swap faces
    const response = await fetch('https://api.photoroom.com/v1/swap-faces', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('PHOTOROOM_API_KEY') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target_image: targetImage,
        source_images: [userFace, partnerFace],
      }),
    })

    if (!response.ok) {
      throw new Error(`PhotoRoom API error: ${response.statusText}`)
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({ success: true, image: result.resultImage }),
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
