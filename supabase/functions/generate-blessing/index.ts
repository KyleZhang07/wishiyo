
import { serve } from 'http/server';
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  return null;
};

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { characterName, partnerName, style, tone } = await req.json();

    // Get OpenAI API key from environment variables
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Prepare the prompt for OpenAI
    const systemPrompt = `You are a heartfelt greeting card writer specializing in personalized messages for loved ones.
Write a beautiful, touching blessing or message that would appear on the introduction page of a love story book.
The message should be in the style of a greeting card message, like the ones you'd find in the introduction of a gift book.
It should be addressed to the recipient(s) and signed by the sender(s).
The message should be concise (3-5 sentences maximum) but deeply meaningful and emotionally resonant.
Do not use fancy formatting, just plain text.`;

    const userPrompt = `Write a heartfelt greeting card message in a ${tone || 'loving'} tone that would appear on the first page of a love story book.
${characterName && partnerName ? `It should be addressed to "${characterName}" and/or "${partnerName}".` : ''}
${style ? `The overall style of the book is "${style}".` : ''}
The message should be short (3-5 sentences) but meaningful, expressing love, good wishes, or a touching sentiment.
Format the response with a greeting at the beginning (e.g., "Dear [Name]," or "To my beloved [Name],") and a signature line at the end (e.g., "Love, [Sender]" or "With all my heart, [Sender]").
Do not include any additional text, comments, or explanations - just the greeting card message itself.`;

    console.log("Sending request to OpenAI with prompt:", userPrompt);

    // Make request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const blessing = data.choices[0].message.content.trim();

    console.log("Generated blessing:", blessing);

    return new Response(
      JSON.stringify({ blessing }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-blessing function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
