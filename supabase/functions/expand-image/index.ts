
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
    console.log('Received image URL:', imageUrl)
    
    if (!imageUrl) {
      throw new Error('No image URL provided')
    }

    // Download the image from URL
    console.log('Fetching image from URL...')
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
    }

    const imageBlob = await imageResponse.blob()
    console.log('Image downloaded successfully')

    // Create form data for PhotoRoom API
    const formData = new FormData()
    formData.append('imageFile', imageBlob, 'image.png')
    formData.append('outputSize', '2048x1024') // 2:1 ratio
    formData.append('referenceBox', 'originalImage')
    formData.append('removeBackground', 'false')
    formData.append('expand.mode', 'ai.auto')
    formData.append('horizontalAlignment', 'right')
    formData.append('verticalAlignment', 'top')

    console.log('Calling PhotoRoom API...')
    const PHOTOROOM_API_KEY = Deno.env.get('PHOTOROOM_API_KEY')
    if (!PHOTOROOM_API_KEY) {
      throw new Error('PhotoRoom API key not configured')
    }

    // Call PhotoRoom API
    const photoRoomResponse = await fetch('https://api.photoroom.com/v1/edit', {
      method: 'POST',
      headers: {
        'x-api-key': PHOTOROOM_API_KEY,
      },
      body: formData,
    })

    if (!photoRoomResponse.ok) {
      const errorText = await photoRoomResponse.text()
      console.error('PhotoRoom API error:', errorText)
      throw new Error(`PhotoRoom API error: ${photoRoomResponse.status} ${photoRoomResponse.statusText}`)
    }

    console.log('Successfully received expanded image')
    // Return the processed image directly
    return new Response(await photoRoomResponse.blob(), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png'
      }
    })
  } catch (error) {
    console.error('Error in expand-image function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
