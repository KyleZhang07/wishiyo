
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
    const { imageUrl } = await req.json()
    if (!imageUrl) {
      throw new Error('No image URL provided')
    }

    // Download the image from URL
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()

    // Create form data
    const formData = new FormData()
    formData.append('imageFile', imageBlob, 'image.png')
    formData.append('outputSize', '2048x1024') // 2:1 aspect ratio
    formData.append('referenceBox', 'originalImage')
    formData.append('removeBackground', 'false')
    formData.append('expand.mode', 'ai.auto')
    formData.append('horizontalAlignment', 'right')
    formData.append('verticalAlignment', 'top')

    // Call PhotoRoom API
    const photoRoomResponse = await fetch('https://image-api.photoroom.com/v2/edit', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('PHOTOROOM_API_KEY') || '',
      },
      body: formData,
    })

    if (!photoRoomResponse.ok) {
      throw new Error(`PhotoRoom API error: ${photoRoomResponse.statusText}`)
    }

    // Get the expanded image as blob
    const expandedImageBlob = await photoRoomResponse.blob()
    
    return new Response(expandedImageBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png'
      }
    })
  } catch (error) {
    console.error('Error expanding image:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
