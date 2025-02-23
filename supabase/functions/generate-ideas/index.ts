
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
      // Get person name for love story
      let answersText = "";
      const imagePrompts = [];
      
      // Process answers to create both context and image prompts
      for (const answer of answers) {
        answersText += `Question: ${answer.question}\nAnswer: ${answer.answer}\n\n`;
        
        // Create detailed image prompt for each answer
        const imagePrompt = `A beautiful, emotional photograph capturing ${answer.answer}. 
          Professional photography, soft natural lighting, cinematic composition, 
          shallow depth of field, high resolution, detailed textures, emotional moment`;
        
        imagePrompts.push({
          question: answer.question,
          prompt: imagePrompt
        });
      }

      // Generate emotional book ideas using GPT
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
              content: `You are a creative assistant that generates emotional and meaningful book ideas. The book will be a collection of memories and moments, presented with photos and heartfelt messages.`
            },
            {
              role: 'user',
              content: `Generate 3 different emotional book ideas based on these answers from questions about their relationship/memories:\n\n${answersText}\n\nThe book is written by ${authorName}.\n\nFor each idea, provide:\n- A meaningful, emotional title that shows care and love\n- A warm description that captures the essence of their story\n\nFormat each idea as a JSON object with 'title', 'author', and 'description' fields. Return an array of exactly 3 ideas.`
            }
          ],
        }),
      });

      const data = await response.json();
      const ideas = JSON.parse(data.choices[0].message.content);

      return new Response(
        JSON.stringify({ ideas, imagePrompts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (category === 'friends' && bookType === 'funny-biography') {
      // Generate funny biography ideas using GPT
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
              content: 'You are a creative assistant that generates humorous and entertaining book ideas.'
            },
            {
              role: 'user',
              content: `Generate 3 different funny biography book ideas based on these answers:\n\n${JSON.stringify(answers, null, 2)}\n\nThe biography is about ${authorName}.\n\nMake each idea:\n- Have a clever, humorous title\n- Include a funny description that captures their personality\n- Be light-hearted and entertaining\n\nFormat each idea as a JSON object with 'title', 'author', and 'description' fields. Return an array of exactly 3 ideas.`
            }
          ],
        }),
      });

      const data = await response.json();
      const ideas = JSON.parse(data.choices[0].message.content);

      return new Response(
        JSON.stringify({ ideas }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle other categories here if needed
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
