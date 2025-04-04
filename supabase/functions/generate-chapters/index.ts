
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

    const prompt = `Create a table of contents for a professional biography book about ${authorName}. The book is titled "${bookTitle}" and follows this theme: "${selectedIdea?.description || 'A professional biography with business lessons'}".

Background information about ${authorName}:
${answers?.map((qa: any) => `- ${qa.question}: ${qa.answer}`).join('\n') || 'No specific details provided'}

Generate exactly 12 chapters. Each chapter should focus on a specific business lesson, success principle, or methodology that readers can learn from ${authorName}'s experiences.

Each chapter must follow this exact format:
{
  "title": "Metaphorical and Inspiring Chapter Title: Practical Subtitle",
  "description": "Brief description explaining what business lessons or insights readers will gain from this chapter (20-30 words).",
  "startPage": page number (start from page 1, each chapter is ~12-15 pages)
}

The chapter titles should follow this pattern: "[Metaphor/Analogy]: [Business Lesson]" - for example:
- "Launching the Lift: Finding Your Starting Point"
- "Navigating the Slopes: Mastering Market Research"
- "Building Your Team: The Success Philosophy"
- "Conquering Fears: Risk Management Like a Pro"

The descriptions should emphasize what readers will learn, using direct address ("you"), focusing on practical business applications.

Example descriptions:
- "Discover how you can identify untapped market opportunities by applying the same principles that helped transform an ordinary idea into extraordinary success."
- "Learn the proven framework for building high-performing teams that will accelerate your business growth while maintaining a strong company culture."
- "Master the art of confident decision-making during uncertain times using the same strategies that guided successful navigation through industry disruption."

Return ONLY a JSON array containing these 12 chapter objects. No other text or explanation.`;

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
            content: `You are a creative AI assistant that generates a table of contents for a professional biography book. 
                      You must generate exactly 12 chapters, each with a metaphorical title that relates to a business lesson, a brief description (20-30 words), and starting page number.
                      
                      Each chapter title should follow the pattern "[Metaphor/Analogy]: [Business Lesson]"
                      
                      The book should be written in the style of addressing the reader directly with "you" perspective.
                      
                      Each chapter should have a starting page number, with the first chapter starting at page 1 and subsequent chapters starting based on approximately 12-15 pages per chapter.
                      Return only valid JSON.`
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

      if (!Array.isArray(chapters) || chapters.length !== 12) {
        throw new Error("Invalid chapter array structure");
      }

      // Validate and format each chapter
      const formattedChapters = chapters.map((chapter, index) => ({
        title: String(chapter.title || `Chapter ${index + 1}`),
        description: String(chapter.description || "An insightful chapter with practical business lessons"),
        startPage: Number(chapter.startPage || index * 15 + 1)
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
