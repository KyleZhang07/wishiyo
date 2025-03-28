import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import { autoTable } from "https://esm.sh/jspdf-autotable@3.8.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

// CORS 头设置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, bookContent, bookTitle, authorName } = await req.json();

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    console.log(`Generating interior PDF for order ${orderId}`);

    // 获取 Supabase 凭证
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
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
        throw new Error(`Failed to fetch book data: ${fetchError.message}`);
      }

      finalBookContent = finalBookContent || bookData.book_content;
      title = title || bookData.title;
      author = author || bookData.author;
    }
    
    if (!title || !author || !finalBookContent) {
      throw new Error('Incomplete book data for PDF generation');
    }

    async function uploadPdfToStorage(pdfData: string, fileName: string): Promise<string> {
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
        
        const binaryString = atob(pdfContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
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
        
        const { data: urlData } = supabase
          .storage
          .from('book-covers')
          .getPublicUrl(filePath);
        
        const publicUrl = urlData?.publicUrl || '';
        console.log(`Generated URL: ${publicUrl}`);
        
        return publicUrl;
      } catch (error) {
        console.error(`Error uploading PDF to storage:`, error);
        console.error(error.stack || error);
        return '';
      }
    }

    // 设置页面出血和尺寸
    const bleed = 0.125;
    const pageWidth = 6 + (bleed * 2);
    const pageHeight = 9 + (bleed * 2);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [pageWidth, pageHeight]
    });

    // 设置页边距
    const margin = {
      top: 0.5 + bleed,
      right: 0.5 + bleed,
      bottom: 0.5 + bleed,
      left: 0.5 + bleed
    };

    const debugLines = true;

    // 添加新页面的函数
    const addPage = () => {
      pdf.addPage([pageWidth, pageHeight]);
      
      if (debugLines) {
        pdf.setDrawColor(0, 162, 232);
        pdf.setLineWidth(0.01);
        pdf.rect(0, 0, pageWidth, pageHeight);
        
        pdf.setDrawColor(0, 0, 255);
        pdf.rect(bleed, bleed, 6, 9);
        
        pdf.setDrawColor(255, 0, 0);
        pdf.rect(bleed + 0.5, bleed + 0.5, 5, 8);
        
        pdf.setFontSize(6);
        pdf.setTextColor(0, 162, 232);
        pdf.text('TRIM / BLEED AREA', pageWidth/2, 0.1, { align: 'center' });
        pdf.text('TRIM / BLEED AREA', pageWidth/2, pageHeight - 0.05, { align: 'center' });
        
        pdf.setTextColor(100, 100, 100);
        pdf.text('SAFETY MARGIN', pageWidth/2, 0.25 + bleed, { align: 'center' });
        pdf.text('SAFETY MARGIN', pageWidth/2, pageHeight - 0.25 - bleed, { align: 'center' });
      }
    };

    // 添加标题页
    pdf.setFontSize(24);
    pdf.setTextColor(0, 0, 0);
    pdf.text(title, pageWidth / 2, pageHeight / 3, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.text(`by ${author}`, pageWidth / 2, pageHeight / 3 + 0.5, { align: 'center' });

    addPage();
    pdf.setFontSize(10);
    const year = new Date().getFullYear();
    pdf.text(`Copyright © ${year} by ${author}`, margin.left, margin.top + 1);
    pdf.text('All rights reserved.', margin.left, margin.top + 1.3);
    pdf.text('This is a work of fiction. Names, characters, places, and incidents either are the', margin.left, margin.top + 2);
    pdf.text('product of the author\'s imagination or are used fictitiously.', margin.left, margin.top + 2.3);

    addPage();
    pdf.setFontSize(18);
    pdf.text('Table of Contents', pageWidth / 2, margin.top + 0.5, { align: 'center' });
    
    pdf.setFontSize(12);
    let tocY = margin.top + 1.2;
    
    let currentPage = 4;

    finalBookContent.forEach((chapter: BookChapter) => {
      pdf.text(`Chapter ${chapter.chapterNumber}: ${chapter.title}`, margin.left, tocY);
      pdf.text(`${currentPage}`, pageWidth - margin.right, tocY, { align: 'right' });
      tocY += 0.3;
      
      const estimatedSectionPages = chapter.sections.reduce((total, section) => {
        const wordCount = section.content.split(/\s+/).length;
        return total + Math.ceil(wordCount / 500);
      }, 0);
      
      currentPage += Math.max(1, estimatedSectionPages);
    });

    // 确保章节从偶数页开始
    if (currentPage % 2 !== 0) {
      addPage();
      currentPage++;
    }

    // 添加章节内容
    finalBookContent.forEach((chapter: BookChapter) => {
      addPage();
      
      pdf.setFontSize(18);
      pdf.text(`Chapter ${chapter.chapterNumber}`, pageWidth / 2, margin.top + 0.5, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text(chapter.title, pageWidth / 2, margin.top + 1, { align: 'center' });
      
      let contentY = margin.top + 1.5;
      
      chapter.sections.forEach((section) => {
        pdf.setFontSize(14);
        pdf.text(section.title, margin.left, contentY);
        contentY += 0.4;
        
        pdf.setFontSize(12);
        
        const paragraphs = section.content.split('\n\n');
        
        paragraphs.forEach((paragraph) => {
          if (contentY > pageHeight - margin.bottom) {
            addPage();
            contentY = margin.top;
          }
          
          const textLines = pdf.splitTextToSize(paragraph, pageWidth - margin.left - margin.right);
          
          pdf.text(textLines, margin.left, contentY);
          
          contentY += (textLines.length * 0.2) + 0.2;
        });
      });
    });

    // 生成 PDF 输出
    const pdfOutput = pdf.output('datauristring');
    
    console.log(`Uploading interior PDF to storage...`);
    const interiorFileUrl = await uploadPdfToStorage(pdfOutput, 'interior.pdf');
    
    if (!interiorFileUrl) {
      console.warn('Failed to upload interior PDF to storage, but will continue with database update');
    } else {
      console.log(`Interior PDF uploaded successfully to storage with URL: ${interiorFileUrl}`);
    }
    
    // 更新数据库
    const pageCount = finalBookContent.length * 5;
    const updateData: any = {
      interior_pdf: pdfOutput
    };
    
    if (interiorFileUrl) {
      updateData.interior_source_url = interiorFileUrl;
    }
    
    updateData.ready_for_printing = true;
    updateData.page_count = pageCount;
    
    const { error: updateError } = await supabase
      .from('funny_biography_books')
      .update(updateData)
      .eq('order_id', orderId);
    
    if (updateError) {
      console.error(`Error updating database:`, updateError);
    } else {
      console.log(`Database updated successfully with interior-pdf, interior_source_url, and marked as ready for printing with ${pageCount} pages`);
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
