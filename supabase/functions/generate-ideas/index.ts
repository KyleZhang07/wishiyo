
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const generateLovePrompt = (authorName: string, stories: any[], bookType: string) => {
  const basePrompt = `You are a professional writer specializing in creating romantic illustrated books. 
  Create a romantic book outline with exactly 20 chapters that alternate between text and illustration pages.
  Each pair should consist of:
  - A text chapter with a poetic narrative
  - An illustration chapter describing the visual interpretation of the previous chapter

  Format requirements:
  1. Start with a creative book title that captures the essence of their love story
  2. Then list all chapters with their descriptions
  3. Format each chapter exactly like this:
     Chapter [number]: [Title]
     "[Description]"

  For text chapters (odd numbers):
  - Write emotional, descriptive narratives about their love story moments
  - Include sensory details, dialogue, and feelings
  - Keep each chapter concise but poetic

  For illustration chapters (even numbers):
  - Start the title with "Illustration:"
  - Describe in detail what the illustration should depict
  - Include details about style, colors, composition, and mood
  - Make sure it perfectly complements the previous text chapter

  Example format:
  Chapter 1: Where We First Met
  "We first crossed paths on a warm afternoon, when a gentle breeze carried our laughter through the air. I still remember the look in your eyes—part curiosity, part excitement—as though we both knew this was the start of something extraordinary."

  Chapter 2: Illustration: The Fateful Encounter
  "A watercolor illustration capturing two figures meeting in a sunlit park. Cherry blossoms drift through the air as their eyes meet for the first time. Soft pastel colors blend together, emphasizing the magical quality of the moment."`;

  switch(bookType) {
    case 'love-story':
      return `${basePrompt}\nCreate a romantic narrative that follows their love story chronologically, highlighting key moments in their relationship.`;
    case 'love-poems':
      return `${basePrompt}\nFocus on poetic moments and emotional expressions, making each text chapter read like a love poem and each illustration capture the poem's essence.`;
    case 'picture-album':
      return `${basePrompt}\nCreate a visual journey through their relationship milestones, with text chapters describing memories and illustration chapters showing how to capture these memories visually.`;
    default:
      return basePrompt;
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
            content: category === 'love' 
              ? 'You are a professional writer specializing in illustrated love stories. Return the book title followed by exactly 20 chapters with their descriptions.'
              : 'You are a creative book idea generator that creates engaging titles, descriptions, and praise quotes. You must respond with valid JSON only.'
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

    if (category === 'love') {
      // Parse the content for love category
      const lines = content.split('\n').filter(line => line.trim());
      const title = lines[0];
      const chapters = [];
      
      for (let i = 1; i < lines.length; i += 2) {
        const titleMatch = lines[i].match(/Chapter \d+: (.+)/);
        const description = lines[i + 1]?.replace(/^"|"$/g, '');
        
        if (titleMatch && description) {
          chapters.push({
            title: titleMatch[1],
            description: description
          });
        }
      }

      const bookIdea = {
        title,
        author: authorName,
        description: "A journey of love told through alternating words and illustrations, each moment captured twice - once in prose, once in art.",
        chapters
      };

      return new Response(
        JSON.stringify({ idea: bookIdea }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // For friends category, parse as JSON array
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
    }

  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
