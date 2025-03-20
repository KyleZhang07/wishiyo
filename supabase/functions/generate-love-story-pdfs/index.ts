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
    const introImages = imageFiles.filter(file => file.name.includes('intro')).sort((a, b) => a.name.localeCompare(b.name))
    const contentImages = imageFiles.filter(file => file.name.includes('content')).sort((a, b) => a.name.localeCompare(b.name))

    // 检查是否有足够的图片
    if (coverImages.length === 0 || introImages.length === 0 || contentImages.length === 0 || backCoverImages.length === 0 || spineImages.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient images for PDF generation', 
          details: {
            coverImagesCount: coverImages.length,
            backCoverImagesCount: backCoverImages.length,
            spineImagesCount: spineImages.length,
            introImagesCount: introImages.length,
            contentImagesCount: contentImages.length
          }
        }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 生成完整封面PDF (封底 + 书脊 + 封面)
    const coverPdf = await generateCoverPdf(backCoverImages[0], spineImages[0], coverImages[0], orderId, supabaseAdmin)
    
    // 生成内页PDF（合并intro和content图片）
    const interiorPdf = await generatePdf([...introImages, ...contentImages], orderId, supabaseAdmin)

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
async function generateCoverPdf(backCoverFile: any, spineFile: any, frontCoverFile: any, orderId: string, supabase: any): Promise<Uint8Array> {
  // 创建PDF，横向模式以容纳封面+书脊+封底
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: [11, 8.5] // 横向A4尺寸大约是11x8.5英寸
  })
  
  // 获取book记录以获取client_id
  const { data: bookData, error: bookError } = await supabase
    .from('love_story_books')
    .select('client_id')
    .eq('order_id', orderId)
    .single()

  if (bookError || !bookData) {
    console.error('Failed to get book data for client_id', bookError)
    throw new Error('Failed to get book data for client_id')
  }

  const clientId = bookData.client_id
  
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
  
  // 设置页面尺寸，根据Lulu要求调整 - 8.625" x 8.75"
  const coverWidth = 8.625 // 英寸
  const coverHeight = 8.75 // 英寸
  const spineWidth = 0.25 // 英寸
  
  // 出血区域宽度 - 通常为0.125"
  const bleedWidth = 0.125 // 英寸
  
  // 计算位置，从左到右放置：封底 + 书脊 + 封面
  // 包括出血区域的总宽度
  const totalWidth = (coverWidth + bleedWidth * 2) * 2 + spineWidth
  const startX = (11 - totalWidth) / 2 // 居中放置
  
  // 添加封底 (左侧) - 包括出血区域
  pdf.addImage(
    backCoverBase64,
    'JPEG',
    startX, // x坐标
    0, // y坐标
    coverWidth + bleedWidth * 2, // 宽度（包括左右出血区域）
    coverHeight + bleedWidth * 2, // 高度（包括上下出血区域）
    undefined, // 别名
    'FAST' // 压缩选项
  )
  
  // 添加书脊 (中间)
  pdf.addImage(
    spineBase64,
    'JPEG',
    startX + coverWidth + bleedWidth * 2, // x坐标 (紧跟封底)
    0, // y坐标
    spineWidth, // 宽度
    coverHeight + bleedWidth * 2, // 高度（包括上下出血区域）
    undefined, // 别名
    'FAST' // 压缩选项
  )
  
  // 添加封面 (右侧) - 包括出血区域
  pdf.addImage(
    frontCoverBase64,
    'JPEG',
    startX + coverWidth + bleedWidth * 2 + spineWidth, // x坐标 (紧跟书脊)
    0, // y坐标
    coverWidth + bleedWidth * 2, // 宽度（包括左右出血区域）
    coverHeight + bleedWidth * 2, // 高度（包括上下出血区域）
    undefined, // 别名
    'FAST' // 压缩选项
  )
  
  // 绘制安全边距指示线（可选，用于调试）
  /*
  const safetyMargin = 0.5; // 安全边距，通常为0.5英寸
  pdf.setDrawColor(255, 0, 0);
  pdf.setLineWidth(0.01);
  // 封底安全边距
  pdf.rect(
    startX + bleedWidth + safetyMargin, 
    bleedWidth + safetyMargin, 
    coverWidth - safetyMargin * 2, 
    coverHeight - safetyMargin * 2
  );
  // 封面安全边距
  pdf.rect(
    startX + coverWidth + bleedWidth * 2 + spineWidth + bleedWidth + safetyMargin, 
    bleedWidth + safetyMargin, 
    coverWidth - safetyMargin * 2, 
    coverHeight - safetyMargin * 2
  );
  */
  
  // 转换PDF为Uint8Array
  const pdfOutput = pdf.output('arraybuffer')
  return new Uint8Array(pdfOutput)
}

// 辅助函数：生成PDF
async function generatePdf(imageFiles: any[], orderId: string, supabase: any): Promise<Uint8Array> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  let currentPage = 0

  // 首先获取book记录以获取client_id
  const { data: bookData, error: bookError } = await supabase
    .from('love_story_books')
    .select('client_id')
    .eq('order_id', orderId)
    .single()

  if (bookError || !bookData) {
    console.error('Failed to get book data for client_id', bookError)
    throw new Error('Failed to get book data for client_id')
  }

  const clientId = bookData.client_id

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

    // 添加图片到PDF
    pdf.addImage(
      imageBase64,
      'JPEG',
      0, // x坐标
      0, // y坐标
      210, // 宽度（A4纸宽度为210mm）
      297, // 高度（A4纸高度为297mm）
      undefined, // 别名
      'FAST' // 压缩选项
    )

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
