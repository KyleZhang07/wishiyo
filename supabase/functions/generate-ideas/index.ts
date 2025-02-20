import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generatePrompt = (authorName: string, stories: Array<{question: string, answer: string}>, bookType: string, category: string) => {
  const storiesText = stories.map(story => `${story.question}\nAnswer: ${story.answer}`).join('\n\n');
  
  if (category === 'friends') {
    // Keep the original multiple ideas generation for friends category
    switch(bookType) {
      case 'funny-biography':
        return `Create 3 funny book ideas for a biography about ${authorName}, and for each idea, generate 4 praise quotes from fictional but contextually relevant organizations or publications. Base the content on this information:\n\n${storiesText}\n\nEnsure to respond with valid JSON array with exactly 3 objects. Each object must have these exact fields: title (string), author (string), description (string), and praises (array of objects with quote and source fields). No markdown or code block formatting.`;
      case 'wild-fantasy':
        return `Create 3 wild fantasy book ideas for ${authorName}, and for each idea, generate 4 praise quotes from fictional but contextually relevant organizations or publications. Base the content on this information:\n\n${storiesText}\n\nEnsure to respond with valid JSON array with exactly 3 objects. Each object must have these exact fields: title (string), author (string), description (string), and praises (array of objects with quote and source fields). No markdown or code block formatting.`;
      case 'prank-book':
        return `Create 3 prank book ideas for ${authorName}, and for each idea, generate 4 praise quotes from fictional but contextually relevant organizations or publications. Base the content on this information:\n\n${storiesText}\n\nEnsure to respond with valid JSON array with exactly 3 objects. Each object must have these exact fields: title (string), author (string), description (string), and praises (array of objects with quote and source fields). No markdown or code block formatting.`;
      default:
        throw new Error('Invalid book type for friends category');
    }
  } else {
    // Generate single outline with chapters for love and kids categories
    switch(bookType) {
      case 'love-story':
        return `Create a romantic anime-style story outline for a gift book from ${authorName} to their partner. The story should be set in various beautiful cities, perfect for anime-style illustrations. Each chapter should be exactly one page long with one accompanying anime-style illustration featuring the couple in that city's setting.

Generate a book outline with:
- A romantic anime-inspired title
- Author (${authorName})
- A brief description that captures the romantic journey through cities
- 8-10 single-page chapters, where each chapter:
  * Has a poetic title reflecting the city and mood
  * Contains a brief but complete story that fits on one page
  * Describes a scene perfect for an anime illustration of the couple
  * Specifies the city/location for the scene
  * Captures a special moment between the couple

The tone should be romantic and dreamy, similar to romantic slice-of-life anime. Each chapter should work as a standalone romantic moment while contributing to the overall love story.

Ensure to respond with a single JSON object containing these fields: title (string), author (string), description (string), and chapters (array of objects with title and description fields). No markdown formatting.`;
      case 'love-poems':
        return `Create a poetry collection outline based on these romantic memories:\n\n${storiesText}\n\nGenerate a book outline with a title, author (${authorName}), brief description, and 8-10 chapters/sections. Each section should have a poetic title and brief description of the poems it will contain. Ensure to respond with a single JSON object containing these fields: title (string), author (string), description (string), and chapters (array of objects with title and description fields). No markdown formatting.`;
      case 'picture-album':
        return `Create a romantic photo album outline based on these memories:\n\n${storiesText}\n\nGenerate a book outline with a title, author (${authorName}), brief description, and 8-10 chapters/sections. Each section should represent a theme or period with a title and description of the photos and memories it will showcase. Ensure to respond with a single JSON object containing these fields: title (string), author (string), description (string), and chapters (array of objects with title and description fields). No markdown formatting.`;
      case 'adventure':
        return `Create a children's adventure story outline based on these details:\n\n${storiesText}\n\nGenerate a book outline with a title, author (${authorName}), brief description, and 8-10 chapters. Each chapter should have an exciting title and brief description suitable for young readers. Ensure to respond with a single JSON object containing these fields: title (string), author (string), description (string), and chapters (array of objects with title and description fields). No markdown formatting.`;
      case 'story-book':
        return `Create a children's story book outline based on these details:\n\n${storiesText}\n\nGenerate a book outline with a title, author (${authorName}), brief description, and 6-8 chapters. Each chapter should have a child-friendly title and brief description that will engage young readers. Ensure to respond with a single JSON object containing these fields: title (string), author (string), description (string), and chapters (array of objects with title and description fields). No markdown formatting.`;
      case 'learning':
        return `Create an educational journey book outline based on these details:\n\n${storiesText}\n\nGenerate a book outline with a title, author (${authorName}), brief description, and 6-8 chapters. Each chapter should have an educational yet engaging title and brief description that makes learning fun. Ensure to respond with a single JSON object containing these fields: title (string), author (string), description (string), and chapters (array of objects with title and description fields). No markdown formatting.`;
      default:
        throw new Error('Invalid book type');
    }
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { authorName, stories, bookType, category } = await req.json();

    if (!authorName || !stories || !bookType || !category) {
      throw new Error('Missing required parameters');
    }

    console.log('Generating ideas for:', { authorName, bookType, category });

    const prompt = generatePrompt(authorName, stories, bookType, category);

    console.log('Sending prompt to OpenAI');

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
            content: category === 'friends' 
              ? 'You are a creative book idea generator that creates engaging titles, descriptions, and praise quotes. You must respond with valid JSON only, no markdown or code blocks.'
              : 'You are a creative book outline generator that creates engaging chapter-based outlines. You must respond with valid JSON only, no markdown or code blocks.'
          },
          { role: 'user', content: prompt }
        ],
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

    let parsedContent;
    try {
      parsedContent = JSON.parse(openAIResponse.choices[0].message.content.trim());
    } catch (error) {
      console.error('JSON parse error:', error);
      console.error('Content that failed to parse:', openAIResponse.choices[0].message.content);
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    // For friends category, expect array of 3 ideas
    // For love and kids categories, expect single object with chapters
    if (category === 'friends') {
      if (!Array.isArray(parsedContent) || parsedContent.length !== 3) {
        throw new Error('Invalid ideas format: expected array of 3 items');
      }
      return new Response(
        JSON.stringify({ ideas: parsedContent }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      if (!parsedContent.chapters || !Array.isArray(parsedContent.chapters)) {
        throw new Error('Invalid idea format: expected object with chapters array');
      }
      return new Response(
        JSON.stringify({ idea: parsedContent }),
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
