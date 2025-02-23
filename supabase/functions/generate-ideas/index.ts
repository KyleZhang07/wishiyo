
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
      // Get person's name from answers
      const personName = answers.find((a: any) => a.question.toLowerCase().includes('name'))?.answer || 'them';
      console.log('Generating prompts for person:', personName);
      
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
              content: `Generate 13 creative image prompts based on these answers:\n\n${JSON.stringify(answers, null, 2)}\n\n
                Create: 
                1. One cover image prompt that captures ${personName}'s essence in a magical setting
                2. Twelve story image prompts showing ${personName} in various imaginative scenarios
                Each prompt should be detailed and photo-realistic.
                Format the response as a JSON array of 13 objects, each with 'question' (short description) and 'prompt' (detailed AI image generation prompt) fields.
                Make the prompts creative and magical, mixing reality with imagination.
                Example prompt structure:
                {
                  "question": "${personName} as a superhero",
                  "prompt": "Ultra-realistic portrait of ${personName}, wearing a sleek superhero costume, standing atop a skyscraper at sunset, city lights glowing below, dramatic lighting, cinematic composition, high detail"
                }`
            }
          ],
        }),
      });

      const promptData = await promptResponse.json();
      console.log('Prompt generation response:', promptData);
      
      let imagePrompts = [];
      try {
        if (promptData.choices && promptData.choices[0] && promptData.choices[0].message) {
          const content = promptData.choices[0].message.content;
          console.log('Raw content:', content);
          imagePrompts = JSON.parse(content);
        } else {
          throw new Error('Invalid response format from OpenAI');
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
        const contentStr = promptData.choices[0].message.content;
        const jsonMatch = contentStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          imagePrompts = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse image prompts: ' + parseError.message);
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
                Return ONLY a JSON array of 3 objects, each with 'title', 'author', and 'description' fields.
                Example:
                [
                  {
                    "title": "Title of the book",
                    "author": "${authorName}",
                    "description": "A heartwarming description..."
                  }
                ]`
            }
          ],
        }),
      });

      const data = await response.json();
      console.log('Book ideas response:', data);
      
      let ideas = [];
      try {
        if (data.choices && data.choices[0] && data.choices[0].message) {
          const content = data.choices[0].message.content;
          console.log('Raw ideas content:', content);
          ideas = JSON.parse(content);
        } else {
          throw new Error('Invalid response format from OpenAI');
        }
      } catch (parseError) {
        console.error('Parse error for ideas:', parseError);
        const contentStr = data.choices[0].message.content;
        const jsonMatch = contentStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          ideas = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse book ideas: ' + parseError.message);
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
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
