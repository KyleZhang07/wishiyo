
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

    try {
      // Convert base64 to Uint8Array
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

      // Create blob from binary data
      const blob = new Blob([binaryData], { type: 'image/png' })

      // Remove background
      console.log('Processing image with background removal...')
      const processedBlob = await remove(blob)

      // Convert processed blob to base64
      const processedBuffer = await processedBlob.arrayBuffer()
      const processedArray = new Uint8Array(processedBuffer)
      let binary = '';
      for (let i = 0; i < processedArray.byteLength; i++) {
        binary += String.fromCharCode(processedArray[i]);
      }
      const processedBase64 = btoa(binary)
      const processedDataUrl = `data:image/png;base64,${processedBase64}`

      console.log('Background removal completed successfully')

      return new Response(
        JSON.stringify({ 
          processedImage: processedDataUrl 
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      )
    } catch (processingError) {
      console.error('Image processing error:', processingError)
      throw new Error(`Failed to process image: ${processingError.message}`)
    }
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
