
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const generateLovePrompt = (authorName: string, stories: any[], bookType: string) => {
  if (bookType === 'love-story') {
    return `Create a meaningful personalized book outline for "${authorName}". The book should be heartfelt and touching, expressing appreciation and admiration. Here's how to structure it:

    Create a book that:
    - Has a meaningful and personal title including "${authorName}"
    - Contains 6-8 chapters that tell a cohesive story
    - Each chapter should focus on different aspects of their personality, impact, or shared memories
    - The story should build up to a meaningful conclusion

    Use these memories and details about ${authorName} that were shared to personalize the story:
    ${JSON.stringify(stories)}

    Format the response as a single JSON object with these exact fields:
    - title (string): A meaningful title including "${authorName}"
    - author (string): "A Special Story for ${authorName}"
    - description (string): A touching description of what makes this story special
    - chapters (array): An array of chapter objects, each with "title" and "description" fields
    - praises (array): An array of 4 fictional praise quotes, each with "quote" and "source" fields`;
  }
  
  // ... keep existing code for other love book types
};

const generateFriendsPrompt = (authorName: string, stories: any[], bookType: string) => {
  switch(bookType) {
    case 'funny-biography':
      return `Create 3 funny book ideas for a biography about ${authorName}, and for each idea, generate 4 praise quotes from fictional but contextually relevant organizations or publications. Base the content on this information:\n\n${JSON.stringify(stories)}\n\nEnsure to respond with valid JSON array with exactly 3 objects. Each object must have these exact fields: title (string), author (string), description (string), and praises (array of objects with quote and source fields).`;
    case 'wild-fantasy':
      return `Create 3 wild fantasy book ideas for ${authorName}, and for each idea, generate 4 praise quotes from fictional but contextually relevant organizations or publications. Base the content on this information:\n\n${JSON.stringify(stories)}\n\nEnsure to respond with valid JSON array with exactly 3 objects. Each object must have these exact fields: title (string), author (string), description (string), and praises (array of objects with quote and source fields).`;
    case 'prank-book':
      return `Create 3 prank book ideas for ${authorName}, and for each idea, generate 4 praise quotes from fictional but contextually relevant organizations or publications. Base the content on this information:\n\n${JSON.stringify(stories)}\n\nEnsure to respond with valid JSON array with exactly 3 objects. Each object must have these exact fields: title (string), author (string), description (string), and praises (array of objects with quote and source fields).`;
    default:
      throw new Error('Invalid book type for friends category');
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { authorName, stories, bookType, category } = await req.json()

    if (!authorName || !stories || !bookType || !category) {
      throw new Error('Missing required parameters');
    }

    console.log('Generating ideas for:', { authorName, bookType, category });
    console.log('Stories provided:', stories);

    let prompt;
    if (category === 'love') {
      prompt = generateLovePrompt(authorName, stories, bookType);
    } else {
      prompt = generateFriendsPrompt(authorName, stories, bookType);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are a creative book generator that creates personalized book outlines. You must respond with valid JSON only.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const openAIResponse = await response.json();
    
    console.log('Raw OpenAI response:', openAIResponse);

    if (!openAIResponse.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const content = openAIResponse.choices[0].message.content.trim();

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
      
      if (category === 'love') {
        // For love category, we wrap the single idea in an object
        return new Response(
          JSON.stringify({ idea: parsedContent }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // For friends category, we expect an array of ideas
        return new Response(
          JSON.stringify({ ideas: parsedContent }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('JSON parse error:', error);
      console.error('Content that failed to parse:', content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }
  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
