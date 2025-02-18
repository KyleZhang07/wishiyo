
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
    console.log('Processing image:', imageUrl ? 'Image URL received' : 'No image URL')

    if (!imageUrl) {
      throw new Error('Image URL is required')
    }

    // Fetch the image directly from the URL instead of converting from base64
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image')
    }
    
    const imageBlob = await imageResponse.blob()
    console.log('Image fetched, size:', imageBlob.size)

    // Call PhotoRoom API
    const formData = new FormData()
    formData.append('image_file', imageBlob, 'image.jpg')

    const apiKey = Deno.env.get('PHOTOROOM_API_KEY')
    if (!apiKey) {
      throw new Error('PhotoRoom API key not configured')
    }

    console.log('Calling PhotoRoom API...')
    const photoroomResponse = await fetch('https://sdk.photoroom.com/v1/segment', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: formData,
    })

    if (!photoroomResponse.ok) {
      const errorText = await photoroomResponse.text()
      console.error('PhotoRoom API error:', photoroomResponse.status, errorText)
      throw new Error(`PhotoRoom API error: ${photoroomResponse.statusText || errorText}`)
    }

    // Get the processed image
    const processedImageBlob = await photoroomResponse.blob()
    console.log('Received processed image, size:', processedImageBlob.size)
    
    // Convert blob to base64 more efficiently using chunks
    const buffer = await processedImageBlob.arrayBuffer()
    const chunks = []
    const chunkSize = 8192
    const uint8Array = new Uint8Array(buffer)
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      chunks.push(String.fromCharCode.apply(null, uint8Array.subarray(i, i + chunkSize)))
    }
    
    const base64 = btoa(chunks.join(''))
    const contentType = processedImageBlob.type
    const dataUrl = `data:${contentType};base64,${base64}`

    return new Response(
      JSON.stringify({ 
        success: true, 
        image: dataUrl 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        } 
      }
    )
  } catch (error) {
    console.error('Error:', error.message)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    )
  }
})
