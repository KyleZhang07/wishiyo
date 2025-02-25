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
    const { authorName, answers, bookType, category } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (category === 'love') {
      // Get person's name and gender from answers
      const personGender = answers.find((a: any) => a.question.toLowerCase().includes('gender'))?.answer || 'them';
      const personName = answers.find((a: any) => a.question.toLowerCase().includes('name'))?.answer || 'them';
      console.log('Generating prompts for person:', personName, 'gender:', personGender);
      
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
              content: `You are a creative assistant that generates imaginative image prompts for a love story photo book. 
                Create 13 unique and creative scenes focusing solely on one person - the recipient.
                Each prompt should imagine the person in different scenarios that highlight their individual qualities.
                Consider the person's gender (${personGender}) when creating prompts.
                Make the prompts suitable for high-quality photo-realistic AI image generation.
                Focus on solo portraits and scenes that showcase the person's character.`
            },
            {
              role: 'user',
              content: `Generate 13 creative image prompts based on these answers:\n\n${JSON.stringify(answers, null, 2)}\n\n
                Create: 
                1. One cover image prompt that captures ${personName}'s essence (${personGender}) in a magical setting
                2. Twelve story image prompts showing ${personName} in various imaginative solo scenarios
                Each prompt should be detailed and photo-realistic.
                Format the response as a JSON array of 13 objects, each with 'question' (short description) and 'prompt' (detailed AI image generation prompt) fields.
                Make the prompts creative and magical, focusing on ${personName} as an individual.
                Ensure the prompts are appropriate for the person's gender (${personGender}).
                Do not include other people in the scenes.
                Example prompt structure:
                {
                  "question": "${personName} as a dreamer",
                  "prompt": "Ultra-realistic portrait of ${personName}, ${personGender === 'male' ? 'handsome' : 'beautiful'} person in a magical garden at twilight, surrounded by floating lights and butterflies, soft ethereal lighting, dreamy atmosphere, solo portrait, high detail"
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
              content: `You are a creative assistant that generates emotional and meaningful book ideas. 
                The book will be a celebration of one person, focusing on their individual qualities and characteristics.
                Consider the recipient's gender (${personGender}) when generating ideas.
                Create ideas that highlight the person's unique traits and experiences.
                You must respond with ONLY a JSON array containing exactly 3 book ideas.`
            },
            {
              role: 'user',
              content: `Generate 3 different emotional book ideas celebrating ${personName} based on these answers:\n\n${JSON.stringify(answers, null, 2)}\n\n
                The book is a tribute written by ${authorName} for ${personName} (${personGender}).\n\n
                Return ONLY a JSON array of 3 objects, each with 'title', 'author', and 'description' fields.
                Focus on ${personName}'s individual qualities and experiences.
                Ensure the ideas are appropriate and tailored for a ${personGender} recipient.
                The book should be a celebration of ${personName} as an individual.
                Example:
                [
                  {
                    "title": "The Magic of ${personName}",
                    "author": "${authorName}",
                    "description": "A celebration of ${personName}'s unique spirit and extraordinary qualities..."
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
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a creative assistant that generates funny and engaging book ideas for a biography.
                Your task is to STRICTLY follow these requirements:
                1. Create a humorous book title that reflects the person's life
                2. For the 'description' field, create a SHORT, PUNCHY, and FUNNY opening line (8-12 words max)
                3. The description should start with action verbs like "Join...", "Follow...", "Laugh..." or similar
                4. Focus on HUMOR rather than detailed description - be witty, not wordy!
                5. The description should give just enough context to be intriguing and amusing
                6. Every word in the description must earn its place - no filler words or unnecessary details
                7. The author field MUST always be exactly the provided authorName - do not modify it
                
                You must respond with ONLY a JSON array containing exactly 3 book ideas.`
            },
            {
              role: 'user',
              content: `Generate 3 different funny book ideas based on these answers:\n\n${JSON.stringify(answers, null, 2)}\n\n
                The biography is about ${authorName}, who is also the author.
                
                Respond with ONLY a JSON array of 3 objects, each with 'title', 'author', and 'description' fields where:
                - The 'author' field MUST be exactly "${authorName}" for all ideas
                - The 'description' field should be a SHORT, FUNNY opening line (8-12 words max) that:
                  * Starts with action verbs like "Join...", "Follow...", "Laugh..." 
                  * Focuses on humor rather than detailed explanation
                  * Examples of good descriptions: "Join Kyle on his ridiculous journey from flatland to avalanche" or "Dive into the whimsical world of Kyle"
                
                Make the descriptions FUNNY, CONCISE, and PUNCHY. Humor is more important than length or completeness.
                DO NOT use ${authorName}'s name in the description.
                DO NOT include any explanatory text or formatting.`
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
