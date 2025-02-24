
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LIGHTX_BASE_URL = "https://api.lightxeditor.com/external/api";
const LIGHTX_UPLOAD_URL = `${LIGHTX_BASE_URL}/v2/uploadImageUrl`;
const LIGHTX_EXPAND_URL = `${LIGHTX_BASE_URL}/v1/expand-photo`;
const LIGHTX_STATUS_URL = `${LIGHTX_BASE_URL}/v1/order-status`;

async function uploadImage(imageBlob: Blob, apiKey: string): Promise<string> {
  console.log('Starting image upload process...');
  
  // Step 1: Get upload URL
  const uploadUrlResponse = await fetch(LIGHTX_UPLOAD_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      type: 'imageUrl',
      size: imageBlob.size,
      contentType: imageBlob.type
    })
  });

  if (!uploadUrlResponse.ok) {
    throw new Error(`Failed to get upload URL: ${await uploadUrlResponse.text()}`);
  }

  const { uploadImage, imageUrl } = await uploadUrlResponse.json();
  console.log('Received upload URL and future public URL');

  // Step 2: Upload image to the temporary URL
  const uploadResponse = await fetch(uploadImage, {
    method: 'PUT',
    body: imageBlob
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image');
  }

  console.log('Successfully uploaded image, public URL:', imageUrl);
  return imageUrl;
}

async function expandImage(publicUrl: string, apiKey: string): Promise<string> {
  console.log('Starting image expansion...');
  
  // Step 1: Request expansion
  const expandResponse = await fetch(LIGHTX_EXPAND_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey
    },
    body: JSON.stringify({
      imageUrl: publicUrl,
      leftPadding: 512, // Expand to the left
      rightPadding: 0,
      topPadding: 0,
      bottomPadding: 0
    })
  });

  if (!expandResponse.ok) {
    throw new Error(`Failed to start expansion: ${await expandResponse.text()}`);
  }

  const { orderId } = await expandResponse.json();
  console.log('Expansion started, orderId:', orderId);

  // Step 2: Poll for completion
  for (let attempt = 0; attempt < 10; attempt++) {
    console.log(`Checking status, attempt ${attempt + 1}`);
    
    const statusResponse = await fetch(LIGHTX_STATUS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({ orderId })
    });

    if (!statusResponse.ok) {
      throw new Error('Failed to check status');
    }

    const { body } = await statusResponse.json();
    console.log('Status check result:', body.status);

    if (body.status === 'active') {
      console.log('Expansion completed, output URL:', body.output);
      return body.output;
    }
    
    if (body.status === 'failed') {
      throw new Error('Expansion failed');
    }

    // Wait 3 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  throw new Error('Expansion timed out');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    console.log('Received request to expand image:', imageUrl);

    const LIGHTX_API_KEY = Deno.env.get('LIGHTX_API_KEY');
    if (!LIGHTX_API_KEY) {
      throw new Error('LightX API key not configured');
    }

    // Step 1: Download the original image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch original image: ${imageResponse.statusText}`);
    }
    const imageBlob = await imageResponse.blob();

    // Step 2: Upload to LightX and get public URL
    const publicUrl = await uploadImage(imageBlob, LIGHTX_API_KEY);

    // Step 3: Expand the image
    const expandedImageUrl = await expandImage(publicUrl, LIGHTX_API_KEY);

    // Step 4: Get the expanded image
    const expandedResponse = await fetch(expandedImageUrl);
    if (!expandedResponse.ok) {
      throw new Error('Failed to fetch expanded image');
    }

    const expandedBlob = await expandedResponse.blob();
    const arrayBuffer = await expandedBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    return new Response(
      JSON.stringify({ 
        imageData: `data:${expandedBlob.type};base64,${base64}`
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error in expand-image function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
