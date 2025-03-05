// Vercel serverless function for generating image texts
import axios from 'axios';

// CORS headers for API responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

/**
 * Interface definitions (commented as docs in JS)
 * 
 * ImagePrompt {
 *   question: string;
 *   prompt: string;
 * }
 * 
 * ImageText {
 *   text: string;
 *   tone: string;
 * }
 * 
 * QuestionAnswer {
 *   question: string;
 *   answer: string;
 * }
 */

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).set(corsHeaders).end();
    return;
  }

  // Only allow POST for this endpoint
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompts, tone, personName, personAge, questionsAndAnswers = [] } = req.body;
    
    console.log(`Generating image texts for ${prompts.length} prompts with tone: ${tone}`);
    
    if (!Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({ error: 'Prompts must be a non-empty array' });
    }
    
    if (!tone) {
      return res.status(400).json({ error: 'Tone is required' });
    }

    const openAIApiKey = process.env.OPENAI_API_KEY;
    if (!openAIApiKey) {
      return res.status(500).json({ error: 'OpenAI API key is not configured' });
    }

    // Process questions and answers for personalization
    let personalInfo = '';
    if (questionsAndAnswers && questionsAndAnswers.length > 0) {
      personalInfo = questionsAndAnswers.map((qa) => 
        `${qa.question}: ${qa.answer}`
      ).join('\n');
    }

    // Create tone-specific system prompts
    const getToneSpecificPrompt = (tone) => {
      switch (tone) {
        case 'Heartfelt':
          return `You are a talented caption writer who specializes in warm, emotional, and deeply sincere content.
                 Your captions should evoke nostalgic feelings, express deep appreciation, and touch the heart.
                 Write in a warm, intimate tone that reflects genuine emotional connection.
                 Include specific personal details to make the text feel authentic and tailored.
                 The text should feel like a heartfelt letter to someone deeply loved and cherished.
                 Start with the person's name and create text that's 3-5 sentences long. 
                 End with a sentiment that captures warm appreciation and nostalgic affection.
                 Example tone: Warm, sincere, emotionally resonant, appreciative.
                 
                 Example of Heartfelt text:
                 "Cassie, whenever the gentle warmth of spring returns, I'm reminded of you—of the way you eagerly lace up your boots and head into the wilderness, excited for every adventure. Your joy in hiking those trails, your quiet wonder beneath the open sky; these are moments that have woven themselves deeply into my heart. I created this page especially for you, hoping it always reminds you of how truly special and cherished you are. Just like spring itself, your presence fills my world with beauty and warmth that I treasure beyond words."`;
          
        case 'Playful':
          return `You are a talented caption writer who specializes in light-hearted, fun, and slightly mischievous content.
                 Your captions should be humorous, cheerful, and playfully teasing.
                 Write in a casual, conversational tone with playful metaphors or gentle jokes.
                 Include fun hypothetical scenarios or light teasing related to the person's interests or habits.
                 The text should feel like a note from a close friend who knows how to make them laugh.
                 Start with "Hey [Name]!" and create text that's 3-5 sentences long.
                 End with an encouraging or adventurous sentiment that's upbeat and positive.
                 Example tone: Lighthearted, humorous, whimsical, friendly.
                 
                 Example of Playful text:
                 "Hey Cassie! Did you notice these trees whispering behind your back? I'm pretty sure they're gossiping about that time you dreamed you'd ski right down the Eiffel Tower when you finally make it to Paris! Remember, adventures await around every corner—whether it's snowy slopes or secret forest trails. Keep being brave, curious, and just a tiny bit mischievous—just like you've always been, my favorite little explorer!"`;
          
        case 'Inspirational':
          return `You are a talented caption writer who specializes in uplifting, motivational, and forward-looking content.
                 Your captions should inspire confidence, courage, and a sense of possibility.
                 Write in an encouraging tone that emphasizes growth, dreams, and future potential.
                 Include metaphors about journeys, paths, or natural cycles (like seasons changing).
                 The text should feel like motivational encouragement from someone who deeply believes in them.
                 Start with the person's name and create text that's 3-5 sentences long.
                 End with a motivational sentiment that inspires them to pursue their dreams.
                 Example tone: Empowering, forward-looking, encouraging, hopeful.
                 
                 Example of Inspirational text:
                 "Cassie, every trail you hike and every slope you ski brings you closer to your dreams—especially that special dream of strolling down the streets of Paris one day. This page is here to remind you that every step forward counts, and every adventure shapes who you are becoming. Just like spring always follows winter, your dreams are waiting patiently for you to arrive. Keep walking boldly towards them—I believe in you, always."`;
          
        default:
          return `You are a talented caption writer for an illustrated book. 
                 Create short, engaging captions in a ${tone} tone. 
                 The captions should complement the illustrations.
                 Write ONLY the caption text, normally 3-5 sentences.`;
      }
    };

    // Generate texts in parallel for all prompts
    const textPromises = prompts.map(async (prompt) => {
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
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
                        
                        Create a ${tone.toLowerCase()} caption that feels personal and evocative.
                        DO NOT include explanations or metadata.
                        DO NOT add any symbols or emoji markers at the beginning.`
            }
          ],
          temperature: 0.7,
          max_tokens: 250,
        }, {
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          }
        });

        const generatedText = response.data.choices[0].message.content.trim();
        
        return {
          text: generatedText,
          tone: tone
        };
      } catch (error) {
        console.error('OpenAI API error:', error.response?.data || error.message);
        return {
          text: "A special moment captured in time.",
          tone: tone
        };
      }
    });

    const generatedTexts = await Promise.all(textPromises);
    
    console.log(`Successfully generated ${generatedTexts.length} texts`);

    // Return the generated texts with CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ texts: generatedTexts });
    
  } catch (error) {
    console.error('Error generating image texts:', error);
    
    // Return error with CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: error.message });
  }
} 