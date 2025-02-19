import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const generatePrompt = (authorName: string, stories: Array<{question: string, answer: string}>, bookType: string, category: string) => {
  const storiesText = stories.map(story => `${story.question}\nAnswer: ${story.answer}`).join('\n\n');
  
  let promptTemplate = '';
  
  switch(bookType) {
    case 'funny-biography':
      promptTemplate = `Create 3 funny book ideas for a biography about ${authorName}, and for each idea, generate 4 praise quotes from fictional but contextually relevant organizations or publications. Base the content on this information:\n\n${storiesText}`;
      break;
    case 'wild-fantasy':
      promptTemplate = `Create 3 wild fantasy book ideas for ${authorName}, and for each idea, generate 4 praise quotes from fictional but contextually relevant organizations or publications. Base the content on this information:\n\n${storiesText}`;
      break;
    case 'prank-book':
      promptTemplate = `Create 3 prank book ideas for ${authorName}, and for each idea, generate 4 praise quotes from fictional but contextually relevant organizations or publications. Base the content on this information:\n\n${storiesText}`;
      break;
    case 'love-story':
      promptTemplate = `Create 3 love story ideas for ${authorName}, and for each idea, generate 4 praise quotes from fictional but contextually relevant organizations or publications. Base the content on this information:\n\n${storiesText}`;
      break;
    case 'love-poems':
      promptTemplate = `Create 3 love poem ideas for ${authorName}, and for each idea, generate 4 praise quotes from fictional but contextually relevant organizations or publications. Base the content on this information:\n\n${storiesText}`;
      break;
    case 'picture-album':
      promptTemplate = `Create 3 picture album ideas for ${authorName}, and for each idea, generate 4 praise quotes from fictional but contextually relevant organizations or publications. Base the content on this information:\n\n${storiesText}`;
      break;
    case 'adventure':
      promptTemplate = `Create 3 adventure book ideas for kids with ${authorName}, and for each idea, generate 4 praise quotes from fictional but contextually relevant organizations or publications. Base the content on this information:\n\n${storiesText}`;
      break;
    case 'story-book':
      promptTemplate = `Create 3 story book ideas for kids with ${authorName}, and for each idea, generate 4 praise quotes from fictional but contextually relevant organizations or publications. Base the content on this information:\n\n${storiesText}`;
      break;
    case 'learning':
      promptTemplate = `Create 3 learning journey ideas for kids with ${authorName}, and for each idea, generate 4 praise quotes from fictional but contextually relevant organizations or publications. Base the content on this information:\n\n${storiesText}`;
      break;
    default:
      throw new Error('Invalid book type');
  }

  promptTemplate += `\n\nReturn the response as a valid JSON array with exactly 3 objects. Each object must have these fields:
{
  "title": "A creative title including their name",
  "author": "by ${authorName}",
  "description": "An engaging description",
  "praises": [
    {
      "quote": "An enthusiastic praise quote",
      "source": "A fictional but contextually relevant organization/publication name"
    },
    // ... 4 praise quotes total per idea
  ]
}`;

  return promptTemplate;
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

    const prompt = generatePrompt(authorName, stories, bookType, category);

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
            content: 'You are a creative book idea generator that creates engaging titles, descriptions, and praise quotes.'
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    const data = await response.json();
    const ideas = JSON.parse(data.choices[0].message.content);

    return new Response(
      JSON.stringify({ ideas }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
