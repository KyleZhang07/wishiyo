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
    const { authorName, answers, bookType, category } = await req.json();
    const personName = localStorage.getItem('loveStoryPersonName') || 'Your Love';

    if (category === 'love') {
      const ideas = [];
      const imagePrompts = [];
      
      // Process answers to create detailed image prompts
      for (const answer of answers) {
        const imagePrompt = `A beautiful, emotional photograph capturing ${answer.answer}. 
          Professional photography, soft natural lighting, cinematic composition, 
          shallow depth of field, high resolution, detailed textures, emotional moment`;
        
        imagePrompts.push({
          question: answer.question,
          prompt: imagePrompt
        });
      }

      // Generate 3 different book ideas using personName
      ideas.push(
        {
          title: `${personName}, Our Story Together`,
          author: authorName,
          description: "A heartfelt journey through our most precious moments together, celebrating our unique bond and shared memories.",
        },
        {
          title: `To ${personName}, With Love`,
          author: authorName,
          description: "A collection of cherished memories and heartfelt moments that showcase the beauty of our relationship.",
        },
        {
          title: `${personName}, This Is Us`,
          author: authorName,
          description: "An intimate portrait of our journey together, filled with love, laughter, and unforgettable moments.",
        }
      );

      return new Response(
        JSON.stringify({ ideas, imagePrompts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const ideas = [
        {
          title: 'The Funny Biography of a Friend',
          author: authorName,
          description: "A hilarious journey through the life of a friend, filled with funny stories and anecdotes.",
        },
        {
          title: 'The Wild Fantasy Adventure',
          author: authorName,
          description: "Embark on an epic quest through magical realms, encountering mythical creatures and overcoming challenges.",
        },
        {
          title: 'The Prank Book',
          author: authorName,
          description: "A collection of hilarious pranks and practical jokes to play on friends and family.",
        },
        {
          title: 'The Adventure Begins',
          author: authorName,
          description: "Embark on an exciting adventure filled with mystery, challenges, and new discoveries.",
        },
        {
          title: 'The Magical Story Book',
          author: authorName,
          description: "A collection of enchanting tales filled with wonder, magic, and heartwarming lessons.",
        },
        {
          title: 'The Learning Journey',
          author: authorName,
          description: "An educational adventure that makes learning fun and engaging for kids.",
        }
      ];
      return new Response(
        JSON.stringify({ ideas }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
