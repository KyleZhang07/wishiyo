
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
    console.log('Received image URL:', imageUrl)

    if (!imageUrl) {
      throw new Error('No image URL provided')
    }

    // Download the image
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`)
    }

    const imageBlob = await imageResponse.blob()
    console.log('Image downloaded successfully, size:', imageBlob.size)

    const formData = new FormData()
    formData.append('image_file', imageBlob, 'image.png')
    formData.append('output_format', 'png')
    formData.append('size', '2048x1024')
    formData.append('background_generation', 'enabled')

    // Call PhotoRoom API
    const apiKey = Deno.env.get('PHOTOROOM_API_KEY')
    if (!apiKey) {
      throw new Error('PhotoRoom API key not configured')
    }

    console.log('Calling PhotoRoom API...')
    const photoRoomResponse = await fetch('https://api.photoroom.com/v1/extend', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey
      },
      body: formData
    })

    if (!photoRoomResponse.ok) {
      console.error('PhotoRoom error status:', photoRoomResponse.status)
      const errorText = await photoRoomResponse.text()
      console.error('PhotoRoom error details:', errorText)
      throw new Error(`PhotoRoom API error: ${photoRoomResponse.status}`)
    }

    console.log('PhotoRoom API call successful')
    const expandedImage = await photoRoomResponse.blob()
    
    return new Response(expandedImage, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png'
      }
    })
  } catch (error) {
    console.error('Error in expand-image function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
