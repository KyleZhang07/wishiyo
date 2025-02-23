import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { authorName, answers, bookType, category } = await req.json();

    if (category === 'love') {
      // Generate emotional, supportive book ideas for love category
      const ideas = [];
      const imagePrompts = [];
      
      // Process answers to create both book ideas and detailed image prompts
      for (const answer of answers) {
        const prompt = `Generate a detailed, artistic scene description for: ${answer.answer}. 
          Include specific details about lighting, composition, emotions, and setting.`;

        // Generate detailed image prompt for each answer
        const imagePrompt = `A beautiful, emotional photograph capturing ${answer.answer}. 
          Professional photography, soft natural lighting, cinematic composition, 
          shallow depth of field, high resolution, detailed textures, emotional moment`;
        
        imagePrompts.push({
          question: answer.question,
          prompt: imagePrompt
        });
      }

      // Generate 3 different book ideas
      ideas.push(
        {
          title: `${authorName.split(' ')[0]}, Our Story Together`,
          author: `Created with love by ${authorName}`,
          description: "A heartfelt journey through our most precious moments together, celebrating our unique bond and shared memories.",
        },
        {
          title: `To ${authorName.split(' ')[0]}, With Love`,
          author: `From ${authorName}`,
          description: "A collection of cherished memories and heartfelt moments that showcase the beauty of our relationship.",
        },
        {
          title: `${authorName.split(' ')[0]}, This Is Us`,
          author: `Lovingly created by ${authorName}`,
          description: "An intimate portrait of our journey together, filled with love, laughter, and unforgettable moments.",
        }
      );

      return new Response(
        JSON.stringify({ ideas, imagePrompts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Original logic for other categories
      const configuration = {
        method: 'post',
        headers: {
          'content-type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
        },
      };

      let prompt = '';

      if (category === 'friends') {
        prompt = `You are a creative story writer. Your job is to come up with 3 unique ideas for a funny biography about ${authorName} and their friend.
        The ideas should be funny and creative. The ideas should be no more than 2 sentences long.
        Here are some details about the friends: ${JSON.stringify(answers)}.
        Give me 3 ideas in JSON format. The keys should be "title", "author", and "description". The author should be ${authorName}.`;
      } else if (category === 'kids') {
        prompt = `You are a creative story writer. Your job is to come up with 1 unique idea for a kids story about ${authorName} and their child.
        The idea should be heart warming and creative. The idea should be no more than 2 sentences long.
        Here are some details about the child: ${JSON.stringify(answers)}.
        Give me 1 idea in JSON format with chapters. The keys should be "title", "author", "description", "chapters". The author should be ${authorName}.
        Each chapter should have a title and a description. There should be 5 chapters.`;
      }

      const body = JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      });

      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        ...configuration,
        body,
      });

      if (!resp.ok) {
        console.error('OpenAI API Error:', resp.status, resp.statusText);
        try {
            const errorBody = await resp.json();
            console.error('Error Body:', JSON.stringify(errorBody, null, 2));
        } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
        }
        throw new Error(`OpenAI API request failed with status ${resp.status}`);
      }

      const json = await resp.json();
      const idea = JSON.parse(json.choices[0].message.content);

      return new Response(
        JSON.stringify(idea),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
