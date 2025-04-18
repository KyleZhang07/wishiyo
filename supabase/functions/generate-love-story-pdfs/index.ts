import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1'

interface RequestBody {
  orderId: string;
}

serve(async (req) => {
  // 设置CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    // 解析请求体
    const body = await req.json() as RequestBody
    const { orderId } = body

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 创建Supabase客户端
    const supabaseAdmin = createClient(
      // @ts-ignore: Deno 全局变量
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore: Deno 全局变量
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 获取love_story_books记录
    const { data: bookData, error: bookError } = await supabaseAdmin
      .from('love_story_books')
      .select('*')
      .eq('order_id', orderId)
      .single()

    if (bookError || !bookData) {
      return new Response(
        JSON.stringify({ error: 'Book not found', details: bookError }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // 获取client_id，用于查找图片
    const clientId = bookData.client_id;

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'Client ID not found in book record' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // 尝试从两个可能的路径获取图片
    let imageFiles: any[] = [];
    let listError = null;

    // 首先尝试从基于client_id的路径获取
    const { data: clientImages, error: clientListError } = await supabaseAdmin
      .storage
      .from('images')
      .list(`${clientId}`)

    if (!clientListError && clientImages && clientImages.length > 0) {
      imageFiles = clientImages;
    } else {
      // 如果没有找到，尝试从love-story/${orderId}路径获取
      const { data: orderImages, error: orderListError } = await supabaseAdmin
        .storage
        .from('images')
        .list(`love-story/${orderId}`)

      if (!orderListError && orderImages && orderImages.length > 0) {
        imageFiles = orderImages;
        listError = null;
      } else {
        // 两个路径都没有找到图片
        imageFiles = [];
        listError = clientListError || orderListError;
      }
    }

    if (listError || !imageFiles || imageFiles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to list images or no images found', details: listError }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // 对图片进行分类和排序
    const coverImages = imageFiles.filter(file => file.name.includes('love-cover-') && !file.name.includes('back')).sort((a, b) => a.name.localeCompare(b.name))
    const backCoverImages = imageFiles.filter(file => file.name.includes('love-back-cover-')).sort((a, b) => a.name.localeCompare(b.name))
    const spineImages = imageFiles.filter(file => file.name.includes('love-spine-')).sort((a, b) => a.name.localeCompare(b.name))

    // 添加blessing图片筛选
    const blessingImages = imageFiles.filter(file => file.name.includes('blessing')).sort((a, b) => a.name.localeCompare(b.name))

    // 添加ending page图片筛选
    const endingImages = imageFiles.filter(file => file.name.includes('ending-page-')).sort((a, b) => a.name.localeCompare(b.name))

    // 修改介绍图片筛选逻辑，只使用 intro-数字 格式，并排除旧的 love-story-intro 格式
    const introImages = imageFiles.filter(file => {
      // 使用正则表达式匹配 intro-数字 格式，但排除love-story-intro前缀
      const introPattern = /intro-\d+/;
      return introPattern.test(file.name) && !file.name.includes('love-story-intro');
    }).sort((a, b) => {
      // 提取数字进行排序
      const numA = parseInt(a.name.match(/intro-(\d+)/)?.[1] || '0');
      const numB = parseInt(b.name.match(/intro-(\d+)/)?.[1] || '0');
      return numA - numB;
    });

    // 修改内容图片筛选逻辑，只使用 content-数字-数字 格式
    const contentImages = imageFiles.filter(file => {
      // 使用正则表达式匹配 content-数字-数字 格式，但排除love-story-content前缀
      const contentPattern = /content-\d+-\d+/;
      return contentPattern.test(file.name) && !file.name.includes('love-story-content');
    }).sort((a, b) => {
      // 提取第一个数字进行主排序，第二个数字进行次排序
      const matchA = a.name.match(/content-(\d+)-(\d+)/);
      const matchB = b.name.match(/content-(\d+)-(\d+)/);

      if (!matchA || !matchB) return 0;

      const firstNumA = parseInt(matchA[1]);
      const firstNumB = parseInt(matchB[1]);

      if (firstNumA !== firstNumB) {
        return firstNumA - firstNumB;
      }

      const secondNumA = parseInt(matchA[2]);
      const secondNumB = parseInt(matchB[2]);
      return secondNumA - secondNumB;
    });

    // 检查是否有足够的图片
    if (coverImages.length === 0 || introImages.length === 0 || contentImages.length === 0 || backCoverImages.length === 0 || spineImages.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient images for PDF generation',
          details: {
            coverImagesCount: coverImages.length,
            backCoverImagesCount: backCoverImages.length,
            spineImagesCount: spineImages.length,
            blessingImagesCount: blessingImages.length,
            introImagesCount: introImages.length,
            contentImagesCount: contentImages.length,
            endingImagesCount: endingImages.length
          }
        }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 生成完整封面PDF (封底 + 书脊 + 封面)
    const coverPdf = await generateCoverPdf(backCoverImages[0], spineImages[0], coverImages[0], orderId, clientId, supabaseAdmin)

    // 生成内页PDF（按顺序合并：blessing + intro + content图片）
    const interiorPdf = await generatePdf([...blessingImages, ...introImages, ...contentImages, ...endingImages], orderId, clientId, supabaseAdmin)

    // 上传PDF到Storage
    const coverPdfPath = `love-story/${orderId}/cover.pdf`
    const interiorPdfPath = `love-story/${orderId}/interior.pdf`

    console.log(`开始上传封面PDF到路径: ${coverPdfPath}`)
    // 检查封面PDF大小
    const coverPdfSize = coverPdf.byteLength;
    console.log(`封面PDF大小: ${coverPdfSize} 字节 (${Math.round(coverPdfSize/1024/1024 * 100) / 100} MB)`)

    // 上传封面PDF（通常较小，直接上传）
    const { data: coverUploadData, error: coverUploadError } = await supabaseAdmin
      .storage
      .from('pdfs')
      .upload(coverPdfPath, coverPdf, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (coverUploadError) {
      console.error(`上传封面PDF失败:`, JSON.stringify(coverUploadError))
      return new Response(
        JSON.stringify({ error: 'Failed to upload cover PDF', details: coverUploadError }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    console.log(`封面PDF上传成功`)

    // 检查内页PDF大小
    const interiorPdfSize = interiorPdf.byteLength;
    console.log(`内页PDF大小: ${interiorPdfSize} 字节 (${Math.round(interiorPdfSize/1024/1024 * 100) / 100} MB)`)

    // 定义分块上传的大小限制 - 增大每块大小，减少分割份数
    const MAX_CHUNKS = 6; // 最多分成6份
    const MIN_CHUNK_SIZE = 1.5 * 1024 * 1024; // 最小块大小为1.5MB
    // 根据文件大小和最大块数计算块大小
    const CHUNK_SIZE = Math.max(MIN_CHUNK_SIZE, Math.ceil(interiorPdfSize / MAX_CHUNKS));

    // 如果PDF较小，直接上传
    if (interiorPdfSize <= MIN_CHUNK_SIZE) {
      console.log(`开始上传内页PDF到路径: ${interiorPdfPath}`)
      const { data: interiorUploadData, error: interiorUploadError } = await supabaseAdmin
        .storage
        .from('pdfs')
        .upload(interiorPdfPath, interiorPdf, {
          contentType: 'application/pdf',
          upsert: true
        })

      if (interiorUploadError) {
        console.error(`上传内页PDF失败:`, JSON.stringify(interiorUploadError))
        return new Response(
          JSON.stringify({ error: 'Failed to upload interior PDF', details: interiorUploadError }),
          { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
      console.log(`内页PDF上传成功`)
    } else {
      // 对于大文件，我们需要一个替代方案
      console.log(`内页PDF过大 (${Math.round(interiorPdfSize/1024/1024 * 100) / 100} MB)，使用分割上传`)

      try {
        // 将大PDF分割成多个较小的PDF文件上传
        const splitPdfCount = Math.min(MAX_CHUNKS, Math.ceil(interiorPdfSize / CHUNK_SIZE));
        console.log(`将PDF分割成 ${splitPdfCount} 个较小的文件上传，每个文件大约 ${Math.round(CHUNK_SIZE/1024/1024 * 100) / 100} MB`);

        // 创建一个包含所有页面信息的数组
        const pageInfoArray: string[] = [];
        for (let i = 0; i < splitPdfCount; i++) {
          const partPath = `love-story/${orderId}/interior-part${i+1}.pdf`;
          pageInfoArray.push(partPath);
        }

        // 将原始PDF拆分成多个较小的PDF文件
        // 注意：由于我们不能在Edge Function中直接拆分PDF，
        // 所以我们将整个PDF按字节拆分，而不是按页面拆分
        for (let i = 0; i < splitPdfCount; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, interiorPdfSize);
          const chunk = interiorPdf.slice(start, end);

          const partPath = `love-story/${orderId}/interior-part${i+1}.pdf`;
          console.log(`上传PDF部分 ${i+1}/${splitPdfCount} 到 ${partPath}, 大小: ${chunk.byteLength} 字节`);

          const { error: partUploadError } = await supabaseAdmin
            .storage
            .from('pdfs')
            .upload(partPath, chunk, {
              contentType: 'application/pdf',
              upsert: true
            });

          if (partUploadError) {
            console.error(`上传PDF部分 ${i+1} 失败:`, JSON.stringify(partUploadError));
            throw new Error(`上传PDF部分 ${i+1} 失败: ${JSON.stringify(partUploadError)}`);
          }
        }

        // 创建一个索引文件，记录所有部分文件的路径
        const indexContent = JSON.stringify({
          orderId: orderId,
          parts: pageInfoArray,
          totalSize: interiorPdfSize,
          createdAt: new Date().toISOString()
        });

        // 上传索引文件
        const indexPath = `love-story/${orderId}/interior-index.json`;
        const { error: indexUploadError } = await supabaseAdmin
          .storage
          .from('pdfs')
          .upload(indexPath, new TextEncoder().encode(indexContent), {
            contentType: 'application/json',
            upsert: true
          });

        if (indexUploadError) {
          console.error(`上传索引文件失败:`, JSON.stringify(indexUploadError));
          throw new Error(`上传索引文件失败: ${JSON.stringify(indexUploadError)}`);
        }

        console.log(`索引文件上传成功，现在异步触发合并操作`);

        // 异步触发合并操作
        // 获取当前请求的origin
        const origin = req.headers.get('origin') || 'https://wishiyo.com';
        const mergeEndpoint = `${origin}/api/merge-pdf`;

        // 使用fetch API发送POST请求，不等待响应
        try {
          // 使用fire-and-forget模式，不等待响应
          fetch(mergeEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: orderId,
              type: 'interior'
            })
          }).catch(err => {
            // 记录错误但不中断主流程
            console.warn(`触发合并操作失败，但这不会影响上传流程:`, err);
          });

          console.log(`已触发合并操作，继续执行`);
        } catch (triggerError) {
          // 记录错误但不中断主流程
          console.warn(`触发合并操作失败，但这不会影响上传流程:`, triggerError);
        }

        // 上传一个小的占位PDF文件到原始路径，以便前端可以获取URL
        // 这个文件包含一个说明页，告知用户完整PDF正在处理中
        const placeholderPdf = new jsPDF();
        placeholderPdf.text('您的PDF正在处理中...', 10, 10);
        placeholderPdf.text(`原始文件大小: ${Math.round(interiorPdfSize/1024/1024 * 100) / 100} MB`, 10, 20);
        placeholderPdf.text(`分割成 ${splitPdfCount} 个部分`, 10, 30);
        placeholderPdf.text(`订单ID: ${orderId}`, 10, 40);
        placeholderPdf.text('系统正在后台合并您的PDF，请稍后刷新页面查看。', 10, 50);

        // 使用当前请求的URL构建合并服务链接
        const mergeUrl = `${origin}/api/merge-pdf?orderId=${orderId}&type=interior`;
        placeholderPdf.setTextColor(0, 0, 255);
        placeholderPdf.text('如果长时间未完成，请点击此处手动下载', 10, 60);
        placeholderPdf.link(10, 57, 180, 10, { url: mergeUrl });
        placeholderPdf.setTextColor(0, 0, 0);

        const placeholderPdfBytes = placeholderPdf.output('arraybuffer');

        const { error: placeholderUploadError } = await supabaseAdmin
          .storage
          .from('pdfs')
          .upload(interiorPdfPath, new Uint8Array(placeholderPdfBytes), {
            contentType: 'application/pdf',
            upsert: true
          });

        if (placeholderUploadError) {
          console.error(`上传占位PDF失败:`, JSON.stringify(placeholderUploadError));
          throw new Error(`上传占位PDF失败: ${JSON.stringify(placeholderUploadError)}`);
        }

        console.log(`PDF分割上传成功，共 ${splitPdfCount} 个部分，已触发后台合并`);

      } catch (error) {
        console.error(`PDF分割上传过程中出错:`, error);
        return new Response(
          JSON.stringify({ error: 'Failed to upload interior PDF using split upload', details: error }),
          { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // 获取PDF的公共URL
    const { data: coverUrl } = supabaseAdmin
      .storage
      .from('pdfs')
      .getPublicUrl(coverPdfPath)

    const { data: interiorUrl } = supabaseAdmin
      .storage
      .from('pdfs')
      .getPublicUrl(interiorPdfPath)

    console.log(`开始更新数据库记录，订单ID: ${orderId}`)
    console.log(`封面PDF URL: ${coverUrl.publicUrl}`)
    console.log(`内页PDF URL: ${interiorUrl.publicUrl}`)

    // 更新love_story_books记录
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('love_story_books')
      .update({
        cover_pdf: coverUrl.publicUrl,
        interior_pdf: interiorUrl.publicUrl,
        cover_source_url: coverUrl.publicUrl,
        interior_source_url: interiorUrl.publicUrl,
        status: 'pdf_generated',
        ready_for_printing: true // 设置为准备好打印
      })
      .eq('order_id', orderId)
      .select()

    if (updateError) {
      console.error(`更新数据库记录失败:`, JSON.stringify(updateError))
      return new Response(
        JSON.stringify({ error: 'Failed to update book record', details: updateError }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    console.log(`数据库记录更新成功`)

    return new Response(
      JSON.stringify({
        success: true,
        coverPdfUrl: coverUrl.publicUrl,
        interiorPdfUrl: interiorUrl.publicUrl,
        book: updateData
      }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// 新增函数：生成完整封面PDF（封底+书脊+封面）
async function generateCoverPdf(backCoverFile: any, spineFile: any, frontCoverFile: any, orderId: string, clientId: string | null, supabase: any): Promise<Uint8Array> {
  // 创建PDF，设置为Lulu要求的总文档尺寸 (19" x 10.25")
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: [19, 10.25] // Lulu模板总文档尺寸
  })

  // 获取书籍记录，以获取封面样式
  const { data: bookData, error: bookError } = await supabase
    .from('love_story_books')
    .select('style')
    .eq('order_id', orderId)
    .single()

  // 定义样式到背景色的映射
  const styleBackgroundColors: Record<string, { r: number, g: number, b: number }> = {
    'classic': { r: 247, g: 210, b: 213 }, // #F7D2D5
    'vintage': { r: 248, g: 233, b: 214 }, // #f8e9d6
    'modern': { r: 26, g: 46, b: 90 }, // #1A2E5A
    'playful': { r: 217, g: 234, b: 211 }, // #D9EAD3
    'elegant': { r: 222, g: 196, b: 217 } // #DEC4D9
  };

  // 获取封面样式
  const coverStyle = bookData?.style || 'classic';

  // 获取样式对应的背景色
  const styleColor = styleBackgroundColors[coverStyle] || { r: 255, g: 255, b: 255 }; // 默认白色

  console.log('Using style color for bleed areas:',
    `Style ID: ${coverStyle}`,
    `Color: rgb(${styleColor.r},${styleColor.g},${styleColor.b})`
  );

  // 从Supabase下载图片
  async function downloadImage(file: any): Promise<string> {
    let imageData = null
    let imageError = null

    // 首先尝试从client_id路径获取图片
    if (clientId) {
      const clientPathResult = await supabase
        .storage
        .from('images')
        .download(`${clientId}/${file.name}`)

      if (!clientPathResult.error && clientPathResult.data) {
        imageData = clientPathResult.data
        imageError = null
      } else {
        // 如果从client_id路径获取失败，尝试从order_id路径获取
        const orderPathResult = await supabase
          .storage
          .from('images')
          .download(`love-story/${orderId}/${file.name}`)

        imageData = orderPathResult.data
        imageError = orderPathResult.error
      }
    } else {
      // 如果没有client_id，直接从order_id路径获取
      const { data, error } = await supabase
        .storage
        .from('images')
        .download(`love-story/${orderId}/${file.name}`)

      imageData = data
      imageError = error
    }

    if (imageError || !imageData) {
      console.error(`Failed to download image: ${file.name}`, imageError)
      throw new Error(`Failed to download image: ${file.name}`)
    }

    // 转换图片为base64
    const imageBase64 = await blobToBase64(imageData)
    return imageBase64
  }

  // 下载所有需要的图片
  const backCoverBase64 = await downloadImage(backCoverFile)
  const spineBase64 = await downloadImage(spineFile)
  const frontCoverBase64 = await downloadImage(frontCoverFile)

  // Lulu模板中的精确尺寸设置
  const totalDocWidth = 19;        // 总文档宽度 (外边缘到外边缘)
  const totalDocHeight = 10.25;    // 总文档高度
  const bleedWidth = 0.125;        // 裁切区域宽度 (Bleed Area)
  const wrapAreaWidth = 0.75;      // 包装区域宽度 (Wrap Area)
  const totalWrapWidth = bleedWidth + wrapAreaWidth; // 总出血区域宽度 = 0.875英寸
  const spineWidth = 0.25;         // 书脊宽度 (Spine Width for hardcover)
  const bookTrimWidth = 8.5;       // 书籍裁切尺寸宽度 (Book Trim Size)
  const bookTrimHeight = 8.5;      // 书籍裁切尺寸高度
  const safetyMarginWidth = 0.5;   // 安全边距宽度

  // 根据总文档宽度和书脊宽度计算封面和封底的实际宽度
  // 总文档宽度 = 封底宽度 + 书脊宽度 + 封面宽度
  // 19 = 封面宽度 * 2 + 0.25
  // 封面宽度 = (19 - 0.25) / 2 = 9.375"
  const coverWidth = (totalDocWidth - spineWidth) / 2;  // 9.375"

  // 计算总内容宽度（封底 + 书脊 + 封面）
  const totalContentWidth = (coverWidth * 2) + spineWidth; // 9.375 + 9.375 + 0.25 = 19"

  // 确保内容宽度等于总文档宽度
  console.log(`总内容宽度: ${totalContentWidth}", 总文档宽度: ${totalDocWidth}"`);

  // 计算左侧边距，使整个设计在PDF中居中
  const leftMargin = (totalDocWidth - totalContentWidth) / 2;

  // 应该接近于0
  const adjustedLeftMargin = Math.max(0, leftMargin);

  // 各部分的位置
  const backCoverX = adjustedLeftMargin;  // 封底从左边距开始
  const spineX = backCoverX + coverWidth;  // 书脊紧跟封底
  const frontCoverX = spineX + spineWidth;  // 封面紧跟书脊

  // Y轴位置（从顶部开始）
  const coverY = 0;  // 从PDF顶部开始

  // 先填充整个背景以确保没有空白区域
  console.log('填充背景为整个PDF');

  // 填充整个PDF背景为白色（作为底层）
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, totalDocWidth, totalDocHeight, 'F');

  // 填充扩展的出血区域背景

  // 1. 绘制背面封面背景颜色（包括出血区域）
  console.log('填充封底背景与出血区域扩展');
  pdf.setFillColor(styleColor.r, styleColor.g, styleColor.b); // 使用样式背景色
  pdf.rect(
    0, // 左侧扩展到PDF边缘
    0, // 顶部扩展到PDF边缘
    backCoverX + coverWidth, // 宽度包括左侧出血区和封底
    totalDocHeight, // 高度扩展到整个PDF高度
    'F'
  );

  // 2. 绘制书脉背景颜色（包括出血区域）
  console.log('填充书脉背景与出血区域扩展');
  pdf.setFillColor(styleColor.r, styleColor.g, styleColor.b); // 使用样式背景色
  pdf.rect(
    backCoverX + coverWidth,
    0, // 顶部扩展到PDF边缘
    spineWidth,
    totalDocHeight, // 高度扩展到整个PDF高度
    'F'
  );

  // 3. 绘制正面封面背景颜色（包括出血区域）
  console.log('填充封面背景与出血区域扩展');
  pdf.setFillColor(styleColor.r, styleColor.g, styleColor.b); // 使用样式背景色
  pdf.rect(
    frontCoverX,
    0, // 顶部扩展到PDF边缘
    coverWidth, // 宽度扩展到PDF右边缘
    totalDocHeight, // 高度扩展到整个PDF高度
    'F'
  );

  // 添加封底（左侧）- 精确覆盖区域
  // 注意：我们需要确保图片内容完全在蓝色辅助线内
  // 图片应该在封面设计时就进行适当缩放和定位

  // 定义缩放因子和偏移量，以确保内容在安全区域内

  // 定义出血区域边距
  const bleedMargin = 0.875; // 0.875英寸的出血区域

  // 计算蓝色辅助线内的尺寸
  // 我们只需要高度，因为宽度将根据书脊位置计算
  const blueGuideHeight = totalDocHeight - (2 * bleedMargin); // 蓝色辅助线内的高度

  // 封底图片的缩放和偏移 - 修改为贴合书脊
  // 封底图片应该从左侧出血区域开始，一直延伸到书脊左边缘
  const scaledBackWidth = coverWidth - bleedMargin; // 宽度从左侧出血区域到书脊
  const scaledBackHeight = blueGuideHeight; // 使用蓝色辅助线的高度
  const backXOffset = bleedMargin; // 左侧偏移量是出血区域的宽度
  const backYOffset = bleedMargin; // 顶部偏移量是出血区域的高度

  // 添加封底（左侧）
  pdf.addImage(
    backCoverBase64,
    'JPEG',
    backCoverX + backXOffset,
    coverY + backYOffset,
    scaledBackWidth,
    scaledBackHeight,
    undefined,
    'NONE' // 不压缩图片，保持原始质量
  )

  // 书脊图片的缩放和偏移
  // 注意：书脊宽度很小，我们需要特殊处理
  // 对于书脊，我们只缩放高度，保持宽度不变
  const scaledSpineWidth = spineWidth; // 不缩放宽度
  const scaledSpineHeight = totalDocHeight - (2 * bleedMargin); // 使用蓝色辅助线的高度
  const spineXOffset = 0; // 不需要水平偏移
  const spineYOffset = bleedMargin; // 顶部偏移量是出血区域的高度

  // 添加书脊（中间）
  pdf.addImage(
    spineBase64,
    'JPEG',
    spineX + spineXOffset,
    coverY + spineYOffset,
    scaledSpineWidth,
    scaledSpineHeight,
    undefined,
    'NONE'
  )

  // 添加封面（右侧） - 调整图片位置和大小以确保内容贴合书脊
  // 封面图片应该从书脊右边缘开始，一直延伸到右侧出血区域
  const scaledWidth = coverWidth - bleedMargin; // 宽度从书脊到右侧出血区域
  const scaledHeight = blueGuideHeight; // 使用蓝色辅助线的高度
  const xOffset = 0; // 不需要水平偏移，直接从书脊开始
  const yOffset = bleedMargin; // 顶部偏移量是出血区域的高度

  pdf.addImage(
    frontCoverBase64,
    'JPEG',
    frontCoverX + xOffset,
    coverY + yOffset,
    scaledWidth,
    scaledHeight,
    undefined,
    'NONE'
  )



  // 添加辅助线来标记安全边距、裁切线等
  const debugLines = false; // 暂时禁用辅助线
  if (debugLines) {
    // 蓝色辅助线 - 表示裁切区域的边界
    const bleedMargin = 0.875; // 0.875英寸的出血区域

    // 封底安全区域
    pdf.setDrawColor(0, 0, 255); // 蓝色
    pdf.setLineWidth(0.5);
    pdf.rect(
      backCoverX + bleedMargin,
      bleedMargin,
      coverWidth - (2 * bleedMargin),
      totalDocHeight - (2 * bleedMargin)
    );

    // 书脊安全区域
    pdf.rect(
      spineX + bleedMargin,
      bleedMargin,
      spineWidth - (2 * bleedMargin),
      totalDocHeight - (2 * bleedMargin)
    );

    // 封面安全区域
    pdf.rect(
      frontCoverX + bleedMargin,
      bleedMargin,
      coverWidth - (2 * bleedMargin),
      totalDocHeight - (2 * bleedMargin)
    );

    // 红色安全边距 - 内容应该保持在这个区域内
    const safetyMargin = 0.5; // 安全边距为0.5英寸
    pdf.setDrawColor(255, 0, 0); // 红色

    // 封底安全区域
    pdf.rect(
      backCoverX + bleedMargin + safetyMargin,
      bleedMargin + safetyMargin,
      coverWidth - (2 * (bleedMargin + safetyMargin)),
      totalDocHeight - (2 * (bleedMargin + safetyMargin))
    );

    // 书脊安全区域
    pdf.rect(
      spineX + bleedMargin + safetyMargin,
      bleedMargin + safetyMargin,
      spineWidth - (2 * (bleedMargin + safetyMargin)),
      totalDocHeight - (2 * (bleedMargin + safetyMargin))
    );

    // 封面安全区域
    pdf.rect(
      frontCoverX + bleedMargin + safetyMargin,
      bleedMargin + safetyMargin,
      coverWidth - (2 * (bleedMargin + safetyMargin)),
      totalDocHeight - (2 * (bleedMargin + safetyMargin))
    );
    // 蓝色辅助线表示出血区域的内边缘（裁切线）
    pdf.setDrawColor(0, 0, 255); // 蓝色
    pdf.setLineWidth(0.02); // 稍微加粗

    // 计算蓝色辅助线的位置
    // 封底蓝色辅助线应该从左边距开始加0.875英寸，一直延伸到书脊左边缘
    const backBlueLeft = backCoverX + totalWrapWidth;
    const backBlueRight = spineX; // 封底蓝色辅助线的右边缘应该正好是书脊的左边缘
    const blueTop = coverY + totalWrapWidth;
    const blueBottom = totalDocHeight - totalWrapWidth;

    // 封底蓝色矩形
    pdf.rect(
      backBlueLeft,
      blueTop,
      backBlueRight - backBlueLeft,
      blueBottom - blueTop
    );

    // 封面蓝色辅助线应该从书脊右边缘开始，一直延伸到封面右边缘减去0.875英寸
    const frontBlueLeft = frontCoverX; // 封面蓝色辅助线的左边缘应该正好是书脊的右边缘
    const frontBlueRight = frontCoverX + coverWidth - totalWrapWidth;

    // 封面蓝色矩形
    pdf.rect(
      frontBlueLeft,
      blueTop,
      frontBlueRight - frontBlueLeft,
      blueBottom - blueTop
    );

    // 书脊蓝色辅助线 - 贴着spine的线
    pdf.rect(spineX, blueTop, spineWidth, blueBottom - blueTop);

    // 绘制红色辅助线 - 表示安全边距的内边缘
    pdf.setDrawColor(255, 0, 0); // 红色
    pdf.setLineWidth(0.01);

    // 封底红色辅助线 - 距离蓝色线0.5英寸
    const backRedLeft = backBlueLeft + safetyMarginWidth;
    const backRedRight = backBlueRight - safetyMarginWidth; // 封底红色辅助线的右边缘应该距离书脊左边缘0.5英寸
    const redTop = blueTop + safetyMarginWidth;
    const redBottom = blueBottom - safetyMarginWidth;

    // 封底红色矩形
    pdf.rect(
      backRedLeft,
      redTop,
      backRedRight - backRedLeft,
      redBottom - redTop
    );

    // 封面红色辅助线 - 距离蓝色线0.5英寸
    const frontRedLeft = frontBlueLeft + safetyMarginWidth; // 封面红色辅助线的左边缘应该距离书脊右边缘0.5英寸
    const frontRedRight = frontBlueRight - safetyMarginWidth;

    // 封面红色矩形
    pdf.rect(
      frontRedLeft,
      redTop,
      frontRedRight - frontRedLeft,
      redBottom - redTop
    );

    // 添加标签文字 - 浅蓝色
    pdf.setTextColor(0, 162, 232);
    pdf.setFontSize(8);

    // 底部标签
    pdf.text('SPINE', spineX + (spineWidth/2), totalDocHeight - 0.1, { align: 'center' });
    pdf.text('BACK COVER', backCoverX + (coverWidth/2), totalDocHeight - 0.1, { align: 'center' });
    pdf.text('FRONT COVER', frontCoverX + (coverWidth/2), totalDocHeight - 0.1, { align: 'center' });

    // 顶部尺寸标签
    pdf.text(`Spine: ${spineWidth}"`, spineX + (spineWidth/2), 0.3, { align: 'center' });
    pdf.text(`Back: ${coverWidth}"`, backCoverX + (coverWidth/2), 0.3, { align: 'center' });
    pdf.text(`Front: ${coverWidth}"`, frontCoverX + (coverWidth/2), 0.3, { align: 'center' });

    // 添加总尺寸标签
    pdf.text(`Total Document: ${totalDocWidth}" x ${totalDocHeight}"`, totalDocWidth - 1, 0.3, { align: 'right' });
    pdf.text(`Left Margin: ${adjustedLeftMargin.toFixed(3)}"`, 1, 0.3, { align: 'left' });
  }

  // 转换PDF为Uint8Array
  const pdfOutput = pdf.output('arraybuffer')
  return new Uint8Array(pdfOutput)
}

// 辅助函数：生成PDF
async function generatePdf(imageFiles: any[], orderId: string, clientId: string | null, supabase: any): Promise<Uint8Array> {
  console.log(`开始生成PDF，处理 ${imageFiles.length} 张图片...`)
  console.log(`订单ID: ${orderId}`)

  // 根据Lulu模板修改为方形格式
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [8.75, 8.75] // 总文档尺寸 8.75" x 8.75"
  })

  // Lulu内页模板尺寸设置
  const totalDocSize = 8.75;       // 总文档尺寸
  const bookTrimSize = 8.5;        // 书籍裁切尺寸
  const bleedWidth = 0.125;        // 出血区域宽度
  const safetyMarginWidth = 0.5;   // 安全边距宽度

  let currentPage = 0
  let successCount = 0
  let errorCount = 0

  // 分批处理图片，每批处理5张
  const batchSize = 5;
  const totalBatches = Math.ceil(imageFiles.length / batchSize);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    console.log(`处理批次 ${batchIndex + 1}/${totalBatches}...`);

    // 计算当前批次的起始和结束索引
    const startIndex = batchIndex * batchSize;
    const endIndex = Math.min(startIndex + batchSize, imageFiles.length);
    const currentBatchFiles = imageFiles.slice(startIndex, endIndex);

    // 处理当前批次的图片
    for (const file of currentBatchFiles) {
      try {
        console.log(`处理图片 ${currentPage + 1}/${imageFiles.length}: ${file.name}`);

        let imageData = null;
        let imageError = null;

        // 首先尝试从client_id路径获取图片
        if (clientId) {
          const clientPathResult = await supabase
            .storage
            .from('images')
            .download(`${clientId}/${file.name}`);

          if (!clientPathResult.error && clientPathResult.data) {
            imageData = clientPathResult.data;
            imageError = null;
          } else {
            // 如果从client_id路径获取失败，尝试从order_id路径获取
            const orderPathResult = await supabase
              .storage
              .from('images')
              .download(`love-story/${orderId}/${file.name}`);

            imageData = orderPathResult.data;
            imageError = orderPathResult.error;
          }
        } else {
          // 如果没有client_id，直接从order_id路径获取
          const { data, error } = await supabase
            .storage
            .from('images')
            .download(`love-story/${orderId}/${file.name}`);

          imageData = data;
          imageError = error;
        }

        if (imageError || !imageData) {
          console.error(`无法下载图片 ${file.name}:`, imageError);
          errorCount++;
          continue; // 跳过这张图片，继续处理下一张
        }

        // 转换图片为base64
        const imageBase64 = await blobToBase64(imageData);

        // 立即释放原始图片数据内存
        imageData = null;

        // 添加新页（除了第一页）
        if (currentPage > 0) {
          pdf.addPage();
        }

        // 添加图片到PDF - 填满整个页面包括出血区域
        pdf.addImage(
          imageBase64,
          'JPEG',
          0, // x坐标
          0, // y坐标
          totalDocSize, // 宽度（总文档宽度）
          totalDocSize, // 高度（总文档高度）
          `img_${currentPage}` // 唯一ID，避免重复
        );

        // 添加安全边距指示线（仅用于调试）
        const debugLines = false; // 暂时禁用辅助线
        if (debugLines) {
          pdf.setDrawColor(255, 0, 0); // 红色
          pdf.setLineWidth(0.01);

          // 安全边距矩形 - 修正计算方式
          pdf.rect(
            bleedWidth + safetyMarginWidth,
            bleedWidth + safetyMarginWidth,
            bookTrimSize - (2 * safetyMarginWidth),
            bookTrimSize - (2 * safetyMarginWidth)
          );

          // 裁切线（Trim Size）
          pdf.setDrawColor(0, 0, 255); // 蓝色
          pdf.rect(
            bleedWidth,
            bleedWidth,
            bookTrimSize,
            bookTrimSize
          );

          // 添加总文档边界
          pdf.setDrawColor(0, 162, 232); // 浅蓝色
          pdf.rect(0, 0, totalDocSize, totalDocSize);

          // 添加标签文本
          pdf.setFontSize(6);
          pdf.setTextColor(0, 162, 232);
          pdf.text('TRIM / BLEED AREA', totalDocSize/2, 0.1, { align: 'center' });
          pdf.text('TRIM / BLEED AREA', totalDocSize/2, totalDocSize - 0.05, { align: 'center' });

          // 添加页码标签
          pdf.setTextColor(0, 0, 0);
          pdf.text(`PAGE ${currentPage + 1}`, totalDocSize/2, bleedWidth/2, { align: 'center' });
        }

        currentPage++;
        successCount++;

        // 每处理一张图片就尝试手动触发垃圾回收
        if (typeof global !== 'undefined' && global.gc) {
          global.gc();
        }
      } catch (error) {
        console.error(`处理图片 ${file.name} 时出错:`, error);
        errorCount++;
        // 继续处理下一张图片，而不是中断整个过程
      }
    }

    // 每批次处理完毕后，输出内存使用情况
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memoryUsage = process.memoryUsage();
      console.log(`批次 ${batchIndex + 1} 完成，内存使用：${Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100} MB / ${Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`);
    } else {
      console.log(`批次 ${batchIndex + 1} 完成，已处理 ${currentPage}/${imageFiles.length} 张图片 (成功: ${successCount}, 失败: ${errorCount})`);
    }

    // 批次间暂停一小段时间，让系统有机会回收内存
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`PDF生成完成，共处理 ${imageFiles.length} 张图片 (成功: ${successCount}, 失败: ${errorCount})`);

  // 转换PDF为Uint8Array
  const pdfOutput = pdf.output('arraybuffer');
  const pdfSize = pdfOutput.byteLength;
  console.log(`生成的PDF大小: ${pdfSize} 字节 (${Math.round(pdfSize/1024/1024 * 100) / 100} MB)`);

  return new Uint8Array(pdfOutput);
}

// 辅助函数：Blob转Base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// 注意：dataURLtoBlob函数已被移除，因为它未被使用
