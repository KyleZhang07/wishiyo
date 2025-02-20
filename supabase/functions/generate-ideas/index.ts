import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    if (category === 'friends') {
      return new Response(
        JSON.stringify({ ideas: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For love and kids categories
    const bookTitle = category === 'love' 
      ? `15 Special Moments with ${authorName}` 
      : `${authorName}'s Amazing Adventures`;

    const generatedStories = generateStories(authorName, category);

    const idea = {
      title: bookTitle,
      author: category === 'love' ? "With All My Love" : "Your Special Friend",
      stories: generatedStories
    };

    return new Response(
      JSON.stringify({ idea }),
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

function generateStories(authorName: string, category: 'love' | 'kids'): Array<{
  title: string;
  location: string;
  imageDescription: string;
  contentDescription: string;
}> {
  if (category === 'love') {
    return [
      {
        title: "Our First Coffee Date",
        location: "The Cozy Corner Café",
        imageDescription: "A warm, sunlit café interior with two coffee cups on a wooden table, steam rising gently",
        contentDescription: "The story of our first meeting, how your smile lit up the whole café"
      },
      {
        title: "Beach Sunset Walk",
        location: "Crystal Bay Beach",
        imageDescription: "A couple walking hand in hand along the shore with a stunning orange and purple sunset",
        contentDescription: "That perfect evening when we walked barefoot in the sand"
      },
      // ... 13 more stories with similar structure
    ];
  } else {
    return [
      {
        title: "The Magic Tree House",
        location: "Grandma's Backyard",
        imageDescription: "A whimsical treehouse with twinkling lights and colorful decorations",
        contentDescription: "Adventures in our special hideaway where imagination comes alive"
      },
      {
        title: "The Secret Garden",
        location: "Community Park",
        imageDescription: "A hidden garden path with butterflies and blooming flowers",
        contentDescription: "Discovering nature's wonders together in our favorite spot"
      },
      // ... 13 more stories with similar structure
    ];
  }
}
