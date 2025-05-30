import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";
import { autoTable } from "https://esm.sh/jspdf-autotable@3.8.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";
import { submitPrintRequest } from "./submit-print-request.ts";

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

    // 初始化Supabase客户端，确保不设置全局Content-Type头
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false
      }
    });

    let finalBookContent = bookContent;
    let title = bookTitle;
    let author = authorName;
    let chapters = null;

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

        if (pdfData.startsWith('data:')) {
          const parts = pdfData.split(',');
          if (parts.length > 1) {
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
        // 创建Blob对象，明确设置MIME类型
        const pdfBlob = new Blob([bytes], { type: 'application/pdf' });

        // 使用Blob上传，不再设置contentType参数
        const { error: uploadError } = await supabase
          .storage
          .from('book-covers')
          .upload(filePath, pdfBlob, {
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
    async function addFonts(pdf: any) {
      // 注意：不需要显式添加标准字体，它们已经内置在 jsPDF 中

      // 加载并嵌入 EB Garamond 字体
      try {
        await loadAndEmbedFont(
          pdf,
          'EBGaramond',
          'https://hbkgbggctzvqffqfrmhl.supabase.co/storage/v1/object/public/fonts/EBGaramond-Regular.ttf',
          'normal'
        );
        await loadAndEmbedFont(
          pdf,
          'EBGaramond',
          'https://hbkgbggctzvqffqfrmhl.supabase.co/storage/v1/object/public/fonts/EBGaramond-Bold.ttf',
          'bold'
        );
        console.log('EB Garamond 字体加载并嵌入成功');
        return true;
      } catch (error) {
        console.warn('加载 EB Garamond 字体失败，将使用标准字体:', error);
        return false;
      }
    }

    // 加载并嵌入字体
    async function loadAndEmbedFont(
      doc: any,
      fontName: string,              // 自定义字体名称
      fontUrl: string,               // 字体文件 URL
      fontStyle: string = 'normal'   // 字体样式
    ) {
      try {
        // 1. 拉取字体文件
        console.log(`加载字体: ${fontName} ${fontStyle} 从 ${fontUrl}`);
        const res = await fetch(fontUrl);
        if (!res.ok) throw new Error(`Failed to load font ${fontUrl}: ${res.status} ${res.statusText}`);
        const buffer = new Uint8Array(await res.arrayBuffer());

        // 2. 转 Base64
        console.log(`转换字体为Base64: ${fontName} ${fontStyle}`);
        const binary = Array.from(buffer)
          .map((b) => String.fromCharCode(b))
          .join("");
        const base64 = btoa(binary);

        // 3. 注册到 VFS（虚拟文件系统）
        const fileName = `${fontName}-${fontStyle}.ttf`;
        console.log(`添加字体到VFS: ${fileName}`);
        doc.addFileToVFS(fileName, base64);

        // 4. 声明字体
        console.log(`注册字体: ${fontName} ${fontStyle}`);
        doc.addFont(fileName, fontName, fontStyle);

        return true;
      } catch (error) {
        console.error(`加载字体失败 ${fontName} ${fontStyle}:`, error);
        throw error;
      }
    }

    // 设置页面出血和尺寸
    const bleed = 0.125;
    const pageWidth = 6 + (bleed * 2);
    const pageHeight = 9 + (bleed * 2);

    // 字体加载状态
    let customFontsLoaded = false;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'in',
      format: [pageWidth, pageHeight]
    });

    // 异步加载字体
    try {
      // 异步加载字体
      customFontsLoaded = await addFonts(pdf);
      if (customFontsLoaded) {
        console.log('自定义字体加载成功，将使用 EB Garamond 字体');
      } else {
        console.log('使用标准字体');
      }
    } catch (fontError) {
      console.warn('自定义字体加载失败，将使用备用字体:', fontError);
      customFontsLoaded = false;
    }

    // 设置页边距
    // 基础边距
    const baseMargin = {
      top: 0.5 + bleed,
      bottom: 0.5 + bleed,
      inner: 0.75 + bleed, // 装订侧更大的边距
      outer: 0.5 + bleed   // 外侧边距
    };

    // 获取特定页码的边距（用于正文和标题）
    function getPageMargins(pageNum: number) {
      // 奇数页（右页）：左侧为内侧（装订侧）
      // 偶数页（左页）：右侧为内侧（装订侧）
      const isRightPage = pageNum % 2 === 1;

      // 奇数页（右页）的正文和标题与右边距更近
      // 通过增加左边距和减少右边距来实现
      // 偶数页的正文不偏移
      const pageOffset = 0.18; // 偏移量为0.18英寸

      return {
        top: baseMargin.top,
        bottom: baseMargin.bottom,
        left: isRightPage ? baseMargin.inner + pageOffset : baseMargin.outer, // 只有奇数页增加左边距
        right: isRightPage ? baseMargin.outer - pageOffset : baseMargin.inner // 只有奇数页减少右边距
      };
    }

    // 获取特定页码的边距（用于页眉和页码）
    // 页眉和页码不需要偏移，保持原来的边距
    function getHeaderMargins(pageNum: number) {
      const isRightPage = pageNum % 2 === 1;
      return {
        top: baseMargin.top,
        bottom: baseMargin.bottom,
        left: isRightPage ? baseMargin.inner : baseMargin.outer,
        right: isRightPage ? baseMargin.outer : baseMargin.inner
      };
    }

    // 初始页边距（将在每页渲染时动态调整）
    const margin = getPageMargins(1);

    const debugLines = false;

    // 更新字体设置为 EB Garamond 风格
    const fonts = {
      title: {
        family: 'EBGaramond', // 使用嵌入的 EB Garamond 字体
        style: 'bold',
        size: 24
      },
      subtitle: {
        family: 'EBGaramond',
        style: 'normal',
        size: 16
      },
      chapterTitle: {
        family: 'EBGaramond',
        style: 'bold',
        size: 18
      },
      contentsTitle: {
        family: 'EBGaramond',
        style: 'bold',
        size: 28 // 更大的目录标题，如图所示
      },
      sectionTitle: {
        family: 'EBGaramond',
        style: 'bold',
        size: 12
      },
      body: {
        family: 'EBGaramond',
        style: 'normal',
        size: 12
      },
      copyright: {
        family: 'EBGaramond',
        style: 'normal',
        size: 10
      },
      tocChapter: {
        family: 'EBGaramond',
        style: 'normal', // 目录中的章节标题使用斜体，更符合图片中的样式
        size: 12
      },
      tocPageNumber: {
        family: 'EBGaramond',
        style: 'normal',
        size: 12
      },
      pageHeaderFooter: { // 新增样式用于页眉页脚
        family: 'EBGaramond',
        style: 'normal',
        size: 10
      },
      runningHeader: { // 新增样式，用于居中放大的页眉章节标题
        family: 'EBGaramond',
        style: 'normal',
        size: 11
      }
    };

    // 备用字体设置，如果自定义字体加载失败则使用这些
    const fallbackFonts = {
      title: {
        family: 'times',
        style: 'bold',
        size: 24
      },
      subtitle: {
        family: 'times',
        style: 'normal',
        size: 16
      },
      chapterTitle: {
        family: 'times',
        style: 'bold',
        size: 18
      },
      contentsTitle: {
        family: 'times',
        style: 'bold',
        size: 28
      },
      sectionTitle: {
        family: 'times',
        style: 'bold',
        size: 12
      },
      body: {
        family: 'times',
        style: 'normal',
        size: 12
      },
      copyright: {
        family: 'times',
        style: 'normal',
        size: 10
      },
      tocChapter: {
        family: 'times',
        style: 'normal',
        size: 12
      },
      tocPageNumber: {
        family: 'times',
        style: 'normal',
        size: 12
      },
      pageHeaderFooter: {
        family: 'times',
        style: 'normal',
        size: 10
      },
      runningHeader: {
        family: 'times',
        style: 'normal',
        size: 11
      }
    };



    // 设置字体和大小的辅助函数
    function setFont(type: keyof typeof fonts) {
      // 根据字体加载状态选择使用主字体或备用字体
      const font = customFontsLoaded ? fonts[type] : fallbackFonts[type];
      pdf.setFont(font.family, font.style);
      pdf.setFontSize(font.size);
      // 返回以英寸为单位的行高
      return font.size / 72 * 1.6; // 1.6 是行间距因子（从1.5增加）
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
    // 获取当前页的动态边距
    // 注意：标题页使用固定布局，不需要动态边距

    setFont('title'); // Georgia Bold 24pt
    pdf.setTextColor(0, 0, 0);
    // 将标题下移到页面中部
    const titleY = pageHeight / 2 - 1.0; // 页面中部偏上一点
    // 将标题向右偏移0.18英寸
    const titleOffset = 0.18;
    const titleX = pageWidth / 2 + titleOffset;
    pdf.text(title, titleX, titleY, { align: 'center' });

    // 完全取消 selected_idea 逻辑

    setFont('subtitle'); // Georgia Normal 16pt
    // 将作者上移，位于标题下方
    const authorY = titleY + 3.0; // 标题下方3英寸（从1英寸增加）
    // 作者名称也使用相同的偏移
    pdf.text(`by ${author}`, titleX, authorY, { align: 'center' });

    addPage();
    // 获取当前页的动态边距
    const copyrightPageNum = pdf.internal.getNumberOfPages();
    const copyrightMargins = getPageMargins(copyrightPageNum);

    setFont('copyright');
    const year = new Date().getFullYear();
    pdf.text(`Copyright © ${year} Wishiyo.com. All rights reserved.`, copyrightMargins.left, copyrightMargins.top + 1);

    // 第一段主要内容 - 使用splitTextToSize确保正确换行
    const firstParagraph = 'This book is created for entertainment purposes only and is intended as a gift. ' +
                          'The content within is fictional, generated by artificial intelligence, and should not ' +
                          'be taken seriously or relied upon for any factual information. It is not intended for ' +
                          'commercial use, academic purposes, or as a source of accurate knowledge.';

    const maxWidth = pageWidth - copyrightMargins.left - copyrightMargins.right - 0.5; // 使用动态边距，留出一些安全边距
    const firstParaLines = pdf.splitTextToSize(firstParagraph, maxWidth);
    // 减少版权信息和第一段之间的间距，从2英寸减少到1.3英寸
    pdf.text(firstParaLines, copyrightMargins.left, copyrightMargins.top + 1.3);

    // 计算第一段的高度
    const lineHeight = fonts.copyright.size / 72 * 1.6; // 行高为字体大小的1.6倍
    const firstParaHeight = firstParaLines.length * lineHeight;

    // 第二段主要内容 - 使用splitTextToSize确保正确换行
    const secondParagraph = 'Wishiyo.com does not make any claims regarding the factual accuracy, ' +
                           'truth, or completeness of the content. The book is designed purely to bring humor ' +
                           'and joy to recipients. Use this book solely in the spirit of fun and amusement.';

    const secondParaLines = pdf.splitTextToSize(secondParagraph, maxWidth);
    // 减少第一段和第二段之间的间距，从0.25英寸减少到0.15英寸
    pdf.text(secondParaLines, copyrightMargins.left, copyrightMargins.top + 1.3 + firstParaHeight + 0.15);

    // 计算第二段的高度
    const secondParaHeight = secondParaLines.length * lineHeight;

    // 版本信息
    // 使用新的坐标计算方式，减少与第二段的间距，从0.25英寸减少到0.15英寸
    pdf.text('First edition, ' + year, copyrightMargins.left, copyrightMargins.top + 1.3 + firstParaHeight + 0.15 + secondParaHeight + 0.15);

    // 出版信息
    // 减少与版本信息的间距，从0.25英寸减少到0.15英寸
    pdf.text('Published by Wishiyo.com', copyrightMargins.left, copyrightMargins.top + 1.3 + firstParaHeight + 0.15 + secondParaHeight + 0.15 + 0.15);

    addPage();
    // 获取当前页的动态边距
    const contentsPageNum = pdf.internal.getNumberOfPages();
    const contentsMargins = getPageMargins(contentsPageNum);

    // 使用更大的字号和Garamond样式的"Contents"标题
    setFont('contentsTitle');
    // 根据奇偶页调整Contents标题的位置
    const contentsOffset = 0.18;
    const contentsY = contentsMargins.top + 1.2; // 向下移动到1.2英寸

    // 检查当前页是奇数页（右页）还是偶数页（左页）
    const isRightPage = contentsPageNum % 2 === 1;
    if (isRightPage) {
      // 奇数页（右页）：标题偏右
      const contentsX = pageWidth / 2 + contentsOffset;
      pdf.text('Contents', contentsX, contentsY, { align: 'center' });
    } else {
      // 偶数页（左页）：标题偏左
      const contentsX = pageWidth / 2 - contentsOffset;
      pdf.text('Contents', contentsX, contentsY, { align: 'center' });
    }

    // 创建一个数组来存储目录条目的信息，以便在渲染完所有章节后回填页码
    const tocEntries: Array<{
      chapter: BookChapter;
      pageNumber: number;
      tocPageNumber: number;
      yPosition: number;
      isRightPage: boolean; // 添加奇偶页标记
    }> = [];

    // 记录目录页码
    const tocPageNumbers: number[] = [];
    tocPageNumbers.push(pdf.internal.getNumberOfPages()); // 当前页就是目录第一页

    // 设置目录内容样式
    let tocY = contentsMargins.top + 2.0; // 使用动态边距，增加目录标题和内容之间的间距

    // 使用 finalBookContent 生成目录页
    for (let i = 0; i < finalBookContent.length; i++) {
      const chapter: BookChapter = finalBookContent[i];

      // 获取当前页的动态边距
      const tocPageNum = pdf.internal.getNumberOfPages();
      const tocPageMargins = getPageMargins(tocPageNum);

      // 检查目录内容是否会超出页面底部，如果会，则自然换页
      // 减小底部边距，允许更多内容（从0.3减小到0.2），以便每页容纳12章而不是11章
      if (tocY > pageHeight - tocPageMargins.bottom - 0.2) {
        addPage();
        tocPageNumbers.push(pdf.internal.getNumberOfPages()); // 记录新的目录页
        // 获取新页的动态边距
        const newTocPageNum = pdf.internal.getNumberOfPages();
        const newTocMargins = getPageMargins(newTocPageNum);
        tocY = newTocMargins.top + 1.0;

        // 重要：在新页面上，重新检查奇偶页状态
        // 这确保了章节编号和标题在新页面上正确对齐
        const isTocRightPage = newTocPageNum % 2 === 1;
        console.log(`目录换页：新页码 ${newTocPageNum}，是右页: ${isTocRightPage}`);
      }

      // 注意：我们现在使用 currentTocPageNum 和 currentIsTocRightPage 来确保正确的奇偶页状态

      // 设置章节编号字体
      setFont('tocChapter');

      // 根据奇偶页调整章节编号的位置
      // 使用当前页的动态边距，而不是固定值
      // 确保使用正确的奇偶页状态
      const currentTocPageNum = pdf.internal.getNumberOfPages();
      const currentTocMargins = getPageMargins(currentTocPageNum);
      const currentIsTocRightPage = currentTocPageNum % 2 === 1;

      // 使用当前页的边距，而不是循环开始时的边距
      pdf.text(`Chapter ${chapter.chapterNumber}`, currentTocMargins.left, tocY);

      // 设置章节标题字体
      // 使用当前页的动态边距，而不是固定值
      const chapterTitleX = currentTocMargins.left + 1.2; // 从当前页的左边距偏移1.2英寸

      // 处理标题过长的情况，确保与页码不重合
      // 减小页码预留空间，从0.8减小到0.6，给标题留出更多空间
      const maxTitleWidth = pageWidth - currentTocMargins.right - chapterTitleX - 0.6; // 使用当前页的动态边距，留出空间给页码
      const titleLines = pdf.splitTextToSize(chapter.title, maxTitleWidth);

      // 支持标题自动换行，最多显示两行
      if (titleLines.length === 1) {
        // 单行标题
        pdf.text(titleLines[0], chapterTitleX, tocY);

        // 将目录条目信息添加到数组中
        tocEntries.push({
          chapter,
          pageNumber: 0, // 先设置为0，后面会更新
          tocPageNumber: currentTocPageNum, // 当前目录页码
          yPosition: tocY, // 记录Y坐标位置
          isRightPage: currentIsTocRightPage // 使用当前页的奇偶页状态
        });

        // 增加目录行间距
        tocY += 0.35; // 从0.5减小到0.35，减小章节间距
      } else {
        // 多行标题，显示最多两行
        const firstLine = titleLines[0];
        const secondLine = titleLines.length > 1 ? titleLines[1] : '';

        // 显示第一行
        pdf.text(firstLine, chapterTitleX, tocY);

        // 将目录条目信息添加到数组中（页码与第一行对齐）
        tocEntries.push({
          chapter,
          pageNumber: 0, // 先设置为0，后面会更新
          tocPageNumber: currentTocPageNum, // 当前目录页码
          yPosition: tocY, // 记录Y坐标位置
          isRightPage: currentIsTocRightPage // 使用当前页的奇偶页状态
        });

        // 显示第二行（如果有），使用较小的行间距
        if (secondLine) {
          const lineHeight = fonts.tocChapter.size / 72 * 1.2; // 使用较小的行间距因子1.2
          pdf.text(secondLine, chapterTitleX, tocY + lineHeight);

          // 增加目录行间距（考虑到第二行）
          tocY += 0.35 + lineHeight; // 减小基础间距加上第二行的高度
        } else {
          // 单行标题的间距
          tocY += 0.35; // 与其他地方保持一致
        }
      }

      // 设置页码字体
      setFont('tocPageNumber');
      // 不使用省略号，直接留空位置给实际页码
      // 后面会回填实际页码
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

      // 获取当前页的动态边距
      const chapterPageNum = pdf.internal.getNumberOfPages();
      const chapterMargins = getPageMargins(chapterPageNum);

      // 1. 绘制 "CHAPTER X"
      setFont('chapterTitle'); // 使用 chapterTitle 样式 (size: 18)
      const chapterNumberText = `CHAPTER ${chapter.chapterNumber}`;
      // 将章节编号的Y坐标从 margin.top + 0.8 向下移动到 margin.top + 1.3
      const chapterNumberY = chapterMargins.top + 1.3; // 使用动态边距，向下移动0.5英寸

      // 根据奇偶页调整标题位置
      const isRightPage = chapterPageNum % 2 === 1;
      const pageOffset = 0.18; // 偏移量为0.18英寸
      if (isRightPage) {
        // 奇数页（右页）：标题偏右
        const titleX = pageWidth / 2 + pageOffset; // 向右偏移
        pdf.text(chapterNumberText, titleX, chapterNumberY, { align: 'center' });
      } else {
        // 偶数页（左页）：标题偏左
        const titleX = pageWidth / 2 - pageOffset; // 向左偏移
        pdf.text(chapterNumberText, titleX, chapterNumberY, { align: 'center' });
      }

      // 2. 绘制换行的章节标题
      // 设置章节主标题的字体和大小 (与 chapterTitle 不同)
      pdf.setFont(fonts.title.family, fonts.title.style); // 使用 title 字体 (georgia, bold)
      pdf.setFontSize(28); // 从 24pt 增大到 28pt
      const chapterTitleText = chapter.title;
      // 获取当前页的动态边距
      const pageNum = pdf.internal.getNumberOfPages();
      const currentMargins = getPageMargins(pageNum);

      const chapterTitleMaxWidth = pageWidth - currentMargins.left - currentMargins.right - 1; // 减去一些额外边距以防万一
      const chapterTitleLines = pdf.splitTextToSize(chapterTitleText, chapterTitleMaxWidth);

      const chapterTitleLineHeight = 28 / 72 * 1.6; // 基于 28pt 字体，行距因子增大到 1.6
      let chapterTitleY = chapterNumberY + 1.0; // 保持与章节编号的相对距离

      // 绘制每一行章节标题
      chapterTitleLines.forEach((line: string) => {
        // 根据奇偶页调整标题位置
        if (isRightPage) {
          // 奇数页（右页）：标题偏右
          const titleX = pageWidth / 2 + pageOffset; // 向右偏移
          pdf.text(line, titleX, chapterTitleY, { align: 'center' });
        } else {
          // 偶数页（左页）：标题偏左
          const titleX = pageWidth / 2 - pageOffset; // 向左偏移
          pdf.text(line, titleX, chapterTitleY, { align: 'center' });
        }
        chapterTitleY += chapterTitleLineHeight;
      });

      // 3. 设置后续内容的起始 Y 坐标
      // 确保内容从换行后的标题下方开始，并有足够间距
      let contentY = chapterTitleY + 0.7; // 在最后一行标题下方增加 0.7 英寸间距 (从 0.5 增加)

      chapter.sections.forEach((section) => {
        // 获取当前页的动态边距
        const checkPageNum = pdf.internal.getNumberOfPages();
        const checkMargins = getPageMargins(checkPageNum);

        // 检查是否需要新页面（为 section title 预留空间）
        const sectionTitleHeight = fonts.sectionTitle.size / 72 * 1.8; // 估算小节标题高度
        if (contentY + sectionTitleHeight > pageHeight - checkMargins.bottom) {
          addPage();
          currentPageNum++; // 章节内容分页时增加页码

          // 在新页顶部添加章节标题页眉
          setFont('runningHeader'); // 使用新样式
          // 获取当前页的页眉边距（不偏移）
          const pageNum = pdf.internal.getNumberOfPages();
          const headerMargins = getHeaderMargins(pageNum);
          // 根据奇偶页调整页眉位置
          const isHeaderRightPage = pageNum % 2 === 1;
          const headerOffset = 0.18; // 偏移量为0.18英寸
          if (isHeaderRightPage) {
            // 奇数页（右页）：页眉偏右
            const headerX = pageWidth / 2 + headerOffset; // 向右偏移
            pdf.text(chapter.title, headerX, headerMargins.top + 0.2, { align: 'center' }); // 将页眉下移，与内容一起整体下移
          } else {
            // 偶数页（左页）：页眉偏左
            const headerX = pageWidth / 2 - headerOffset; // 向左偏移
            pdf.text(chapter.title, headerX, headerMargins.top + 0.2, { align: 'center' }); // 将页眉下移，与内容一起整体下移
          }

          // 不需要重新设置小节标题字体，因为下面会调用setFont('sectionTitle')

          contentY = headerMargins.top + 0.8; // 使用页眉边距，增加顶部内容起始的安全距离，整体下移内容
        }

        // 设置小节标题样式
        // 增加小节标题前的间距，特别是非页面开头的情况
        // 获取当前页的动态边距
        const sectionPageNum = pdf.internal.getNumberOfPages();
        const sectionMargins = getPageMargins(sectionPageNum);

        // 检查页面剩余空间，确保section标题不会出现在页面的最后一行
        // 计算当前页面底部边距
        const pageBottom = pageHeight - sectionMargins.bottom;
        // 计算section标题需要的最小空间（标题高度 + 至少一行正文）
        // 使用不同的变量名避免重复声明
        const sectionTitleLineHeight = fonts.sectionTitle.size / 72 * 1.6; // 标题高度
        const bodyLineHeight = fonts.body.size / 72 * 1.6; // 正文行高
        const minSpaceNeeded = sectionTitleLineHeight + bodyLineHeight + 0.1; // 额外添加0.1英寸作为安全边距

        // 如果剩余空间不足，则添加新页面
        if (pageBottom - contentY < minSpaceNeeded) {
          console.log('Section title would be at bottom of page, adding new page');
          addPage();
          // 获取新页的页码
          const newPageNum = pdf.internal.getNumberOfPages();
          // 获取新页的动态边距
          const newPageMargins = getPageMargins(newPageNum);

          // 设置页眉字体并绘制页眉
          setFont('runningHeader');
          // 根据奇偶页调整页眉位置
          const isHeaderRightPage = newPageNum % 2 === 1;
          const headerOffset = 0.18; // 偏移量为0.18英寸
          if (isHeaderRightPage) {
            // 奇数页（右页）：页眉偏右
            const headerX = pageWidth / 2 + headerOffset; // 向右偏移
            pdf.text(chapter.title, headerX, newPageMargins.top + 0.2, { align: 'center' }); // 将页眉下移，与内容一起整体下移
          } else {
            // 偶数页（左页）：页眉偏左
            const headerX = pageWidth / 2 - headerOffset; // 向左偏移
            pdf.text(chapter.title, headerX, newPageMargins.top + 0.2, { align: 'center' }); // 将页眉下移，与内容一起整体下移
          }

          // 重置contentY到新页面的顶部位置
          contentY = newPageMargins.top + 0.8;
        } else if (contentY > sectionMargins.top + 0.8) { // 如果不是在页面顶部，则增加额外间距，使用动态边距
          contentY += 0.2; // 在当前段落和新小节标题之间添加额外的 0.2 英寸间距（从0.3英寸减小）
        }

        setFont('sectionTitle');
        // 定义安全边距，与段落处理中相同
        const safetyMarginRight = 0.15; // 额外添加的右侧安全边距
        // 获取当前页的动态边距
        const pageNum = pdf.internal.getNumberOfPages();
        const currentMargins = getPageMargins(pageNum);
        // 添加小标题自动换行功能
        const sectionTitleLines = pdf.splitTextToSize(section.title, pageWidth - currentMargins.left - currentMargins.right - safetyMarginRight);
        pdf.text(sectionTitleLines, currentMargins.left, contentY);

        // 小标题与正文之间的间距，从 1.5 增加到 1.6
        contentY += fonts.sectionTitle.size / 72 * 1.6 + (sectionTitleLines.length - 1) * (fonts.sectionTitle.size / 72 * 1.6);

        // 设置正文内容样式为Garamond (georgia) - 移动到段落循环内
        // 将\n\n解释为段落分隔符，但不添加额外的段落间距
        // 根据新的需求，当检测到 \n\n 时，将其替换为换行加四个非间断空格
        // 这样可以在同一段内通过换行来模拟分段的效果

        // 先处理文本，确保文本末尾没有多余的换行符
        let content = section.content.trim();

        // 如果最后一个字符是\n，则移除它
        if (content.endsWith('\n')) {
          content = content.replace(/\n+$/, '');
        }

        // 将\n\n替换为特殊标记，以便后续处理
        const paragraphBreak = '<PARAGRAPH_BREAK>';
        content = content.replace(/\n\n+/g, paragraphBreak);

        // 在段落开头添加两个非间断空格作为缩进
        // 将特殊标记替换为换行符加两个普通空格
        content = content.replace(new RegExp(paragraphBreak, 'g'), '\n  ');

        // 在段落开头添加两个普通空格作为缩进
        content = '  ' + content;

        // 将内容作为一个段落处理
        const filteredParagraphs = [content];

        filteredParagraphs.forEach((paragraph, paragraphIndex) => {
          // 添加调试日志，查看段落渲染情况
          console.log(`渲染段落 ${paragraphIndex+1}/${filteredParagraphs.length}, 长度: ${paragraph.length} 字符`);
          setFont('body'); // Ensure body font is set before calculations
          // 增加正文行距，将行高因子从 1.5 增加到 1.6
          const lineHeight = fonts.body.size / 72 * 1.6;
          // 段落间距设置为小值，确保段落之间有适当的间距
          // 如果不是第一个段落，添加一个小的段落间距
          if (paragraphIndex > 0) {
            contentY += lineHeight * 0.5; // 段落间距为行高的0.5倍
          }

          // 获取当前页的动态边距
          const pageNum = pdf.internal.getNumberOfPages();
          const currentMargins = getPageMargins(pageNum);

          // 段落已经在处理时添加了缩进，这里不需要再添加
          let processedParagraph = paragraph;

          // 使用标准宽度分割文本，不再为缩进特别减小宽度
          const textLines = pdf.splitTextToSize(processedParagraph, pageWidth - currentMargins.left - currentMargins.right - safetyMarginRight);

          // 打印所有行的内容，以便调试
          for (let i = 0; i < textLines.length; i++) {
            console.log(`行 ${i+1} 内容: "${textLines[i].substring(0, 20)}..."`);
          }

          // 检查每一行，如果下一行以两个非间断空格开头，则当前行需要模拟左对齐
          for (let i = 0; i < textLines.length - 1; i++) {
            // 检查下一行是否以两个空格开头
            const nextLine = textLines[i+1];
            // 使用更直接的方式检测空格
            if (nextLine && nextLine.startsWith('  ')) {
              // 当前行需要模拟左对齐
              // 计算需要添加的空格数量
              const currentLine = textLines[i];

              // 使用 jsPDF 的方法计算文本宽度
              const fontSize = pdf.internal.getFontSize();
              const scaleFactor = pdf.internal.scaleFactor;
              const lineWidth = pdf.getStringUnitWidth(currentLine) * fontSize / scaleFactor;
              const maxWidth = pageWidth - currentMargins.left - currentMargins.right - safetyMarginRight;
              const spaceWidth = pdf.getStringUnitWidth(' ') * fontSize / scaleFactor;

              // 计算需要添加的空格数量，使行宽接近但不超过最大宽度
              const spacesToAdd = Math.floor((maxWidth - lineWidth) / spaceWidth) - 2; // 减2是为了安全

              // 添加空格
              if (spacesToAdd > 0) {
                const spaces = ' '.repeat(spacesToAdd);
                textLines[i] = currentLine + spaces;
                console.log(`向行 ${i+1} 添加了 ${spacesToAdd} 个空格，以模拟左对齐效果`);
              }
            }
          }

          let linesProcessed = 0;
          while (linesProcessed < textLines.length) {
            // 获取当前页的动态边距
            const paragraphPageNum = pdf.internal.getNumberOfPages();
            const paragraphMargins = getPageMargins(paragraphPageNum);
            const availableHeight = pageHeight - paragraphMargins.bottom - contentY;
            // 段落间距为0，不需要额外的空间
            const linesThatFitCount = Math.floor(availableHeight / lineHeight);

            if (linesThatFitCount <= 0 && contentY > margin.top) { // Not enough space even for one line, and not already at top
              // Add new page
              addPage();
              // 获取新页的页码
              const newPageNum = pdf.internal.getNumberOfPages();

              // 获取新页的动态边距
              const newPageMargins = getPageMargins(newPageNum);

              // 设置页眉字体并绘制页眉
              setFont('runningHeader');
              pdf.text(chapter.title, pageWidth / 2, newPageMargins.top + 0.2, { align: 'center' }); // 将页眉下移，与内容一起整体下移

              // 重新设置回正文字体，确保跨页时字体一致
              setFont('body');

              contentY = newPageMargins.top + 0.8; // 使用动态边距，与其他位置保持一致，整体下移内容
              // Re-calculate lines that fit on the new empty page
              const newAvailableHeight = pageHeight - newPageMargins.bottom - contentY;
              // 段落间距为0，不需要额外的空间
              const linesOnNewPageCount = Math.floor(newAvailableHeight / lineHeight);
              const linesToDraw = textLines.slice(linesProcessed, linesProcessed + linesOnNewPageCount);

              if (linesToDraw.length > 0) {
                 // 段落间距为0，直接使用当前 Y 坐标
                 const drawY = contentY;

                 // 获取当前页的动态边距
                 const currentPageNum = pdf.internal.getNumberOfPages();
                 const currentMargins = getPageMargins(currentPageNum);

                 // 使用简化的渲染方式，空格作为缩进已经包含在文本中
                 console.log(`新页面上渲染段落，行数: ${linesToDraw.length}`);

                 // 使用 jsPDF 的 text 方法的另一种形式来渲染文本
                 // 不要逐行渲染，而是一次性渲染整个文本块
                 console.log(`新页面渲染整个文本块，行数: ${linesToDraw.length}`);

                 // 使用 justify 对齐方式渲染所有文本
                 pdf.text(linesToDraw, currentMargins.left, drawY, {
                   align: 'justify',
                   maxWidth: pageWidth - currentMargins.left - currentMargins.right - safetyMarginRight,
                   lineHeightFactor: 1.6 // 设置行高因子
                 });

                 console.log(`新页面应用 justify 对齐到整个文本块`);

                 // 统一行高计算，确保行间距一致
                 // 无论是否是段落的第一行，都使用相同的计算方式
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
                 // 段落间距为0，直接使用当前 Y 坐标
                 const drawY = contentY;

                 // 获取当前页的动态边距
                 const currentPageNum = pdf.internal.getNumberOfPages();
                 const currentMargins = getPageMargins(currentPageNum);

                 // 使用简化的渲染方式，空格作为缩进已经包含在文本中
                 console.log(`渲染段落，行数: ${linesToDraw.length}`);

                 // 使用 jsPDF 的 text 方法的另一种形式来渲染文本
                 // 不要逐行渲染，而是一次性渲染整个文本块
                 console.log(`渲染整个文本块，行数: ${linesToDraw.length}`);

                 // 使用 justify 对齐方式渲染所有文本
                 pdf.text(linesToDraw, currentMargins.left, drawY, {
                   align: 'justify',
                   maxWidth: pageWidth - currentMargins.left - currentMargins.right - safetyMarginRight,
                   lineHeightFactor: 1.6 // 设置行高因子
                 });

                 console.log(`应用 justify 对齐到整个文本块`);

                 // 统一行高计算，确保行间距一致
                 // 无论是否是段落的第一行，都使用相同的计算方式
                 contentY = drawY + linesToDraw.length * lineHeight;
                 linesProcessed += linesToDraw.length;
              } else {
                  // No lines fit, break (should be handled by the case above, but for safety)
                  // 获取当前页的动态边距
                  const currentPageMargins = getPageMargins(pdf.internal.getNumberOfPages());
                  if (contentY <= currentPageMargins.top) { // If we are already at the top and still can't fit, paragraph is too big for page.
                       console.error("Paragraph segment too large to fit on a single page.");
                  }
                  break;
              }
            }
          }
        });
      });
    }); // end chapters loop

    // 记录章节页码信息
    console.log('Chapter start pages:', chapterStartPages);
    console.log('First content page number:', firstContentPageNumber);

    // 现在回填目录页码
    console.log('Filling in table of contents page numbers');

    // 更新tocEntries中的页码信息
    tocEntries.forEach(entry => {
      // 获取章节的实际起始页码
      const actualPageNumber = chapterStartPages[entry.chapter.chapterNumber];
      if (actualPageNumber) {
        // 计算相对于第一章的页码偏移
        const firstChapterPage = chapterStartPages[1];
        entry.pageNumber = actualPageNumber - firstChapterPage + 1;
      }
    });

    // 回填目录页码
    tocEntries.forEach(entry => {
      if (entry.pageNumber > 0) {
        // 切换到目录页
        pdf.setPage(entry.tocPageNumber);

        // 设置页码字体
        setFont('tocPageNumber');

        // 根据当前页的动态边距调整页码的位置
        // 获取当前目录页的动态边距
        const tocPageMargins = getPageMargins(entry.tocPageNumber);
        // 无论奇偶页，页码都在右侧
        pdf.text(String(entry.pageNumber), pageWidth - tocPageMargins.right, entry.yPosition, { align: 'right' });
      }
    });

    console.log('Table of contents page numbers filled in successfully');

    // **添加10页空白页到书的末尾**
    for (let i = 0; i < 12; i++) {
      addPage();
    }

    // **添加页码和最终处理**
    const finalPageCount = pdf.internal.getNumberOfPages(); // 使用准确的页码
    const lastContentPage = finalPageCount - 12; // 最后一个内容页（减去10页空白页）

    // 从第一章开始添加页码，使第一章的页码为1
    for (let i = firstContentPageNumber; i <= lastContentPage; i++) {
      pdf.setPage(i); // 切换到指定页面

      // 检查当前页是否是章节开始页
      let isChapterStartPage = false;
      let chapterNumber = 0;

      // 遍历所有章节起始页码
      for (const [chapNum, pageNum] of Object.entries(chapterStartPages)) {
        if (pageNum === i) {
          isChapterStartPage = true;
          chapterNumber = parseInt(chapNum);
          break;
        }
      }

      // 如果是第一章的起始页，页码设为1
      // 其他章节页码根据与第一章起始页的偏移计算
      if (chapterNumber === 1) {
        // 记录第一章的实际页码
        const firstChapterPage = i;
        console.log(`First chapter (Chapter 1) starts at page ${firstChapterPage}`);

        // 设置页码为1
        setFont('pageHeaderFooter');
        // 根据奇偶页调整页码位置
        const headerMargins = getHeaderMargins(i); // 使用页眉边距（不偏移）
        const isRightPage = i % 2 === 1;
        const pageOffset = 0.18; // 偏移量为0.18英寸

        // 对于第一章起始页，页码显示在底部中央
        if (isRightPage) {
          // 奇数页（右页）：页码向右偏移
          const footerX = pageWidth / 2 + pageOffset;
          pdf.text('1', footerX, pageHeight - headerMargins.bottom, { align: 'center' });
        } else {
          // 偶数页（左页）：页码向左偏移
          const footerX = pageWidth / 2 - pageOffset;
          pdf.text('1', footerX, pageHeight - headerMargins.bottom, { align: 'center' });
        }
      } else if (isChapterStartPage) {
        // 如果是其他章节的起始页，计算相对于第一章的偏移
        const firstChapterPage = chapterStartPages[1];
        const displayPageNum = String(i - firstChapterPage + 1);
        setFont('pageHeaderFooter');
        // 根据奇偶页调整页码位置
        const headerMargins = getHeaderMargins(i); // 使用页眉边距（不偏移）
        const isRightPage = i % 2 === 1;
        const pageOffset = 0.18; // 偏移量为0.18英寸

        // 对于章节起始页，页码显示在底部中央
        if (isRightPage) {
          // 奇数页（右页）：页码向右偏移
          const footerX = pageWidth / 2 + pageOffset;
          pdf.text(displayPageNum, footerX, pageHeight - headerMargins.bottom, { align: 'center' });
        } else {
          // 偶数页（左页）：页码向左偏移
          const footerX = pageWidth / 2 - pageOffset;
          pdf.text(displayPageNum, footerX, pageHeight - headerMargins.bottom, { align: 'center' });
        }
      } else if (i > chapterStartPages[1]) {
        // 如果是第一章之后的页面，但不是章节起始页
        const firstChapterPage = chapterStartPages[1];
        const displayPageNum = String(i - firstChapterPage + 1);
        setFont('pageHeaderFooter');
        // 根据奇偶页调整页码位置
        const headerMargins = getHeaderMargins(i); // 使用页眉边距（不偏移）
        const isRightPage = i % 2 === 1;
        if (isRightPage) {
          // 奇数页（右页）：页码在右侧
          pdf.text(displayPageNum, pageWidth - headerMargins.right, headerMargins.top + 0.2, { align: 'right' });
        } else {
          // 偶数页（左页）：页码在左侧
          pdf.text(displayPageNum, headerMargins.left, headerMargins.top + 0.2, { align: 'left' });
        }
      }
      // 前面的空白页不显示页码
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

    // EB Garamond 字体已在PDF生成过程中直接嵌入，无需再调用外部API
    console.log(`EB Garamond 字体已在PDF生成过程中直接嵌入，使用原始上传的PDF URL`);
    let processedInteriorUrl = interiorFileUrl;

    // 更新数据库
    // const pageCount = finalBookContent.length * 5; // 旧的粗略计算
    const updateData: any = {
      interior_pdf: pdfOutput,
      page_count: finalPageCount // 使用上面已声明的 finalPageCount
    };

    if (processedInteriorUrl) {
      updateData.interior_source_url = processedInteriorUrl;
    } else if (interiorFileUrl) {
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

        // 如果状态更新为 'completed'，自动提交打印请求
        try {
          console.log(`Book ${orderId} is completed, auto-submitting print request to Lulu Press`);

          // 获取应用基础URL
          const baseUrl = Deno.env.get('VERCEL_URL')
            ? `https://${Deno.env.get('VERCEL_URL')}`
            : 'https://wishiyo.com';

          // 自动提交打印请求
          const printResult = await submitPrintRequest(
            orderId,
            'funny_biography',
            baseUrl,
            supabaseServiceKey,
            supabase // 传递 Supabase 客户端以检查订单状态
          );

          if (printResult.success) {
            console.log(`Auto-submitted print request for book ${orderId} successfully, print job ID: ${printResult.print_job_id}`);
          } else {
            console.error(`Failed to auto-submit print request for book ${orderId}: ${printResult.message}`);
          }
        } catch (printError) {
          console.error(`Error auto-submitting print request for book ${orderId}:`, printError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Interior PDF generated successfully',
        // 不返回完整PDF数据，避免响应体过大
        pdfSize: pdfOutput.length,
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
