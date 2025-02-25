
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
    const { authorName, bookTitle, selectedIdea, answers } = await req.json();
    
    // Get OpenAI API key from environment variable
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Construct a prompt based on user inputs
    const systemPrompt = `As a humorous biography writer, generate 10 funny chapters for a book. Each chapter should tell a part of ${authorName}'s story in a light-hearted way.

The book title is: "${bookTitle}"
The main theme/idea: "${selectedIdea?.description || 'A funny biography'}"

Use these details about ${authorName} to create relevant chapters:
${answers?.map((qa: any) => `- ${qa.question}: ${qa.answer}`).join('\n') || 'No specific details provided'}

For each chapter, provide:
1. A humorous title
2. A funny description (1-2 sentences)
3. A starting page number (start from page 1, each chapter should be about 20-25 pages)

Format as a JSON array of chapters.`;

    // Call OpenAI API
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
            content: "You are a humorous biography writer who specializes in creating funny chapter outlines."
          },
          {
            role: "user",
            content: systemPrompt
          }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    // Parse the generated JSON
    let chapters;
    try {
      chapters = JSON.parse(generatedText);
    } catch (e) {
      console.error("Error parsing OpenAI response:", e);
      console.log("Raw response:", generatedText);
      
      // Fallback structure if parsing fails
      chapters = Array(10).fill(null).map((_, i) => ({
        title: `Chapter ${i + 1}`,
        description: "Content generation error. Please try again.",
        startPage: i * 20 + 1
      }));
    }

    return new Response(
      JSON.stringify({ chapters }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-chapters function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
