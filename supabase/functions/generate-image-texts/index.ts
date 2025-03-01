import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImagePrompt {
  question: string;
  prompt: string;
}

interface ImageText {
  text: string;
  tone: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompts, tone, personName, personAge } = await req.json();
    
    console.log(`Generating image texts for ${prompts.length} prompts with tone: ${tone}`);
    
    if (!Array.isArray(prompts) || prompts.length === 0) {
      throw new Error('Prompts must be a non-empty array');
    }
    
    if (!tone) {
      throw new Error('Tone is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const texts: ImageText[] = [];

    // Generate texts in parallel for all prompts
    const textPromises = prompts.map(async (prompt: ImagePrompt) => {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: `You are a talented caption writer for an illustrated book. 
                        Create short, engaging captions in a ${tone} tone. 
                        The captions should be for a love story and complement the illustrations.
                        Write ONLY the caption text, no more than 1-2 sentences.
                        Do not include any explanations or metadata.` 
            },
            { 
              role: 'user', 
              content: `Write a detailed descriptive text for this image: ${prompt.prompt}.
                        This is for a love story featuring a person named ${personName || 'my love'}, who is ${personAge || 'adult'} years old.
                        Make it ${tone}, personal, and evocative with specific details.
                        The text should be 3-5 sentences long, rich in imagery and emotion.
                        This text will be displayed prominently next to the image.` 
            }
          ],
          temperature: 0.7,
          max_tokens: 250,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API error:', await response.text());
        return {
          text: "A beautiful moment frozen in time. The emotions of this scene tell a story deeper than words could express. Each detail captures the essence of a profound experience.",
          tone: tone
        };
      }

      const data = await response.json();
      const generatedText = data.choices[0].message.content.trim();
      
      return {
        text: generatedText,
        tone: tone
      };
    });

    const generatedTexts = await Promise.all(textPromises);
    
    console.log(`Successfully generated ${generatedTexts.length} texts`);

    return new Response(
      JSON.stringify({ texts: generatedTexts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating image texts:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
