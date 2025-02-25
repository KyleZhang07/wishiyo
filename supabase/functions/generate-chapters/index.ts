
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { authorName, bookTitle, selectedIdea } = await req.json();

    // Generate 10 funny chapters based on the book's context
    const chapters = [
      {
        title: "The Art of Being Accidentally Right",
        description: "A detailed study of those rare moments when your wild guesses actually turned out to be correct, much to everyone's surprise.",
        startPage: 1
      },
      {
        title: "Epic Family Dinner Disasters",
        description: "Chronicles of memorable meals gone wrong and how they became legendary family stories.",
        startPage: 25
      },
      {
        title: "The Secret Life of Family Pets",
        description: "What your pets are really thinking during family arguments (they're probably judging everyone).",
        startPage: 48
      },
      {
        title: "Sibling Rivalry: An Olympic Sport",
        description: "A comprehensive guide to turning everyday competitions into epic family tournaments.",
        startPage: 72
      },
      {
        title: "The Great Remote Control Wars",
        description: "Historical accounts of the battles fought over TV channel supremacy and Netflix queue dominance.",
        startPage: 95
      },
      {
        title: "Questionable Life Advice From Relatives",
        description: "A collection of well-meaning but bizarre wisdom passed down through generations.",
        startPage: 118
      },
      {
        title: "Family Vacation Horror Stories",
        description: "Tales of misadventure, wrong turns, and unexpected detours that somehow became cherished memories.",
        startPage: 142
      },
      {
        title: "The Art of Winning Arguments You Know Nothing About",
        description: "Advanced techniques in confidently defending completely made-up facts.",
        startPage: 165
      },
      {
        title: "Emergency Room Greatest Hits",
        description: "A compilation of the most ridiculous family injuries and the even more ridiculous stories behind them.",
        startPage: 189
      },
      {
        title: "Legacy of Laughter",
        description: "How family chaos, misunderstandings, and general mayhem created an unbreakable bond.",
        startPage: 213
      }
    ];

    return new Response(
      JSON.stringify({ chapters }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
