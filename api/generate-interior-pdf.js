import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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

/**
 * 生成内页PDF的API端点
 */
export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { orderId, bookContent, bookTitle, authorName } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }

    console.log(`Generating interior PDF for order ${orderId}`);

    // 获取环境变量
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, error: 'Missing Supabase credentials' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let finalBookContent = bookContent;
    let title = bookTitle;
    let author = authorName;

    // 如果未提供内容，从数据库获取
    if (!finalBookContent || !title || !author) {
      console.log(`Fetching book data for order ${orderId} from database to get missing info`);
      const { data: bookData, error: fetchError } = await supabase
        .from('funny_biography_books')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (fetchError) {
        return res.status(404).json({ 
          success: false, 
          error: `Failed to fetch book data: ${fetchError.message}` 
        });
      }

      finalBookContent = finalBookContent || bookData.book_content;
      title = title || bookData.title;
      author = author || bookData.author;
    }
    
    if (!title || !author || !finalBookContent) {
      return res.status(400).json({ 
        success: false, 
        error: 'Incomplete book data for PDF generation' 
      });
    }

    async function uploadPdfToStorage(pdfData, fileName) {
      try {
        console.log(`Uploading ${fileName} to storage...`);
        
        const { data: buckets, error: bucketsError } = await supabase
          .storage
          .listBuckets();
        
        const bucketExists = buckets?.some(bucket => bucket.name === 'book-covers');
        
        if (!bucketExists) {
          console.log(`Storage bucket 'book-covers' does not exist, creating...`);
          const { error: createBucketError } = await supabase
            .storage
            .createBucket('book-covers', {
              public: true
            });
          
          if (createBucketError) {
            console.error(`Failed to create storage bucket:`, createBucketError);
            throw createBucketError;
          } else {
            console.log(`Storage bucket 'book-covers' created successfully`);
          }
        }
        
        // 将PDF数据转换为Buffer
        const pdfBuffer = Buffer.from(pdfData.split(',')[1], 'base64');
        
        // 上传PDF文件
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('book-covers')
          .upload(`pdfs/${fileName}`, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          });
        
        if (uploadError) {
          console.error(`Failed to upload PDF:`, uploadError);
          throw uploadError;
        }
        
        console.log(`PDF uploaded successfully:`, uploadData);
        
        // 获取公共URL
        const { data: publicUrlData } = supabase
          .storage
          .from('book-covers')
          .getPublicUrl(`pdfs/${fileName}`);
        
        const publicUrl = publicUrlData.publicUrl;
        console.log(`Public URL for PDF:`, publicUrl);
        
        return publicUrl;
      } catch (error) {
        console.error(`Error uploading PDF to storage:`, error);
        throw error;
      }
    }

    // 设置页面出血和尺寸
    const bleed = 0.125;
    const pageWidth = 6 + (bleed * 2);
    const pageHeight = 9 + (bleed * 2);
    
    // 创建PDF文档
    console.log('Creating interior PDF document');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [pageWidth, pageHeight]
    });
    
    // 设置字体和边距
    const margin = 0.75 + bleed; // 0.75英寸边距加上出血
    const textWidth = pageWidth - (margin * 2);
    const lineHeight = 0.25; // 行高
    
    // 添加新页面的函数
    function addPage() {
      pdf.addPage([pageWidth, pageHeight]);
      
      // 添加页面调试线（仅在开发时使用）
      const debugLines = false;
      if (debugLines) {
        // 出血区域
        pdf.setDrawColor(0, 162, 232); // 浅蓝色
        pdf.setLineWidth(0.01);
        pdf.rect(0, 0, pageWidth, pageHeight);
        
        // 裁切线
        pdf.setDrawColor(255, 0, 0); // 红色
        pdf.rect(bleed, bleed, pageWidth - (bleed * 2), pageHeight - (bleed * 2));
        
        // 安全区域
        pdf.setDrawColor(0, 255, 0); // 绿色
        pdf.rect(margin, margin, textWidth, pageHeight - (margin * 2));
      }
    }

    // 添加标题页
    pdf.setFontSize(24);
    pdf.setTextColor(0, 0, 0);
    pdf.text(title, pageWidth / 2, pageHeight / 3, { align: 'center' });
    
    // 添加作者
    pdf.setFontSize(16);
    pdf.text(`By ${author}`, pageWidth / 2, pageHeight / 3 + 0.5, { align: 'center' });
    
    // 添加版权页
    addPage();
    pdf.setFontSize(10);
    const copyrightText = `© ${new Date().getFullYear()} ${author}\nAll rights reserved.\n\nThis is a work of humor. Names, characters, businesses, places, events, and incidents are either the products of the author's imagination or used in a fictitious manner. Any resemblance to actual persons, living or dead, or actual events is purely coincidental.\n\nProduced by Wishiyo\nwww.wishiyo.com`;
    pdf.text(copyrightText, margin, margin + lineHeight);
    
    // 添加目录页
    addPage();
    pdf.setFontSize(18);
    pdf.text('Table of Contents', pageWidth / 2, margin, { align: 'center' });
    
    pdf.setFontSize(12);
    let tocY = margin + 0.75;
    
    // 排序章节
    const sortedChapters = [...finalBookContent].sort((a, b) => a.chapterNumber - b.chapterNumber);
    
    // 生成目录
    sortedChapters.forEach(chapter => {
      pdf.text(`Chapter ${chapter.chapterNumber}: ${chapter.title}`, margin, tocY);
      tocY += lineHeight;
    });
    
    // 添加章节内容
    sortedChapters.forEach(chapter => {
      addPage();
      
      // 章节标题
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Chapter ${chapter.chapterNumber}`, pageWidth / 2, margin, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.text(chapter.title, pageWidth / 2, margin + lineHeight, { align: 'center' });
      
      let contentY = margin + (lineHeight * 3);
      
      // 添加章节内容
      if (chapter.sections && Array.isArray(chapter.sections)) {
        chapter.sections.forEach(section => {
          // 添加小节标题
          pdf.setFontSize(14);
          pdf.setTextColor(0, 0, 0);
          
          // 检查是否需要新页面
          if (contentY > pageHeight - margin) {
            addPage();
            contentY = margin;
          }
          
          pdf.text(section.title, margin, contentY);
          contentY += lineHeight;
          
          // 添加小节内容
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 0);
          
          // 分段处理内容
          const paragraphs = section.content.split('\n\n');
          paragraphs.forEach(paragraph => {
            if (paragraph.trim() === '') return;
            
            // 使用splitTextToSize将文本拆分为适合页面宽度的行
            const lines = pdf.splitTextToSize(paragraph, textWidth);
            
            // 检查是否需要新页面
            if (contentY + (lines.length * lineHeight) > pageHeight - margin) {
              addPage();
              contentY = margin;
            }
            
            // 添加段落
            pdf.text(lines, margin, contentY);
            contentY += lines.length * lineHeight + 0.2; // 段落间距
          });
          
          // 小节之间添加额外空间
          contentY += lineHeight * 0.5;
        });
      } else {
        // 如果没有小节，直接添加章节内容
        pdf.setFontSize(12);
        pdf.text('Content not available for this chapter.', margin, contentY);
      }
    });
    
    // 添加页码
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text(String(i), pageWidth / 2, pageHeight - (margin / 2), { align: 'center' });
    }
    
    // 将PDF转换为base64
    console.log('Converting PDF to base64');
    const pdfOutput = pdf.output('datauristring');
    
    // 上传PDF到Supabase存储
    console.log('Uploading PDF to Supabase storage');
    const fileName = `interior_${orderId}_${Date.now()}.pdf`;
    const interiorSourceUrl = await uploadPdfToStorage(pdfOutput, fileName);
    
    // 更新数据库中的内页PDF URL和状态
    console.log('Updating database with interior PDF URL');
    const { error: updateError } = await supabase
      .from('funny_biography_books')
      .update({ 
        interior_pdf: interiorSourceUrl,
        interior_source_url: interiorSourceUrl,
        status: 'completed',
        ready_for_printing: true,
        page_count: totalPages
      })
      .eq('order_id', orderId);
    
    if (updateError) {
      console.error('Error updating database:', updateError);
      return res.status(500).json({ 
        success: false, 
        error: `Error updating database: ${updateError.message}` 
      });
    }
    
    // 触发打印请求检查
    try {
      console.log('Triggering print request check for newly completed order...');
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
      
      fetch(`${baseUrl}/api/order-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          autoSubmit: true
        })
      }).catch(error => {
        console.error('Error triggering print request check:', error);
      });
    } catch (printCheckError) {
      console.error('Error triggering print request check:', printCheckError);
      // 不中断处理流程
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Interior PDF generated successfully',
      interiorPdfUrl: interiorSourceUrl,
      interiorSourceUrl,
      pageCount: totalPages
    });
  } catch (error) {
    console.error('Error in generate-interior-pdf:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'An unknown error occurred' 
    });
  }
}
