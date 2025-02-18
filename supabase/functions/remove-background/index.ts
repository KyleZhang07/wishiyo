
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function dataURLtoBlob(dataUrl: string) {
  // Extract the base64 data from the data URL
  const base64Data = dataUrl.split(',')[1];
  // Convert base64 to binary
  const binaryStr = atob(base64Data);
  // Create a Uint8Array from the binary string
  const arr = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    arr[i] = binaryStr.charCodeAt(i);
  }
  // Create a blob from the array
  return new Blob([arr], { type: 'image/jpeg' });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { imageUrl } = await req.json()
    console.log('Processing image data URL...')

    if (!imageUrl) {
      throw new Error('Image URL is required')
    }

    // Convert data URL to blob
    const imageBlob = await dataURLtoBlob(imageUrl)
    console.log('Converted image to blob, size:', imageBlob.size)

    // Call PhotoRoom API
    const formData = new FormData()
    formData.append('image_file', imageBlob, 'image.jpg')

    console.log('Calling PhotoRoom API...')
    const photoroomResponse = await fetch('https://api.photoroom.com/v1/segment', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('PHOTOROOM_API_KEY') || '',
      },
      body: formData,
    })

    if (!photoroomResponse.ok) {
      console.error('PhotoRoom API error:', photoroomResponse.status, photoroomResponse.statusText)
      throw new Error(`PhotoRoom API error: ${photoroomResponse.statusText}`)
    }

    // Get the processed image
    const processedImageBlob = await photoroomResponse.blob()
    console.log('Received processed image, size:', processedImageBlob.size)
    
    // Convert blob to base64
    const buffer = await processedImageBlob.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    const contentType = processedImageBlob.type
    const dataUrl = `data:${contentType};base64,${base64}`

    console.log('Successfully processed image')
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
