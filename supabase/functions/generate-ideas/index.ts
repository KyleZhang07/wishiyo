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
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (category === 'love') {
      // First, get the name of the person from the answers
      const personName = localStorage.getItem('loveStoryPersonName') || 'them';
      
      // Generate image prompts first
      const promptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: `You are a creative assistant that generates imaginative image prompts for a love story photo book. 
                Create 13 unique and creative scenes - 1 cover image and 12 story images. 
                Each prompt should imagine the person in different scenarios, both realistic and fantastical.
                Make the prompts suitable for high-quality photo-realistic AI image generation.`
            },
            {
              role: 'user',
              content: `Generate 13 creative image prompts based on these answers about ${personName}:\n\n${JSON.stringify(answers, null, 2)}\n\n
                Create: 
                1. One cover image prompt that captures their essence
                2. Twelve story image prompts showing ${personName} in various imaginative scenarios
                Each prompt should be detailed and photo-realistic.
                Respond with ONLY a JSON array of 13 objects, each with 'question' and 'prompt' fields.
                Make the prompts creative and magical, mixing reality with imagination.`
            }
          ],
        }),
      });

      const promptData = await promptResponse.json();
      let imagePrompts = [];
      
      try {
        imagePrompts = JSON.parse(promptData.choices[0].message.content);
      } catch (parseError) {
        const contentStr = promptData.choices[0].message.content;
        const jsonMatch = contentStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          imagePrompts = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse image prompts');
        }
      }

      // Then generate book ideas
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
              content: `You are a creative assistant that generates emotional and meaningful book ideas. 
                The book will be a collection of memories and moments, presented with photos and heartfelt messages. 
                You must respond with ONLY a JSON array containing exactly 3 book ideas.`
            },
            {
              role: 'user',
              content: `Generate 3 different emotional book ideas based on these answers:\n\n${JSON.stringify(answers, null, 2)}\n\n
                The book is written by ${authorName} for ${personName}.\n\n
                Respond with ONLY a JSON array of 3 objects, each with 'title', 'author', and 'description' fields. 
                Do not include any other text or formatting.`
            }
          ],
        }),
      });

      const data = await response.json();
      let ideas = [];

      try {
        ideas = JSON.parse(data.choices[0].message.content);
      } catch (parseError) {
        const contentStr = data.choices[0].message.content;
        const jsonMatch = contentStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          ideas = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse book ideas');
        }
      }

      return new Response(
        JSON.stringify({ ideas, imagePrompts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (category === 'friends' && bookType === 'funny-biography') {
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
              content: `You are a creative assistant that generates funny and engaging book ideas for a biography. 
                The biography will be a humorous take on the person's life, highlighting funny stories and memorable moments. 
                You must respond with ONLY a JSON array containing exactly 3 book ideas.`
            },
            {
              role: 'user',
              content: `Generate 3 different funny book ideas based on these answers:\n\n${JSON.stringify(answers, null, 2)}\n\n
                The biography is about ${authorName}.\n\n
                Respond with ONLY a JSON array of 3 objects, each with 'title', 'author', and 'description' fields. 
                Do not include any other text or formatting.`
            }
          ],
        }),
      });

      const data = await response.json();
      let ideas = [];

      try {
        ideas = JSON.parse(data.choices[0].message.content);
      } catch (parseError) {
        const contentStr = data.choices[0].message.content;
        const jsonMatch = contentStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          ideas = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse book ideas');
        }
      }

      return new Response(
        JSON.stringify({ ideas }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Unsupported book type or category');

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
