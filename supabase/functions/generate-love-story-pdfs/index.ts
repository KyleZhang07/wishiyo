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

    // 获取图片列表
    const { data: imageFiles, error: listError } = await supabaseAdmin
      .storage
      .from('images')
      .list(`love-story/${orderId}`)

    if (listError || !imageFiles) {
      return new Response(
        JSON.stringify({ error: 'Failed to list images', details: listError }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // 对图片进行分类和排序
    const coverImages = imageFiles.filter(file => file.name.includes('cover')).sort((a, b) => a.name.localeCompare(b.name))
    const introImages = imageFiles.filter(file => file.name.includes('intro')).sort((a, b) => a.name.localeCompare(b.name))
    const contentImages = imageFiles.filter(file => file.name.includes('content')).sort((a, b) => a.name.localeCompare(b.name))

    // 生成封面PDF
    const coverPdf = await generatePdf([coverImages[0]], orderId, supabaseAdmin)
    
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
        status: 'pdf_generated'
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

// 辅助函数：生成PDF
async function generatePdf(imageFiles: any[], orderId: string, supabase: any): Promise<Uint8Array> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  let currentPage = 0

  for (const file of imageFiles) {
    // 获取图片
    const { data: imageData, error: imageError } = await supabase
      .storage
      .from('images')
      .download(`love-story/${orderId}/${file.name}`)

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
