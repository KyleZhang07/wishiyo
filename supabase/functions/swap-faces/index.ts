
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

    // Call PIAI face swap API
    const response = await fetch('https://api.piai.app/swap-face/v1', {
      method: 'POST',
      headers: {
        'X-API-KEY': Deno.env.get('PIAI_API_KEY') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target_image: targetImage,
        source_faces: [
          { image: userFace },
          { image: partnerFace }
        ],
        enhance_face: true,
        pad_face: true
      }),
    })

    if (!response.ok) {
      throw new Error(`PIAI API error: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('Face swap completed successfully')

    return new Response(
      JSON.stringify({ success: true, image: result.image }),
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
