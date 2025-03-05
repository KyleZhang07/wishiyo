
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImagePrompt {
  question: string;
  prompt: string;
}

interface ImageText {
  text: string;
  tone: string;
}

interface QuestionAnswer {
  question: string;
  answer: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompts, tone, personName, personAge, questionsAndAnswers = [] } = await req.json();
    
    console.log(`Generating image texts for ${prompts.length} prompts with tone: ${tone}`);
    
    if (!Array.isArray(prompts) || prompts.length === 0) {
      throw new Error('Prompts must be a non-empty array');
    }
    
    if (!tone) {
      throw new Error('Tone is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const texts: ImageText[] = [];
    
    // Process questions and answers for personalization
    let personalInfo = '';
    if (questionsAndAnswers && questionsAndAnswers.length > 0) {
      personalInfo = questionsAndAnswers.map((qa: QuestionAnswer) => 
        `${qa.question}: ${qa.answer}`
      ).join('\n');
    }

    // Create tone-specific system prompts
    const getToneSpecificPrompt = (tone: string) => {
      switch (tone) {
        case 'Heartfelt':
          return `You are a talented caption writer who specializes in warm, emotional, and deeply sincere content.
                 Your captions should evoke nostalgic feelings, express deep appreciation, and touch the heart.
                 Write in a warm, intimate tone that reflects genuine emotional connection.
                 Include specific personal details to make the text feel authentic and tailored.
                 The text should feel like a heartfelt letter to someone deeply loved and cherished.
                 Start with the person's name and create text that's 2-3 sentences long. 
                 End with a sentiment that captures warm appreciation and nostalgic affection.
                 Example tone: Warm, sincere, emotionally resonant, appreciative.
                 
                 Example of Heartfelt text:
                 "Cassie, whenever the gentle warmth of spring returns, I'm reminded of you—of the way you eagerly lace up your boots and head into the wilderness. Your joy in hiking those trails fills my heart with warmth that I treasure beyond words."`;
          
        case 'Playful':
          return `You are a talented caption writer who specializes in light-hearted, fun, and slightly mischievous content.
                 Your captions should be humorous, cheerful, and playfully teasing.
                 Write in a casual, conversational tone with playful metaphors or gentle jokes.
                 Include fun hypothetical scenarios or light teasing related to the person's interests or habits.
                 The text should feel like a note from a close friend who knows how to make them laugh.
                 Start with "Hey [Name]!" and create text that's 2-3 sentences long.
                 End with an encouraging or adventurous sentiment that's upbeat and positive.
                 Example tone: Lighthearted, humorous, whimsical, friendly.
                 
                 Example of Playful text:
                 "Hey Cassie! Did you notice these trees whispering behind your back? I'm pretty sure they're gossiping about that time you dreamed you'd ski right down the Eiffel Tower when you finally make it to Paris!"`;
          
        case 'Inspirational':
          return `You are a talented caption writer who specializes in uplifting, motivational, and forward-looking content.
                 Your captions should inspire confidence, courage, and a sense of possibility.
                 Write in an encouraging tone that emphasizes growth, dreams, and future potential.
                 Include metaphors about journeys, paths, or natural cycles (like seasons changing).
                 The text should feel like motivational encouragement from someone who deeply believes in them.
                 Start with the person's name and create text that's 2-3 sentences long.
                 End with a motivational sentiment that inspires them to pursue their dreams.
                 Example tone: Empowering, forward-looking, encouraging, hopeful.
                 
                 Example of Inspirational text:
                 "Cassie, every trail you hike and every slope you ski brings you closer to your dreams—especially that special dream of Paris. Keep walking boldly towards them—I believe in you, always."`;
          
        default:
          return `You are a talented caption writer for an illustrated book. 
                 Create short, engaging captions in a ${tone} tone. 
                 The captions should complement the illustrations.
                 Write ONLY the caption text, normally 2-3 sentences.`;
      }
    };

    // Generate texts in parallel for all prompts
    const textPromises = prompts.map(async (prompt: ImagePrompt) => {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: getToneSpecificPrompt(tone)
            },
            { 
              role: 'user', 
              content: `Write a personalized caption for this image: ${prompt.prompt}
                        
                        This is for a love story featuring ${personName || 'my love'}, who is ${personAge || 'adult'} years old.
                        
                        Personal information about ${personName}:
                        ${personalInfo || `${personName} is someone special and loved.`}
                        
                        The caption should relate to this prompt's theme: ${prompt.question}
                        
                        Create a brief ${tone.toLowerCase()} caption that feels personal and evocative (2-3 sentences max).
                        Keep it short and meaningful. Less is more.
                        DO NOT include explanations or metadata.
                        DO NOT add any symbols or emoji markers at the beginning.`
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API error:', await response.text());
        return {
          text: "A special moment captured in time.",
          tone: tone
        };
      }

      const data = await response.json();
      const generatedText = data.choices[0].message.content.trim();
      
      return {
        text: generatedText,
        tone: tone
      };
    });

    const generatedTexts = await Promise.all(textPromises);
    
    console.log(`Successfully generated ${generatedTexts.length} texts`);

    return new Response(
      JSON.stringify({ texts: generatedTexts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating image texts:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
