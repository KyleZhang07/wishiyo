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
  
  // 修正计算：封面和封底宽度就是书籍封面宽度，不需要额外添加出血区域
  const backCoverWidth = bookCoverWidth;  // 8.625"
  const frontCoverWidth = bookCoverWidth;  // 8.625"
  
  // 修正各部分的位置布局，确保居中对齐
  // 计算左侧边距，使整个设计在PDF中居中
  const leftMargin = (totalDocWidth - (backCoverWidth + spineWidth + frontCoverWidth)) / 2;
  const backCoverX = leftMargin;  // 封底从左边距开始
  const spineX = backCoverX + backCoverWidth;  // 书脊位于封底右侧
  const frontCoverX = spineX + spineWidth;  // 封面位于书脊右侧
  
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
  const debugLines = true; // 保持原有设置
  if (debugLines) {
    pdf.setDrawColor(255, 0, 0); // 红色
    pdf.setLineWidth(0.01);
    
    // 绘制安全边距线 - 封底
    const backSafetyLeft = backCoverX + wrapAreaWidth + safetyMarginWidth;
    const backSafetyRight = backCoverX + backCoverWidth - wrapAreaWidth - safetyMarginWidth;
    const backSafetyTop = coverY + wrapAreaWidth + safetyMarginWidth;
    const backSafetyBottom = totalDocHeight - wrapAreaWidth - safetyMarginWidth;
    
    // 封底安全区域矩形
    pdf.rect(
      backSafetyLeft, 
      backSafetyTop, 
      backSafetyRight - backSafetyLeft, 
      backSafetyBottom - backSafetyTop
    );
    
    // 绘制安全边距线 - 封面
    const frontSafetyLeft = frontCoverX + wrapAreaWidth + safetyMarginWidth;
    const frontSafetyRight = frontCoverX + frontCoverWidth - wrapAreaWidth - safetyMarginWidth;
    
    // 封面安全区域矩形
    pdf.rect(
      frontSafetyLeft, 
      backSafetyTop, 
      frontSafetyRight - frontSafetyLeft, 
      backSafetyBottom - backSafetyTop
    );
    
    // 绘制裁切线 - 蓝色
    pdf.setDrawColor(0, 0, 255);
    
    // 封底裁切线
    const backTrimLeft = backCoverX + wrapAreaWidth;
    const backTrimRight = backCoverX + backCoverWidth - wrapAreaWidth;
    const trimTop = coverY + wrapAreaWidth;
    const trimBottom = totalDocHeight - wrapAreaWidth;
    
    pdf.rect(backTrimLeft, trimTop, backTrimRight - backTrimLeft, trimBottom - trimTop);
    
    // 封面裁切线
    const frontTrimLeft = frontCoverX + wrapAreaWidth;
    const frontTrimRight = frontCoverX + frontCoverWidth - wrapAreaWidth;
    
    pdf.rect(frontTrimLeft, trimTop, frontTrimRight - frontTrimLeft, trimBottom - trimTop);
    
    // 书脊裁切线
    pdf.rect(spineX, trimTop, spineWidth, trimBottom - trimTop);
    
    // 添加标签文字 - 浅蓝色
    pdf.setTextColor(0, 162, 232);
    pdf.setFontSize(8);
    
    // 底部标签
    pdf.text('SPINE', spineX + (spineWidth/2), totalDocHeight - 0.1, { align: 'center' });
    pdf.text('BACK COVER', backCoverX + (backCoverWidth/2), totalDocHeight - 0.1, { align: 'center' });
    pdf.text('FRONT COVER', frontCoverX + (frontCoverWidth/2), totalDocHeight - 0.1, { align: 'center' });
    
    // 顶部尺寸标签
    pdf.text(`Spine: ${spineWidth}"`, spineX + (spineWidth/2), 0.3, { align: 'center' });
    pdf.text(`Back: ${backCoverWidth}"`, backCoverX + (backCoverWidth/2), 0.3, { align: 'center' });
    pdf.text(`Front: ${frontCoverWidth}"`, frontCoverX + (frontCoverWidth/2), 0.3, { align: 'center' });
    
    // 添加总尺寸标签
    pdf.text(`Total Document: ${totalDocWidth}" x ${totalDocHeight}"`, totalDocWidth - 1, 0.3, { align: 'right' });
    pdf.text(`Left Margin: ${leftMargin.toFixed(3)}"`, 1, 0.3, { align: 'left' });
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
        const debugLines = true; // 保持原有设置
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

function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)?.[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}
