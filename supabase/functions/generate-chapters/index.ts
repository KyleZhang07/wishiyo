
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

    // Construct a prompt that explicitly requests JSON format
    const systemPrompt = `Generate exactly 10 funny chapters for a humorous biography book. Return ONLY a JSON array where each object has these exact fields:
    - "title": string (the chapter title)
    - "description": string (1-2 sentence funny description)
    - "startPage": number (starting from page 1, each chapter is about 20 pages)

Use these details to personalize the content:
- Author: ${authorName}
- Book Title: ${bookTitle}
- Theme: ${selectedIdea?.description || 'A funny biography'}
${answers?.map((qa: any) => `- ${qa.question}: ${qa.answer}`).join('\n') || ''}

The response must be a valid JSON array that can be parsed. Do not include any other text or explanations.`;

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
            content: "You are an AI that generates chapter outlines in JSON format. Always return valid JSON arrays."
          },
          {
            role: "user",
            content: systemPrompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    console.log("Raw OpenAI response:", generatedText); // Add logging for debugging

    // Try to parse the JSON response
    let chapters;
    try {
      // Clean the response by removing any markdown formatting if present
      const cleanedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
      chapters = JSON.parse(cleanedText);
      
      // Validate the structure of each chapter
      if (!Array.isArray(chapters) || chapters.length !== 10) {
        throw new Error("Invalid chapter array structure");
      }

      chapters = chapters.map((chapter, index) => ({
        title: chapter.title || `Chapter ${index + 1}`,
        description: chapter.description || "An exciting chapter in this story",
        startPage: chapter.startPage || (index * 20 + 1)
      }));

    } catch (e) {
      console.error("Error parsing OpenAI response:", e);
      console.log("Attempted to parse:", generatedText);
      
      // Create fallback chapters with incrementing page numbers
      chapters = Array(10).fill(null).map((_, i) => ({
        title: `Chapter ${i + 1}: A New Adventure`,
        description: "This chapter is being regenerated. Please refresh to try again.",
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
      JSON.stringify({ 
        error: error.message,
        chapters: Array(10).fill(null).map((_, i) => ({
          title: `Chapter ${i + 1}`,
          description: "An error occurred while generating this chapter. Please try again.",
          startPage: i * 20 + 1
        }))
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
