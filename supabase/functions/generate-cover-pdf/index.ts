import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { jsPDF } from "https://esm.sh/jspdf@2.5.2";
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { frontCover, spine, backCover, orderId, binding_type, format, style } = await req.json();

    // 支持两种参数名称，优先使用 binding_type，如果不存在则使用 format，都不存在则默认为 'softcover'
    const bindingType = binding_type || format || 'softcover';
    // 使用传入的封面样式，如果不存在则默认为 'classic'
    const coverStyle = style || 'classic';

    console.log('Received request for PDF generation with order ID:', orderId, 'binding type:', bindingType, 'cover style:', coverStyle);

    if (!frontCover || !spine || !backCover) {
      throw new Error('Missing required cover image URLs');
    }

    console.log('Processing cover image URLs for PDF generation');

    // 获取Supabase连接信息
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

    // 从URL获取图片数据
    async function getImageFromUrl(imageUrl: string): Promise<string> {
      try {
        console.log(`Processing image URL: ${imageUrl.substring(0, 50)}...`);

        // 处理已经是base64数据的情况
        if (imageUrl.startsWith('data:')) {
          console.log('Image is already in data URI format - using directly');
          return imageUrl;
        }

        console.log(`Fetching image from URL: ${imageUrl}`);
        const response = await fetch(imageUrl, {
          headers: {
            'Accept': 'image/*,application/pdf',
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch image from ${imageUrl}: ${response.status} ${response.statusText}`);
        }

        // 获取内容类型
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        console.log(`Content type of fetched image: ${contentType}`);

        // 获取图片数据
        const arrayBuffer = await response.arrayBuffer();
        const base64String = btoa(
          new Uint8Array(arrayBuffer)
            .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        return `data:${contentType};base64,${base64String}`;
      } catch (error) {
        console.error(`Error downloading image from ${imageUrl.substring(0, 50)}...:`, error);
        throw error;
      }
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
        const base64Data = pdfData.split(',')[1];

        // 将base64转换为Uint8Array
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // 上传到Supabase Storage
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
          // 记录详细的错误信息
          console.error('Upload error details:', JSON.stringify(uploadError));
          const errorText = uploadError.message || JSON.stringify(uploadError);
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

    console.log('Starting to download and process images');

    // 获取所有图片的base64数据
    const frontCoverData = await getImageFromUrl(frontCover);
    console.log('Front cover processed successfully');

    const spineData = await getImageFromUrl(spine);
    console.log('Spine processed successfully');

    const backCoverData = await getImageFromUrl(backCover);
    console.log('Back cover processed successfully');

    console.log('All images downloaded and processed successfully');

    // 根据装订类型设置不同的尺寸
    let pdfWidth, pdfHeight, bookWidth, bookHeight, spineWidth;

    if (bindingType === 'hardcover') {
      // 精装本尺寸 (基于Lulu模板)
      bookWidth = 6.125;
      bookHeight = 9.25;
      spineWidth = 0.813; // 精装本书脊宽度
      // 计算新的PDF总宽度 = 两个封面宽度 + 书脊宽度 + 两侧包装区域
      const wrapAreaWidth = 0.75; // 每侧0.75"的包装区域
      pdfWidth = (bookWidth * 2) + spineWidth + (wrapAreaWidth * 2); // 14.563"
      pdfHeight = 10.75;
      console.log(`Using hardcover dimensions: ${pdfWidth}" x ${pdfHeight}" with spine width ${spineWidth}"`);
      console.log(`Total content width: ${(bookWidth * 2) + spineWidth}"`);
      console.log(`Wrap area width: ${wrapAreaWidth}" on each side, total ${wrapAreaWidth * 2}"`);
    } else {
      // 平装本尺寸 (基于Lulu模板)
      bookWidth = 6.0;
      bookHeight = 9.0;
      spineWidth = 0.58; // 平装本书脊宽度
      // 计算新的PDF总宽度 = 两个封面宽度 + 书脊宽度 + 两侧出血区域
      pdfWidth = (bookWidth * 2) + spineWidth + 0.25; // 0.25" 是两侧各 0.125" 的出血区域 (减小了0.02")
      pdfHeight = 9.25;
      console.log(`Using softcover dimensions: ${pdfWidth}" x ${pdfHeight}" with spine width ${spineWidth}"`);
      console.log(`Total content width: ${(bookWidth * 2) + spineWidth}"`);
    }

    // Create a new PDF with appropriate dimensions
    console.log('Creating PDF document');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: [pdfWidth, pdfHeight] // Width x Height with bleed areas
    });

    // 封面PDF不需要嵌入字体

    // Calculate positions and dimensions
    const bleed = 0.125; // Bleed area: 0.125"
    const wrapArea = 0.75; // Wrap area: 0.75" on each side
    const totalWrapWidth = bleed + wrapArea; // 总包装区域宽度 = 0.875英寸
    const safetyMargin = 0.5; // Safety margin: 0.5"
    const backCoverWidth = bookWidth; // 使用根据装订类型设置的宽度
    const frontCoverWidth = bookWidth; // Same as back cover

    // 计算总宽度和居中偏移量
    const totalWidth = backCoverWidth + spineWidth + frontCoverWidth;
    const xOffset = (pdfWidth - totalWidth) / 2; // 水平居中偏移量
    const yOffset = (pdfHeight - bookHeight) / 2; // 垂直居中偏移量

    console.log(`Layout calculations:
      - PDF dimensions: ${pdfWidth}" x ${pdfHeight}"
      - Book dimensions: ${bookWidth}" x ${bookHeight}"
      - Spine width: ${spineWidth}"
      - Total content width: ${totalWidth}"
      - Horizontal offset (for centering): ${xOffset}"
      - Vertical offset (for centering): ${yOffset}"
    `);

    // 定义样式到背景色的映射
    const styleBackgroundColors: Record<string, { r: number, g: number, b: number }> = {
      'classic': { r: 0, g: 0, b: 0 }, // 黑色 - 对应 classic-red 样式
      'modern': { r: 236, g: 232, b: 217 }, // #ECE8D9
      'minimal': { r: 236, g: 236, b: 236 }, // #ECECEC - 对应 minimal-gray 样式，非常浅的灰色
      'vibrant': { r: 67, g: 97, b: 238 }, // #4361EE
      'pastel-beige': { r: 255, g: 192, b: 203 }, // #FFC0CB - 粉色
      'vibrant-green': { r: 229, g: 221, b: 202 }, // #E5DDCA - 对应 modern-green 样式
      'bestseller': { r: 0, g: 0, b: 0 } // 黑色 - 对应 bestseller-style 样式
    };

    // 样式 ID 到模板名称的映射
    const styleIdToTemplate: Record<string, string> = {
      'classic-red': 'classic',
      'bestseller-style': 'bestseller',
      'modern-green': 'vibrant-green',
      'minimal-gray': 'minimal',
      'pastel-beige': 'pastel-beige'
    };

    // 获取实际的模板名称
    const templateName = styleIdToTemplate[coverStyle] || coverStyle;

    // 简化版的图片颜色分析函数 - 我们不再需要实际分析图片颜色
    // 因为我们将使用样式背景色来填充出血区域
    async function analyzeImageColors(imageData: string): Promise<{r: number, g: number, b: number}> {
      // 返回样式对应的背景色，如果没有匹配的样式则返回白色
      return styleBackgroundColors[templateName] || { r: 255, g: 255, b: 255 };
    }

    // 获取样式对应的背景色
    const styleColor = styleBackgroundColors[templateName] || { r: 255, g: 255, b: 255 }; // 默认白色

    console.log('Using style color for bleed areas:',
      `Style ID: ${coverStyle}`,
      `Template: ${templateName}`,
      `Color: rgb(${styleColor.r},${styleColor.g},${styleColor.b})`
    );

    // 由于我们不再需要分析图片颜色，这些变量现在都会使用样式背景色
    const frontCoverColor = styleColor;
    const backCoverColor = styleColor;
    const spineColor = styleColor;

    console.log('Using style colors for all elements:',
      `Front: rgb(${frontCoverColor.r},${frontCoverColor.g},${frontCoverColor.b})`,
      `Spine: rgb(${spineColor.r},${spineColor.g},${spineColor.b})`,
      `Back: rgb(${backCoverColor.r},${backCoverColor.g},${backCoverColor.b})`
    );

    // 先填充整个背景以确保没有空白区域
    console.log('Filling background for entire PDF');

    // 填充整个PDF背景为白色（作为底层）
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

    // 填充扩展的出血区域背景
    if (bindingType === 'hardcover') {
      // 硬封面使用 totalWrapWidth (0.875")
      // 1. 绘制背面封面背景颜色（包括出血区域和包装区域）
      console.log('Filling hardcover back cover background with bleed and wrap extension');
      pdf.setFillColor(styleColor.r, styleColor.g, styleColor.b); // 使用样式背景色
      pdf.rect(
        0, // 左侧扩展到PDF边缘
        0, // 顶部扩展到PDF边缘
        xOffset + backCoverWidth, // 宽度包括左侧出血区和封底
        pdfHeight, // 高度扩展到整个PDF高度
        'F'
      );

      // 2. 绘制书脊背景颜色（包括出血区域）
      console.log('Filling hardcover spine background with bleed extension');
      pdf.setFillColor(styleColor.r, styleColor.g, styleColor.b); // 使用样式背景色
      pdf.rect(
        xOffset + backCoverWidth,
        0, // 顶部扩展到PDF边缘
        spineWidth,
        pdfHeight, // 高度扩展到整个PDF高度
        'F'
      );

      // 3. 绘制正面封面背景颜色（包括出血区域）
      console.log('Filling hardcover front cover background with bleed extension');
      pdf.setFillColor(styleColor.r, styleColor.g, styleColor.b); // 使用样式背景色
      pdf.rect(
        xOffset + backCoverWidth + spineWidth,
        0, // 顶部扩展到PDF边缘
        pdfWidth - (xOffset + backCoverWidth + spineWidth), // 宽度扩展到PDF右边缘
        pdfHeight, // 高度扩展到整个PDF高度
        'F'
      );
    } else {
      // 软封面只使用 bleed (0.125")
      // 1. 绘制背面封面背景颜色（只包括出血区域）
      console.log('Filling softcover back cover background with bleed only');
      pdf.setFillColor(styleColor.r, styleColor.g, styleColor.b); // 使用样式背景色
      pdf.rect(
        0, // 左侧扩展到PDF边缘
        0, // 顶部扩展到PDF边缘
        bleed + backCoverWidth, // 只使用出血区域宽度
        pdfHeight, // 高度扩展到整个PDF高度
        'F'
      );

      // 2. 绘制书脊背景颜色
      console.log('Filling softcover spine background');
      pdf.setFillColor(styleColor.r, styleColor.g, styleColor.b); // 使用样式背景色
      pdf.rect(
        bleed + backCoverWidth,
        0, // 顶部扩展到PDF边缘
        spineWidth,
        pdfHeight, // 高度扩展到整个PDF高度
        'F'
      );

      // 3. 绘制正面封面背景颜色（只包括出血区域）
      console.log('Filling softcover front cover background with bleed only');
      pdf.setFillColor(styleColor.r, styleColor.g, styleColor.b); // 使用样式背景色
      pdf.rect(
        bleed + backCoverWidth + spineWidth,
        0, // 顶部扩展到PDF边缘
        frontCoverWidth + bleed, // 只使用出血区域宽度
        pdfHeight, // 高度扩展到整个PDF高度
        'F'
      );
    }

    // Debug lines flag - set to false to hide safety margins and trim lines
    const debugLines = false; // 设置为false以隐藏辅助线

    // Add images to the PDF (coordinate system starts from top-left)
    // Using calculated offsets for proper centering
    console.log('Adding back cover to PDF');
    pdf.addImage(
      backCoverData,
      'JPEG',
      xOffset, // x-position with centering offset
      yOffset, // y-position with centering offset
      backCoverWidth, // width
      bookHeight // height
    );

    console.log('Adding spine to PDF');
    console.log(`Spine position: x=${xOffset + backCoverWidth}, y=${yOffset}, width=${spineWidth}, height=${bookHeight}`);
    pdf.addImage(
      spineData,
      'JPEG',
      xOffset + backCoverWidth, // x-position after back cover
      yOffset, // y-position with centering offset
      spineWidth, // width based on binding type
      bookHeight // height
    );

    console.log('Adding front cover to PDF');
    pdf.addImage(
      frontCoverData,
      'JPEG',
      xOffset + backCoverWidth + spineWidth, // x-position after spine
      yOffset, // y-position with centering offset
      frontCoverWidth, // width
      bookHeight // height
    );

    // Draw debug lines when enabled
    if (debugLines) {
      console.log('Adding debug lines to PDF');

      // Blue outer bleed area rectangle (total document size)
      pdf.setDrawColor(0, 162, 232); // Light blue for bleed area
      pdf.setLineWidth(0.01);
      pdf.rect(0, 0, pdfWidth, pdfHeight);

      // Dark blue trim rectangles (actual book size after cutting)
      pdf.setDrawColor(0, 0, 255); // Blue for trim lines

      // Back cover trim
      pdf.rect(xOffset, yOffset, backCoverWidth, bookHeight);

      // Spine trim
      pdf.rect(xOffset + backCoverWidth, yOffset, spineWidth, bookHeight);

      // Front cover trim
      pdf.rect(xOffset + backCoverWidth + spineWidth, yOffset, frontCoverWidth, bookHeight);

      // Red safety margin rectangles
      pdf.setDrawColor(255, 0, 0); // Red for safety margin

      // Back cover safety margin
      pdf.rect(
        xOffset + safetyMargin,
        yOffset + safetyMargin,
        backCoverWidth - (safetyMargin * 2),
        bookHeight - (safetyMargin * 2)
      );

      // Front cover safety margin
      pdf.rect(
        xOffset + backCoverWidth + spineWidth + safetyMargin,
        yOffset + safetyMargin,
        frontCoverWidth - (safetyMargin * 2),
        bookHeight - (safetyMargin * 2)
      );

      // Add text labels
      pdf.setFontSize(6);
      pdf.setTextColor(0, 162, 232);

      // Top and bottom trim/bleed labels
      pdf.text('TRIM / BLEED AREA', pdfWidth/2, 0.1, { align: 'center' });
      pdf.text('TRIM / BLEED AREA', pdfWidth/2, pdfHeight - 0.1, { align: 'center' });

      // Safety margin labels
      pdf.setTextColor(100, 100, 100);
      pdf.text('SAFETY MARGIN', pdfWidth/2, yOffset + 0.2, { align: 'center' });
      pdf.text('SAFETY MARGIN', pdfWidth/2, yOffset + bookHeight - 0.2, { align: 'center' });

      // Spine label
      pdf.setTextColor(0, 0, 255);
      pdf.text('SPINE', xOffset + backCoverWidth + (spineWidth/2), yOffset + (bookHeight/2), { angle: 90, align: 'center' });

      // Cover labels
      pdf.text('BACK COVER', xOffset + (backCoverWidth/2), yOffset - 0.1, { align: 'center' });
      pdf.text('FRONT COVER', xOffset + backCoverWidth + spineWidth + (frontCoverWidth/2), yOffset - 0.1, { align: 'center' });

      // Add binding type and dimensions text
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Binding Type: ${bindingType}`, 0.5, pdfHeight - 0.5);
      pdf.text(`PDF Size: ${pdfWidth}" x ${pdfHeight}"`, 0.5, pdfHeight - 0.3);
      pdf.text(`Spine Width: ${spineWidth}"`, 0.5, pdfHeight - 0.1); // 添加书脊宽度信息
    }

    // Convert PDF to base64
    console.log('Converting PDF to base64');
    const pdfOutput = pdf.output('datauristring');
    console.log('PDF generation successful, output length:', pdfOutput.length);

    // 上传PDF到存储桶
    console.log(`Uploading cover PDF to storage...`);
    const coverFileUrl = await uploadPdfToStorage(pdfOutput, 'cover-full.pdf');

    if (!coverFileUrl) {
      throw new Error('Failed to upload cover PDF to storage');
    }

    console.log(`Cover PDF uploaded successfully to storage with URL: ${coverFileUrl}`);

    // 封面PDF不需要嵌入字体
    console.log(`封面PDF不需要嵌入字体，直接使用原始上传的PDF URL`);
    let processedCoverUrl = coverFileUrl;

    // 查询数据库获取书籍信息
    const { data: bookData, error: bookError } = await supabase
      .from('funny_biography_books')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (bookError) {
      console.error('Error fetching book data:', bookError);
      throw new Error('Failed to fetch book data');
    }

    if (!bookData) {
      console.error('No book data found for order ID:', orderId);
      throw new Error('Book data not found');
    }

    console.log('Retrieved book data for PDF generation');

    // 如果数据库中没有封面样式信息，则使用传入的参数
    const finalCoverStyle = bookData.style || coverStyle;
    console.log('Using cover style:', finalCoverStyle);

    // 更新数据库，包含PDF数据和URL
    if (orderId) {
      console.log(`Updating database for order ${orderId} with coverPdf and cover_source_url`);

      // 查询当前书籍状态，检查内页PDF是否已生成
      const { data: bookData, error: fetchError } = await supabase
        .from('funny_biography_books')
        .select('interior_source_url, status')
        .eq('order_id', orderId)
        .single();

      const updateData: any = {
        cover_pdf: pdfOutput,
        cover_source_url: processedCoverUrl || coverFileUrl
      };

      if (fetchError) {
        console.error(`Error fetching book data:`, fetchError);
      } else {
        // 如果内页PDF已生成，将状态更新为"已完成"
        if (bookData?.interior_source_url) {
          updateData.status = 'completed';
          console.log(`Interior PDF already generated, updating book status to 'completed'`);
        } else {
          console.log(`Interior PDF not yet generated, keeping current status: ${bookData?.status || 'unknown'}`);
        }
      }

      const { error: updateError } = await supabase
        .from('funny_biography_books')
        .update(updateData)
        .eq('order_id', orderId);

      if (updateError) {
        console.error(`Error updating database:`, updateError);
      } else {
        console.log(`Database updated successfully with coverPdf and cover_source_url`);
        if (updateData.status === 'completed') {
          console.log(`Book status updated to 'completed'`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        pdfOutput: pdfOutput.substring(0, 100) + '...',  // Just show a small preview in the response
        coverSourceUrl: processedCoverUrl || coverFileUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating cover PDF:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
