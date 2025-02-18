
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { remove } from 'npm:@imgly/background-removal@latest'

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
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Get the image data from the request
    const { image } = await req.json()
    
    if (!image) {
      throw new Error('No image data provided')
    }

    console.log('Starting background removal process...')

    // Convert base64 to blob
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const byteString = atob(base64Data)
    const byteArray = new Uint8Array(byteString.length)
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i)
    }
    const blob = new Blob([byteArray], { type: 'image/png' })

    // Remove background
    console.log('Processing image with background removal...')
    const processedBlob = await remove(blob)

    // Convert processed blob back to base64
    const reader = new FileReader()
    const base64Promise = new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(processedBlob)
    })
    const processedBase64 = await base64Promise

    console.log('Background removal completed successfully')

    return new Response(
      JSON.stringify({ 
        processedImage: processedBase64 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})
