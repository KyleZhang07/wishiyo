
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const PHOTOROOM_API_KEY = Deno.env.get('PHOTOROOM_API_KEY')
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function expandImage(imageUrl: string) {
  try {
    // Download the image first
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()

    // Create form data
    const formData = new FormData()
    formData.append('imageFile', imageBlob, 'image.jpg')
    formData.append('outputSize', '2048x1024')  // Set 2:1 aspect ratio size
    formData.append('referenceBox', 'originalImage')
    formData.append('removeBackground', 'false')
    formData.append('expand.mode', 'ai.auto')
    formData.append('horizontalAlignment', 'right')
    formData.append('verticalAlignment', 'top')

    // Call PhotoRoom API
    const response = await fetch('https://image-api.photoroom.com/v2/edit', {
      method: 'POST',
      headers: {
        'x-api-key': PHOTOROOM_API_KEY || '',
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`PhotoRoom API error: ${response.statusText}`)
    }

    // Get the expanded image as blob
    const expandedImageBlob = await response.blob()

    // Convert blob to base64
    const arrayBuffer = await expandedImageBlob.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
    
    return {
      image: `data:image/png;base64,${base64}`
    }
  } catch (error) {
    console.error('Error expanding image:', error)
    throw error
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageUrl } = await req.json()
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await expandImage(imageUrl)

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
