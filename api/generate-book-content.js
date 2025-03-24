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

    // 立即返回响应，不等待任何章节生成
    res.status(200).json({
      success: true,
      message: 'Book content generation started'
    });

    // 开始生成过程
    processNextBatch(
      orderId, 
      bookTitle, 
      bookAuthor, 
      selected_idea, 
      answers, 
      chapters, 
      bookChapters, 
      OPENAI_API_KEY
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
 * 处理下一批章节生成
 * @param {string} orderId - 订单ID
 * @param {string} bookTitle - 书籍标题
 * @param {string} bookAuthor - 书籍作者
 * @param {Object} selectedIdea - 选定的创意
 * @param {Array} answers - 用户问题回答
 * @param {Array} chapters - 章节大纲
 * @param {Array} existingChapters - 已生成的章节
 * @param {string} apiKey - OpenAI API密钥
 * @returns {Promise<void>}
 */
async function processNextBatch(
  orderId, 
  bookTitle, 
  bookAuthor, 
  selectedIdea, 
  answers, 
  chapters, 
  existingChapters, 
  apiKey
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const fetchFunc = typeof fetch !== 'undefined' ? fetch : nodeFetch;
  
  try {
    let bookChapters = [...existingChapters];
    const startChapter = bookChapters.length + 1;
    
    // 如果已经生成了所有章节，触发PDF生成并返回
    if (startChapter > 20) {
      console.log(`All 20 chapters already generated for order ${orderId}, triggering PDF generation`);
      await triggerInteriorPdfGeneration(orderId, bookChapters, bookTitle, bookAuthor, supabaseUrl, supabaseServiceKey, fetchFunc);
      return;
    }
    
    // 当前批次：生成最多5章
    const batchEnd = Math.min(startChapter + 4, 20);
    console.log(`Processing batch from chapter ${startChapter} to ${batchEnd} for order ${orderId}`);
    
    // 生成当前批次章节
    for (let i = startChapter; i <= batchEnd; i++) {
      console.log(`Generating chapter ${i} content...`);
      const chapter = await generateChapter(i, bookTitle, bookAuthor, selectedIdea, answers, chapters, apiKey, fetchFunc);
      bookChapters.push(chapter);
    }
    
    // 更新数据库
    await updateDatabase(supabase, orderId, bookChapters);
    console.log(`Successfully updated database with ${bookChapters.length} chapters for order ${orderId}`);
    
    // 如果还有更多章节需要生成，通过新的API调用触发下一批
    if (batchEnd < 20) {
      console.log(`Triggering next batch generation for order ${orderId}`);
      // 使用绝对URL调用API
      let baseUrl;
      if (process.env.VERCEL_URL) {
        // Vercel 环境
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else if (process.env.VERCEL_ENV === 'production') {
        // Vercel 生产环境但没有 VERCEL_URL
        baseUrl = 'https://wishiyo.vercel.app'; // 替换为您的实际域名
      } else if (process.env.VERCEL_ENV === 'preview') {
        // Vercel 预览环境
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else {
        // 本地开发环境
        baseUrl = 'http://localhost:3000';
      }
      
      console.log(`Using base URL: ${baseUrl} for next batch API call`);
      
      try {
        const response = await fetchFunc(`${baseUrl}/api/generate-book-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            orderId,
            title: bookTitle,
            author: bookAuthor,
            format: 'Paperback' // 确保包含所有必要参数
          })
        });
        
        if (!response.ok) {
          console.error(`Error triggering next batch for order ${orderId}: ${response.status} ${response.statusText}`);
          // 尝试使用备用方法
          await triggerNextBatchWithFetch(orderId, bookTitle, bookAuthor);
        } else {
          console.log(`Successfully triggered next batch for order ${orderId}`);
        }
      } catch (error) {
        console.error(`Error calling next batch API for order ${orderId}:`, error);
        // 尝试使用备用方法
        await triggerNextBatchWithFetch(orderId, bookTitle, bookAuthor);
      }
    } else {
      // 如果已经生成了所有章节，触发PDF生成
      console.log(`All 20 chapters generated successfully for order ${orderId}, triggering PDF generation`);
      await triggerInteriorPdfGeneration(orderId, bookChapters, bookTitle, bookAuthor, supabaseUrl, supabaseServiceKey, fetchFunc);
    }
  } catch (error) {
    console.error(`Error processing batch for order ${orderId}:`, error);
    // 尝试重新触发，以便下次继续
    setTimeout(async () => {
      try {
        let baseUrl;
        if (process.env.VERCEL_URL) {
          baseUrl = `https://${process.env.VERCEL_URL}`;
        } else if (process.env.VERCEL_ENV === 'production') {
          baseUrl = 'https://wishiyo.vercel.app';
        } else if (process.env.VERCEL_ENV === 'preview') {
          baseUrl = `https://${process.env.VERCEL_URL}`;
        } else {
          baseUrl = 'http://localhost:3000';
        }
        
        console.log(`Retry using base URL: ${baseUrl} for order ${orderId}`);
        
        const response = await fetchFunc(`${baseUrl}/api/generate-book-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            orderId,
            title: bookTitle,
            author: bookAuthor,
            format: 'Paperback'
          })
        });
        
        if (!response.ok) {
          console.error(`Retry failed for order ${orderId}: ${response.status}`);
          // 最后尝试使用备用方法
          await triggerNextBatchWithFetch(orderId, bookTitle, bookAuthor);
        } else {
          console.log(`Retry succeeded for order ${orderId}`);
        }
      } catch (retryError) {
        console.error(`Failed to retry batch for order ${orderId}:`, retryError);
      }
    }, 5000); // 5秒后重试
  }
}

/**
 * 使用备用方法触发下一批生成
 * @param {string} orderId - 订单ID
 * @param {string} bookTitle - 书籍标题
 * @param {string} bookAuthor - 书籍作者
 * @returns {Promise<void>}
 */
async function triggerNextBatchWithFetch(orderId, bookTitle, bookAuthor) {
  console.log(`Attempting to trigger next batch with alternative method for order ${orderId}`);
  try {
    // 尝试使用 node-fetch 和绝对 URL
    const nodeFetch = require('node-fetch');
    const absoluteUrl = process.env.VERCEL_ENV === 'production' 
      ? 'https://wishiyo.vercel.app/api/generate-book-content'
      : 'https://wishiyo.vercel.app/api/generate-book-content'; // 使用固定的生产 URL
    
    const response = await nodeFetch(absoluteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        orderId,
        title: bookTitle,
        author: bookAuthor,
        format: 'Paperback'
      })
    });
    
    if (!response.ok) {
      console.error(`Alternative method failed for order ${orderId}: ${response.status}`);
    } else {
      console.log(`Alternative method succeeded for order ${orderId}`);
    }
  } catch (error) {
    console.error(`Error in alternative method for order ${orderId}:`, error);
  }
}

/**
 * 异步生成所有章节 - 已弃用，保留以兼容旧代码
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
  console.warn('generateAllChapters is deprecated, use processNextBatch instead');
  // 调用新的处理函数
  processNextBatch(orderId, bookTitle, bookAuthor, selectedIdea, answers, chapters, existingChapters, apiKey);
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
