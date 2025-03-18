
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
    const { personName, authorName, tone, style } = await req.json();

    // 根据不同风格生成不同的提示语
    let systemPrompt = "You are a skilled writer creating a heartfelt blessing for a love story book. ";
    
    // 根据风格添加特定的指引
    if (style === 'Heartfelt') {
      systemPrompt += "Write in a sincere, deeply emotional tone that touches the heart. Use warm, intimate language.";
    } else if (style === 'Playful') {
      systemPrompt += "Write in a light-hearted, fun and playful tone. Include some humor and joyful expressions.";
    } else if (style === 'Inspirational') {
      systemPrompt += "Write in an uplifting, motivational tone that inspires hope and celebrates love's journey.";
    } else {
      systemPrompt += "Write in a warm, romantic tone that celebrates love.";
    }

    const userPrompt = `Create a beautiful blessing message (around 100-150 words) for a love story book dedicated from ${authorName} to ${personName}. The tone should be ${tone || 'heartfelt'}. The blessing should express deep love and appreciation without mentioning specific events. Make it poetic, touching and suitable for a book's introduction page.`;

    console.log("Generating blessing with the following parameters:");
    console.log(`Person Name: ${personName}`);
    console.log(`Author Name: ${authorName}`);
    console.log(`Tone: ${tone}`);
    console.log(`Style: ${style}`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      console.error("Unexpected API response:", data);
      throw new Error("Failed to generate blessing text");
    }
    
    const blessing = data.choices[0].message.content.trim();
    console.log("Generated blessing:", blessing);

    return new Response(JSON.stringify({ blessing }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-blessing function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
