import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const { method } = req;
  if (method === "OPTIONS") {
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
        'love-story': 'Travel Book',
        'love-poems': 'Time Travel',
        'picture-album': 'Love Letters',
        'adventure': 'Adventure',
        'story-book': 'Career Exploration',
        'learning': 'Learning Journey'
      };
      return bookTypeMap[type] || type;
    };

    let prompt = '';
    if (category === 'friends') {
      prompt = `Create a collection of stories for ${authorName}. Each story should:
      1. Have a title
      2. Include a subtitle describing the scene
      3. Describe the image that should accompany the story
      4. Provide a one-page story content description

      Based on these memories and preferences:
      ${stories.map(story => `${story.question}\nAnswer: ${story.answer}`).join('\n\n')}

      Respond with a JSON object containing:
      {
        "title": "string",
        "author": "string",
        "stories": [
          {
            "title": "string",
            "subtitle": "string",
            "imageDescription": "string",
            "contentDescription": "string"
          }
        ]
      }`;
    } else {
      const bookTypeName = getBookTypeName(bookType);
      prompt = `Create a ${bookTypeName} with 15 stories for ${authorName}. Each story should:
      1. Have a location-based title (e.g., "A serendipitous encounter in Paris")
      2. Include a subtitle describing the scene (e.g., "${authorName} wandering in the streets of Paris")
      3. Describe the image that should accompany the story
      4. Provide a one-page story content description

      Based on these memories and preferences:
      ${stories.map(story => `${story.question}\nAnswer: ${story.answer}`).join('\n\n')}

      Respond with a JSON object containing:
      {
        "title": "string",
        "author": "string",
        "stories": [
          {
            "title": "string (location-based)",
            "subtitle": "string",
            "imageDescription": "string",
            "contentDescription": "string"
          }
        ]
      }`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
