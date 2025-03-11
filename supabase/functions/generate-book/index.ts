import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 为每一章生成内容
async function generateChapterContent(
  openAIApiKey: string,
  authorName: string,
  bookTitle: string,
  selectedIdea: any,
  answers: any[],
  chapter: any,
  chapterIndex: number
) {
  const prompt = `
Write chapter ${chapterIndex + 1} titled "${chapter.title}" for a humorous biography book about ${authorName}. 
The book is titled "${bookTitle}" and follows this theme: "${selectedIdea?.description || 'A funny biography'}".

Chapter description: ${chapter.description}

Background information about ${authorName}:
${answers?.map((qa: any) => `- ${qa.question}: ${qa.answer}`).join('\n') || 'No specific details provided'}

Create 4 sections for this chapter:
1. A catchy section title
2. A catchy section title
3. A catchy section title
4. A catchy section title

Each section should:
- Be 400-500 words
- Be humorous and entertaining
- Include fictional anecdotes and stories that fit the theme
- Make witty observations and comedic insights
- Maintain a consistent narrative voice

Format the response as a JSON object with the following structure:
{
  "title": "Chapter ${chapterIndex + 1}: ${chapter.title}",
  "sections": [
    {
      "title": "Section 1 Title",
      "content": "Section 1 content..."
    },
    {
      "title": "Section 2 Title",
      "content": "Section 2 content..."
    },
    {
      "title": "Section 3 Title",
      "content": "Section 3 content..."
    },
    {
      "title": "Section 4 Title",
      "content": "Section 4 content..."
    }
  ]
}
`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openAIApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a creative AI assistant that writes humorous biography chapters.
                    Create 4 sections for the chapter, each with a catchy title and 400-500 words of entertaining content.
                    The content should be funny, engaging, and maintain a consistent narrative voice.
                    Return only valid JSON in the exact format specified.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  let generatedText = data.choices[0].message.content;
  
  // Clean the response and parse JSON
  try {
    // Remove any markdown formatting if present
    generatedText = generatedText.replace(/```json\n?|\n?```/g, '').trim();
    const chapterContent = JSON.parse(generatedText);
    
    return chapterContent;
  } catch (e) {
    console.error("Error parsing OpenAI response:", e);
    throw new Error("Failed to parse chapter content");
  }
}

// 生成内页PDF
async function generateInteriorPDF(
  bookTitle: string,
  authorName: string,
  chapters: any[],
  format: string
) {
  console.log("Starting interior PDF generation");
  
  // 启动浏览器
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    
    // 设置页面大小为标准6x9英寸（加0.125英寸出血边距）
    // 根据format不同，可以调整页面大小
    const pageWidth = format === 'hardcover' ? 6.25 : 6.25; // 6x9英寸格式，加上0.125边距
    const pageHeight = format === 'hardcover' ? 9.25 : 9.25;
    
    await page.setViewport({
      width: Math.round(pageWidth * 96), // 转换为像素（假设96DPI）
      height: Math.round(pageHeight * 96),
      deviceScaleFactor: 4, // 提高分辨率，确保300DPI以上
    });
    
    // 生成HTML内容
    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${bookTitle}</title>
      <style>
        @page {
          size: ${pageWidth}in ${pageHeight}in;
          margin: 0.5in;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
          margin: 0;
          padding: 0;
        }
        .title-page {
          text-align: center;
          padding-top: 3in;
        }
        .title-page h1 {
          font-size: 24pt;
          margin-bottom: 1in;
        }
        .title-page h2 {
          font-size: 18pt;
        }
        .copyright-page {
          font-size: 10pt;
          text-align: center;
          padding-top: 6in;
        }
        .chapter {
          page-break-before: always;
        }
        .chapter-title {
          font-size: 18pt;
          text-align: center;
          margin-bottom: 1in;
          padding-top: 1in;
        }
        .section-title {
          font-size: 14pt;
          margin-top: 0.5in;
          margin-bottom: 0.25in;
        }
        p {
          text-indent: 0.25in;
          margin: 0 0 0.25in 0;
          text-align: justify;
        }
      </style>
    </head>
    <body>
      <!-- 标题页 -->
      <div class="title-page">
        <h1>${bookTitle}</h1>
        <h2>By ${authorName}</h2>
      </div>
      
      <!-- 版权页 -->
      <div class="copyright-page">
        <p>Copyright ${new Date().getFullYear()} ${authorName}</p>
        <p>All rights reserved.</p>
        <p>Generated with Wishiyo</p>
      </div>
    `;
    
    // 添加章节内容
    for (const chapter of chapters) {
      htmlContent += `
      <div class="chapter">
        <h2 class="chapter-title">${chapter.title}</h2>
      `;
      
      for (const section of chapter.sections) {
        htmlContent += `
        <h3 class="section-title">${section.title}</h3>
        ${section.content.split('\n\n').map(p => `<p>${p}</p>`).join('')}
        `;
      }
      
      htmlContent += `</div>`;
    }
    
    htmlContent += `</body></html>`;
    
    // 设置页面内容
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // 生成PDF - 符合LuluPress要求
    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: `${pageWidth}in`,
      height: `${pageHeight}in`,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      preferCSSPageSize: true, // 使用CSS定义的页面大小
    });
    
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

// 生成封面PDF
async function generateCoverPDF(
  bookTitle: string,
  authorName: string,
  frontCoverCanvas: string,
  spineCanvas: string,
  backCoverCanvas: string,
  format: string,
  pageCount: number
) {
  console.log("Starting cover PDF generation");
  
  // 启动浏览器
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    
    // 计算封面尺寸 (根据LuluPress标准，包括0.125英寸出血)
    let coverWidth, coverHeight, spineWidth;
    
    // 6x9英寸格式
    coverWidth = 6.25; // 6英寸 + 0.125英寸出血边距 x 2
    coverHeight = 9.25; // 9英寸 + 0.125英寸出血边距 x 2
    
    // 计算书脊宽度 (根据页数)
    // 假设标准黑白页面每100页约0.25英寸厚度
    spineWidth = Math.max(0.1, (pageCount / 100) * 0.25);
    
    // 总宽度 = 封底宽度 + 书脊宽度 + 封面宽度
    const totalWidth = (coverWidth * 2) + spineWidth;
    
    await page.setViewport({
      width: Math.round(totalWidth * 96), // 转换为像素
      height: Math.round(coverHeight * 96),
      deviceScaleFactor: 4, // 提高分辨率，确保300DPI以上
    });
    
    // 生成HTML内容
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${bookTitle} - Cover</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          display: flex;
          width: ${totalWidth}in;
          height: ${coverHeight}in;
        }
        #back-cover {
          width: ${coverWidth}in;
          height: ${coverHeight}in;
          overflow: hidden;
        }
        #spine {
          width: ${spineWidth}in;
          height: ${coverHeight}in;
          overflow: hidden;
        }
        #front-cover {
          width: ${coverWidth}in;
          height: ${coverHeight}in;
          overflow: hidden;
        }
        img {
          max-width: 100%;
          max-height: 100%;
        }
      </style>
    </head>
    <body>
      <div id="back-cover">
        <img src="${backCoverCanvas}" />
      </div>
      <div id="spine">
        <img src="${spineCanvas}" />
      </div>
      <div id="front-cover">
        <img src="${frontCoverCanvas}" />
      </div>
    </body>
    </html>
    `;
    
    // 设置页面内容
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // 生成PDF - 符合LuluPress要求
    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: `${totalWidth}in`,
      height: `${coverHeight}in`,
      margin: {
        top: '0in',
        right: '0in',
        bottom: '0in',
        left: '0in'
      },
    });
    
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

// 将PDF上传到Supabase Storage
async function uploadPdfToStorage(
  supabase: any,
  orderId: string,
  pdfBuffer: Uint8Array,
  fileType: 'interior' | 'cover'
) {
  const fileName = `${orderId}_${fileType}.pdf`;
  const filePath = `books/${orderId}/${fileName}`;
  
  const { data, error } = await supabase
    .storage
    .from('book-pdfs')
    .upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });
  
  if (error) {
    throw new Error(`Error uploading ${fileType} PDF: ${error.message}`);
  }
  
  // 获取公共URL
  const { data: publicUrlData } = supabase
    .storage
    .from('book-pdfs')
    .getPublicUrl(filePath);
  
  return {
    path: filePath,
    url: publicUrlData.publicUrl
  };
}

serve(async (req) => {
  // 处理CORS预检请求
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 获取请求数据
    const {
      orderId,
      productId,
      title,
      format = 'softcover',
      shipping = null,
      customerEmail = null,
      paymentStatus = 'pending',
      localStorageData
    } = await req.json();

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    console.log("Received order:", orderId, productId, title);

    // 初始化Supabase客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 获取OpenAI API密钥
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // 获取书籍数据
    const bookData = localStorageData || {};
    
    // 提取书籍数据
    const {
      authorName = "Unknown Author",
      bookTitle = title || "My Funny Biography",
      selectedIdea = { description: "A humorous life story" },
      answers = [],
      tableOfContents = [],
      // 获取封面画布数据
      frontCoverCanvas = bookData.frontCoverCanvas || "",
      spineCanvas = bookData.spineCanvas || "",
      backCoverCanvas = bookData.backCoverCanvas || ""
    } = bookData;

    console.log("Starting book generation for:", {
      orderId,
      authorName,
      bookTitle
    });

    // 如果没有目录，则创建一个基本目录
    let chapters = tableOfContents;
    if (!chapters || chapters.length === 0) {
      throw new Error("Table of contents is required");
    }

    // 为测试，只生成前两章
    const chaptersToGenerate = chapters.slice(0, 2);
    const generatedChapters = [];

    // 生成各章内容
    for (let i = 0; i < chaptersToGenerate.length; i++) {
      console.log(`Generating content for chapter ${i + 1}: ${chaptersToGenerate[i].title}`);
      
      try {
        const chapterContent = await generateChapterContent(
          openAIApiKey,
          authorName,
          bookTitle,
          selectedIdea,
          answers,
          chaptersToGenerate[i],
          i
        );
        
        generatedChapters.push(chapterContent);
        console.log(`Chapter ${i + 1} generated successfully`);
      } catch (error) {
        console.error(`Error generating chapter ${i + 1}:`, error);
        throw new Error(`Failed to generate chapter ${i + 1}: ${error.message}`);
      }
    }

    // 生成内页PDF
    let interiorPdfBuffer;
    try {
      interiorPdfBuffer = await generateInteriorPDF(
        bookTitle,
        authorName,
        generatedChapters,
        format
      );
      console.log("Interior PDF generated successfully");
    } catch (error) {
      console.error("Error generating interior PDF:", error);
      throw new Error(`Failed to generate interior PDF: ${error.message}`);
    }
    
    // 生成封面PDF
    let coverPdfBuffer;
    try {
      if (!frontCoverCanvas || !spineCanvas || !backCoverCanvas) {
        throw new Error("Missing cover canvas data");
      }
      
      coverPdfBuffer = await generateCoverPDF(
        bookTitle,
        authorName,
        frontCoverCanvas,
        spineCanvas,
        backCoverCanvas,
        format,
        generatedChapters.length * 20 // 估算页数，每章约20页
      );
      console.log("Cover PDF generated successfully");
    } catch (error) {
      console.error("Error generating cover PDF:", error);
      throw new Error(`Failed to generate cover PDF: ${error.message}`);
    }
    
    // 上传PDF到Supabase存储
    let interiorPdfUrl, coverPdfUrl;
    try {
      // 上传内页PDF
      const interiorResult = await uploadPdfToStorage(
        supabase,
        orderId,
        interiorPdfBuffer,
        'interior'
      );
      interiorPdfUrl = interiorResult.url;
      console.log("Interior PDF uploaded:", interiorPdfUrl);
      
      // 上传封面PDF
      const coverResult = await uploadPdfToStorage(
        supabase,
        orderId,
        coverPdfBuffer,
        'cover'
      );
      coverPdfUrl = coverResult.url;
      console.log("Cover PDF uploaded:", coverPdfUrl);
    } catch (error) {
      console.error("Error uploading PDFs:", error);
      throw new Error(`Failed to upload PDFs: ${error.message}`);
    }

    // 创建书籍记录
    const { data: bookRecord, error: bookError } = await supabase
      .from('books')
      .insert({
        order_id: orderId,
        title: bookTitle,
        author: authorName,
        format: format || 'softcover',
        status: 'generated',
        customer_email: customerEmail,
        shipping_details: shipping,
        payment_status: paymentStatus || 'pending',
        pdf_interior_url: interiorPdfUrl,
        pdf_cover_url: coverPdfUrl,
        product_id: productId
      })
      .select()
      .single();

    if (bookError) {
      throw new Error(`Error saving book record: ${bookError.message}`);
    }

    console.log("Book generation completed and saved to database:", bookRecord.id);

    return new Response(
      JSON.stringify({
        success: true,
        book_id: bookRecord.id,
        order_id: orderId,
        message: "Book generated successfully with PDFs",
        interior_pdf_url: interiorPdfUrl,
        cover_pdf_url: coverPdfUrl
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-book function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}); 