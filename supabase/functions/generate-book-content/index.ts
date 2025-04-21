import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 添加Deno类型声明，避免TypeScript错误
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// 定义书籍章节结构
interface BookChapter {
  chapterNumber: number;
  title: string;
  sections: {
    sectionNumber: number;
    title: string;
    content: string;
  }[];
}

// 定义批次大小和总章节数
const BATCH_SIZE = 2; // 每批生成2章
const TOTAL_CHAPTERS = 2; // 总共生成2章
const MAX_RETRIES = 3;

// 定义页面布局常量
const CHARS_PER_PAGE = 1300; // 每页平均字符数（包括空格）
const WORDS_PER_PAGE = 220;  // 每页平均单词数
const PAGES_PER_CHAPTER = 11; // 每章目标页数
const WORDS_PER_CHAPTER = PAGES_PER_CHAPTER * WORDS_PER_PAGE; // 每章目标单词数（约2,420单词）
const RETRY_DELAY = 1000; // 1秒

serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, title, author, format, batchNumber = 1, retryCount = 0, existingContent = [] } = await req.json();

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // 计算当前批次的章节范围
    const startChapter = (batchNumber - 1) * BATCH_SIZE + 1;
    const endChapter = Math.min(batchNumber * BATCH_SIZE, TOTAL_CHAPTERS);

    console.log(`Generating book content for order ${orderId}, batch ${batchNumber} (chapters ${startChapter}-${endChapter})`);

    // 获取Supabase连接信息和OpenAI API Key
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey || !OPENAI_API_KEY) {
      throw new Error('Missing required environment variables');
    }

    // 初始化Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 从数据库获取图书数据
    const { data: bookData, error: fetchError } = await supabase
      .from('funny_biography_books')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (fetchError || !bookData) {
      throw new Error(`Failed to fetch book data: ${fetchError?.message || 'No data returned'}`);
    }

    // 使用传递的title和author，如果没有则使用数据库值
    const bookTitle = title || bookData.title;
    const bookAuthor = author || bookData.author;
    const { selected_idea, answers, chapters } = bookData;

    // 使用传入的现有内容或从数据库获取
    let bookChapters: BookChapter[] = existingContent.length > 0
      ? [...existingContent]
      : (Array.isArray(bookData.book_content) ? [...bookData.book_content] : []);

    if (!bookTitle || !bookAuthor || !selected_idea || !chapters) {
      throw new Error('Incomplete book data for content generation');
    }

    // 生成提示词所需的上下文
    const ideaDescription = selected_idea.description || '';
    const answersContext = answers && Array.isArray(answers)
      ? answers.map((answer: any) => `Q: ${answer.question}\nA: ${answer.answer}`).join('\n\n')
      : '';

    // 生成当前批次的章节
    for (let i = startChapter; i <= endChapter; i++) {
      // 检查是否已存在该章节（错误恢复）
      const existingChapterIndex = bookChapters.findIndex(ch => ch.chapterNumber === i);
      if (existingChapterIndex !== -1) {
        console.log(`Chapter ${i} already exists, skipping generation`);
        continue;
      }

      console.log(`Generating chapter ${i} content...`);

      let chapterTitle = '';
      let chapterDescription = '';

      // 尝试从现有章节大纲中找到匹配的章节
      if (chapters && Array.isArray(chapters) && chapters.length >= i) {
        const existingChapter = chapters[i - 1];
        if (existingChapter) {
          chapterTitle = existingChapter.title || `Chapter ${i}`;
          chapterDescription = existingChapter.description || '';
        }
      }

      if (!chapterTitle) {
        chapterTitle = `Chapter ${i}`;
      }

      // 带重试机制的OpenAI API调用
      let chapterContent: string | null = null;
      let retries = 0;

      while (retries < MAX_RETRIES) {
        try {
          const prompt = `
          You are writing a funny biography titled "${bookTitle}" about ${bookAuthor}, exploring their expertise, methodology, and insights in a funny, satirical, or professional tone.
          The book concept is: ${ideaDescription}

          Additional context about the subject (use these details naturally throughout the narrative, but don't use the details too much):
          ${answersContext}

          This is Chapter ${i}: ${chapterTitle}
          ${chapterDescription ? `Chapter description: ${chapterDescription}` : ''}

          Write this chapter with 4 distinct sections:
          - CRITICAL: EACH SECTION MUST CONTAIN BETWEEN 850 TO 950 WORDS. If a section is below 850 words, you must expand it. If above 950 words, you must trim it.
          - Use first-person "I" when ${bookAuthor} is sharing specific personal experiences or anecdotes
          - Use second-person "you" when explaining methodologies, principles, or when instructing the reader
          - The narrative should feel like ${bookAuthor} is personally guiding readers through their expertise using engaging metaphors

          Guidelines:
          - CRITICAL: EACH SECTION MUST CONTAIN BETWEEN 850 TO 950 WORDS. If a section is below 850 words, you must expand it. If above 950 words, you must trim it.
          - Balance between "I" (for personal stories) and "you" (for instructional content)
          - When using "I," focus on ${bookAuthor}'s personal journey, challenges overcome, and pivotal moments
          - When using "you," focus on transferable principles, methodologies, and practical applications
          - Each section should either:
            * Share a personal experience through ${bookAuthor}'s eyes (first-person) and then extract the lesson for readers (second-person)
            * Introduce a methodology using metaphors and explain how readers can apply it in their context
            * Connect ${bookAuthor}'s unique approach to broader applications for the audience
          - Section titles should use thematic metaphors that relate to the chapter's main concepts (like "Navigating the Slopes" or "The Downhill Rush")
          - Naturally incorporate details from the context into a cohesive narrative
          - Make it insightful, methodological and funny while maintaining a professional tone with appropriate personality
          - Write in a style that skillfully weaves personal stories with practical wisdom, using analogies to explain complex ideas

          Format your response as JSON with this structure:
          {
            "chapterNumber": ${i},
            "title": "Chapter title",
            "sections": [
              {
                "sectionNumber": 1,
                "title": "Section title",
                "content": "Section content..."
              },
              ...
            ],

          }
          `;

          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4.1',
              messages: [
                {
                  role: 'system',
                  content: `You MUST STRICTLY enforce these requirements, especially the word count requirements:
- Each chapter must have exactly 4 sections.
- CRITICAL REQUIREMENT: Each section MUST contain EXACTLY between 850 and 950 words. This is a HARD REQUIREMENT.
- You MUST count words in each section before finalizing your response.
- If any section has fewer than 850 words, you MUST expand it before responding.
- If any section has more than 950 words, you MUST trim it before responding.
- Each section's content must use double line breaks (\\n\\n) between paragraphs to clearly separate them.
- Respond only with valid JSON. Do not include any commentary or explanation outside the JSON structure.`
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 1.0,
              max_tokens: 7000,
              response_format: { type: "json_object" }
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
          }

          const result = await response.json();
          chapterContent = result.choices[0].message.content;
          break; // 成功获取内容，跳出重试循环

        } catch (error) {
          retries++;
          console.error(`Error generating chapter ${i}, attempt ${retries}:`, error);

          if (retries >= MAX_RETRIES) {
            console.error(`Failed to generate chapter ${i} after ${MAX_RETRIES} attempts`);
            // 创建一个错误占位章节
            chapterContent = JSON.stringify({
              chapterNumber: i,
              title: chapterTitle,
              sections: [
                {
                  sectionNumber: 1,
                  title: "Content Error",
                  content: "There was an error processing this chapter's content. It will be regenerated later."
                }
              ]
            });
          } else {
            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
          }
        }
      }

      try {
        // 解析JSON响应
        const parsedChapter = JSON.parse(chapterContent!);
        bookChapters.push(parsedChapter);

        // 每生成一章就更新数据库，确保不丢失进度
        if (i % 1 === 0 || i === endChapter) { // 每章或批次结束时更新
          const { error: updateError } = await supabase
            .from('funny_biography_books')
            .update({ book_content: bookChapters })
            .eq('order_id', orderId);

          if (updateError) {
            console.error(`Warning: Failed to update book data after chapter ${i}:`, updateError);
          }
        }
      } catch (parseError) {
        console.error(`Error parsing chapter ${i} content:`, parseError);
        console.error(`Original content (first 300 chars): ${chapterContent!.substring(0, 300)}...`);

        // 如果解析失败，创建一个带有错误信息的章节
        const errorChapter = {
          chapterNumber: i,
          title: chapterTitle,
          sections: [
            {
              sectionNumber: 1,
              title: "Content Error",
              content: "There was an error processing this chapter's content. It will be regenerated later."
            }
          ]
        };

        bookChapters.push(errorChapter);

        // 更新数据库，保存进度
        const { error: updateError } = await supabase
          .from('funny_biography_books')
          .update({ book_content: bookChapters })
          .eq('order_id', orderId);

        if (updateError) {
          console.error(`Warning: Failed to update book data after error in chapter ${i}:`, updateError);
        }
      }
    }

    // 最终更新数据库
    const { error: finalUpdateError } = await supabase
      .from('funny_biography_books')
      .update({ book_content: bookChapters })
      .eq('order_id', orderId);

    if (finalUpdateError) {
      throw new Error(`Failed to update book data: ${finalUpdateError.message}`);
    }

    // 如果还有更多批次要处理，触发下一批次
    if (endChapter < TOTAL_CHAPTERS) {
      console.log(`Triggering next batch (${batchNumber + 1}) for order ${orderId}`);
      try {
        // 异步触发下一批次，不等待响应
        fetch(`${supabaseUrl}/functions/v1/generate-book-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            orderId,
            batchNumber: batchNumber + 1,
            existingContent: bookChapters
          })
        }).catch(error => {
          console.error(`Error triggering next batch: ${error.message}`);
        });
      } catch (error) {
        console.error('Error triggering next batch:', error);
        // 继续流程，不中断
      }
    } else {
      // 所有章节都已生成，触发内页PDF生成
      console.log(`All chapters generated, triggering interior PDF generation for order ${orderId}`);
      try {
        fetch(`${supabaseUrl}/functions/v1/generate-interior-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            orderId,
            bookContent: bookChapters,
            bookTitle: bookTitle,
            authorName: bookAuthor
          })
        }).catch(error => {
          console.error(`Error triggering PDF generation: ${error.message}`);
        });
      } catch (error) {
        console.error('Error calling interior PDF generation:', error);
        // 继续流程，不中断
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Book content batch ${batchNumber} generated successfully`,
        isComplete: endChapter >= TOTAL_CHAPTERS
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating book content:', error);

    // 如果是批次处理失败，尝试重试当前批次
    try {
      const { orderId, batchNumber, retryCount = 0, existingContent = [] } = await req.json();

      if (orderId && batchNumber && retryCount < MAX_RETRIES) {
        console.log(`Retrying batch ${batchNumber} for order ${orderId}, attempt ${retryCount + 1}`);

        // 等待一段时间后重试
        setTimeout(() => {
          const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
          const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

          if (supabaseUrl && supabaseServiceKey) {
            fetch(`${supabaseUrl}/functions/v1/generate-book-content`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`
              },
              body: JSON.stringify({
                orderId,
                batchNumber,
                retryCount: retryCount + 1,
                existingContent
              })
            }).catch(e => console.error('Error in retry attempt:', e));
          }
        }, RETRY_DELAY * (retryCount + 1));
      }
    } catch (retryError) {
      console.error('Error setting up retry:', retryError);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
