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
    const { frontCover, spine, backCover } = req.body;

    if (!frontCover || !spine || !backCover) {
      throw new Error('Front cover, spine, and back cover are required');
    }

    console.log('Generating cover PDF...');
    
    // 启动Puppeteer
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    
    const page = await browser.newPage();
    
    // 设置HTML模板
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Book Cover</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            display: flex;
            height: 100vh;
            width: 100vw;
          }
          .book-cover {
            display: flex;
            height: 9in;
            width: 18in; /* Combined width for back, spine, front */
          }
          .back-cover {
            width: 6in;
            height: 9in;
            background-image: url('${backCover}');
            background-size: cover;
            background-position: center;
          }
          .spine {
            width: 0.75in; /* Spine width */
            height: 9in;
            background-image: url('${spine}');
            background-size: cover;
            background-position: center;
          }
          .front-cover {
            width: 6in;
            height: 9in;
            background-image: url('${frontCover}');
            background-size: cover;
            background-position: center;
          }
        </style>
      </head>
      <body>
        <div class="book-cover">
          <div class="back-cover"></div>
          <div class="spine"></div>
          <div class="front-cover"></div>
        </div>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // 生成PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true
    });
    
    // 将PDF编码为base64
    const pdfOutput = pdfBuffer.toString('base64');
    console.log('Cover PDF generated successfully');
    
    // 将PDF上传到Supabase Storage (可选)
    // const supabaseUrl = process.env.SUPABASE_URL;
    // const supabaseKey = process.env.SUPABASE_ANON_KEY;
    // const supabase = createClient(supabaseUrl, supabaseKey);
    // const { data, error } = await supabase.storage.from('pdfs').upload(`covers/${Date.now()}.pdf`, pdfBuffer, {
    //   contentType: 'application/pdf',
    //   upsert: true
    // });
    
    return res.status(200).json({
      success: true,
      pdfOutput: pdfOutput
    });
  } catch (error) {
    console.error('Error generating cover PDF:', error);
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
} 