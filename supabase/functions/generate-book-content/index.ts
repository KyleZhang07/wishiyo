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
const BATCH_SIZE = 1; // 每批生成2章
const TOTAL_CHAPTERS = 20; // 总共生成2章
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

      // 分别生成每个section的函数
      async function generateSection(sectionNumber: number, chapterNum: number, chapterTitle: string, chapterDescription: string, previousSections: Array<{title: string, content: string}> = []): Promise<{title: string, content: string}> {
        let retries = 0;

        // 为不同的section定义不同的角色和目的
        let sectionRole = '';
        let previousSectionsContext = '';

        // 根据section编号分配不同的角色
        if (sectionNumber === 1) {
          sectionRole = `This is the FIRST section of the chapter. Your role is to introduce the main theme of the chapter and set up the narrative framework. Begin with a compelling hook or anecdote that draws readers in.`;
        } else if (sectionNumber === 2) {
          sectionRole = `This is the SECOND section of the chapter. Your role is to develop the main ideas introduced in the first section. Expand on the concepts with examples and deeper analysis.`;

          // 添加前一个section的上下文
          if (previousSections.length > 0) {
            previousSectionsContext = `
Previous section (${previousSections[0].title}) covered: ${previousSections[0].content.substring(0, 150)}... [content continues]

You should build upon these ideas and maintain narrative continuity. Do not repeat the same examples or anecdotes, but do reference key concepts to create a cohesive flow.`;
          }
        } else if (sectionNumber === 3) {
          sectionRole = `This is the THIRD section of the chapter. Your role is to present a turning point, contrast, or new perspective on the chapter's theme. Introduce a twist or insight that adds depth to the narrative.`;

          // 添加前两个section的上下文
          if (previousSections.length > 0) {
            const summaries = previousSections.map((section, index) =>
              `Section ${index+1} (${section.title}): ${section.content.substring(0, 100)}...`
            ).join('\n');
            previousSectionsContext = `
Previous sections covered:\n${summaries}\n\nBuild upon these ideas while introducing new perspectives. Create smooth transitions between sections and maintain narrative continuity.`;
          }
        } else if (sectionNumber === 4) {
          sectionRole = `This is the FINAL section of the chapter. Your role is to provide resolution, practical applications, and connect back to the chapter's main theme. End with a memorable conclusion that leaves readers with a clear takeaway.`;

          // 添加前三个section的上下文
          if (previousSections.length > 0) {
            const summaries = previousSections.map((section, index) =>
              `Section ${index+1} (${section.title}): ${section.content.substring(0, 80)}...`
            ).join('\n');
            previousSectionsContext = `
Previous sections covered:\n${summaries}\n\nYour job is to bring closure to the themes and ideas presented in the previous sections. Reference key concepts from earlier sections to create a sense of completion and cohesion.`;
          }
        }

        while (retries < MAX_RETRIES) {
          try {
            const sectionPrompt = `
            You will obey every rule in the prompt, especially the word count rule. You are writing section ${sectionNumber} of 4 total sections for a funny biography titled "${bookTitle}" about ${bookAuthor}.
            The book concept is: ${ideaDescription}

            Additional context about the subject (use these details naturally):
            ${answersContext}

            This is for Chapter ${chapterNum}: ${chapterTitle}
            ${chapterDescription ? `Chapter description: ${chapterDescription}` : ''}

            ${sectionRole}
            ${previousSectionsContext}

            Guidelines for this section:
            - CRITICAL: THIS SECTION MUST CONTAIN EXACTLY BETWEEN 500 TO 600 WORDS. Not less, not more.
            - Use first-person "I" when ${bookAuthor} is sharing personal experiences or anecdotes
            - Use second-person "you" when explaining methodologies or instructing the reader
            - The section should either:
              * Share a personal experience through ${bookAuthor}'s eyes (first-person) and extract the lesson (second-person)
              * Introduce a methodology using metaphors and explain how readers can apply it
              * Connect ${bookAuthor}'s unique approach to broader applications for the audience
            - Section title should use thematic metaphors related to the chapter's main concepts
            - Make it insightful, methodological and funny while maintaining a professional tone
            - Use double line breaks (\n\n) between paragraphs to clearly separate them
            - IMPORTANT: Create smooth transitions between sections. Reference ideas from previous sections when appropriate to maintain narrative flow.

            Format your response as JSON with this structure:
            {
              "title": "Section title",
              "content": "Section content with 500-600 words..."
            }
            `;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4.1-mini',
                messages: [
                  {
                    role: 'system',
                    content: `You MUST STRICTLY enforce these requirements:
- CRITICAL REQUIREMENT: The section MUST contain EXACTLY between 500 and 600 words. Count the words carefully.
- Each chapter has exactly 4 sections (not 5).
- The section's content must use double line breaks (\\n\\n) between paragraphs to clearly separate them.
- Maintain narrative continuity with previous sections when applicable.
- Create smooth transitions between ideas and reference previous concepts when appropriate.
- Respond only with valid JSON. Do not include any commentary outside the JSON structure.`
                  },
                  {
                    role: 'user',
                    content: sectionPrompt
                  }
                ],
                temperature: 1.0,
                response_format: { type: "json_object" }
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
            }

            const result = await response.json();
            const sectionContent = JSON.parse(result.choices[0].message.content);

            // 验证字数
            const wordCount = sectionContent.content.split(/\s+/).length;
            console.log(`Section ${sectionNumber} generated with ${wordCount} words`);

            if (wordCount < 550 || wordCount > 700) {
              console.warn(`Section ${sectionNumber} word count (${wordCount}) outside acceptable range, retrying...`);
              throw new Error(`Word count outside acceptable range: ${wordCount}`);
            }

            return sectionContent;
          } catch (error) {
            retries++;
            console.error(`Error generating section ${sectionNumber}, attempt ${retries}:`, error);

            if (retries >= MAX_RETRIES) {
              console.error(`Failed to generate section ${sectionNumber} after ${MAX_RETRIES} attempts`);
              // 返回错误占位内容
              return {
                title: `Section ${sectionNumber}`,
                content: `There was an error generating this section's content. It contains approximately 500 words of placeholder text to maintain the book's structure. This section will be regenerated later with proper content.

${'Lorem ipsum dolor sit amet. '.repeat(100)}`
              };
            } else {
              // 等待一段时间后重试
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
            }
          }
        }

        // 如果所有重试都失败，返回错误占位内容
        return {
          title: `Section ${sectionNumber}`,
          content: `There was an error generating this section's content. It contains approximately 500 words of placeholder text to maintain the book's structure. This section will be regenerated later with proper content.

${'Lorem ipsum dolor sit amet. '.repeat(100)}`
        };
      }

      // 生成完整章节
      console.log(`Generating chapter ${i} with 5 sections individually...`);

      // 创建章节结构
      const chapter = {
        chapterNumber: i,
        title: chapterTitle,
        sections: []
      };

      // 分别生成每个section
      try {
        // 用于存储已生成的section，传递给下一个section作为上下文
        const generatedSections: Array<{title: string, content: string}> = [];

        for (let sectionNum = 1; sectionNum <= 4; sectionNum++) {
          console.log(`Generating section ${sectionNum} for chapter ${i}...`);
          // 将已生成的section传递给生成函数
          const section = await generateSection(sectionNum, i, chapterTitle, chapterDescription, generatedSections);

          // 将新生成的section添加到已生成列表中
          generatedSections.push({
            title: section.title,
            content: section.content
          });

          chapter.sections.push({
            sectionNumber: sectionNum,
            title: section.title,
            content: section.content
          });

          // 每生成一个section就更新数据库，确保不丢失进度
          bookChapters = bookChapters.filter(ch => ch.chapterNumber !== i); // 移除旧的章节（如果有）
          bookChapters.push(chapter);

          const { error: updateError } = await supabase
            .from('funny_biography_books')
            .update({ book_content: bookChapters })
            .eq('order_id', orderId);

          if (updateError) {
            console.error(`Warning: Failed to update book data after section ${sectionNum} of chapter ${i}:`, updateError);
          } else {
            console.log(`Successfully saved progress after section ${sectionNum} of chapter ${i}`);
          }

          // 添加延迟，避免API限制
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`Successfully generated all 4 sections for chapter ${i}`);

      } catch (chapterError) {
        console.error(`Error generating chapter ${i}:`, chapterError);

        // 如果生成章节失败，创建一个错误占位章节
        if (chapter.sections.length === 0) {
          chapter.sections.push({
            sectionNumber: 1,
            title: "Content Error",
            content: "There was an error processing this chapter's content. It will be regenerated later."
          });

          // 更新数据库，保存错误章节
          bookChapters = bookChapters.filter(ch => ch.chapterNumber !== i);
          bookChapters.push(chapter);

          const { error: updateError } = await supabase
            .from('funny_biography_books')
            .update({ book_content: bookChapters })
            .eq('order_id', orderId);

          if (updateError) {
            console.error(`Warning: Failed to update book data with error chapter ${i}:`, updateError);
          }
        }
      }

      // 注意：我们已经在生成每个section后更新了数据库
      // 这里只需要确保章节已经添加到bookChapters中
      const chapterExists = bookChapters.some(ch => ch.chapterNumber === i);

      if (!chapterExists) {
        console.error(`Warning: Chapter ${i} was not properly added to bookChapters. Adding placeholder.`);

        // 添加占位章节
        const placeholderChapter = {
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

        bookChapters.push(placeholderChapter);

        // 更新数据库
        const { error: updateError } = await supabase
          .from('funny_biography_books')
          .update({ book_content: bookChapters })
          .eq('order_id', orderId);

        if (updateError) {
          console.error(`Warning: Failed to update book data with placeholder chapter ${i}:`, updateError);
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
