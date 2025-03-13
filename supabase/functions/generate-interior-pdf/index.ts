import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import { autoTable } from "https://esm.sh/jspdf-autotable@3.8.1";
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

// Define book chapter structure to match the output from generate-book-content
interface BookChapter {
  chapterNumber: number;
  title: string;
  sections: {
    sectionNumber: number;
    title: string;
    content: string;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, bookContent, bookTitle, authorName } = await req.json();

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    console.log(`Generating interior PDF for order ${orderId}`);

    // 获取Supabase连接信息
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    // 初始化Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 从数据库直接获取图书数据（如果未提供）
    let finalBookContent = bookContent;
    let title = bookTitle;
    let author = authorName;

    if (!finalBookContent || !title || !author) {
      console.log(`Fetching book data for order ${orderId} from database to get missing info`);
      const { data: bookData, error: fetchError } = await supabase
        .from('funny_biography_books')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch book data: ${fetchError.message}`);
      }

      finalBookContent = finalBookContent || bookData.book_content;
      title = title || bookData.title;
      author = author || bookData.author;
    }
    
    if (!title || !author || !finalBookContent) {
      throw new Error('Incomplete book data for PDF generation');
    }

    // 将PDF上传到存储桶并返回公共URL
    async function uploadPdfToStorage(pdfData: string, fileName: string): Promise<string> {
      try {
        console.log(`Uploading ${fileName} to storage...`);
        
        // 检查存储桶是否存在
        const { data: buckets, error: bucketsError } = await supabase
          .storage
          .listBuckets();
        
        const bucketExists = buckets?.some(bucket => bucket.name === 'book-covers');
        
        // 如果存储桶不存在，则创建
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
        
        // 从base64 Data URI中提取PDF数据
        let pdfContent = pdfData;
        let contentType = 'application/pdf';
        
        if (pdfData.startsWith('data:')) {
          const parts = pdfData.split(',');
          if (parts.length > 1) {
            const matches = parts[0].match(/^data:([^;]+);base64$/);
            if (matches && matches[1]) {
              contentType = matches[1];
            }
            pdfContent = parts[1];
          }
        }
        
        // 将base64转换为Uint8Array
        const binaryString = atob(pdfContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        // 上传到Supabase Storage
        const filePath = `${orderId}/${fileName}`;
        console.log(`Uploading to book-covers/${filePath}`);
        const { error: uploadError } = await supabase
          .storage
          .from('book-covers')
          .upload(filePath, bytes, {
            contentType,
            upsert: true
          });
        
        if (uploadError) {
          const errorText = uploadError.message;
          throw new Error(`Failed to upload PDF: ${errorText}`);
        }
        
        console.log(`PDF uploaded successfully to storage`);
        
        // 获取公共URL
        const { data: urlData } = supabase
          .storage
          .from('book-covers')
          .getPublicUrl(filePath);
        
        const publicUrl = urlData?.publicUrl || '';
        console.log(`Generated URL: ${publicUrl}`);
        
        return publicUrl;
      } catch (error) {
        console.error(`Error uploading PDF to storage:`, error);
        console.error(error.stack || error); // 打印完整错误栈
        return '';
      }
    }

    // Create a new PDF - US Trade (6x9 inches) with bleed
    const bleed = 0.125; // 0.125 inches bleed
    const pageWidth = 6 + (bleed * 2);
    const pageHeight = 9 + (bleed * 2);
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [pageWidth, pageHeight]
    });

    // Set up safety margins
    const margin = {
      top: 0.5 + bleed,
      right: 0.5 + bleed,
      bottom: 0.5 + bleed,
      left: 0.5 + bleed
    };

    // Set up font to ensure embedding
    pdf.setFont('Helvetica', 'normal');
    
    // Function to add a page with proper margins and bleed
    const addPage = () => {
      pdf.addPage([pageWidth, pageHeight]);
    };

    // Add title page
    pdf.setFontSize(24);
    pdf.text(title, pageWidth / 2, pageHeight / 3, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.text(`by ${author}`, pageWidth / 2, pageHeight / 3 + 0.5, { align: 'center' });

    // Add copyright page
    addPage();
    pdf.setFontSize(10);
    const year = new Date().getFullYear();
    pdf.text(`Copyright © ${year} by ${author}`, margin.left, margin.top + 1);
    pdf.text('All rights reserved.', margin.left, margin.top + 1.3);
    pdf.text('This is a work of fiction. Names, characters, places, and incidents either are the', margin.left, margin.top + 2);
    pdf.text('product of the author\'s imagination or are used fictitiously.', margin.left, margin.top + 2.3);

    // Add table of contents page
    addPage();
    pdf.setFontSize(18);
    pdf.text('Table of Contents', pageWidth / 2, margin.top + 0.5, { align: 'center' });
    
    pdf.setFontSize(12);
    let tocY = margin.top + 1.2;
    
    // Keeping track of current page number for TOC
    let currentPage = 4; // Starting page for content (after title, copyright, TOC)
    
    finalBookContent.forEach((chapter: BookChapter) => {
      pdf.text(`Chapter ${chapter.chapterNumber}: ${chapter.title}`, margin.left, tocY);
      pdf.text(`${currentPage}`, pageWidth - margin.right, tocY, { align: 'right' });
      tocY += 0.3;
      
      // Each chapter will have at least one page, plus we estimate one page per 500 words
      // This is just an estimate for TOC page numbers
      const estimatedSectionPages = chapter.sections.reduce((total, section) => {
        const wordCount = section.content.split(/\s+/).length;
        return total + Math.ceil(wordCount / 500);
      }, 0);
      
      currentPage += Math.max(1, estimatedSectionPages);
    });

    // Add blank page if needed to make content start on right-hand page
    if (currentPage % 2 !== 0) {
      addPage(); // Add blank page
      currentPage++;
    }

    // Process and add chapter content
    finalBookContent.forEach((chapter: BookChapter) => {
      // Start each chapter on a new page
      addPage();
      
      // Chapter title
      pdf.setFontSize(18);
      pdf.text(`Chapter ${chapter.chapterNumber}`, pageWidth / 2, margin.top + 0.5, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text(chapter.title, pageWidth / 2, margin.top + 1, { align: 'center' });
      
      let contentY = margin.top + 1.5;
      
      // Process chapter sections
      chapter.sections.forEach((section) => {
        // Add section title
        pdf.setFontSize(14);
        pdf.text(section.title, margin.left, contentY);
        contentY += 0.4;
        
        // Process section content with word wrapping
        pdf.setFontSize(12);
        
        // Split content into paragraphs
        const paragraphs = section.content.split('\n\n');
        
        paragraphs.forEach((paragraph) => {
          // Check if we need a new page
          if (contentY > pageHeight - margin.bottom) {
            addPage();
            contentY = margin.top;
          }
          
          // Create wrapped text
          const textLines = pdf.splitTextToSize(paragraph, pageWidth - margin.left - margin.right);
          
          // Add text to PDF
          pdf.text(textLines, margin.left, contentY);
          
          // Move Y position down based on text height
          contentY += (textLines.length * 0.2) + 0.2; // 0.2 inch line height + paragraph spacing
        });
      });
    });

    // Convert PDF to base64
    const pdfOutput = pdf.output('datauristring');
    
    // 上传PDF到存储桶
    console.log(`Uploading interior PDF to storage...`);
    const interiorFileUrl = await uploadPdfToStorage(pdfOutput, 'interior.pdf');
    
    if (!interiorFileUrl) {
      console.warn('Failed to upload interior PDF to storage, but will continue with database update');
    } else {
      console.log(`Interior PDF uploaded successfully to storage with URL: ${interiorFileUrl}`);
    }
    
    // 更新数据库，包含PDF数据和URL
    console.log(`Updating database for order ${orderId} with interiorPdf and interior_source_url`);
    const updateData: any = {
      interior_pdf: pdfOutput
    };
    
    if (interiorFileUrl) {
      updateData.interior_source_url = interiorFileUrl;
    }
    
    const { error: updateError } = await supabase
      .from('funny_biography_books')
      .update(updateData)
      .eq('order_id', orderId);
    
    if (updateError) {
      console.error(`Error updating database:`, updateError);
    } else {
      console.log(`Database updated successfully with interiorPdf${interiorFileUrl ? ' and interior_source_url' : ''}`);
    }
    
    // 检查是否可以将图书设置为准备打印
    if (interiorFileUrl) {
      const { data: bookData, error: bookError } = await supabase
        .from('funny_biography_books')
        .select('cover_source_url,book_content')
        .eq('order_id', orderId)
        .single();
      
      if (!bookError && bookData && bookData.cover_source_url) {
        console.log(`Both cover and interior PDFs available, setting book ready for printing`);
        const pageCount = finalBookContent.length * 5; // 简单估算每章5页
        
        const { error: readyError } = await supabase
          .from('funny_biography_books')
          .update({
            ready_for_printing: true,
            page_count: pageCount
          })
          .eq('order_id', orderId);
        
        if (readyError) {
          console.error(`Error setting book ready for printing:`, readyError);
        } else {
          console.log(`Book marked as ready for printing with estimated ${pageCount} pages`);
        }
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Interior PDF generated successfully',
        pdfOutput: pdfOutput,
        interiorSourceUrl: interiorFileUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating interior PDF:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
