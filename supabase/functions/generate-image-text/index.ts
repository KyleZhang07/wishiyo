
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CreateCompletionRequest } from "https://esm.sh/openai@4.0.0/resources/chat/completions";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    // Parse request data
    const { prompts, tone, personName } = await req.json();
    
    if (!prompts || !tone) {
      throw new Error('Missing required parameters: prompts, tone');
    }

    console.log('Generating image texts with tone:', tone);
    console.log('Number of prompts:', prompts.length);

    // Function to generate text for a single prompt
    const generateTextForPrompt = async (prompt) => {
      const systemPrompt = `You are a skilled writer for a love story photo book. Create a short, engaging caption (25-40 words) for an image in a ${tone.toLowerCase()} tone. 
      The caption should feel like text accompanying an image in a love story photo book. 
      Use second person perspective addressing the recipient by name occasionally.`;

      const userPrompt = `The image shows: ${prompt.prompt || prompt}
      ${personName ? `The recipient's name is: ${personName}` : ''}
      
      Create a brief, ${tone.toLowerCase()} caption that would accompany this image in a love story photo book. 
      The caption should evoke emotion and relate to the image description.`;

      try {
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
            max_tokens: 80,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('OpenAI API error:', errorData);
          throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const generatedText = data.choices[0].message.content.trim();
        
        console.log('Generated text:', generatedText);
        
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
    };

    // Process all prompts concurrently
    const textPromises = Array.isArray(prompts) 
      ? prompts.map(generateTextForPrompt)
      : [generateTextForPrompt(prompts)];
    
    const texts = await Promise.all(textPromises);

    return new Response(
      JSON.stringify({ 
        texts,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-image-text function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        texts: null,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
