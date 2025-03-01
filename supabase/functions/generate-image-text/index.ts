
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Define our CORS headers
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
    console.log('Received request to generate image text');
    const { prompts, tone, personName } = await req.json();
    
    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      throw new Error('Invalid prompts: expected non-empty array');
    }
    
    if (!tone) {
      throw new Error('Missing tone parameter');
    }
    
    console.log(`Generating texts with tone: ${tone} for ${prompts.length} prompts`);
    console.log(`First prompt: ${JSON.stringify(prompts[0])}`);
    
    // Generate texts for each prompt
    const texts = await Promise.all(prompts.map(async (prompt) => {
      try {
        // Ensure we have a valid prompt object
        if (!prompt || typeof prompt !== 'object' || !prompt.prompt) {
          console.error('Invalid prompt object:', prompt);
          return {
            text: "A special moment captured in time.",
            tone: tone
          };
        }
        
        // Build the system prompt for text generation
        const systemPrompt = `You are a talented writer who creates emotional, meaningful captions for images in a ${tone.toLowerCase()} tone. 
        Write a short caption (1-2 sentences maximum) that would accompany an image described by the following prompt. 
        The caption should be evocative and reflect the emotion of the moment in a ${tone.toLowerCase()} way.
        If the name "${personName}" is provided, you can incorporate it naturally in the caption, but it's not required.
        Keep it concise, meaningful, and appropriate for a love story book.`;
        
        console.log(`Calling OpenAI for prompt: ${prompt.prompt.substring(0, 50)}...`);
        
        // Call OpenAI for text generation
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
              { role: 'user', content: `Generate a caption for this image: ${prompt.prompt}` }
            ],
            max_tokens: 150,
            temperature: 0.7
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('OpenAI API error:', errorData);
          throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
        }
        
        const data = await response.json();
        console.log('OpenAI response:', data);
        
        const generatedText = data.choices[0].message.content.trim();
        
        return {
          text: generatedText,
          tone: tone
        };
      } catch (error) {
        console.error('Error generating text for prompt:', error);
        return {
          text: "A special moment captured in time.",
          tone: tone
        };
      }
    }));
    
    console.log(`Generated ${texts.length} texts successfully`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        texts: texts 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in generate-image-text:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
