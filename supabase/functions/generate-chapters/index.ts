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

    const prompt = `Create a table of contents for a biography book about ${authorName}. The book is titled "${bookTitle}" and follows this theme: "${selectedIdea?.description || 'A professional biography'}".

Background information about ${authorName}:
${answers?.map((qa: any) => `- ${qa.question}: ${qa.answer}`).join('\n') || 'No specific details provided'}

Generate exactly 20 chapters. Each chapter must follow this exact format:
{
  "title": "Engaging chapter title with metaphorical or thematic elements",
  "description": "Brief description of the chapter (15-30 words). Make it sound like a real book's table of contents - engaging, specific, and reflecting the chapter's key insights or methodology.",
  "startPage": page number (start from page 1, each chapter is ~10-12 pages)
}

Chapter titles should follow these patterns:
- Use metaphors related to the subject's profession or interests
- Frame chapters as journeys, methodologies, or key principles
- Use a "The X of Y" structure or "X: Y" format for some titles
- Include specific, tangible concepts rather than generic headings

Example titles:
- "Navigating the Slopes: Mastering Market Research"
- "The Downhill Rush: Embracing Speed and Agility"
- "Skiing with Purpose: Aligning Your Mission With Your Values"
- "Conquering Fears: Risk Management Like a Pro"

Example descriptions:
- "How understanding your customer is essential, much like choosing the right ski lift for your ride to success."
- "The parallels between tracking market trends and observing snowfall patterns to anticipate future opportunities."
- "Developing resilience through unexpected challenges and learning to transform obstacles into stepping stones."

Return ONLY a JSON object with a "chapters" array containing these 20 chapter objects. The response must be a valid JSON object with the format: {"chapters": [...]}. No other text or explanation.`;

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
                      You must generate exactly 20 chapters, each with a metaphorical or theme-based title, brief description (15-30 words), and starting page number.

                      Example chapter titles:
                      - "Navigating the Slopes: Mastering Market Research"
                      - "The Downhill Rush: Embracing Speed and Agility"
                      - "Conquering Fears: Risk Management Like a Pro"

                      Example descriptions:
                      - "How understanding your customer is essential, much like choosing the right ski lift for your ride to success."
                      - "The parallels between tracking market trends and observing snowfall patterns to anticipate future opportunities."
                      - "Developing resilience through unexpected challenges and learning to transform obstacles into stepping stones."

                      Each chapter should have a starting page number, with the first chapter starting at page 1 and subsequent chapters starting based on approximately 10-12 pages per chapter.

                      Return a JSON object with a "chapters" array containing exactly 20 chapter objects. Each chapter object must have "title", "description", and "startPage" fields.

                      Example format:
                      {
                        "chapters": [
                          {
                            "title": "Chapter Title",
                            "description": "Brief description",
                            "startPage": 1
                          },
                          ...
                        ]
                      }`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: "json_object" },
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
      const parsedResponse = JSON.parse(generatedText);

      // 由于使用了 response_format: { type: "json_object" }，
      // 模型可能会返回 { chapters: [...] } 或其他包含章节数组的对象
      // 我们需要提取章节数组
      let chapters: any[] | undefined;

      if (Array.isArray(parsedResponse)) {
        // 如果直接返回数组
        chapters = parsedResponse;
      } else if (parsedResponse && typeof parsedResponse === 'object') {
        // 如果返回对象，尝试找到章节数组
        // 可能的键名：chapters, items, content 等
        const possibleArrayKeys = ['chapters', 'items', 'content', 'data'];
        for (const key of possibleArrayKeys) {
          if (Array.isArray(parsedResponse[key])) {
            chapters = parsedResponse[key];
            break;
          }
        }

        // 如果没有找到数组，但对象有值，尝试使用对象的值
        if (!chapters) {
          const values = Object.values(parsedResponse);
          const arrayValues = values.filter(v => Array.isArray(v));
          if (arrayValues.length > 0) {
            chapters = arrayValues[0];
          }
        }
      }

      // 如果仍然没有找到章节数组，抛出错误
      if (!chapters || !Array.isArray(chapters)) {
        console.error("Parsed response structure:", JSON.stringify(parsedResponse, null, 2));
        throw new Error("Could not find chapters array in response");
      }

      // 验证章节数量
      if (chapters.length !== 20) {
        console.warn(`Expected 20 chapters but got ${chapters.length}`);
        // 继续处理，不抛出错误
      }

      // Validate and format each chapter
      // 根据截图中的目录页数计算每章的页数
      // 第1章：页码为1
      // 第2章：页码为12
      // 第3章：页码为23
      // 第4章：页码为34
      // 第5章：页码为45
      // 每章约11页，总共220页，20章
      const formattedChapters = chapters.map((chapter, index) => {
        // 计算起始页码
        let startPage: number;
        if (index === 0) {
          startPage = 1; // 第一章从第1页开始
        } else {
          // 每章约11页，适应220页总长度
          startPage = index * 11 + 1;
        }

        return {
          title: String(chapter.title || `Chapter ${index + 1}`),
          description: String(chapter.description || "An exciting chapter in this story"),
          startPage: Number(chapter.startPage || startPage)
        };
      });

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
