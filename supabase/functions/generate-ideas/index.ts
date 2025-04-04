
import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { name } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const prompt = `Generate 3 unique professional biography book concepts about ${name}. Each book should focus on their achievements, success principles, and business lessons in a motivational and educational way.

For each concept, include:
1. A catchy main title (4-5 words maximum)
2. A compelling subtitle that emphasizes practical lessons or insights (15-20 words)
3. A brief description (30-40 words) explaining how the book will help readers learn from ${name}'s experiences, methodologies and success principles

Each book should be structured like a professionally written business biography where the author addresses the reader directly using "you" perspective, teaching valuable lessons through real-life examples and analogies.

The tone should be:
- Educational and insightful
- Professional with touches of wit
- Focused on practical lessons that readers can apply
- Positioned as a business/self-improvement bestseller

Example format:
{
  "id": "1",
  "title": "STARTUPS & SKI LIFTS",
  "subtitle": "LESSONS FROM TECH AND THE SLOPES ON HOW TO ELEVATE YOUR BUSINESS",
  "description": "A compelling exploration of how business principles can be understood through ski analogies, helping entrepreneurs master key skills from market research to investor relationships."
}

Return ONLY a JSON array containing these 3 book concepts. No other text.`;

    console.log("Sending prompt to OpenAI:", prompt);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a creative AI assistant that generates professional biography book concepts. You must follow all requirements exactly and return only valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    let ideas = data.choices[0].message.content;
    
    try {
      // Remove any markdown formatting if present
      ideas = ideas.replace(/```json\n?|\n?```/g, '').trim();
      console.log("Cleaned JSON:", ideas);
      
      // Parse and validate the ideas
      const parsedIdeas = JSON.parse(ideas);
      
      if (!Array.isArray(parsedIdeas) || parsedIdeas.length !== 3) {
        throw new Error("Invalid ideas format");
      }
      
      return new Response(
        JSON.stringify({ ideas: parsedIdeas }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("Error parsing OpenAI response:", e);
      throw new Error("Failed to parse ideas data");
    }

  } catch (error) {
    console.error("Error in generate-ideas function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
