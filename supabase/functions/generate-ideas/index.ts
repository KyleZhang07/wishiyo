
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
      let answersText = "";
      const imagePrompts = [];
      
      for (const answer of answers) {
        answersText += `Question: ${answer.question}\nAnswer: ${answer.answer}\n\n`;
        
        const imagePrompt = `A beautiful, emotional photograph capturing ${answer.answer}. 
          Professional photography, soft natural lighting, cinematic composition, 
          shallow depth of field, high resolution, detailed textures, emotional moment`;
        
        imagePrompts.push({
          question: answer.question,
          prompt: imagePrompt
        });
      }

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
              content: `You are a creative assistant that generates emotional and meaningful book ideas. The book will be a collection of memories and moments, presented with photos and heartfelt messages. You must respond with ONLY a JSON array containing exactly 3 book ideas.`
            },
            {
              role: 'user',
              content: `Generate 3 different emotional book ideas based on these answers:\n\n${answersText}\n\nThe book is written by ${authorName}.\n\nRespond with ONLY a JSON array of 3 objects, each with 'title', 'author', and 'description' fields. Do not include any other text or formatting.`
            }
          ],
        }),
      });

      const data = await response.json();
      console.log('OpenAI response:', JSON.stringify(data, null, 2));

      try {
        // Try to parse the content directly first
        const ideas = JSON.parse(data.choices[0].message.content);
        return new Response(
          JSON.stringify({ ideas, imagePrompts }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from the content
        const contentStr = data.choices[0].message.content;
        const jsonMatch = contentStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const ideas = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify({ ideas, imagePrompts }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error('Failed to parse OpenAI response as JSON');
      }

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
              content: `You are a creative assistant that generates humorous and entertaining book ideas. You must respond with ONLY a JSON array containing exactly 3 book ideas.`
            },
            {
              role: 'user',
              content: `Generate 3 different funny biography book ideas based on these answers:\n\n${JSON.stringify(answers, null, 2)}\n\nThe biography is about ${authorName}.\n\nRespond with ONLY a JSON array of 3 objects, each with 'title', 'author', and 'description' fields. Each idea should be funny and entertaining. Do not include any other text or formatting.`
            }
          ],
        }),
      });

      const data = await response.json();
      console.log('OpenAI response:', JSON.stringify(data, null, 2));

      try {
        // Try to parse the content directly first
        const ideas = JSON.parse(data.choices[0].message.content);
        return new Response(
          JSON.stringify({ ideas }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from the content
        const contentStr = data.choices[0].message.content;
        const jsonMatch = contentStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const ideas = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify({ ideas }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error('Failed to parse OpenAI response as JSON');
      }
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
