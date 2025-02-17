
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

Return your response in strict JSON array format with exactly 3 objects having these fields: title, author, description. The response should be parseable by JSON.parse().`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { authorName, stories } = await req.json();
    console.log('Received request with author:', authorName);
    
    if (!authorName || !stories || !Array.isArray(stories)) {
      throw new Error('Invalid input: authorName and stories array are required');
    }

    const prompt = generateFunnyBiographyPrompt(authorName, stories);
    console.log('Generated prompt:', prompt);

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
            content: 'You are a creative writer specializing in humorous biographies. Always respond in valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    let ideas;
    try {
      ideas = JSON.parse(data.choices[0].message.content.trim());
      
      // Validate the response structure
      if (!Array.isArray(ideas) || ideas.length !== 3) {
        throw new Error('Invalid response format: expected array of 3 ideas');
      }
      
      ideas.forEach(idea => {
        if (!idea.title || !idea.author || !idea.description) {
          throw new Error('Invalid idea format: missing required fields');
        }
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Raw content:', data.choices[0].message.content);
      throw new Error('Failed to parse AI response as JSON');
    }

    return new Response(JSON.stringify({ ideas }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
