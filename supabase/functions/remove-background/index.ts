
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { image } = await req.json()

    // Create Python process
    const process = new Deno.Command('python3', {
      args: ['-c', `
import sys
import base64
from rembg import remove
from PIL import Image
import io

# Read base64 image from stdin
input_base64 = sys.stdin.read()

# Convert base64 to image
input_bytes = base64.b64decode(input_base64.split(',')[1])
input_image = Image.open(io.BytesIO(input_bytes))

# Remove background
output_image = remove(input_image)

# Convert back to base64
output_buffer = io.BytesIO()
output_image.save(output_buffer, format='PNG')
output_base64 = base64.b64encode(output_buffer.getvalue()).decode('utf-8')

# Print the result
print(f"data:image/png;base64,{output_base64}")
      `],
      stdin: 'piped',
      stdout: 'piped',
    });

    // Start the process and write the image data
    const child = process.spawn();
    const writer = child.stdin.getWriter();
    await writer.write(new TextEncoder().encode(image));
    await writer.close();

    // Get the result
    const output = await child.output();
    const result = new TextDecoder().decode(output.stdout).trim();

    return new Response(
      JSON.stringify({ image: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
