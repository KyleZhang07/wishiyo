
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imagePrompt, imageConcept, tone, characterName, contentIndex } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('Missing OpenAI API key');
    }

    console.log(`Generating text for image ${contentIndex} with tone: ${tone}`);
    console.log(`Image concept: ${imageConcept}`);
    console.log(`Character name: ${characterName}`);

    // Construct the system prompt based on the tone
    let systemPrompt = `You are a creative writer specializing in writing image captions for a personalized love story book. 
Write a short, engaging caption (2-3 sentences) that complements an image in a ${tone.toLowerCase()} tone.
The caption should be about a moment shared between the author and ${characterName}.
`;

    // Add tone-specific instructions
    switch (tone) {
      case 'Humorous':
        systemPrompt += 'Use playful language, light wit, and a touch of humor that makes the reader smile.';
        break;
      case 'Poetic':
        systemPrompt += 'Use lyrical, expressive language with metaphors and vivid imagery to create an emotional impact.';
        break;
      case 'Dramatic':
        systemPrompt += 'Use intense, emotionally charged language that emphasizes the significance of the moment.';
        break;
      case 'Heartfelt':
        systemPrompt += 'Use warm, genuine language that conveys deep sincerity and affection.';
        break;
      case 'Encouraging':
        systemPrompt += 'Use positive, uplifting language that inspires and affirms the relationship.';
        break;
      default:
        systemPrompt += 'Use sincere, authentic language that captures the essence of the moment.';
    }

    // Construct the user prompt
    const userPrompt = `Write a caption for an image that depicts: ${imagePrompt || imageConcept}
This is for a moment in a love story between the author and ${characterName}.
This is Moment ${contentIndex} in their story.
Keep the text concise (2-3 sentences) but evocative.`;

    // Call OpenAI API for text generation
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    
    console.log("OpenAI API response:", JSON.stringify(data));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API');
    }

    const generatedText = data.choices[0].message.content.trim();
    
    console.log(`Generated text: ${generatedText}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        text: generatedText,
        tone
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-image-text function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An unexpected error occurred',
        text: "A special moment captured in time." // Fallback text
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
