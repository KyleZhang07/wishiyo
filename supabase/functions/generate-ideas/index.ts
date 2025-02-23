import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const generateLovePrompt = (authorName: string, stories: any[], bookType: string) => {
  if (bookType === 'love-story') {
    return `Create 3 different love story book ideas to express feelings for "${authorName}". Each book should have a different style and emotional focus.

    For each book idea, provide:
    - A meaningful title (including "${authorName}")
    - A touching description of the book's theme and purpose
    - 3-4 fictional praise quotes from relevant sources (like relationship experts or romantic authors)

    Base the content on these stories and information shared about ${authorName}:
    ${JSON.stringify(stories)}

    Return the results as a valid JSON array with exactly 3 objects. Each object must have these exact fields:
    - title (string)
    - author (string, use "A Story by ${authorName}")
    - description (string)
    - praises (array of objects with quote and source fields)

    Make sure each book idea is unique in its approach and emotional tone.`;
  }
  
  if (bookType === 'love-poems') {
    return `Create 3 different love poem book ideas to express feelings for "${authorName}". Each book should have a different style and emotional focus.

    For each book idea, provide:
    - A meaningful title (including "${authorName}")
    - A touching description of the book's theme and purpose
    - 3-4 fictional praise quotes from relevant sources (like relationship experts or romantic authors)

    Base the content on these stories and information shared about ${authorName}:
    ${JSON.stringify(stories)}

    Return the results as a valid JSON array with exactly 3 objects. Each object must have these exact fields:
    - title (string)
    - author (string, use "A Story by ${authorName}")
    - description (string)
    - praises (array of objects with quote and source fields)

    Make sure each book idea is unique in its approach and emotional tone.`;
  }

  if (bookType === 'picture-album') {
    return `Create 3 different picture album ideas to express feelings for "${authorName}". Each album should have a different style and emotional focus.

    For each album idea, provide:
    - A meaningful title (including "${authorName}")
    - A touching description of the album's theme and purpose
    - 3-4 fictional praise quotes from relevant sources (like relationship experts or gift reviewers)

    Base the content on these stories and information shared about ${authorName}:
    ${JSON.stringify(stories)}

    Return the results as a valid JSON array with exactly 3 objects. Each object must have these exact fields:
    - title (string)
    - author (string, use "A Gift for ${authorName}")
    - description (string)
    - praises (array of objects with quote and source fields)

    Make sure each album idea is unique in its approach and emotional tone.`;
  }
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
    const { authorName, stories, bookType, category } = await req.json();

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
            content: 'You are a creative book idea generator that creates touching and meaningful book concepts. You must respond with valid JSON only.'
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

    try {
      const parsedContent = JSON.parse(content);
      // Always return an array of ideas in the same format for all categories
      return new Response(
        JSON.stringify({ ideas: parsedContent }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
