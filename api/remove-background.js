import fetch from 'node-fetch';
import FormData from 'form-data';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).set(corsHeaders).end();
    return;
  }
  
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, please use POST' });
  }

  try {
    const { imageUrl } = req.body;
    console.log('Processing image:', imageUrl ? 'Image URL received' : 'No image URL');

    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    // Fetch the image directly from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image');
    }
    
    const imageBuffer = await imageResponse.buffer();
    console.log('Image fetched, size:', imageBuffer.length);

    // Call PhotoRoom API
    const formData = new FormData();
    formData.append('image_file', imageBuffer, { filename: 'image.jpg' });

    const apiKey = process.env.PHOTOROOM_API_KEY;
    if (!apiKey) {
      throw new Error('PhotoRoom API key not configured');
    }

    console.log('Calling PhotoRoom API...');
    const photoroomResponse = await fetch('https://sdk.photoroom.com/v1/segment', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: formData,
    });

    if (!photoroomResponse.ok) {
      const errorText = await photoroomResponse.text();
      console.error('PhotoRoom API error:', photoroomResponse.status, errorText);
      throw new Error(`PhotoRoom API error: ${photoroomResponse.statusText || errorText}`);
    }

    // Get the processed image
    const processedImageBuffer = await photoroomResponse.buffer();
    console.log('Received processed image, size:', processedImageBuffer.length);
    
    // Convert buffer to base64
    const base64 = processedImageBuffer.toString('base64');
    const contentType = photoroomResponse.headers.get('content-type') || 'image/png';
    const dataUrl = `data:${contentType};base64,${base64}`;

    return res.status(200).json({ 
      success: true, 
      image: dataUrl 
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
} 