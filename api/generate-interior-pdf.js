import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

export default async function handler(req, res) {
  // 处理CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  let browser;
  try {
    const { orderId } = req.body;

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    console.log(`Generating interior PDF for order ${orderId}...`);
    
    // 初始化Supabase客户端
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 查询书籍数据
    const { data: books, error: queryError } = await supabase
      .from('funny_biography_books')
      .select('*')
      .eq('order_id', orderId);

    if (queryError) {
      console.error('Error querying book data:', queryError);
      throw queryError;
    }

    if (!books || books.length === 0) {
      throw new Error(`No book found with order ID: ${orderId}`);
    }

    const book = books[0];
    const bookContent = book.book_content || {};
    const title = book.title || 'Untitled Book';
    const author = book.author || 'Unknown Author';
    const content = bookContent.content || '';
    
    if (!content) {
      throw new Error('Book content is missing');
    }
    
    // 启动Puppeteer
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    
    const page = await browser.newPage();
    
    // 将内容格式化为HTML
    const formattedContent = formatContent(content);
    
    // 设置HTML模板
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page {
            margin: 1in;
            size: 6in 9in;
          }
          body {
            font-family: 'Georgia', serif;
            font-size: 12pt;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            color: #333;
          }
          .book-container {
            max-width: 4in;
            margin: 0 auto;
          }
          .title-page {
            text-align: center;
            margin: 2in 0;
          }
          .title-page h1 {
            font-size: 24pt;
            margin-bottom: 0.5in;
          }
          .title-page h2 {
            font-size: 18pt;
            font-weight: normal;
          }
          .chapter {
            margin-top: 1in;
            page-break-before: always;
          }
          .chapter:first-of-type {
            page-break-before: avoid;
          }
          .chapter h2 {
            font-size: 18pt;
            text-align: center;
            margin-bottom: 0.5in;
          }
          p {
            text-indent: 0.25in;
            margin: 0.5em 0;
            text-align: justify;
          }
        </style>
      </head>
      <body>
        <div class="book-container">
          <div class="title-page">
            <h1>${title}</h1>
            <h2>by ${author}</h2>
          </div>
          ${formattedContent}
        </div>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // 生成PDF
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '1in', right: '1in', bottom: '1in', left: '1in' },
      preferCSSPageSize: true
    });
    
    // 将PDF编码为base64
    const pdfOutput = pdfBuffer.toString('base64');
    console.log('Interior PDF generated successfully');
    
    return res.status(200).json({
      success: true,
      pdfOutput: pdfOutput
    });
  } catch (error) {
    console.error('Error generating interior PDF:', error);
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 格式化内容为HTML的辅助函数
function formatContent(content) {
  // 检查内容是否已经包含HTML标记
  if (content.includes('<chapter>') || content.includes('<h2>')) {
    return content;
  }
  
  // 尝试识别章节格式（假设每章以"Chapter X:"或类似格式开头）
  const chapterPattern = /Chapter\s+(\d+|[A-Z]+|[IVXLCDM]+)[\s:\-]+(.+?)(?=\n|$)/gi;
  let formattedContent = content.replace(chapterPattern, '<div class="chapter"><h2>Chapter $1: $2</h2>');
  
  // 如果没有找到章节格式，尝试使用其他常见标题格式
  if (!formattedContent.includes('<div class="chapter">')) {
    const titlePattern = /^\s*([A-Z][^.!?]*[.!?]?)(?:\n|\r\n?)/gm;
    formattedContent = content.replace(titlePattern, '<div class="chapter"><h2>$1</h2>');
  }
  
  // 如果仍未找到章节，将整个内容作为单个章节
  if (!formattedContent.includes('<div class="chapter">')) {
    formattedContent = `<div class="chapter"><h2>My Story</h2>${content}</div>`;
  }
  
  // 将段落转换为HTML段落
  formattedContent = formattedContent.replace(/\n\s*\n/g, '</p><p>');
  
  // 确保所有段落都被正确包装
  if (!formattedContent.includes('<p>')) {
    formattedContent = `<p>${formattedContent}</p>`;
  }
  
  // 闭合所有章节div
  formattedContent = formattedContent.replace(/<div class="chapter">/g, '</div><div class="chapter">');
  formattedContent = formattedContent.substring(6) + '</div>'; // 移除第一个闭合标签并添加最后一个闭合标签
  
  return formattedContent;
} 