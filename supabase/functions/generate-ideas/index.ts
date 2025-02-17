
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
      promptTemplate = `Create 3 funny book ideas for a biography about ${authorName}. Use this information:\n\n${storiesText}`;
      break;
    case 'wild-fantasy':
      promptTemplate = `Create 3 wild fantasy adventure book ideas featuring ${authorName} as the main character. Use these details about their personality and preferences:\n\n${storiesText}\n\nMake the ideas epic and imaginative, incorporating magical elements and fantastic scenarios.`;
      break;
    case 'prank-book':
      promptTemplate = `Create 3 hilarious prank book ideas featuring ${authorName}'s mischievous adventures. Use these details about their pranking history:\n\n${storiesText}\n\nMake the ideas funny and engaging, focusing on clever pranks and their amusing consequences.`;
      break;
    case 'love-story':
      promptTemplate = `Create 3 romantic book ideas about a love story featuring ${authorName}. Use these romantic moments and details:\n\n${storiesText}\n\nMake the ideas touching and heartfelt, focusing on the deep emotional connection.`;
      break;
    case 'love-poems':
      promptTemplate = `Create 3 poetic book ideas featuring love poems dedicated to ${authorName}. Use these emotional details:\n\n${storiesText}\n\nMake the ideas poetic and romantic, focusing on expressing deep feelings through verse.`;
      break;
    case 'picture-album':
      promptTemplate = `Create 3 picture album book ideas celebrating memories with ${authorName}. Use these special moments:\n\n${storiesText}\n\nMake the ideas visually engaging, focusing on capturing precious memories through photos and stories.`;
      break;
    case 'adventure':
      promptTemplate = `Create 3 children's adventure book ideas featuring ${authorName} on exciting journeys. Use these character details:\n\n${storiesText}\n\nMake the ideas fun and educational, suitable for young readers.`;
      break;
    case 'story-book':
      promptTemplate = `Create 3 children's story book ideas about ${authorName}'s magical world. Use these story elements:\n\n${storiesText}\n\nMake the ideas enchanting and imaginative, perfect for bedtime reading.`;
      break;
    case 'learning':
      promptTemplate = `Create 3 educational book ideas featuring ${authorName} learning new things. Use these educational preferences:\n\n${storiesText}\n\nMake the ideas engaging and instructive, focusing on making learning fun.`;
      break;
    default:
      promptTemplate = `Create 3 book ideas featuring ${authorName}. Use this information:\n\n${storiesText}`;
  }

  promptTemplate += `\n\nIMPORTANT: Return your response as a valid JSON array with exactly 3 objects. Each object MUST have these exact fields:
{
  "title": "A creative title including their name",
  "author": "by ${authorName}",
  "description": "An engaging description"
}

DO NOT include any explanation or additional text. ONLY return the JSON array.`;

  return promptTemplate;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { authorName, stories, bookType, category } = await req.json();
    console.log('Received request with author:', authorName, 'bookType:', bookType);
    
    if (!authorName || !stories || !Array.isArray(stories) || !bookType || !category) {
      throw new Error('Invalid input: authorName, stories array, bookType, and category are required');
    }

    const prompt = generatePrompt(authorName, stories, bookType, category);
    console.log('Generated prompt:', prompt);

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
            content: 'You are a creative writer specializing in various book genres. You must ALWAYS respond with valid JSON arrays containing exactly 3 objects with title, author, and description fields. Never include any other text or explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI raw response:', data.choices?.[0]?.message?.content);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI: No content received');
    }

    let ideas;
    try {
      const cleanContent = data.choices[0].message.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      ideas = JSON.parse(cleanContent);
      
      if (!Array.isArray(ideas)) {
        throw new Error('Response is not an array');
      }
      
      if (ideas.length !== 3) {
        throw new Error(`Expected 3 ideas, got ${ideas.length}`);
      }
      
      ideas.forEach((idea, index) => {
        if (!idea.title || !idea.author || !idea.description) {
          throw new Error(`Idea ${index + 1} is missing required fields`);
        }
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', data.choices[0].message.content);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    return new Response(JSON.stringify({ ideas }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
