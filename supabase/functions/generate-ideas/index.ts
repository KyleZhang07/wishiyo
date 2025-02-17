
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generateFunnyBiographyPrompt = (authorName: string, stories: Array<{question: string, answer: string}>) => {
  const storiesText = stories.map(story => `${story.question}\nAnswer: ${story.answer}`).join('\n\n');
  
  return `Create 3 funny book ideas for a biography about ${authorName}. Use this information:

${storiesText}

IMPORTANT: Return your response as a valid JSON array with exactly 3 objects. Each object MUST have these exact fields:
{
  "title": "A witty title including their name",
  "author": "by ${authorName}",
  "description": "A funny description"
}

DO NOT include any explanation or additional text. ONLY return the JSON array. Example format:
[
  {
    "title": "Example Title",
    "author": "by Author Name",
    "description": "Example description"
  },
  ...
]`;
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
            content: 'You are a creative writer specializing in humorous biographies. You must ALWAYS respond with valid JSON arrays containing exactly 3 objects with title, author, and description fields. Never include any other text or explanations.'
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
    console.log('OpenAI raw response:', data.choices?.[0]?.message?.content);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI: No content received');
    }

    let ideas;
    try {
      // Remove any potential markdown formatting that OpenAI might add
      const cleanContent = data.choices[0].message.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      ideas = JSON.parse(cleanContent);
      
      // Validate the response structure
      if (!Array.isArray(ideas)) {
        throw new Error('Response is not an array');
      }
      
      if (ideas.length !== 3) {
        throw new Error(`Expected 3 ideas, got ${ideas.length}`);
      }
      
      ideas.forEach((idea, index) => {
        if (!idea.title || !idea.author || !idea.description) {
          throw new Error(`Idea ${index + 1} is missing required fields`);
        }
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', data.choices[0].message.content);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    return new Response(JSON.stringify({ ideas }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
