import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { authorName, answers, bookType, category, personName, personGender } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (category === 'love') {
      // Use the personName and personGender from the request directly
      // Fallback to extraction from answers if not provided (for backward compatibility)
      const recipientName = personName || answers.find((a: any) => a.question.toLowerCase().includes('name'))?.answer || 'them';
      const recipientGender = personGender || answers.find((a: any) => a.question.toLowerCase().includes('gender'))?.answer || 'them';
      
      console.log('Generating prompts for person:', recipientName, 'gender:', recipientGender);
      
      // Generate image prompts first
      const promptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: `You are a creative assistant that generates imaginative image prompts for a fantasy autobiography book. 
                Create 13 unique and creative scenes focusing solely on one person - the recipient.
                Each prompt should imagine the person in different fantasy scenarios that represent their ideal dream life.
                Consider the person's gender (${recipientGender}) when creating prompts.
                Make the prompts suitable for high-quality photo-realistic AI image generation.
                Focus on solo portraits and scenes that showcase the person living their fantasy dream life.
                Include a variety of settings: adventure scenarios, career achievements, lifestyle dreams, and aspirational moments.`
            },
            {
              role: 'user',
              content: `Generate 13 creative image prompts based on these answers:\n\n${JSON.stringify(answers, null, 2)}\n\n
                Create: 
                1. One cover image prompt that captures ${recipientName}'s essence (${recipientGender}) in an aspirational setting
                2. Twelve fantasy autobiography image prompts showing ${recipientName} in various dream life scenarios
                Each prompt should be detailed and photo-realistic.
                Format the response as a JSON array of 13 objects, each with 'question' (short description) and 'prompt' (detailed AI image generation prompt) fields.
                Make the prompts reflect fantasy scenarios like:
                - ${recipientName} achieving career dreams
                - ${recipientName} in adventure settings (exploring exotic locations, etc.)
                - ${recipientName} living luxury lifestyle moments
                - ${recipientName} accomplishing personal goals
                Ensure the prompts are appropriate for the person's gender (${recipientGender}).
                Do not include other people in the scenes - focus solely on ${recipientName}.
                Example prompt structure:
                {
                  "question": "${recipientName} living their dream",
                  "prompt": "Ultra-realistic portrait of ${recipientName}, ${recipientGender === 'male' ? 'handsome' : 'beautiful'} person standing on a private yacht in crystal blue waters, luxurious setting, golden hour lighting, successful lifestyle, solo portrait, high detail"
                }`
            }
          ],
        }),
      });

      const promptData = await promptResponse.json();
      console.log('Prompt generation response:', promptData);
      
      let imagePrompts = [];
      try {
        if (promptData.choices && promptData.choices[0] && promptData.choices[0].message) {
          const content = promptData.choices[0].message.content;
          console.log('Raw content:', content);
          imagePrompts = JSON.parse(content);
        } else {
          throw new Error('Invalid response format from OpenAI');
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
        const contentStr = promptData.choices[0].message.content;
        const jsonMatch = contentStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          imagePrompts = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse image prompts: ' + parseError.message);
        }
      }

      // Then generate book ideas
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
              content: `You are a creative assistant that generates imaginative and aspirational fantasy autobiography book ideas. 
                The book will be a showcase of ONE PERSON ONLY - the recipient - living their dream life.
                Your ideas must focus EXCLUSIVELY on the recipient's fantasy journey, dream achievements, and ideal experiences.
                Consider the recipient's gender (${recipientGender}) when generating ideas.
                Create compelling, specific, and highly personal book concepts that showcase the recipient in their ideal life scenarios.
                Each idea should read like an engaging fantasy autobiography premise that draws readers in.
                IGNORE any information about other people mentioned in the answers - focus solely on ${recipientName}.
                You must respond with ONLY a JSON array containing exactly 3 book ideas.`
            },
            {
              role: 'user',
              content: `Generate 3 different fantasy autobiography book ideas for ${recipientName} based on these answers:\n\n${JSON.stringify(answers, null, 2)}\n\n
                The book is a dream life visualization created by ${authorName} for ${recipientName} (${recipientGender}).\n\n
                Return ONLY a JSON array of 3 objects, each with 'title', 'author', and 'description' fields.
                CREATE HIGHLY ENGAGING IDEAS - make each description sound like an enticing fantasy autobiography that people would want to read.
                Focus EXCLUSIVELY on ${recipientName}'s dream life, aspirational achievements, and fantasy experiences.
                Even if other people are mentioned in the answers, your ideas should be only about ${recipientName}.
                Each book should represent different aspects of ${recipientName}'s ideal life:
                - Career and achievement dreams
                - Adventure and exploration fantasies
                - Lifestyle and personal fulfillment aspirations
                Create titles and descriptions that would genuinely intrigue and captivate a reader.
                Make each description specific, personal, and aspirational.
                Example:
                [
                  {
                    "title": "The Extraordinary Life of ${recipientName}",
                    "author": "${authorName}",
                    "description": "An intimate journey through ${recipientName}'s dream life, revealing the extraordinary adventures and remarkable achievements of a life lived to its fullest potential."
                  }
                ]`
            }
          ],
        }),
      });

      const data = await response.json();
      console.log('Book ideas response:', data);
      
      let ideas = [];
      try {
        if (data.choices && data.choices[0] && data.choices[0].message) {
          const content = data.choices[0].message.content;
          console.log('Raw ideas content:', content);
          ideas = JSON.parse(content);
        } else {
          throw new Error('Invalid response format from OpenAI');
        }
      } catch (parseError) {
        console.error('Parse error for ideas:', parseError);
        const contentStr = data.choices[0].message.content;
        const jsonMatch = contentStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          ideas = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Failed to parse book ideas: ' + parseError.message);
        }
      }

      return new Response(
        JSON.stringify({ ideas, imagePrompts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (category === 'friends' && bookType === 'funny-biography') {
      // Define interface for book ideas
      interface BookIdea {
        title: string;
        author: string;
        description: string;
      }

      // First, generate book ideas
      const ideasResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `
                1. In 3-7 words (exactly), create a concise, punchy biography title that reflects the MAIN CHARACTER'S personal life
                2. Make the book about ONE PERSON ONLY - ignore any mentions of other people in the answers
                3. Focus on humor that centers on the main character's personal quirks, life experiences, and unique journey
                4. Make the ideas SPECIFIC and PERSONAL to the main character, not generic
                5. Ensure the ideas are immediately accessible and entertaining to readers
                6. The author field MUST always be exactly the provided authorName - do not modify it
                
                Biography title examples to follow:
                - "The Last Laugh"
                - "Life Against All Odds"
                - "The Accidental Hero"
                - "Falling Upward"
                - "Perfectly Imperfect"
                - "Kyle's Chaos and Glory"
                
                You must respond with ONLY a JSON array containing exactly 3 book ideas.`
            },
            {
              role: 'user',
              content: `Generate 3 different funny book ideas based on these answers:\n\n${JSON.stringify(answers, null, 2)}\n\n
                The biography is about ${authorName}, who is also the author.
                
                Respond with ONLY a JSON array of 3 objects, each with 'title', 'author', and 'description' fields where:
                - The 'title' field must be SHORT, MEMORABLE, and NEVER use parentheses or subtitle formats
                - The 'author' field MUST be exactly "${authorName}" for all ideas
                - The 'description' field should be ENGAGING, FUNNY, and FOCUSED ONLY on ${authorName}:
                  * Use action verbs and vivid language that draw the reader in
                  * Create descriptions that would make people curious and want to read more
                  * Focus EXCLUSIVELY on ${authorName}'s personal journey and experiences
                  * Description should be 1 sentence long, 10-15 words
                
                Make the ideas FUNNY but also MEANINGFUL - they should sound like real biography books people would enjoy reading.
                Each idea should be ABOUT ${authorName} ONLY, even if other people are mentioned in the answers.
                DO NOT include any explanatory text or formatting.
                NEVER use parentheses, brackets, or subtitle formats in titles.`
            }
          ],
        }),
      });

      const ideasData = await ideasResponse.json();
      let ideas: BookIdea[] = [];

      try {
        ideas = JSON.parse(ideasData.choices[0].message.content);
        
        // Force the author field to be exactly authorName for all ideas
        ideas = ideas.map(idea => ({
          ...idea,
          author: authorName,
          // No truncation of descriptions
        }));
        
      } catch (parseError) {
        const contentStr = ideasData.choices[0].message.content;
        const jsonMatch = contentStr.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          ideas = JSON.parse(jsonMatch[0]);
          
          // Force the author field to be exactly authorName for all ideas
          ideas = ideas.map(idea => ({
            ...idea,
            author: authorName,
            // No truncation of descriptions
          }));
        } else {
          throw new Error('Failed to parse book ideas');
        }
      }

      // Return the ideas directly without generating praise quotes
      return new Response(
        JSON.stringify({ ideas }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Unsupported book type or category');

  } catch (error) {
    console.error('Error in generate-ideas function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
