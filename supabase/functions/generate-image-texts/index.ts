import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ImagePrompt {
  question: string;
  prompt: string;
}

interface ImageText {
  text: string;
  tone: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }

    const configuration = new Configuration({
      apiKey: OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const { prompts, tone, personName } = await req.json();

    if (!prompts || !Array.isArray(prompts) || !tone) {
      throw new Error("Missing required parameters: prompts, tone");
    }

    console.log(`Generating ${prompts.length} image texts with tone: ${tone}`);
    
    const toneInstructions = {
      "Humorous": "witty and amusing text with light-hearted jokes",
      "Poetic": "lyrical and expressive text with poetic language and imagery",
      "Dramatic": "emotionally intense text with vivid and powerful descriptions",
      "Heartfelt": "warm, sincere text expressing genuine emotions and connections",
      "Encouraging": "uplifting, positive text that inspires and motivates"
    };

    const texts: ImageText[] = [];

    // Process prompts in batches to avoid rate limiting
    const batchSize = 4;
    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize);
      
      const promptTexts = batch.map((prompt: ImagePrompt, index: number) => {
        return `Image ${i + index + 1}: ${prompt.question}`;
      });

      const response = await openai.createChatCompletion({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert writer helping to create text accompaniments for images in a love story book. 
            Write short, engaging text in a ${tone.toLowerCase()} tone (${toneInstructions[tone as keyof typeof toneInstructions]}) 
            for each image description. Each text should be 1-2 sentences only and should describe the scene or moment in a way that 
            makes it feel special and personal for ${personName}. Don't mention that this is for a book or story - 
            write as if directly describing a meaningful moment.`
          },
          {
            role: "user",
            content: `Write a brief text accompaniment for each of these image descriptions using a ${tone.toLowerCase()} tone. 
            Keep each response to 1-2 sentences maximum:\n\n${promptTexts.join("\n\n")}`
          }
        ]
      });

      if (!response.data.choices[0].message?.content) {
        throw new Error("No response from OpenAI");
      }

      const content = response.data.choices[0].message.content;
      const textResponses = content.split(/Image \d+:/).slice(1);

      for (let j = 0; j < batch.length; j++) {
        if (j < textResponses.length) {
          texts.push({
            text: textResponses[j].trim(),
            tone: tone
          });
        } else {
          // Fallback if parsing fails
          texts.push({
            text: `A special moment to remember.`,
            tone: tone
          });
        }
      }
    }

    console.log(`Generated ${texts.length} text accompaniments`);

    return new Response(
      JSON.stringify({ texts }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in generate-image-texts function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}); 