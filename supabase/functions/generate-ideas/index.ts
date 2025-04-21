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
          model: 'gpt-4.1-nano',
          temperature: 1,
          messages: [
            {
              role: 'system',
              content: `You are a creative assistant that generates imaginative image prompts for a fantasy autobiography book.
                Create 13 unique and creative scenes focusing solely on one person - the recipient.
                Each prompt should imagine the person in different fantasy scenarios that represent their ideal dream life.
                Consider the person's gender (${recipientGender}) and age (${recipientAge}) when creating prompts.
                Focus on solo portraits and scenes that showcase the person living their fantasy dream life.
                Include a variety of settings: adventure scenarios, career achievements, lifestyle dreams, and aspirational moments.`
            },
            {
              role: 'user',
              content: `Generate 13 creative image prompts based on these answers:\n\n${JSON.stringify(answers, null, 2)}\n\n
                Create:
                1. One cover image prompt that captures ${recipientName}'s essence (${recipientGender}, ${recipientAge} years old) in an aspirational setting
                2. Twelve fantasy autobiography image prompts showing ${recipientName} in various dream life scenarios
                Format the response as a JSON array of 13 objects, each with 'question' (short description) and 'prompt' (detailed AI image generation prompt) fields.
                Make the prompts reflect fantasy scenarios like:
                - ${recipientName} achieving career dreams
                - ${recipientName} in adventure settings (exploring exotic locations, etc.)
                - ${recipientName} living fantasy lifestyle moments
                - ${recipientName} accomplishing personal goals
                Ensure the prompts are appropriate for the person's gender (${recipientGender}) and age (${recipientAge}).
                Do not include other people in the scenes - focus solely on ${recipientName}.
                Example prompt structure:
                {
                  "question": "${recipientName} living their dream",
                  "prompt": "Image of ${recipientName}, ${recipientGender === 'male' ? 'handsome' : 'beautiful'} ${recipientAge}-year-old person standing on a private yacht in crystal blue waters, luxurious setting, golden hour lighting, successful lifestyle, solo portrait, high detail"
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
          let content = promptData.choices[0].message.content;
          console.log('Raw content:', content);

          // 清理可能存在的 Markdown 代码块标记
          if (content.startsWith('```json\n') && content.endsWith('\n```')) {
            content = content.slice(7, -4);
          } else if (content.startsWith('```') && content.endsWith('```')) {
            content = content.slice(3, -3);
          }

          // 现在尝试解析清理后的内容
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

      // 不再需要为 love 类别创建 ideas 字段，前端已经修改为可以处理没有 ideas 的情况

      return new Response(
        JSON.stringify({ imagePrompts }),
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
          model: 'gpt-4.1-nano',
          temperature: 1.2, // 设置高温度以增加创造性
          messages: [
            {
              role: 'system',
              content: `
                1. Create a concise, punchy title (3-5 words, not exceeding 30 characters) where each individual word MUST NOT exceed 14 characters.
                2. Make the book about ONE PERSON ONLY - sharing their expertise, unique perspectives, or interesting life approaches
                3. The tone should vary across the three ideas: one professional, one satirical (gently poking fun at quirks mentioned in answers), and one unexpected
                4. IMPORTANT: emphasize HUMOR throughout all ideas - include WITTY observations, PLAYFUL exaggerations, and AMUSING perspectives even in the more professional ideas
                5. The ideas should balance PROFESSIONAL WISDOM with ENTERTAINING ELEMENTS while maintaining an engaging tone
                6. Each book should present the subject as someone sharing valuable insights through memorable frameworks that might be conventional, satirical, or unexpected
                7. The author field MUST always be exactly the provided authorName - do not modify it
                8. Descriptions must ALWAYS be a SINGLE SENTENCE - use other connectors or rephrase as needed
                9. Avoid using "I" or "you" perspectives in descriptions - use objective third-person statements instead
                10. For satirical ideas, playfully exaggerate elements from the user's answers but keep it good-natured
                11. AVOID UNCOMMON words and use EASY to understand language, and avoid complex expressions that average readers might not know

                Title examples to follow (ranging from professional to satirical to unexpected):
                - "The Kitchen Creativity"
                - "Startups and Slam Dunks"
                - "Mission: Impossible"
                - "Poop like a pro"
                - "Accidental Leadership Genius"
                - "Skiing, Strategy, and space"
                - "How I Befriended Gravity"

                Subtitle examples to follow (ALWAYS ONE SENTENCE NO COMMAS NO "I" OR "YOU"):
                - "Essential cooking techniques transformed into business strategies for maximum growth"
                - "A guide to balancing basketball dreams while building successful ventures"
                - "Discovering the hidden patterns that connect daily decisions to major life outcomes"
                - "Mastering the science of midday rest for enhanced productivity and creative thinking"
                - "Exploring the relationship between human intuition and computational thinking"
                - "Revolutionary methods for organizing chaos in both wardrobes and life situations"
                - "Transforming mundane workplace interactions into opportunities for meaningful connection"
                - "Learning to work with natural forces instead of constantly fighting against them"

                Additionally, for each book idea, create 4 fictional praise quotes from imaginary publications, magazines, or critics.
                These should sound like authentic book reviews or endorsements that would appear on a book's back cover.

                You must respond with ONLY a JSON array containing exactly 3 book ideas.`
            },
            {
              role: 'user',
              content: `Generate 3 different engaging autobiography ideas based on these answers:\n\n${JSON.stringify(answers, null, 2)}\n\n
                The autobiography is about ${authorName}, sharing their unique perspectives, methods, and life principles with a balance of insight and personality.

                Respond with ONLY a JSON array of 3 objects, each with:
                - 'title': The book title (3-5 words, not exceeding 30 characters, where each individual word MUST NOT exceed 14 characters)
                - 'author': "${authorName}" for all ideas
                - 'description': A compelling subtitle (ONE SENTENCE NO COMMAS 10-14 words) that expands on the central concept with personality
                - 'praises': An array of 4 fictional praise objects, each with 'source' (imaginary publication or critic name) and 'text' (the praise quote)

                Make the ideas VARIED IN TONE:
                - One should be professional and metaphor-rich
                - One should be satirical and playfully exaggerate elements from the user's answers (gently poking fun at quirks or habits mentioned)
                - One should be unexpected or quirky

                Each idea should present ${authorName}'s unique methodology or perspective through a single extended framework.

                The descriptions should:
                - Expand on the central concept established in the title
                - AVOID USING "I" OR "YOU" PERSPECTIVES - use objective third-person statements instead
                - ALWAYS BE ONE SENTENCE WITHOUT ANY COMMAS (use alternative sentence structures)
                - Clearly communicate the value proposition whether serious or lighthearted
                - USE COMMON WORDS AND EASY TO UNDERSTAND LANGUAGE - avoid rare characters, uncommon words, and complex expressions that average readers might not know
                - INFUSE HUMOR THROUGHOUT ALL IDEAS including witty observations, playful exaggerations, and amusing perspectives even in the more professional concepts

                For the satirical idea, look for amusing contradictions or exaggerations in the user's answers that could be playfully highlighted.

                Example title/description pairs (ranging from professional to satirical to unexpected):
                - "The Kitchen Creativity Blueprint" / "Essential cooking techniques transformed into business strategies for maximum growth"
                - "Skiing, Strategy, and space" / "A guide to balancing basketball dreams while building successful ventures"
                - "The Art of Perfect Timing" / "Discovering the hidden patterns that connect daily decisions to major life outcomes"
                - "Poop like a pro" / "Mastering the science of midday rest for enhanced productivity and creative thinking"
                - "Conversations with Algorithms" / "Exploring the relationship between human intuition and computational thinking"
                - "The Sock Matching Manifesto" / "Revolutionary methods for organizing chaos in both wardrobes and life situations"
                - "Mission: Impossible" / "How consistently making the wrong decisions somehow led to extraordinary success"
                - "The Overthinking Olympics" / "Mental gymnastics and philosophical contortions that turned simple problems into lifetime quests"
                - "Chaos Whisperer" / "Transforming spectacular disasters into opportunities through sheer stubbornness and luck"

                For the praises, follow these guidelines:
                1. Each praise should be a substantial paragraph (2-3 sentences) that analyzes some aspect of the book or author's style
                2. Use language that matches the tone of the book idea - more formal for professional concepts, more playful for quirky ones
                3. Include specific insights about the book's themes, the author's approach, or the reader experience
                4. Make them sound like genuine reviews from publications with names that match the subject matter
                5. Source names should be publications that match the subject matter (magazines, journals, blogs, etc.)

                Example praises (for different tones):
                [
                  {
                    "source": "Business Innovation Quarterly",
                    "text": "${authorName}'s approach to connecting seemingly unrelated domains creates an immediately applicable framework for problem-solving. Their ability to distill complex concepts into actionable wisdom makes this not just an entertaining read but a valuable resource for professionals seeking fresh perspectives."
                  },
                  {
                    "source": "The Curious Mind Magazine",
                    "text": "With refreshing originality and insightful observations, ${authorName} transforms everyday experiences into universal principles. The book's blend of wisdom and unexpected connections creates a reading experience that both entertains and inspires meaningful change in how readers approach familiar challenges."
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
