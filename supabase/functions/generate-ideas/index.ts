import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const generateLovePrompt = (authorName: string, stories: any[], bookType: string) => {
  if (bookType === 'love-story') {
    return `Create 3 different book outlines for "${authorName}". Each book should have a different style and tone:

    1. First book: Create an encouraging and uplifting children's book style. The title should be motivational and sweet, like "Joey, You Can Reach the Stars!" or "Sarah, Your Dreams Are Beautiful!". The story should be gentle and inspiring.

    2. Second book: Create a deeply loving and appreciative book style. The title should express deep admiration, like "Michael, You Are My Greatest Inspiration" or "Emma, Your Light Shines So Bright". The story should be heartfelt and touching.

    3. Third book: Create a humorous yet encouraging book style. The title should be playful but supportive, like "Hey Alex, Time to Rock This!" or "Come On Lucy, Show Them What You've Got!". The story should be fun and motivating.

    For each book idea, provide:
    - A title that follows the style description
    - A touching description of the book's theme and purpose
    - 4 sample chapters that capture the essence of the story
    - 4 praise quotes from fictional but relevant sources

    Return the results as a valid JSON array with exactly 3 objects. Each object must have these fields: 
    - title (string)
    - author (string, use "${authorName}")
    - description (string)
    - chapters (array of objects with title and description fields)
    - praises (array of objects with quote and source fields)

    Base the content on these stories and information about ${authorName}:
    ${JSON.stringify(stories)}`;
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
            content: 'You are a creative book idea generator that creates engaging titles, descriptions, chapters, and praise quotes. You must respond with valid JSON only.'
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

    // Parse as JSON array for both categories now
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error('JSON parse error:', error);
      console.error('Content that failed to parse:', content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    return new Response(
      JSON.stringify({ ideas: parsedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
