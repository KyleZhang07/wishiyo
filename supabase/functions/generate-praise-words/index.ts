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
    const { title, authorName, bookType = 'funny-biography' } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!title) {
      throw new Error('Book title is required');
    }

    // Generate praise quotes for the book
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
            content: `You are a creative assistant that generates fictional praise quotes for books.
              Create 3 fictional praise quotes for a book cover from imaginary prestigious institutions, 
              famous authors, or well-known publications. 
              The quotes should be humorous but realistic, and match the tone of the book.
              The praise should sound genuinely enthusiastic and compelling.
              Each quote MUST include the name of a fictional source (institution, person, or publication).`
          },
          {
            role: 'user',
            content: `Generate 3 fictional praise quotes for the back cover of a humorous biography book titled "${title}" by ${authorName}.
              The quotes should be brief (1-2 sentences), witty, and praise the book's humor and entertainment value.
              
              Format the response as a JSON array of objects, each with:
              - "quote": The praise text (15-25 words)
              - "source": A fictional but legitimate-sounding source (famous author, publication, or institution)
              
              Example quote format:
              {
                "quote": "A delightful romp through the absurdities of everyday life. I couldn't put it down!",
                "source": "The Literary Gazette"
              }
              
              Make sources varied and authoritative-sounding. Use fictional but plausible names.
              Ensure the tone matches a humorous biography.`
          }
        ],
      }),
    });

    const data = await response.json();
    console.log('Praise generation response:', data);
    
    let praiseQuotes = [];
    try {
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content;
        console.log('Raw content:', content);
        praiseQuotes = JSON.parse(content);
      } else {
        throw new Error('Invalid response format from OpenAI');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      const contentStr = data.choices[0].message.content;
      const jsonMatch = contentStr.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        praiseQuotes = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse praise quotes: ' + parseError.message);
      }
    }

    return new Response(
      JSON.stringify({ praiseQuotes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-praise-words function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});