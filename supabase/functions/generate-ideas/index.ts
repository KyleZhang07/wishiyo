
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
    // Generate single picture book with location-based stories for love and kids categories
    const basePrompt = `Create a picture book with exactly 15 stories based on these memories and preferences:\n\n${storiesText}\n\n`;
    
    let specificInstructions = '';
    if (category === 'love') {
      switch(bookType) {
        case 'love-story':
          specificInstructions = `Create a romantic picture storybook about the journey with ${authorName}. Each story should be set in a specific, meaningful location and capture a special moment together. Format each story like: "Story X: [A meaningful encounter in Location]" with a subtitle describing the scene, similar to "Story 1: A serendipitous encounter in Paris" with subtitle "${authorName} and their love wandering the streets of Paris".`;
          break;
        case 'love-poems':
          specificInstructions = `Create a romantic picture book collection about moments with ${authorName}. Each piece should be tied to a specific location where a meaningful moment occurred. Format like "Story X: [A poetic moment in Location]" with subtitle describing the scene.`;
          break;
        case 'picture-album':
          specificInstructions = `Create a romantic photo album story collection about memories with ${authorName}. Each story should describe a specific location and moment worth capturing. Format like "Story X: [A captured moment in Location]" with subtitle describing the perfect photo opportunity.`;
          break;
        default:
          throw new Error('Invalid love book type');
      }
    } else {
      switch(bookType) {
        case 'adventure':
          specificInstructions = `Create an adventure picture book about ${authorName}'s exciting journeys. Each story should take place in a different, exciting location. Format like "Story X: [An adventure in Location]" with subtitle describing the exciting scene.`;
          break;
        case 'story-book':
          specificInstructions = `Create a children's picture storybook featuring ${authorName}'s experiences. Each story should happen in a different, child-friendly location. Format like "Story X: [A fun moment in Location]" with subtitle describing the heartwarming scene.`;
          break;
        case 'learning':
          specificInstructions = `Create an educational picture journey about learning with ${authorName}. Each story should be set in a different location perfect for learning. Format like "Story X: [A discovery in Location]" with subtitle describing the learning moment.`;
          break;
        default:
          throw new Error('Invalid kids book type');
      }
    }

    return `${basePrompt}${specificInstructions}\n\nGenerate a book outline with these exact components:
    1. A title that expresses love and connection
    2. Author attribution (${category === 'love' ? '"With All My Love"' : '"Your Special Friend"'})
    3. Exactly 15 stories, each with:
       - A location-based title (e.g., "A magical evening in Central Park")
       - A subtitle describing the scene
       - A brief description of the image that should accompany the story
       - A short description of what happens in the story (one page worth)
    
    Ensure to respond with a single JSON object containing these fields:
    - title (string)
    - author (string)
    - stories (array of 15 objects, each with title, subtitle, imageDescription, and contentDescription fields)
    No markdown formatting.`;
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
              : 'You are a creative picture book generator that creates engaging location-based stories with vivid imagery. You must respond with valid JSON only, no markdown or code blocks.'
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
    // For love and kids categories, expect single object with stories
    if (category === 'friends') {
      if (!Array.isArray(parsedContent) || parsedContent.length !== 3) {
        throw new Error('Invalid ideas format: expected array of 3 items');
      }
      return new Response(
        JSON.stringify({ ideas: parsedContent }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      if (!parsedContent.stories || !Array.isArray(parsedContent.stories)) {
        throw new Error('Invalid idea format: expected object with stories array');
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
