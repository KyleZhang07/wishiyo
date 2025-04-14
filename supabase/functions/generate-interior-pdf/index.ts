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
    let chapters = null;
    let ideas = null;
    let selectedIdea = null;

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
      chapters = bookData.chapters;
      ideas = bookData.ideas;
      selectedIdea = bookData.selected_idea;
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

    const debugLines = false;

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
        size: 12
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
      },
      runningHeader: { // 新增样式，用于居中放大的页眉章节标题
        family: 'georgia',
        style: 'normal',
        size: 11
      }
    };

    // 设置字体和大小的辅助函数
    function setFont(type: keyof typeof fonts) {
      const font = fonts[type];
      pdf.setFont(font.family, font.style);
      pdf.setFontSize(font.size);
      // 返回以英寸为单位的行高
      return font.size / 72 * 1.5; // 1.5 是行间距因子（从1.2增加）
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
    setFont('title'); // Georgia Bold 24pt
    pdf.setTextColor(0, 0, 0);
    // 将标题上移至页面顶部附近
    pdf.text(title, pageWidth / 2, margin.top + 1.0, { align: 'center' });

    // 添加描述文本
    let descriptionText = '';

    // 如果有selectedIdea，直接使用其description
    if (selectedIdea && typeof selectedIdea === 'object' && 'description' in selectedIdea) {
      descriptionText = (selectedIdea as any).description;
    }
    // 如果没有selectedIdea但有ideas数组，尝试匹配标题
    else if (ideas && Array.isArray(ideas)) {
      // 尝试在ideas数组中找到匹配当前标题的项
      const ideasArray = ideas as Array<any>;
      const matchedIdea = ideasArray.find((idea: any) => idea && idea.title === title);
      if (matchedIdea && typeof matchedIdea === 'object' && 'description' in matchedIdea) {
        descriptionText = matchedIdea.description;
      }
    }

    // 如果找到描述文本，则显示它
    if (descriptionText) {
      setFont('body'); // Georgia Normal 12pt
      // 处理描述文本过长的情况
      const maxDescWidth = pageWidth - margin.left - margin.right - 1;
      const descLines = pdf.splitTextToSize(descriptionText, maxDescWidth);

      // 在标题下方显示描述文本，但仍然接近顶部
      const titleHeight = fonts.title.size / 72 * 1.2; // 标题行高
      let descY = margin.top + 1.0 + titleHeight + 0.3; // 标题下方0.3英寸

      pdf.text(descLines, pageWidth / 2, descY, { align: 'center' });
    }

    setFont('subtitle'); // Georgia Normal 16pt
    // 将作者下移至页面底部附近
    pdf.text(`by ${author}`, pageWidth / 2, pageHeight - margin.bottom - 1.0, { align: 'center' });

    addPage();
    setFont('copyright');
    const year = new Date().getFullYear();
    pdf.text(`Copyright © ${year} Wishiyo.com. All rights reserved.`, margin.left, margin.top + 1);

    // 第一段主要内容 - 使用splitTextToSize确保正确换行
    const firstParagraph = 'This book is created for entertainment purposes only and is intended as a gift. ' +
                          'The content within is fictional, generated by artificial intelligence, and should not ' +
                          'be taken seriously or relied upon for any factual information. It is not intended for ' +
                          'commercial use, academic purposes, or as a source of accurate knowledge.';

    const maxWidth = pageWidth - margin.left - margin.right - 0.5; // 留出一些安全边距
    const firstParaLines = pdf.splitTextToSize(firstParagraph, maxWidth);
    pdf.text(firstParaLines, margin.left, margin.top + 2);

    // 计算第一段的高度
    const lineHeight = fonts.copyright.size / 72 * 1.5; // 行高为字体大小的1.5倍（从1.3倍增加）
    const firstParaHeight = firstParaLines.length * lineHeight;

    // 第二段主要内容 - 使用splitTextToSize确保正确换行
    const secondParagraph = 'Wishiyo.com does not make any claims regarding the factual accuracy, ' +
                           'truth, or completeness of the content. The book is designed purely to bring humor ' +
                           'and joy to recipients. Use this book solely in the spirit of fun and amusement.';

    const secondParaLines = pdf.splitTextToSize(secondParagraph, maxWidth);
    pdf.text(secondParaLines, margin.left, margin.top + 2 + firstParaHeight + 0.5); // 第一段下方0.5英寸

    // 计算第二段的高度
    const secondParaHeight = secondParaLines.length * lineHeight;

    // 版本信息
    pdf.text('First edition, ' + year, margin.left, margin.top + 2 + firstParaHeight + 0.5 + secondParaHeight + 0.5);

    // 出版信息
    pdf.text('Published by Wishiyo.com', margin.left, margin.top + 2 + firstParaHeight + 0.5 + secondParaHeight + 0.5 + 0.5);

    addPage();
    // 使用更大的字号和Garamond样式的"Contents"标题
    setFont('contentsTitle');
    pdf.text('Contents', pageWidth / 2, margin.top + 0.8, { align: 'center' });

    // 设置目录内容样式
    let tocY = margin.top + 2.0; // 增加目录标题和内容之间的间距

    // 跟踪当前页码位置
    let currentPage = 4;

    // 使用chapters数据生成目录页
    if (chapters && Array.isArray(chapters)) {
      const chaptersArray = chapters as Array<any>;
      for (let i = 0; i < chaptersArray.length; i++) {
        const chapter = chaptersArray[i] as any;
        const chapterNumber = i + 1;

        // 检查目录内容是否会超出页面底部，如果会，则自然换页
        if (tocY > pageHeight - margin.bottom - 0.3) {
          addPage();
          currentPage++;
          tocY = margin.top + 1.0;
        }

        // 设置章节编号字体
        setFont('tocChapter');
        pdf.text(`Chapter ${chapterNumber}`, margin.left + 0.1, tocY);

        // 设置章节标题字体
        setFont('tocChapter');
        const chapterTitleX = margin.left + 1.2; // 调整标题的左边距以增加对齐

        // 处理标题过长的情况，确保与页码不重合
        const maxTitleWidth = pageWidth - margin.right - chapterTitleX - 0.8; // 留出空间给页码
        const titleLines = pdf.splitTextToSize(chapter.title, maxTitleWidth);

        // 只显示第一行，确保目录整洁
        pdf.text(titleLines[0], chapterTitleX, tocY);

        // 设置页码字体
        setFont('tocPageNumber');
        // 使用chapters中的startPage数据
        if (chapter.startPage) {
          pdf.text(`${chapter.startPage}`, pageWidth - margin.right, tocY, { align: 'right' });
        } else {
          pdf.text(`...`, pageWidth - margin.right, tocY, { align: 'right' });
        }

        // 增加目录行间距
        tocY += 0.55;
      }
    } else {
      // 如果没有chapters数据，则使用finalBookContent
      for (let i = 0; i < finalBookContent.length; i++) {
        const chapter: BookChapter = finalBookContent[i];

        // 检查目录内容是否会超出页面底部，如果会，则自然换页
        if (tocY > pageHeight - margin.bottom - 0.3) {
          addPage();
          currentPage++;
          tocY = margin.top + 1.0;
        }

        // 设置章节编号字体
        setFont('tocChapter');
        pdf.text(`Chapter ${chapter.chapterNumber}`, margin.left + 0.1, tocY);

        // 设置章节标题字体
        const chapterTitleX = margin.left + 1.2; // 调整标题的左边距以增加对齐

        // 处理标题过长的情况，确保与页码不重合
        const maxTitleWidth = pageWidth - margin.right - chapterTitleX - 0.8; // 留出空间给页码
        const titleLines = pdf.splitTextToSize(chapter.title, maxTitleWidth);

        // 只显示第一行，确保目录整洁
        pdf.text(titleLines[0], chapterTitleX, tocY);

        // 设置页码字体
        setFont('tocPageNumber');
        pdf.text(`...`, pageWidth - margin.right, tocY, { align: 'right' });

        // 增加目录行间距
        tocY += 0.55;
      }
    }

    // !! 页码计算逻辑需要重新审视和实现 !!
    // 当前的 currentPage 计算逻辑在目录生成时是不准确的
    // 需要在所有章节内容实际渲染完成后再回来填充目录页码

    // **添加两个空白页**
    addPage();
    addPage();

    // 重新计算第一个内容页的实际页码
    // 根据实际使用的章节数量估算目录页数
    const chapterCount = chapters && Array.isArray(chapters) ? (chapters as Array<any>).length : (Array.isArray(finalBookContent) ? finalBookContent.length : 0);
    const tocPages = chapterCount > 12 ? 2 : 1; // 估算目录页数
    const firstContentPageNumber = 1 + 1 + tocPages + 2; // 标题页(1) + 版权页(1) + 目录页数(tocPages) + 空白页(2)

    // 使用Garamond样式添加章节内容
    // 需要在渲染章节时记录每个章节开始的准确页码
    const chapterStartPages: { [key: number]: number } = {};

    finalBookContent.forEach((chapter: BookChapter) => {
      let currentPageNum = pdf.internal.getNumberOfPages(); // 获取当前文档的总页数

      // 对于任何章节，总是添加新页面，确保前一章内容不会与新章节在同一页
      addPage();
      currentPageNum++;

      // 仅对第一章确保从奇数页（右侧）开始
      if (chapter.chapterNumber === 1 && currentPageNum % 2 === 0) {
        // 如果第一章当前页是偶数（左侧），添加一页空白页，确保从奇数页开始
        addPage();
        currentPageNum++;
      }

      // 记录章节开始的 *实际* 物理页码
      chapterStartPages[chapter.chapterNumber] = pdf.internal.getNumberOfPages(); // 记录当前页为章节起始页

      // 1. 绘制 "CHAPTER X"
      setFont('chapterTitle'); // 使用 chapterTitle 样式 (size: 18)
      const chapterNumberText = `CHAPTER ${chapter.chapterNumber}`;
      // 将章节编号的Y坐标从 margin.top + 0.8 向下移动到 margin.top + 1.3
      const chapterNumberY = margin.top + 1.3; // 向下移动0.5英寸
      pdf.text(chapterNumberText, pageWidth / 2, chapterNumberY, { align: 'center' });

      // 2. 绘制换行的章节标题
      // 设置章节主标题的字体和大小 (与 chapterTitle 不同)
      pdf.setFont(fonts.title.family, fonts.title.style); // 使用 title 字体 (georgia, bold)
      pdf.setFontSize(28); // 从 24pt 增大到 28pt
      const chapterTitleText = chapter.title;
      const chapterTitleMaxWidth = pageWidth - margin.left - margin.right - 1; // 减去一些额外边距以防万一
      const chapterTitleLines = pdf.splitTextToSize(chapterTitleText, chapterTitleMaxWidth);

      const chapterTitleLineHeight = 28 / 72 * 1.5; // 基于 28pt 字体，行距因子增大到 1.5
      let chapterTitleY = chapterNumberY + 1.0; // 保持与章节编号的相对距离

      // 绘制每一行章节标题
      chapterTitleLines.forEach((line: string) => {
        pdf.text(line, pageWidth / 2, chapterTitleY, { align: 'center' });
        chapterTitleY += chapterTitleLineHeight;
      });

      // 3. 设置后续内容的起始 Y 坐标
      // 确保内容从换行后的标题下方开始，并有足够间距
      let contentY = chapterTitleY + 0.7; // 在最后一行标题下方增加 0.7 英寸间距 (从 0.5 增加)

      chapter.sections.forEach((section) => {
        // 检查是否需要新页面（为 section title 预留空间）
        const sectionTitleHeight = fonts.sectionTitle.size / 72 * 1.8; // 估算小节标题高度
        if (contentY + sectionTitleHeight > pageHeight - margin.bottom) {
          addPage();
          currentPageNum++; // 章节内容分页时增加页码

          // 在新页顶部添加居中的章节标题页眉
          setFont('runningHeader'); // 使用新样式
          // 恢复页眉原来的位置
          pdf.text(chapter.title, pageWidth / 2, margin.top - 0.2, { align: 'center' }); // 恢复原始位置

          // 不需要重新设置小节标题字体，因为下面会调用setFont('sectionTitle')

          contentY = margin.top + 0.3; // 增加顶部内容起始的安全距离，保证文本不超出上边界
        }

        // 设置小节标题样式
        // 增加小节标题前的间距，特别是非页面开头的情况
        if (contentY > margin.top + 0.3) { // 如果不是在页面顶部，则增加额外间距
          contentY += 0.2; // 在当前段落和新小节标题之间添加额外的 0.2 英寸间距（从0.3英寸减小）
        }

        setFont('sectionTitle');
        // 定义安全边距，与段落处理中相同
        const safetyMarginRight = 0.15; // 额外添加的右侧安全边距
        // 添加小标题自动换行功能
        const sectionTitleLines = pdf.splitTextToSize(section.title, pageWidth - margin.left - margin.right - safetyMarginRight);
        pdf.text(sectionTitleLines, margin.left, contentY);

        // 小标题与正文之间的间距，从 1.4 增加到 1.5
        contentY += fonts.sectionTitle.size / 72 * 1.5 + (sectionTitleLines.length - 1) * (fonts.sectionTitle.size / 72 * 1.5);

        // 设置正文内容样式为Garamond (georgia) - 移动到段落循环内
        const paragraphs = section.content.split('\n\n');

        paragraphs.forEach((paragraph) => {
          setFont('body'); // Ensure body font is set before calculations
          // 增加正文行距，将行高因子从 1.4 增加到 1.5
          const lineHeight = fonts.body.size / 72 * 1.5;
          // 将段落间距设置为与行间距相同，而不是固定值0.2英寸
          const paragraphSpacing = lineHeight;

          // 使用缩小后的有效宽度分割文本
          const textLines = pdf.splitTextToSize(paragraph, pageWidth - margin.left - margin.right - safetyMarginRight);

          let linesProcessed = 0;
          while (linesProcessed < textLines.length) {
            const availableHeight = pageHeight - margin.bottom - contentY;
            const linesThatFitCount = Math.floor((availableHeight - (linesProcessed === 0 ? paragraphSpacing : 0)) / lineHeight);

            if (linesThatFitCount <= 0 && contentY > margin.top) { // Not enough space even for one line, and not already at top
              // Add new page
              addPage();
              currentPageNum++;

              // 设置页眉字体并绘制页眉
              setFont('runningHeader');
              pdf.text(chapter.title, pageWidth / 2, margin.top - 0.2, { align: 'center' }); // 恢复原始位置

              // 重新设置回正文字体，确保跨页时字体一致
              setFont('body');

              contentY = margin.top + 0.3; // 修改为 margin.top + 0.3，确保内容不会超出上边界
              // Re-calculate lines that fit on the new empty page
              const newAvailableHeight = pageHeight - margin.bottom - contentY;
              const linesOnNewPageCount = Math.floor((newAvailableHeight - (linesProcessed === 0 ? paragraphSpacing : 0)) / lineHeight);
              const linesToDraw = textLines.slice(linesProcessed, linesProcessed + linesOnNewPageCount);

              if (linesToDraw.length > 0) {
                 // Add paragraph spacing only if it's the start of the paragraph drawing
                 const drawY = contentY + (linesProcessed === 0 ? paragraphSpacing : 0);

                 // 设置两端对齐，但使用较小的有效宽度确保内容在安全框内
                 pdf.text(linesToDraw, margin.left, drawY, { align: 'justify', maxWidth: pageWidth - margin.left - margin.right - safetyMarginRight });

                 contentY = drawY + linesToDraw.length * lineHeight;
                 linesProcessed += linesToDraw.length;
              } else {
                 // Should not happen if a full page is available, but break defensively
                 console.warn("Could not fit any lines on a new page.");
                 break;
              }
            } else {
              // Draw lines that fit on the current page
              const linesToDrawCount = Math.min(linesThatFitCount, textLines.length - linesProcessed);
              const linesToDraw = textLines.slice(linesProcessed, linesProcessed + linesToDrawCount);

              if (linesToDraw.length > 0) {
                 // Add paragraph spacing only if it's the start of the paragraph drawing on this page segment
                 const drawY = contentY + (linesProcessed === 0 ? paragraphSpacing : 0);

                 // 设置两端对齐，但使用较小的有效宽度确保内容在安全框内
                 pdf.text(linesToDraw, margin.left, drawY, { align: 'justify', maxWidth: pageWidth - margin.left - margin.right - safetyMarginRight });

                 contentY = drawY + linesToDraw.length * lineHeight;
                 linesProcessed += linesToDraw.length;
              } else {
                  // No lines fit, break (should be handled by the case above, but for safety)
                  if (contentY <= margin.top) { // If we are already at the top and still can't fit, paragraph is too big for page.
                       console.error("Paragraph segment too large to fit on a single page.");
                  }
                  break;
              }
            }
          }
        });
      });
    }); // end chapters loop

    // !! 回填目录页码 !!
    // 现在我们有了 chapterStartPages，可以回去填充目录了
    // 这需要重新访问目录页并绘制页码，实现起来比较复杂
    // 暂时保留 '...' 作为页码占位符

    // **添加6页空白页到书的末尾**
    for (let i = 0; i < 6; i++) {
      addPage();
    }

    // **添加页码和最终处理**
    const finalPageCount = pdf.internal.getNumberOfPages(); // 使用准确的页码
    const lastContentPage = finalPageCount - 6; // 最后一个内容页（减去6页空白页）

    // 从第一个 *内容* 页面开始添加页码到最后一个*内容*页面（不含最后添加的6页空白页）
    for (let i = firstContentPageNumber; i <= lastContentPage; i++) {
      pdf.setPage(i); // 切换到指定页面
      const displayPageNum = String(i - firstContentPageNumber + 1); // 计算显示的页码 (1, 2, 3...)
      setFont('pageHeaderFooter');
      // 恢复页码原来的位置
      pdf.text(displayPageNum, pageWidth - margin.right, margin.top - 0.2, { align: 'right' }); // 恢复原始位置
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
