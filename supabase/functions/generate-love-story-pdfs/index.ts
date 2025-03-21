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

    const { data: coverUploadData, error: coverUploadError } = await supabaseAdmin
      .storage
      .from('pdfs')
      .upload(coverPdfPath, coverPdf, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (coverUploadError) {
      return new Response(
        JSON.stringify({ error: 'Failed to upload cover PDF', details: coverUploadError }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const { data: interiorUploadData, error: interiorUploadError } = await supabaseAdmin
      .storage
      .from('pdfs')
      .upload(interiorPdfPath, interiorPdf, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (interiorUploadError) {
      return new Response(
        JSON.stringify({ error: 'Failed to upload interior PDF', details: interiorUploadError }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
      )
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
      return new Response(
        JSON.stringify({ error: 'Failed to update book record', details: updateError }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

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
  const wrapAreaWidth = 0.75;      // 出血区域宽度 (Wrap Area)
  const spineWidth = 0.25;         // 书脊宽度 (Minimum Spine Width)
  const bookCoverWidth = 8.625;    // 书籍封面宽度 (Book Cover Size)
  const bookCoverHeight = 8.75;    // 书籍封面高度
  const bookTrimWidth = 8.5;       // 书籍裁切尺寸宽度 (Book Trim Size)
  const bookTrimHeight = 8.5;      // 书籍裁切尺寸高度
  const safetyMarginWidth = 0.5;   // 安全边距宽度
  
  // 修正计算：封面和封底宽度应包括两侧的Wrap Area
  const backCoverWidth = bookCoverWidth + (wrapAreaWidth * 2);  // 10.125"
  const frontCoverWidth = backCoverWidth;  // 10.125"
  
  // 修正各部分的位置布局
  const backCoverX = 0;  // 封底从左侧开始
  const spineX = backCoverX + backCoverWidth;  // 书脊位于封底右侧 (10.125")
  const frontCoverX = spineX + spineWidth;  // 封面位于书脊右侧 (10.375")
  
  // Y轴位置（从顶部开始）
  const coverY = 0;  // 从PDF顶部开始
  
  // 添加封底（左侧）- 精确覆盖区域
  pdf.addImage(
    backCoverBase64,
    'JPEG',
    backCoverX,
    coverY,
    backCoverWidth,
    totalDocHeight,
    undefined
  )
  
  // 添加书脊（中间）
  pdf.addImage(
    spineBase64,
    'JPEG',
    spineX,
    coverY,
    spineWidth,
    totalDocHeight,
    undefined
  )
  
  // 添加封面（右侧）
  pdf.addImage(
    frontCoverBase64,
    'JPEG',
    frontCoverX,
    coverY,
    frontCoverWidth,
    totalDocHeight,
    undefined
  )
  
  // 如果需要，可以添加辅助线来标记安全边距、裁切线等（仅用于调试）
  const debugLines = true; // 设置为true以显示调试线
  if (debugLines) {
    pdf.setDrawColor(255, 0, 0); // 红色
    pdf.setLineWidth(0.01);
    
    // 封底安全边距 - 修正位置
    pdf.rect(
      backCoverX + wrapAreaWidth + safetyMarginWidth, 
      (totalDocHeight - bookTrimHeight)/2 + safetyMarginWidth, 
      bookTrimWidth - (2 * safetyMarginWidth), 
      bookTrimHeight - (2 * safetyMarginWidth)
    );
    
    // 封面安全边距 - 修正位置
    pdf.rect(
      frontCoverX + wrapAreaWidth + safetyMarginWidth, 
      (totalDocHeight - bookTrimHeight)/2 + safetyMarginWidth, 
      bookTrimWidth - (2 * safetyMarginWidth), 
      bookTrimHeight - (2 * safetyMarginWidth)
    );
    
    // 标记出书脊区域
    pdf.setDrawColor(0, 0, 255); // 蓝色
    pdf.rect(spineX, 0, spineWidth, totalDocHeight);

    // 标记出裁切线（Trim Lines）
    pdf.setDrawColor(0, 162, 232); // 浅蓝色
    
    // 封底裁切线
    const backTrimLeft = backCoverX + wrapAreaWidth;
    const backTrimRight = backTrimLeft + bookTrimWidth;
    const trimTop = (totalDocHeight - bookTrimHeight) / 2;
    const trimBottom = trimTop + bookTrimHeight;
    
    // 封底裁切线
    pdf.rect(backTrimLeft, trimTop, bookTrimWidth, bookTrimHeight);
    
    // 封面裁切线
    const frontTrimLeft = frontCoverX + wrapAreaWidth;
    pdf.rect(frontTrimLeft, trimTop, bookTrimWidth, bookTrimHeight);
    
    // 标记出总文档尺寸（包括出血区域）
    pdf.setDrawColor(128, 128, 128); // 灰色
    pdf.rect(0, 0, totalDocWidth, totalDocHeight);
    
    // 添加标签文本
    pdf.setFontSize(6);
    pdf.setTextColor(0, 162, 232);
    pdf.text('TRIM AREA', backTrimLeft + (bookTrimWidth/2), trimTop - 0.1, { align: 'center' });
    pdf.text('TRIM AREA', frontTrimLeft + (bookTrimWidth/2), trimTop - 0.1, { align: 'center' });
    
    pdf.setTextColor(255, 0, 0);
    pdf.text('SAFETY MARGIN', backTrimLeft + (bookTrimWidth/2), trimTop + 0.2, { align: 'center' });
    pdf.text('SAFETY MARGIN', frontTrimLeft + (bookTrimWidth/2), trimTop + 0.2, { align: 'center' });
    
    // 添加部分标签
    pdf.setTextColor(0, 0, 255);
    pdf.text('SPINE', spineX + (spineWidth/2), totalDocHeight/2, { angle: 90, align: 'center' });
    
    pdf.text('BACK COVER', backCoverX + (backCoverWidth/2), totalDocHeight - 0.1, { align: 'center' });
    pdf.text('FRONT COVER', frontCoverX + (frontCoverWidth/2), totalDocHeight - 0.1, { align: 'center' });
    
    // 添加尺寸标注
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Total: ${totalDocWidth}" x ${totalDocHeight}"`, totalDocWidth/2, 0.2, { align: 'center' });
    pdf.text(`Back: ${backCoverWidth}"`, backCoverX + (backCoverWidth/2), 0.3, { align: 'center' });
    pdf.text(`Spine: ${spineWidth}"`, spineX + (spineWidth/2), 0.3, { align: 'center' });
    pdf.text(`Front: ${frontCoverWidth}"`, frontCoverX + (frontCoverWidth/2), 0.3, { align: 'center' });
  }
  
  // 转换PDF为Uint8Array
  const pdfOutput = pdf.output('arraybuffer')
  return new Uint8Array(pdfOutput)
}

// 辅助函数：生成PDF
async function generatePdf(imageFiles: any[], orderId: string, clientId: string | null, supabase: any): Promise<Uint8Array> {
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

  // 移除重复查询client_id的代码，直接使用传入的参数
  for (const file of imageFiles) {
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
      continue
    }

    // 转换图片为base64
    const imageBase64 = await blobToBase64(imageData)

    // 添加新页（除了第一页）
    if (currentPage > 0) {
      pdf.addPage()
    }

    // 添加图片到PDF - 填满整个页面包括出血区域
    pdf.addImage(
      imageBase64,
      'JPEG',
      0, // x坐标
      0, // y坐标
      totalDocSize, // 宽度（总文档宽度）
      totalDocSize // 高度（总文档高度）
    )
    
    // 添加安全边距指示线（仅用于调试）
    const debugLines = true; // 设置为true显示调试线
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

    currentPage++
  }

  // 转换PDF为Uint8Array
  const pdfOutput = pdf.output('arraybuffer')
  return new Uint8Array(pdfOutput)
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
