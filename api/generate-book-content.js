import { createClient } from '@supabase/supabase-js';
import nodeFetch from 'node-fetch';

// 初始化Supabase客户端 - 优先使用服务器变量
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * 处理书籍内容生成请求
 * @param {Object} req - HTTP请求对象
 * @param {Object} res - HTTP响应对象
 * @returns {Promise<Object>} - HTTP响应
 */
export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只处理POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // 解析请求体
    const { orderId, title, author, format } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    console.log(`Generating book content for order ${orderId}`);

    // 验证OpenAI API密钥
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      console.error('Missing OpenAI API key');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Missing OpenAI API key'
      });
    }

    // 验证Supabase凭证
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Missing Supabase credentials'
      });
    }

    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 从数据库获取书籍数据
    console.log(`Fetching book data for order ${orderId} from database`);
    const { data, error: fetchError } = await supabase
      .from('funny_biography_books')
      .select('*')
      .eq('order_id', orderId);

    console.log('Book data fetch response:', {
      success: !!data,
      hasError: !!fetchError,
      recordCount: data?.length || 0,
      errorMessage: fetchError?.message || 'none'
    });

    if (fetchError) {
      throw new Error(`Failed to fetch book data: ${fetchError.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error(`No book data found for order ID: ${orderId}`);
    }

    // 使用第一条记录
    const bookData = data[0];

    // 使用直接传递的title和author，如果没有则使用数据库值
    const bookTitle = title || bookData.title;
    const bookAuthor = author || bookData.author;
    const { selected_idea, answers, chapters } = bookData;

    if (!bookTitle || !bookAuthor || !selected_idea || !chapters) {
      throw new Error('Incomplete book data for content generation');
    }

    // 初始化空的章节数组
    let bookChapters = [];

    // 检查是否已有内容
    if (bookData.book_content && Array.isArray(bookData.book_content) && bookData.book_content.length > 0) {
      // 如果已经有完整内容，直接返回成功
      if (bookData.book_content.length >= 20) {
        return res.status(200).json({
          success: true,
          message: 'Book content already exists'
        });
      }
      
      // 使用已有内容
      bookChapters = [...bookData.book_content];
    }

    // 使用 nodeFetch 或全局 fetch
    const fetchFunc = typeof fetch !== 'undefined' ? fetch : nodeFetch;

    // 立即返回响应，不等待任何章节生成
    res.status(200).json({
      success: true,
      message: 'Book content generation started'
    });

    // 异步生成所有章节
    generateAllChapters(
      orderId, 
      bookTitle, 
      bookAuthor, 
      selected_idea, 
      answers, 
      chapters, 
      bookChapters, 
      OPENAI_API_KEY, 
      fetchFunc,
      supabaseUrl,
      supabaseServiceKey
    );

  } catch (error) {
    console.error('Error generating book content:', error);
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${error.message}`
    });
  }
}

/**
 * 异步生成所有章节
 * @param {string} orderId - 订单ID
 * @param {string} bookTitle - 书籍标题
 * @param {string} bookAuthor - 书籍作者
 * @param {Object} selectedIdea - 选定的创意
 * @param {Array} answers - 用户问题回答
 * @param {Array} chapters - 章节大纲
 * @param {Array} existingChapters - 已生成的章节
 * @param {string} apiKey - OpenAI API密钥
 * @param {Function} fetchFunc - Fetch函数
 * @param {string} supabaseUrl - Supabase URL
 * @param {string} supabaseKey - Supabase密钥
 * @returns {Promise<void>}
 */
async function generateAllChapters(
  orderId, 
  bookTitle, 
  bookAuthor, 
  selectedIdea, 
  answers, 
  chapters, 
  existingChapters, 
  apiKey, 
  fetchFunc,
  supabaseUrl,
  supabaseKey
) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    let bookChapters = [...existingChapters];
    const startChapter = bookChapters.length + 1;
    
    // 分批处理所有章节
    // 批次1：章节startChapter到startChapter+4，但不超过20
    const batch1End = Math.min(startChapter + 4, 20);
    for (let i = startChapter; i <= batch1End; i++) {
      console.log(`Generating chapter ${i} content...`);
      const chapter = await generateChapter(i, bookTitle, bookAuthor, selectedIdea, answers, chapters, apiKey, fetchFunc);
      bookChapters.push(chapter);
    }
    
    // 更新数据库
    await updateDatabase(supabase, orderId, bookChapters);
    
    // 如果还有更多章节
    if (batch1End < 20) {
      // 批次2：下一批5章，但不超过20
      const batch2End = Math.min(batch1End + 5, 20);
      for (let i = batch1End + 1; i <= batch2End; i++) {
        console.log(`Generating chapter ${i} content...`);
        const chapter = await generateChapter(i, bookTitle, bookAuthor, selectedIdea, answers, chapters, apiKey, fetchFunc);
        bookChapters.push(chapter);
      }
      
      // 更新数据库
      await updateDatabase(supabase, orderId, bookChapters);
      
      // 如果还有更多章节
      if (batch2End < 20) {
        // 批次3：下一批5章，但不超过20
        const batch3End = Math.min(batch2End + 5, 20);
        for (let i = batch2End + 1; i <= batch3End; i++) {
          console.log(`Generating chapter ${i} content...`);
          const chapter = await generateChapter(i, bookTitle, bookAuthor, selectedIdea, answers, chapters, apiKey, fetchFunc);
          bookChapters.push(chapter);
        }
        
        // 更新数据库
        await updateDatabase(supabase, orderId, bookChapters);
        
        // 如果还有更多章节
        if (batch3End < 20) {
          // 批次4：最后一批，直到20章
          for (let i = batch3End + 1; i <= 20; i++) {
            console.log(`Generating chapter ${i} content...`);
            const chapter = await generateChapter(i, bookTitle, bookAuthor, selectedIdea, answers, chapters, apiKey, fetchFunc);
            bookChapters.push(chapter);
          }
          
          // 最终更新
          await updateDatabase(supabase, orderId, bookChapters);
        }
      }
    }
    
    // 确保只有在生成了完整的20章后才触发PDF生成
    if (bookChapters.length >= 20) {
      console.log(`All 20 chapters generated successfully for order ${orderId}, triggering PDF generation`);
      await triggerInteriorPdfGeneration(orderId, bookChapters, bookTitle, bookAuthor, supabaseUrl, supabaseKey, fetchFunc);
    } else {
      console.warn(`Warning: Only ${bookChapters.length} chapters were generated for order ${orderId}, not triggering PDF generation`);
    }
    
  } catch (error) {
    console.error('Error generating chapters:', error);
    // 记录错误但不中断流程
  }
}

/**
 * 异步生成剩余章节
 * @param {string} orderId - 订单ID
 * @param {string} bookTitle - 书籍标题
 * @param {string} bookAuthor - 书籍作者
 * @param {Object} selectedIdea - 选定的创意
 * @param {Array} answers - 用户问题回答
 * @param {Array} chapters - 章节大纲
 * @param {Array} existingChapters - 已生成的章节
 * @param {number} startFrom - 开始生成的章节编号
 * @param {string} apiKey - OpenAI API密钥
 * @param {Function} fetchFunc - Fetch函数
 * @returns {Promise<void>}
 */
async function generateRemainingChapters(
  orderId, 
  bookTitle, 
  bookAuthor, 
  selectedIdea, 
  answers, 
  chapters, 
  existingChapters, 
  startFrom, 
  apiKey, 
  fetchFunc
) {
  // 这个函数保留但不再使用，为了向后兼容
  console.warn('generateRemainingChapters is deprecated, use generateAllChapters instead');
}

/**
 * 生成单个章节内容
 * @param {number} chapterNumber - 章节编号
 * @param {string} bookTitle - 书籍标题
 * @param {string} bookAuthor - 书籍作者
 * @param {Object} selectedIdea - 选定的创意
 * @param {Array} answers - 用户问题回答
 * @param {Array} chapters - 章节大纲
 * @param {string} apiKey - OpenAI API密钥
 * @param {Function} fetchFunc - Fetch函数
 * @returns {Promise<Object>} - 生成的章节内容
 */
async function generateChapter(chapterNumber, bookTitle, bookAuthor, selectedIdea, answers, chapters, apiKey, fetchFunc) {
  let chapterTitle = '';
  let chapterDescription = '';
  
  // 尝试找到匹配的章节
  if (chapters && Array.isArray(chapters) && chapters.length >= chapterNumber) {
    const existingChapter = chapters[chapterNumber - 1];
    if (existingChapter) {
      chapterTitle = existingChapter.title || `Chapter ${chapterNumber}`;
      chapterDescription = existingChapter.description || '';
    }
  }
  
  if (!chapterTitle) {
    chapterTitle = `Chapter ${chapterNumber}`;
  }

  // 处理问题答案作为额外上下文
  const answersContext = answers && Array.isArray(answers) 
    ? answers.map((answer) => `Q: ${answer.question}\nA: ${answer.answer}`).join('\n\n')
    : '';

  // 构建提示词
  const prompt = `
You are writing a humorous biography book titled "${bookTitle}" about ${bookAuthor}. 
The book concept is: ${selectedIdea.description || ''}

Additional context about the subject:
${answersContext}

This is Chapter ${chapterNumber}: ${chapterTitle}
${chapterDescription ? `Chapter description: ${chapterDescription}` : ''}

Write this chapter with 2 distinct sections. Make it entertaining, humorous and engaging.
For each section, provide a creative section title and approximately 300-400 words of content.
Write in a conversational, entertaining style appropriate for a funny biography.
Include anecdotes, humorous observations, and witty commentary.

Format your response as JSON with this structure:
{
  "chapterNumber": ${chapterNumber},
  "title": "Chapter title",
  "sections": [
    {
      "sectionNumber": 1,
      "title": "Section title",
      "content": "Section content..."
    },
    ...
  ]
}
`;

  // 添加重试逻辑
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      const response = await fetchFunc('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You must respond with valid JSON only. Do not include any explanation outside the JSON structure.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
          max_tokens: 3000,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      const chapterContent = result.choices[0].message.content;
      
      // 解析JSON响应
      const parsedChapter = JSON.parse(chapterContent);
      return parsedChapter;
      
    } catch (error) {
      retries++;
      console.error(`Error generating chapter ${chapterNumber}, attempt ${retries}:`, error);
      
      if (retries >= maxRetries) {
        // 如果所有重试都失败，返回错误章节
        console.error(`Failed to generate chapter ${chapterNumber} after ${maxRetries} attempts`);
        return {
          chapterNumber: chapterNumber,
          title: chapterTitle,
          sections: [
            {
              sectionNumber: 1,
              title: "Content Generation Error",
              content: "There was an error processing this chapter's content. Please try regenerating this chapter later."
            }
          ]
        };
      }
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 2000 * retries));
    }
  }
}

/**
 * 更新数据库中的书籍内容
 * @param {Object} supabase - Supabase客户端
 * @param {string} orderId - 订单ID
 * @param {Array} bookChapters - 书籍章节内容
 * @returns {Promise<void>}
 */
async function updateDatabase(supabase, orderId, bookChapters) {
  const { error: updateError } = await supabase
    .from('funny_biography_books')
    .update({
      book_content: bookChapters
    })
    .eq('order_id', orderId);

  if (updateError) {
    console.error(`Error updating book data for order ${orderId}:`, updateError);
  } else {
    console.log(`Successfully updated book data for order ${orderId}, chapters count: ${bookChapters.length}`);
  }
}

/**
 * 触发内页PDF生成
 * @param {string} orderId - 订单ID
 * @param {Array} bookChapters - 书籍章节内容
 * @param {string} bookTitle - 书籍标题
 * @param {string} bookAuthor - 书籍作者
 * @param {string} supabaseUrl - Supabase URL
 * @param {string} supabaseKey - Supabase密钥
 * @param {Function} fetchFunc - Fetch函数
 * @returns {Promise<void>}
 */
async function triggerInteriorPdfGeneration(orderId, bookChapters, bookTitle, bookAuthor, supabaseUrl, supabaseKey, fetchFunc) {
  console.log(`Triggering interior PDF generation for order ${orderId}`);
  try {
    // 尝试调用Supabase函数
    const interiorResponse = await fetchFunc(`${supabaseUrl}/functions/v1/generate-interior-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        orderId,
        bookContent: bookChapters,
        bookTitle: bookTitle,
        authorName: bookAuthor
      })
    });

    const interiorResult = await interiorResponse.json();
    if (!interiorResponse.ok || !interiorResult.success) {
      console.error(`Error generating interior PDF: ${JSON.stringify(interiorResult)}`);
      // 尝试使用Vercel API端点
      await triggerVercelPdfGeneration(orderId, bookChapters, bookTitle, bookAuthor, fetchFunc);
    } else {
      console.log(`Interior PDF generated successfully with URL: ${interiorResult.interiorSourceUrl || 'No URL'}`);
    }
  } catch (error) {
    console.error('Error calling Supabase interior PDF generation:', error);
    // 尝试使用Vercel API端点
    await triggerVercelPdfGeneration(orderId, bookChapters, bookTitle, bookAuthor, fetchFunc);
  }
}

/**
 * 触发Vercel API端点生成PDF
 * @param {string} orderId - 订单ID
 * @param {Array} bookChapters - 书籍章节内容
 * @param {string} bookTitle - 书籍标题
 * @param {string} bookAuthor - 书籍作者
 * @param {Function} fetchFunc - Fetch函数
 * @returns {Promise<void>}
 */
async function triggerVercelPdfGeneration(orderId, bookChapters, bookTitle, bookAuthor, fetchFunc) {
  console.log(`Attempting to use Vercel API for PDF generation for order ${orderId}`);
  try {
    // 假设我们有一个Vercel API端点来生成PDF
    const vercelEndpoint = '/api/generate-interior-pdf';
    const response = await fetchFunc(vercelEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId,
        bookContent: bookChapters,
        bookTitle,
        authorName: bookAuthor
      })
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      console.error(`Error generating PDF via Vercel API: ${JSON.stringify(result)}`);
    } else {
      console.log(`PDF generated successfully via Vercel API: ${result.interiorSourceUrl || 'No URL'}`);
    }
  } catch (error) {
    console.error('Error calling Vercel PDF generation API:', error);
  }
}
