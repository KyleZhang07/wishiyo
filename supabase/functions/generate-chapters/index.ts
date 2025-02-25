
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
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const prompt = `Create a table of contents for a humorous biography book about ${authorName}. The book is titled "${bookTitle}" and follows this theme: "${selectedIdea?.description || 'A funny biography'}".

Background information about ${authorName}:
${answers?.map((qa: any) => `- ${qa.question}: ${qa.answer}`).join('\n') || 'No specific details provided'}

Generate exactly 10 chapters. Each chapter must follow this exact format:
{
  "title": "Funny chapter title here",
  "description": "Brief humorous description of the chapter (1-2 sentences)",
  "startPage": page number (start from page 1, each chapter is ~20-25 pages)
}

Return ONLY a JSON array containing these 10 chapter objects. No other text or explanation.`;

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
            content: "You are a specialist in creating humorous chapter outlines. Always return valid JSON arrays containing exactly 10 chapters."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    let generatedText = data.choices[0].message.content;
    console.log("Raw OpenAI response:", generatedText);

    // Clean the response and parse JSON
    try {
      // Remove any markdown formatting if present
      generatedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
      const chapters = JSON.parse(generatedText);

      if (!Array.isArray(chapters) || chapters.length !== 10) {
        throw new Error("Invalid chapter array structure");
      }

      // Validate and format each chapter
      const formattedChapters = chapters.map((chapter, index) => ({
        title: String(chapter.title || `Chapter ${index + 1}`),
        description: String(chapter.description || "An exciting chapter in this story"),
        startPage: Number(chapter.startPage || index * 20 + 1)
      }));

      return new Response(
        JSON.stringify({ chapters: formattedChapters }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("Error parsing OpenAI response:", e);
      throw new Error("Failed to parse chapter data");
    }

  } catch (error) {
    console.error("Error in generate-chapters function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
