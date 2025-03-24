import { createClient } from '@supabase/supabase-js';
import nodeFetch from 'node-fetch';

// 环境变量
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * 处理批量生成书籍章节的请求
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
    const { orderId, title, author, batchNumber, existingChapters } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: orderId'
      });
    }

    console.log(`Processing batch ${batchNumber} for order ${orderId}, existing chapters: ${existingChapters}`);

    // 初始化Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 从数据库获取书籍数据
    console.log(`Fetching book data for order ${orderId} from database`);
    const { data, error: fetchError } = await supabase
      .from('funny_biography_books')
      .select('*')
      .eq('order_id', orderId);

    if (fetchError) {
      throw new Error(`Failed to fetch book data: ${fetchError.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error(`No book data found for order ID: ${orderId}`);
    }

    // 使用第一条记录
    const bookData = data[0];
    
    // 获取书籍内容和其他必要数据
    const bookTitle = title || bookData.title;
    const bookAuthor = author || bookData.author;
    const selected_idea = bookData.selected_idea;
    const answers = bookData.answers;
    const chapters = bookData.chapters;
    
    // 获取已有章节
    let bookChapters = [];
    if (bookData.book_content && Array.isArray(bookData.book_content) && bookData.book_content.length > 0) {
      bookChapters = [...bookData.book_content];
    }
    
    // 如果已经有完整内容，直接返回成功
    if (bookChapters.length >= 20) {
      return res.status(200).json({
        success: true,
        message: 'Book content already exists',
        chaptersCount: bookChapters.length
      });
    }

    // 使用 nodeFetch 或全局 fetch
    const fetchFunc = typeof fetch !== 'undefined' ? fetch : nodeFetch;
    
    // 计算本批次的起始和结束章节
    const startChapter = bookChapters.length + 1;
    const endChapter = Math.min(startChapter + 4, 20); // 每批5章，但不超过20章
    
    console.log(`Generating chapters ${startChapter} to ${endChapter} for order ${orderId}`);
    
    // 生成本批次的章节
    for (let i = startChapter; i <= endChapter; i++) {
      console.log(`Generating chapter ${i} content...`);
      const chapter = await generateChapter(i, bookTitle, bookAuthor, selected_idea, answers, chapters, OPENAI_API_KEY, fetchFunc);
      bookChapters.push(chapter);
    }
    
    // 更新数据库
    await updateDatabase(supabase, orderId, bookChapters);
    
    // 如果还有更多章节需要生成，触发下一批
    if (bookChapters.length < 20) {
      // 使用绝对URL调用自身API来处理下一批章节
      const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
      fetchFunc(`${baseUrl}/api/generate-book-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          title: bookTitle,
          author: bookAuthor,
          batchNumber: batchNumber + 1,
          existingChapters: bookChapters.length
        })
      }).catch(error => {
        console.error(`Error triggering next batch for order ${orderId}:`, error);
      });
      
      return res.status(200).json({
        success: true,
        message: `Batch ${batchNumber} completed, triggered next batch`,
        chaptersGenerated: bookChapters.length
      });
    } else {
      // 所有章节已生成完成，触发PDF生成
      console.log(`All 20 chapters generated for order ${orderId}, triggering PDF generation`);
      await triggerInteriorPdfGeneration(orderId, bookChapters, bookTitle, bookAuthor, supabaseUrl, supabaseServiceKey, fetchFunc);
      
      return res.status(200).json({
        success: true,
        message: 'All chapters generated, PDF generation triggered',
        chaptersGenerated: bookChapters.length
      });
    }
    
  } catch (error) {
    console.error('Error processing batch:', error);
    return res.status(500).json({
      success: false,
      error: `Internal server error: ${error.message}`
    });
  }
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
 * @returns {Promise<Object>} - 生成的章节对象
 */
async function generateChapter(chapterNumber, bookTitle, bookAuthor, selectedIdea, answers, chapters, apiKey, fetchFunc) {
  try {
    const chapterInfo = chapters.find(c => c.number === chapterNumber) || {
      title: `Chapter ${chapterNumber}`,
      sections: [`Section ${chapterNumber}.1`, `Section ${chapterNumber}.2`, `Section ${chapterNumber}.3`]
    };
    
    const chapterTitle = chapterInfo.title;
    const sections = [];
    
    // 为每个小节生成内容
    for (let i = 0; i < chapterInfo.sections.length; i++) {
      const sectionTitle = chapterInfo.sections[i];
      const sectionContent = await generateSectionContent(
        chapterNumber,
        chapterTitle,
        sectionTitle,
        i + 1,
        bookTitle,
        bookAuthor,
        selectedIdea,
        answers,
        apiKey,
        fetchFunc
      );
      
      sections.push({
        title: sectionTitle,
        content: sectionContent
      });
    }
    
    return {
      number: chapterNumber,
      title: chapterTitle,
      sections: sections
    };
  } catch (error) {
    console.error(`Error generating chapter ${chapterNumber}:`, error);
    // 返回一个带有错误信息的章节对象
    return {
      number: chapterNumber,
      title: `Chapter ${chapterNumber} (Error)`,
      sections: [{
        title: 'Error',
        content: `Failed to generate content: ${error.message}`
      }],
      error: error.message
    };
  }
}

/**
 * 生成小节内容
 * @param {number} chapterNumber - 章节编号
 * @param {string} chapterTitle - 章节标题
 * @param {string} sectionTitle - 小节标题
 * @param {number} sectionNumber - 小节编号
 * @param {string} bookTitle - 书籍标题
 * @param {string} bookAuthor - 书籍作者
 * @param {Object} selectedIdea - 选定的创意
 * @param {Array} answers - 用户问题回答
 * @param {string} apiKey - OpenAI API密钥
 * @param {Function} fetchFunc - Fetch函数
 * @returns {Promise<string>} - 生成的小节内容
 */
async function generateSectionContent(
  chapterNumber,
  chapterTitle,
  sectionTitle,
  sectionNumber,
  bookTitle,
  bookAuthor,
  selectedIdea,
  answers,
  apiKey,
  fetchFunc
) {
  const prompt = `
    You are writing a section for a humorous biography book titled "${bookTitle}" by ${bookAuthor}.
    
    Book theme: ${selectedIdea.title}
    Book description: ${selectedIdea.description}
    
    User information:
    ${answers.map(a => `- ${a.question}: ${a.answer}`).join('\n')}
    
    You are currently writing Chapter ${chapterNumber}: "${chapterTitle}", Section ${sectionNumber}: "${sectionTitle}".
    
    Write an engaging, humorous, and conversational section that's approximately 300-400 words. 
    The content should be entertaining, include dialogue, and maintain a light-hearted tone.
    Make sure the content flows naturally from previous sections and chapters.
    
    Do not include the chapter title or section title in your response.
    Just write the section content directly.
  `;
  
  try {
    const response = await fetchFunc('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional comedy writer specializing in humorous biographies.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }
    
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Error generating section content:`, error);
    throw error;
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
  try {
    console.log(`Updating database with ${bookChapters.length} chapters for order ${orderId}`);
    
    const { error } = await supabase
      .from('funny_biography_books')
      .update({
        book_content: bookChapters,
        status: bookChapters.length >= 20 ? 'completed' : 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);
    
    if (error) {
      throw new Error(`Failed to update database: ${error.message}`);
    }
    
    console.log(`Database updated successfully for order ${orderId}`);
  } catch (error) {
    console.error(`Error updating database:`, error);
    throw error;
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
  try {
    console.log(`Triggering interior PDF generation for order ${orderId}`);
    
    // 这里可以添加调用PDF生成服务的代码
    // 例如，调用另一个API端点或Supabase函数
    
    // 更新数据库状态为"PDF生成中"
    const supabase = createClient(supabaseUrl, supabaseKey);
    await supabase
      .from('funny_biography_books')
      .update({
        status: 'generating_pdf',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);
    
    console.log(`Interior PDF generation triggered for order ${orderId}`);
  } catch (error) {
    console.error(`Error triggering PDF generation:`, error);
    throw error;
  }
}
