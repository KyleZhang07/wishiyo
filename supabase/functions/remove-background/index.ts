
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { removeBackground } from 'https://esm.sh/@imgly/background-removal@1.2.1'

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
    const formData = await req.formData()
    const image = formData.get('image')

    if (!image || !(image instanceof File)) {
      throw new Error('No image file provided')
    }

    console.log('Starting background removal for image:', image.name)

    // Convert File to Blob
    const imageBlob = new Blob([await image.arrayBuffer()], { type: image.type })

    // Process image
    console.log('Processing image...')
    const processedBlob = await removeBackground(imageBlob, {
      debug: false,
      progress: (key, current, total) => {
        console.log(`Progress: ${key} - ${current}/${total}`)
      }
    })

    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Upload to storage
    const fileName = `${crypto.randomUUID()}.png`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('book-covers')
      .upload(fileName, processedBlob, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: publicUrlData } = await supabaseAdmin.storage
      .from('book-covers')
      .getPublicUrl(fileName)

    console.log('Background removal complete, image uploaded:', fileName)

    return new Response(
      JSON.stringify({ 
        url: publicUrlData.publicUrl,
        success: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
