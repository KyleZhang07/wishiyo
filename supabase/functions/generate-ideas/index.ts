
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { authorName, stories, bookType, category } = await req.json();

    console.log('Generating ideas for:', { authorName, bookType, category });

    if (!authorName || !stories || !bookType || !category) {
      throw new Error('Missing required parameters');
    }

    const getBookTypeName = (type: string) => {
      const bookTypeMap: { [key: string]: string } = {
        'travel-book': 'Travel Book',
        'time-travel': 'Time Travel',
        'love-letters': 'Love Letters',
        'adventure': 'Adventure',
        'career-exploration': 'Career Exploration',
        'learning-journey': 'Learning Journey'
      };
      return bookTypeMap[type] || type;
    };

    let prompt = '';
    if (category === 'friends') {
      prompt = `Create a ${bookType} book for ${authorName} based on these stories and answers:
      ${stories.map(story => `${story.question}\nAnswer: ${story.answer}`).join('\n\n')}
      
      Respond with a JSON array containing exactly 3 book ideas, each with:
      {
        "title": "string",
        "author": "${authorName}",
        "description": "string (2-3 sentences)",
        "praises": [
          {
            "quote": "string (praise quote)",
            "source": "string (source name)"
          }
        ]
      }`;
    } else {
      const bookTypeName = getBookTypeName(bookType);
      prompt = `Create a ${bookTypeName} with stories based on these inputs:
      ${stories.map(story => `${story.question}\nAnswer: ${story.answer}`).join('\n\n')}
      
      Respond with a JSON object containing:
      {
        "title": "string",
        "author": "${authorName}",
        "description": "string",
        "chapters": [
          {
            "title": "string",
            "description": "string"
          }
        ]
      }`;
    }

    // Call OpenAI API
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
            content: 'You are a creative book generator that creates outlines and ideas for personalized books.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    try {
      const parsed = JSON.parse(generatedContent);
      if (category === 'friends') {
        return new Response(
          JSON.stringify({ ideas: parsed }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ idea: parsed }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Error parsing generated content:', error);
      throw new Error('Failed to parse AI response');
    }
  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
