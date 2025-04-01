import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 定义赞美语接口
interface Praise {
  source: string; // 虚构的机构或名人名称
  text: string;   // 赞美文本
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { authorName, answers, bookType, category, personName, personGender, personAge } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (category === 'love') {
      // Use the personName and personGender from the request directly
      // Fallback to extraction from answers if not provided (for backward compatibility)
      const recipientName = personName || answers.find((a: any) => a.question.toLowerCase().includes('name'))?.answer || 'them';
      const recipientGender = personGender || answers.find((a: any) => a.question.toLowerCase().includes('gender'))?.answer || 'them';
      const recipientAge = personAge || '30'; // Default age if not provided
      
      console.log('Generating prompts for person:', recipientName, 'gender:', recipientGender, 'age:', recipientAge);
      
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
                Consider the person's gender (${recipientGender}) and age (${recipientAge}) when creating prompts.
                Make the prompts suitable for high-quality photo-realistic AI image generation.
                Focus on solo portraits and scenes that showcase the person living their fantasy dream life.
                Include a variety of settings: adventure scenarios, career achievements, lifestyle dreams, and aspirational moments.`
            },
            {
              role: 'user',
              content: `Generate 13 creative image prompts based on these answers:\n\n${JSON.stringify(answers, null, 2)}\n\n
                Create: 
                1. One cover image prompt that captures ${recipientName}'s essence (${recipientGender}, ${recipientAge} years old) in an aspirational setting
                2. Twelve fantasy autobiography image prompts showing ${recipientName} in various dream life scenarios
                Each prompt should be detailed and photo-realistic.
                Format the response as a JSON array of 13 objects, each with 'question' (short description) and 'prompt' (detailed AI image generation prompt) fields.
                Make the prompts reflect fantasy scenarios like:
                - ${recipientName} achieving career dreams
                - ${recipientName} in adventure settings (exploring exotic locations, etc.)
                - ${recipientName} living luxury lifestyle moments
                - ${recipientName} accomplishing personal goals
                Ensure the prompts are appropriate for the person's gender (${recipientGender}) and age (${recipientAge}).
                Do not include other people in the scenes - focus solely on ${recipientName}.
                Example prompt structure:
                {
                  "question": "${recipientName} living their dream",
                  "prompt": "Ultra-realistic portrait of ${recipientName}, ${recipientGender === 'male' ? 'handsome' : 'beautiful'} ${recipientAge}-year-old person standing on a private yacht in crystal blue waters, luxurious setting, golden hour lighting, successful lifestyle, solo portrait, high detail"
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
                Consider the recipient's gender (${recipientGender}) and age (${recipientAge}) when generating ideas.
                Create compelling, specific, and highly personal book concepts that showcase the recipient in their ideal life scenarios.
                Each idea should read like an engaging fantasy autobiography premise that draws readers in.
                IGNORE any information about other people mentioned in the answers - focus solely on ${recipientName}.
                You must respond with ONLY a JSON array containing exactly 3 book ideas.
                
                Additionally, for each book idea, create 4 fictional praise quotes from imaginary publications, magazines, or critics.
                These should sound like authentic book reviews or endorsements that would appear on a book's back cover.`
            },
            {
              role: 'user',
              content: `Generate 3 different fantasy autobiography book ideas for ${recipientName} based on these answers:\n\n${JSON.stringify(answers, null, 2)}\n\n
                The book is a dream life visualization created by ${authorName} for ${recipientName} (${recipientGender}, ${recipientAge} years old).\n\n
                Return a JSON array of 3 objects, each with:
                - 'title': The book title
                - 'author': "${authorName}"
                - 'description': An engaging book description
                - 'praises': An array of 4 fictional praise objects, each with 'source' (imaginary publication or critic name) and 'text' (the praise quote)
                
                CREATE HIGHLY ENGAGING IDEAS - make each description sound like an enticing fantasy autobiography that people would want to read.
                Focus EXCLUSIVELY on ${recipientName}'s dream life, aspirational achievements, and fantasy experiences.
                Even if other people are mentioned in the answers, your ideas should be only about ${recipientName}.
                
                Each book should represent different aspects of ${recipientName}'s ideal life:
                - Career and achievement dreams
                - Adventure and exploration fantasies
                - Lifestyle and personal fulfillment aspirations
                
                The praises should sound authentic and specific to the book idea, mentioning themes from the book.
                
                Example:
                [
                  {
                    "title": "The Extraordinary Life of ${recipientName}",
                    "author": "${authorName}",
                    "description": "An intimate journey through ${recipientName}'s dream life, revealing the extraordinary adventures and remarkable achievements of a life lived to its fullest potential.",
                    "praises": [
                      {
                        "source": "Dream Life Magazine",
                        "text": "A spellbinding journey into the world of possibilities and dreams. ${authorName} masterfully captures the universal desire for achievement and fulfillment, crafting a narrative that resonates with anyone who has ever dared to imagine a different life. This visionary work transports readers through ${recipientName}'s extraordinary potential with vivid detail and emotional depth."
                      },
                      {
                        "source": "The Visionary Review",
                        "text": "An immersive experience that transforms aspirations into vivid reality. Readers will find themselves inspired to pursue their own dreams after witnessing ${recipientName}'s extraordinary journey through challenges and triumphs. Each page reveals new depths of human potential that leave a lasting impression long after the final chapter."
                      },
                      {
                        "source": "Success Chronicles",
                        "text": "${recipientName}'s journey unfolds like a masterclass in determination and self-discovery. This book resonates with anyone who has ever stood at the crossroads of comfort and possibility, offering a compelling glimpse into what happens when we choose the path of growth. It's a beautifully crafted testament to the power of imagination that will have readers reflecting on their own untapped potential."
                      },
                      {
                        "source": "Beneath the Screen Publishing",
                        "text": "An exhilarating narrative that transforms ordinary aspirations into epic quests and meaningful journeys. ${authorName}'s unique storytelling voice illuminates ${recipientName}'s potential with such vividness that readers will find themselves inspired to reimagine their own possibilities. A remarkable blend of fantasy and emotional truth that captivates from the first page to the last."
                      }
                    ]
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
        praises?: Praise[]; // 添加赞美语数组
      }

      // First, generate book ideas with praises
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
              content: `
                1. In 3-7 words (exactly), create a concise, punchy autobiography title that reflects the MAIN CHARACTER'S personal life journey or philosophy
                2. Make the book about ONE PERSON ONLY - the author sharing their own story in first person
                3. Focus on positive, uplifting humor that centers on the author's personal growth, valuable life lessons, and unique methodology
                4. The ideas must be POSITIVE and INSPIRATIONAL while maintaining humor - avoid any negative portrayals
                5. Make the ideas SPECIFIC and PERSONAL to the author, focusing on their experiences, methods, and success principles
                6. Each book should present the author as someone sharing valuable insights through their personal stories
                7. The author field MUST always be exactly the provided authorName - do not modify it
                
                Autobiography title examples to follow:
                - "The Success Mindset"
                - "Life Lessons Learned"
                - "My Unconventional Path"
                - "Rising Through Challenges"
                - "Wisdom Through Experience"
                - "My Winning Formula"
                
                Additionally, for each book idea, create 4 fictional praise quotes from imaginary publications, magazines, or critics.
                These should sound like authentic book reviews or endorsements that would appear on a book's back cover.
                
                You must respond with ONLY a JSON array containing exactly 3 book ideas.`
            },
            {
              role: 'user',
              content: `Generate 3 different positive and inspirational autobiography ideas based on these answers:\n\n${JSON.stringify(answers, null, 2)}\n\n
                The autobiography is written by ${authorName} in first person, sharing their personal experiences, methods, and success principles.
                
                Respond with ONLY a JSON array of 3 objects, each with:
                - 'title': The book title (SHORT, MEMORABLE, NEVER using parentheses or subtitle formats)
                - 'author': "${authorName}" for all ideas
                - 'description': A compelling book description (10-20 words) that sounds like a real book blurb. Make it engaging, specific, and capture the essence of the book.
                - 'praises': An array of 4 fictional praise objects, each with 'source' (imaginary publication or critic name) and 'text' (the praise quote)
                
                Make the ideas POSITIVE, INSPIRATIONAL and MEANINGFUL - they should sound like real autobiography books people would enjoy reading and learn from.
                Each idea should present ${authorName} sharing their unique life experiences, methodologies, and success principles in first person.
                
                The descriptions should highlight how ${authorName} shares valuable insights through personal stories, focusing on:
                - Personal experiences that shaped their perspective
                - Their unique methodology or approach to life/work
                - Success principles and how they apply to different situations
                - Valuable life lessons taught through personal stories
                
                Example descriptions:
                - "My journey from novice to expert, revealing the unconventional methods that transformed my career."
                - "How I discovered the principles of success through unexpected life challenges and turned them into opportunities."
                - "The mindset shifts and practical strategies I developed to achieve balance and fulfillment in life."
                
                For the praises, follow these guidelines:
                1. Each praise should be a substantial paragraph (2-4 sentences) that deeply analyzes some aspect of the book or author's style
                2. Use formal, literary language with sophisticated vocabulary and structure
                3. Include specific insights about the book's themes, the author's writing approach, or the reader experience
                4. Make them sound like genuine literary critiques from respected publications
                5. Source names should be specific publications that match the subject matter (magazines, journals, newspapers, etc.)
                
                Example praises:
                [
                  {
                    "source": "Success Quarterly",
                    "text": "${authorName}'s candid approach to sharing personal triumphs and setbacks creates an immediately relatable narrative. Their ability to distill complex life lessons into actionable wisdom makes this not just an entertaining read, but a valuable resource for anyone seeking personal growth."
                  },
                  {
                    "source": "Mindset Magazine",
                    "text": "With refreshing honesty and insightful reflection, ${authorName} transforms personal anecdotes into universal principles. The book's blend of humor and wisdom creates a reading experience that both entertains and inspires meaningful change in the reader's own approach to challenges."
                  }
                ]`
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
