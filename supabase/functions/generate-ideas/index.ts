
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generateFunnyBiographyPrompt = (authorName: string, stories: Array<{question: string, answer: string}>) => {
  const storiesText = stories.map(story => `${story.question}\nAnswer: ${story.answer}`).join('\n\n');
  
  return `As a comedic biography writer, create 3 hilarious book ideas for a funny biography about a person named ${authorName}. Use the following information about them:

${storiesText}

Generate 3 different book ideas. Each should have:
1. A catchy, witty title that includes their name or references their characteristics
2. "by ${authorName}" as the author line
3. A funny description that ties together their quirks and stories in an entertaining way

Format each idea like this:
{
  "title": "The witty title",
  "author": "by ${authorName}",
  "description": "The funny description"
}

Return exactly 3 ideas in a JSON array.`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { authorName, stories } = await req.json();
    const prompt = generateFunnyBiographyPrompt(authorName, stories);

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
            content: 'You are a creative writer specializing in humorous biographies.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const ideas = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify({ ideas }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating ideas:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
