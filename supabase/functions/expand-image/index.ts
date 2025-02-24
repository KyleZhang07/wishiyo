
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
    const { imageUrl } = await req.json()

    if (!imageUrl) {
      throw new Error('No image URL provided')
    }

    // Fetch the original image
    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) {
      throw new Error('Failed to fetch original image')
    }
    const originalImage = await imageRes.blob()

    // Prepare form data for PhotoRoom API
    const formData = new FormData()
    formData.append('imageFile', originalImage)
    formData.append('outputSize', '2048x1024') // 2:1 ratio
    formData.append('referenceBox', 'originalImage')
    formData.append('removeBackground', 'false')
    formData.append('expand.mode', 'ai.auto')
    formData.append('horizontalAlignment', 'right')
    formData.append('verticalAlignment', 'center')

    // Call PhotoRoom API
    const PHOTOROOM_API_KEY = Deno.env.get('PHOTOROOM_API_KEY')
    if (!PHOTOROOM_API_KEY) {
      throw new Error('PhotoRoom API key not found')
    }

    const photoRoomRes = await fetch('https://api.photoroom.com/v1/edit', {
      method: 'POST',
      headers: {
        'x-api-key': PHOTOROOM_API_KEY
      },
      body: formData
    })

    if (!photoRoomRes.ok) {
      throw new Error(`PhotoRoom API error: ${photoRoomRes.status}`)
    }

    const expandedImage = await photoRoomRes.blob()

    return new Response(expandedImage, {
      headers: {
        ...corsHeaders,
        'Content-Type': expandedImage.type
      }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
