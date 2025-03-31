import { createClient } from '@supabase/supabase-js';

// 定义书籍章节结构
/**
 * @typedef {Object} BookSection
 * @property {number} sectionNumber - 章节编号
 * @property {string} title - 章节标题
 * @property {string} content - 章节内容
 */

/**
 * @typedef {Object} BookChapter
 * @property {number} chapterNumber - 章节编号
 * @property {string} title - 章节标题
 * @property {Array<BookSection>} sections - 章节内容
 */

// 定义批次大小和总章节数
const BATCH_SIZE = 3;
const TOTAL_CHAPTERS = 20;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒

/**
 * 生成书籍内容的API端点
 */
export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { orderId, title, author, format, batchNumber = 1, retryCount = 0, existingContent = [] } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    // 计算当前批次的章节范围
    const startChapter = (batchNumber - 1) * BATCH_SIZE + 1;
    const endChapter = Math.min(batchNumber * BATCH_SIZE, TOTAL_CHAPTERS);

    console.log(`Generating book content for order ${orderId}, batch ${batchNumber} (chapters ${startChapter}-${endChapter})`);

    // 获取环境变量
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey || !OPENAI_API_KEY) {
      return res.status(500).json({ success: false, error: 'Missing required environment variables' });
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
      return res.status(404).json({ 
        success: false, 
        error: `Failed to fetch book data: ${fetchError?.message || 'No data returned'}` 
      });
    }

    // 使用传递的title和author，如果没有则使用数据库值
    const bookTitle = title || bookData.title;
    const bookAuthor = author || bookData.author;
    const { selected_idea, answers, chapters } = bookData;
    
    // 使用传入的现有内容或从数据库获取
    let bookChapters = existingContent.length > 0 
      ? [...existingContent] 
      : (Array.isArray(bookData.book_content) ? [...bookData.book_content] : []);
    
    if (!bookTitle || !bookAuthor || !selected_idea || !chapters) {
      return res.status(400).json({ 
        success: false, 
        error: 'Incomplete book data for content generation' 
      });
    }

    // 生成提示词所需的上下文
    const ideaDescription = selected_idea.description || '';
    const answersContext = answers && Array.isArray(answers) 
      ? answers.map((answer) => `Q: ${answer.question}\nA: ${answer.answer}`).join('\n\n')
      : '';

    // 生成当前批次的章节
    for (let i = startChapter; i <= endChapter; i++) {
      // 检查是否已存在该章节（错误恢复）
      const existingChapterIndex = bookChapters.findIndex(ch => ch.chapterNumber === i);
      if (existingChapterIndex !== -1) {
        console.log(`Chapter ${i} already exists, skipping generation`);
        continue;
      }

      // 获取章节标题
      const chapterTitle = chapters[i - 1]?.title || `Chapter ${i}`;
      console.log(`Generating content for chapter ${i}: ${chapterTitle}`);

      // 构建提示词
      const prompt = `
You are a professional funny biography writer. You're writing a humorous biography book titled "${bookTitle}" about a person named "${bookAuthor}".

The book is based on this idea: "${ideaDescription}"

Here's some additional context about the person from a questionnaire:
${answersContext}

Write chapter ${i} titled "${chapterTitle}" for this funny biography. The chapter should be divided into 3-5 sections, each with its own subtitle. Make the content humorous, engaging, and entertaining while staying true to the information provided.

Format your response as a valid JSON object with this structure:
{
  "chapterNumber": ${i},
  "title": "${chapterTitle}",
  "sections": [
    {
      "sectionNumber": 1,
      "title": "Section Title",
      "content": "Section content..."
    },
    ...
  ]
}

Each section should be 2-3 paragraphs long. Use humor, anecdotes, and a conversational tone. The content should be appropriate for a general audience.
`;

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a professional funny biography writer.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`OpenAI API error for chapter ${i}:`, errorData);
          
          // 如果达到最大重试次数，则跳过此章节
          if (retryCount >= MAX_RETRIES) {
            console.warn(`Max retries reached for chapter ${i}, skipping`);
            continue;
          }
          
          // 否则，稍后重试此批次
          console.log(`Retrying batch ${batchNumber} after delay...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          
          // 递归调用自身，增加重试计数
          return await handler({
            ...req,
            body: {
              ...req.body,
              retryCount: retryCount + 1
            }
          }, res);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        try {
          // 解析返回的JSON
          const chapterData = JSON.parse(content);
          bookChapters.push(chapterData);
          console.log(`Successfully generated chapter ${i}`);
        } catch (parseError) {
          console.error(`Error parsing JSON for chapter ${i}:`, parseError);
          console.error('Raw content:', content);
          
          // 创建一个基本章节结构
          const fallbackChapter = {
            chapterNumber: i,
            title: chapterTitle,
            sections: [
              {
                sectionNumber: 1,
                title: "Error in Content Generation",
                content: "We apologize, but there was an error generating this chapter. Please try regenerating the book content."
              }
            ]
          };
          
          bookChapters.push(fallbackChapter);
          console.log(`Added fallback chapter ${i} due to parsing error`);
        }
      } catch (error) {
        console.error(`Error generating chapter ${i}:`, error);
        
        // 如果达到最大重试次数，则使用占位符
        if (retryCount >= MAX_RETRIES) {
          const fallbackChapter = {
            chapterNumber: i,
            title: chapterTitle,
            sections: [
              {
                sectionNumber: 1,
                title: "Error in Content Generation",
                content: "We apologize, but there was an error generating this chapter. Please try regenerating the book content."
              }
            ]
          };
          
          bookChapters.push(fallbackChapter);
          console.log(`Added fallback chapter ${i} due to generation error`);
          continue;
        }
        
        // 否则，稍后重试此批次
        console.log(`Retrying batch ${batchNumber} after delay...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        
        // 递归调用自身，增加重试计数
        return await handler({
          ...req,
          body: {
            ...req.body,
            retryCount: retryCount + 1
          }
        }, res);
      }
    }

    // 更新数据库中的图书内容
    const { error: updateError } = await supabase
      .from('funny_biography_books')
      .update({ 
        book_content: bookChapters,
        status: batchNumber * BATCH_SIZE >= TOTAL_CHAPTERS ? 'content_completed' : 'content_generating'
      })
      .eq('order_id', orderId);

    if (updateError) {
      console.error(`Error updating book content in database:`, updateError);
      return res.status(500).json({ success: false, error: `Failed to update book content: ${updateError.message}` });
    }

    // 检查是否需要生成下一批次
    if (endChapter < TOTAL_CHAPTERS) {
      // 还有更多章节需要生成，递归调用下一批次
      console.log(`Triggering next batch (${batchNumber + 1}) for order ${orderId}`);
      
      // 使用fetch发起新的请求，而不是直接递归调用
      // 这样可以避免请求超时
      const nextBatchUrl = `${process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/api/generate-book-content`;
      
      fetch(nextBatchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          title: bookTitle,
          author: bookAuthor,
          format: format,
          batchNumber: batchNumber + 1,
          existingContent: bookChapters
        })
      }).catch(error => {
        console.error(`Error triggering next batch:`, error);
      });
      
      return res.status(200).json({ 
        success: true, 
        message: `Batch ${batchNumber} completed, triggered batch ${batchNumber + 1}`,
        bookContent: bookChapters,
        completedChapters: endChapter,
        totalChapters: TOTAL_CHAPTERS
      });
    } else {
      // 所有章节都已生成，触发内页PDF生成
      console.log(`All chapters generated, triggering interior PDF generation for order ${orderId}`);
      try {
        const interiorPdfUrl = `${process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000'}/api/generate-interior-pdf`;
        
        fetch(interiorPdfUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            orderId,
            bookContent: bookChapters,
            bookTitle,
            authorName: bookAuthor
          })
        }).catch(error => {
          console.error(`Error triggering interior PDF generation:`, error);
        });
        
        return res.status(200).json({ 
          success: true, 
          message: 'Book content generation completed, interior PDF generation triggered',
          bookContent: bookChapters
        });
      } catch (error) {
        console.error(`Error triggering interior PDF generation:`, error);
        return res.status(200).json({ 
          success: true, 
          warning: 'Book content generation completed, but failed to trigger interior PDF generation',
          bookContent: bookChapters
        });
      }
    }
  } catch (error) {
    console.error('Error in generate-book-content:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'An unknown error occurred' 
    });
  }
}
