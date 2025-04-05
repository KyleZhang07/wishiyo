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

    // 添加字体
    function addFonts(pdf: any) {
      // 添加标准字体，包括Garamond
      pdf.addFont('helvetica', 'normal');
      pdf.addFont('helvetica', 'bold');
      pdf.addFont('times', 'normal');
      pdf.addFont('times', 'bold');
      pdf.addFont('georgia', 'normal'); // 作为Garamond的替代，因为jsPDF标准版本没有直接支持Garamond
      pdf.addFont('georgia', 'bold');
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

    // 添加字体
    addFonts(pdf);

    // 设置页边距
    const margin = {
      top: 0.5 + bleed,
      right: 0.5 + bleed,
      bottom: 0.5 + bleed,
      left: 0.5 + bleed
    };

    const debugLines = true;

    // 更新字体设置为Garamond风格（用Georgia作为近似替代）
    const fonts = {
      title: {
        family: 'georgia',
        style: 'bold',
        size: 24
      },
      subtitle: {
        family: 'georgia',
        style: 'normal',
        size: 16
      },
      chapterTitle: {
        family: 'georgia',
        style: 'bold',
        size: 18
      },
      contentsTitle: {
        family: 'georgia',
        style: 'bold',
        size: 28 // 更大的目录标题，如图所示
      },
      sectionTitle: {
        family: 'georgia',
        style: 'bold',
        size: 14
      },
      body: {
        family: 'georgia',
        style: 'normal',
        size: 12
      },
      copyright: {
        family: 'georgia',
        style: 'normal',
        size: 10
      },
      tocChapter: {
        family: 'georgia',
        style: 'normal', // 目录中的章节标题使用斜体，更符合图片中的样式
        size: 12
      },
      tocPageNumber: {
        family: 'georgia',
        style: 'normal',
        size: 12
      },
      pageHeaderFooter: { // 新增样式用于页眉页脚
        family: 'georgia',
        style: 'normal',
        size: 10
      }
    };

    // 设置字体和大小的辅助函数
    function setFont(type: keyof typeof fonts) {
      const font = fonts[type];
      pdf.setFont(font.family, font.style);
      pdf.setFontSize(font.size);
      // 返回以英寸为单位的行高
      return font.size / 72 * 1.2; // 1.2 是行间距因子
    }

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
    setFont('title');
    pdf.setTextColor(0, 0, 0);
    pdf.text(title, pageWidth / 2, pageHeight * 0.3, { align: 'center' });

    setFont('subtitle');
    pdf.text(`by ${author}`, pageWidth / 2, pageHeight * 0.8, { align: 'center' });

    addPage();
    setFont('copyright');
    const year = new Date().getFullYear();
    pdf.text(`Copyright ${year} by ${author}`, margin.left, margin.top + 1);
    pdf.text('All rights reserved.', margin.left, margin.top + 1.3);
    pdf.text('This is a work of fiction. Names, characters, places, and incidents either are the', margin.left, margin.top + 2);
    pdf.text('product of the author\'s imagination or are used fictitiously.', margin.left, margin.top + 2.3);

    addPage();
    // 使用更大的字号和Garamond样式的"Contents"标题
    setFont('contentsTitle');
    pdf.text('Contents', pageWidth / 2, margin.top + 0.8, { align: 'center' });
    
    // 设置目录内容样式
    let tocY = margin.top + 2.0; // 增加目录标题和内容之间的间距
    
    // 跟踪当前页码位置
    let currentPage = 4;

    // 使用 for 循环处理目录项，以便于分页
    for (let i = 0; i < finalBookContent.length; i++) {
      const chapter: BookChapter = finalBookContent[i];

      // 在第12个条目后且总条目数大于12时，添加新页并重置Y坐标
      if (i === 12 && finalBookContent.length > 12) {
        addPage();
        currentPage++; // 目录现在占用两页
        tocY = margin.top + 1.0; // 重置第二页目录的起始Y坐标
      }

      // 检查目录内容是否会超出页面底部，如果会，则换页 (以防单页目录也溢出)
      // 增加检查条件，确保在分页点之后也检查溢出
      if (tocY > pageHeight - margin.bottom - 0.3 && i !== 12 ) {
         // 如果不是恰好在第12个元素后分页，且内容溢出，则正常添加新页
         // (如果恰好是第12个元素后分页，上面的逻辑已经处理了分页)
        addPage();
        currentPage++;
        tocY = margin.top + 1.0;
      }

      // 设置章节编号字体
      setFont('tocChapter');
      pdf.text(`Chapter ${chapter.chapterNumber}`, margin.left + 0.1, tocY);
      
      // 设置章节标题字体
      const chapterTitleX = margin.left + 1.2; // 调整标题的左边距以增加对齐
      pdf.text(`${chapter.title}`, chapterTitleX, tocY);
      
      // 设置页码字体
      setFont('tocPageNumber');
      // !! 注意：这里的页码计算需要修正，现在只是占位符 !!
      // 准确的页码计算需要在内容完全渲染后才能确定，暂时使用估算值
      // const estimatedChapterStartPage = currentPage + i; // 这是一个非常粗略的估算
      // pdf.text(`${estimatedChapterStartPage}`, pageWidth - margin.right, tocY, { align: 'right' });
      // 暂时移除页码，因为准确计算复杂
       pdf.text(`...`, pageWidth - margin.right, tocY, { align: 'right' });

      // 增加目录行间距，使其更宽松，符合图片
      tocY += 0.6; // 从 0.4 增加到 0.6
    }

    // !! 页码计算逻辑需要重新审视和实现 !!
    // 当前的 currentPage 计算逻辑在目录生成时是不准确的
    // 需要在所有章节内容实际渲染完成后再回来填充目录页码

    // 确保章节从偶数页开始
    // 需要基于准确的目录页数调整起始章节页码
    const tocPages = finalBookContent.length > 12 ? 2 : 1;
    let startingContentPage = 2 + tocPages + 1; // 标题页(1), 版权页(1), 目录页数(tocPages) + 1
    if (startingContentPage % 2 !== 0) {
       addPage(); // 添加空白页以确保从偶数页开始
       // currentPage++; // 更新当前页码计数器 - 需要更可靠的页码管理
    }

    // 使用Garamond样式添加章节内容
    // 需要在渲染章节时记录每个章节开始的准确页码
    const chapterStartPages: { [key: number]: number } = {};
    let currentContentPage = startingContentPage; // 使用调整后的起始页码

    finalBookContent.forEach((chapter: BookChapter) => {
      // 如果不是第一章且当前页不是偶数页，则添加空白页 (确保章节从右侧页面开始)
      // 注意：需要一个更健壮的页码跟踪系统
      if (chapter.chapterNumber > 1 && currentContentPage % 2 !== 0) {
         addPage();
         currentContentPage++;
      } else if (chapter.chapterNumber === 1 && currentContentPage % 2 === 0) {
         // 如果第一章在左侧页（偶数页），则添加一个空白页移到右侧
         addPage();
         currentContentPage++;
      }

      addPage(); // 为章节内容添加新页
      chapterStartPages[chapter.chapterNumber] = currentContentPage; // 记录章节起始页码

      // 1. 绘制 "CHAPTER X"
      setFont('chapterTitle'); // 使用 chapterTitle 样式 (size: 18)
      const chapterNumberText = `CHAPTER ${chapter.chapterNumber}`;
      const chapterNumberY = margin.top + 0.8; // 调整 Y 坐标，使其更靠上，类似图片
      pdf.text(chapterNumberText, pageWidth / 2, chapterNumberY, { align: 'center' });

      // 2. 绘制换行的章节标题
      // 设置章节主标题的字体和大小 (与 chapterTitle 不同)
      pdf.setFont(fonts.title.family, fonts.title.style); // 使用 title 字体 (georgia, bold)
      pdf.setFontSize(24); // 明确设置字体大小为 24pt
      const chapterTitleText = chapter.title;
      const chapterTitleMaxWidth = pageWidth - margin.left - margin.right - 1; // 减去一些额外边距以防万一
      const chapterTitleLines = pdf.splitTextToSize(chapterTitleText, chapterTitleMaxWidth);
      
      const chapterTitleLineHeight = 24 / 72 * 1.2; // 行高 (基于24pt字体)
      let chapterTitleY = chapterNumberY + 0.7; // 在 "CHAPTER X" 下方开始绘制，增加间距

      // 绘制每一行章节标题
      chapterTitleLines.forEach((line: string) => {
        pdf.text(line, pageWidth / 2, chapterTitleY, { align: 'center' });
        chapterTitleY += chapterTitleLineHeight;
      });

      // 3. 设置后续内容的起始 Y 坐标
      // 确保内容从换行后的标题下方开始，并有足够间距
      let contentY = chapterTitleY + 0.5; // 在最后一行标题下方增加 0.5 英寸间距

      chapter.sections.forEach((section) => {
        // 检查是否需要新页面（为 section title 预留空间）
        const sectionTitleHeight = fonts.sectionTitle.size / 72 * 1.8; // 估算小节标题高度
        if (contentY + sectionTitleHeight > pageHeight - margin.bottom) {
          addPage();
          currentContentPage++; // 章节内容分页时增加页码
          // 在新页顶部添加章节标题页眉
          setFont('pageHeaderFooter');
          pdf.text(chapter.title, margin.left, margin.top - 0.2); // 页眉放左上角
          contentY = margin.top; // 新页面从顶部开始
        }
        
        // 设置小节标题样式
        setFont('sectionTitle');
        pdf.text(section.title, margin.left, contentY);
        contentY += fonts.sectionTitle.size / 72 * 1.8; // 增加标题后的间距
        
        // 设置正文内容样式为Garamond (georgia) - 移动到段落循环内
        const paragraphs = section.content.split('\n\n');
        
        paragraphs.forEach((paragraph) => {
          // 计算当前段落需要的空间
          const textLines = pdf.splitTextToSize(paragraph, pageWidth - margin.left - margin.right);
          const paragraphHeight = textLines.length * (fonts.body.size / 72 * 1.2) + 0.2;
          
          // 如果当前段落无法完全放入当前页面，添加新页面
          if (contentY + paragraphHeight > pageHeight - margin.bottom) {
            addPage();
            currentContentPage++; // 章节内容分页时增加页码
            // 在新页顶部添加章节标题页眉
            setFont('pageHeaderFooter');
            pdf.text(chapter.title, margin.left, margin.top - 0.2); // 页眉放左上角
            contentY = margin.top;
          }
          
          // 在绘制每个段落前确保设置正确的正文字体
          setFont('body');
          // 添加 align: 'justify' 来尝试实现两端对齐
          pdf.text(textLines, margin.left, contentY, { align: 'justify' });
          
          // 更精确地计算段落后的垂直位置
          contentY += paragraphHeight;
        });
      });

      // 完成一个章节的渲染后，需要更新 currentContentPage
      // 但 addPage() 内部没有直接返回页码，需要外部管理
      currentContentPage = pdf.internal.getNumberOfPages(); // 获取当前总页数作为下一章的起始页码参考
    }); // end chapters loop

    // !! 回填目录页码 !!
    // 现在我们有了 chapterStartPages，可以回去填充目录了
    // 这需要重新访问目录页并绘制页码，实现起来比较复杂
    // 暂时保留 '...' 作为页码占位符

    // **添加页码和最终处理**
    const finalPageCount = pdf.internal.getNumberOfPages(); // 使用准确的页码
    const firstChapterPage = chapterStartPages[1] || startingContentPage; // Chapter 1 开始的物理页码

    // 从第一章开始添加页码到最后一页
    for (let i = firstChapterPage; i <= finalPageCount; i++) {
      pdf.setPage(i); // 切换到指定页面
      const displayPageNum = String(i - firstChapterPage + 1); // 计算显示的页码 (1, 2, 3...)
      setFont('pageHeaderFooter');
      pdf.text(displayPageNum, pageWidth - margin.right, margin.top - 0.2, { align: 'right' }); // 页码放右上角
    }

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
    // const pageCount = finalBookContent.length * 5; // 旧的粗略计算
    const updateData: any = {
      interior_pdf: pdfOutput,
      page_count: finalPageCount // 使用上面已声明的 finalPageCount
    };
    
    if (interiorFileUrl) {
      updateData.interior_source_url = interiorFileUrl;
    }
    
    updateData.ready_for_printing = true;
    
    // 查询当前书籍状态，检查封面PDF是否已生成
    const { data: bookData, error: fetchError } = await supabase
      .from('funny_biography_books')
      .select('cover_source_url, status')
      .eq('order_id', orderId)
      .single();
    
    if (fetchError) {
      console.error(`Error fetching book data:`, fetchError);
    } else {
      // 如果封面PDF已生成，将状态更新为"已完成"
      if (bookData?.cover_source_url) {
        updateData.status = 'completed';
        console.log(`Cover PDF already generated, updating book status to 'completed'`);
      } else {
        console.log(`Cover PDF not yet generated, keeping current status: ${bookData?.status || 'unknown'}`);
      }
    }
    
    const { error: updateError } = await supabase
      .from('funny_biography_books')
      .update(updateData)
      .eq('order_id', orderId);
    
    if (updateError) {
      console.error(`Error updating database:`, updateError);
    } else {
      console.log(`Database updated successfully with interior-pdf, interior_source_url, and marked as ready for printing with ${finalPageCount} pages`); // 使用准确页码
      if (updateData.status === 'completed') {
        console.log(`Book status updated to 'completed'`);
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
