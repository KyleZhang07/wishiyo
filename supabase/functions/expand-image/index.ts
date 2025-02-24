
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
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
    }

    const imageBlob = await imageResponse.blob()
    console.log('Image downloaded, size:', imageBlob.size)

    // Create form data
    const formData = new FormData()
    formData.append('imageFile', imageBlob, 'image.png')
    formData.append('outputSize', '2048x1024')
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
      const errorText = await photoRoomResponse.text()
      console.error('PhotoRoom API error:', errorText)
      throw new Error(`PhotoRoom API error: ${photoRoomResponse.statusText}`)
    }

    // Get the expanded image URL from PhotoRoom
    const expandedImageBlob = await photoRoomResponse.blob()
    const expandedImageArrayBuffer = await expandedImageBlob.arrayBuffer()
    
    // Convert to base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(expandedImageArrayBuffer)))
    const dataUrl = `data:image/png;base64,${base64}`
    
    return new Response(JSON.stringify({ url: dataUrl }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
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
