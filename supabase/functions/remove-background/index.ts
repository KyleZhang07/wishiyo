
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

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
    console.log('Processing image:', imageUrl)

    if (!imageUrl) {
      throw new Error('Image URL is required')
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()

    // Call PhotoRoom API
    const formData = new FormData()
    formData.append('image_file', imageBlob, 'image.jpg')

    const photoroomResponse = await fetch('https://api.photoroom.com/v1/segment', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('PHOTOROOM_API_KEY') || '',
      },
      body: formData,
    })

    if (!photoroomResponse.ok) {
      throw new Error(`PhotoRoom API error: ${photoroomResponse.statusText}`)
    }

    // Get the processed image
    const processedImageBlob = await photoroomResponse.blob()
    
    // Convert blob to base64
    const buffer = await processedImageBlob.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
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
