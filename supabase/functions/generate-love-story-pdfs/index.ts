import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'
import { jsPDF } from 'https://esm.sh/jspdf@2.5.1'

// 存储桶常量
const BUCKET_PDFS = 'pdfs';
const BUCKET_COMPLETE_PAGES = 'complete-pages';

interface RequestBody {
  orderId: string;
  clientId: string;
}

interface ImageFile {
  name: string;
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
    const { orderId, clientId } = body

    if (!orderId || !clientId) {
      return new Response(
        JSON.stringify({ error: 'Order ID and Client ID are required' }),
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

    console.log(`Generating PDF for order ${orderId} and client ${clientId}`);

    // 检查complete-pages桶中的图片
    const { data: completePages, error: completePagesError } = await supabaseAdmin
      .storage
      .from(BUCKET_COMPLETE_PAGES)
      .list(`${clientId}/${orderId}`)
    
    if (completePagesError) {
      console.error('Error listing images in complete-pages bucket:', completePagesError);
      return new Response(
        JSON.stringify({ error: 'Failed to list images in complete-pages bucket' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (!completePages || completePages.length === 0) {
      console.log('No images found in complete-pages bucket');
      return new Response(
        JSON.stringify({ error: 'No images found in complete-pages bucket' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    console.log('Found images in complete-pages bucket:', completePages.length);
    
    // 对图片进行分类和排序
    const coverImage = completePages.find(file => file.name === 'cover.png');
    const introImage = completePages.find(file => file.name === 'intro.png');
    const contentImages = completePages.filter(file => file.name.startsWith('content-')).sort((a, b) => {
      // 从文件名中提取页码并按数字顺序排序
      const pageA = parseInt(a.name.match(/content-(\d+)\.png/)?.[1] || '0');
      const pageB = parseInt(b.name.match(/content-(\d+)\.png/)?.[1] || '0');
      return pageA - pageB;
    });
    
    console.log('Found in complete-pages bucket:', {
      coverImage: coverImage ? coverImage.name : 'not found',
      introImage: introImage ? introImage.name : 'not found',
      contentImages: contentImages.map(img => img.name)
    });
    
    // 检查是否有必要的图片
    if (!coverImage) {
      console.log('Cover image not found in complete-pages bucket');
      return new Response(
        JSON.stringify({ error: 'Cover image not found in complete-pages bucket' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // 生成PDF
    let pdfBytes: Uint8Array;
    
    // 如果有内容页面，生成包含所有页面的PDF
    if (contentImages.length > 0) {
      // 按顺序排列所有图片：封面，介绍，内容页
      const allImages: ImageFile[] = [];
      if (coverImage) allImages.push(coverImage);
      if (introImage) allImages.push(introImage);
      allImages.push(...contentImages);
      
      console.log('Generating PDF from all images:', allImages.map(img => img.name));
      pdfBytes = await generatePdfFromCompletePages(allImages, orderId, clientId, supabaseAdmin);
    } else if (introImage) {
      // 只有封面和介绍页
      const images = [coverImage, introImage].filter(Boolean) as ImageFile[];
      console.log('Generating PDF from cover and intro images:', images.map(img => img.name));
      pdfBytes = await generatePdfFromCompletePages(images, orderId, clientId, supabaseAdmin);
    } else {
      // 只有封面
      console.log('Generating PDF from cover image only:', coverImage.name);
      pdfBytes = await generatePdfFromCompletePage(coverImage, orderId, clientId, supabaseAdmin);
    }
    
    // 上传PDF到Supabase Storage
    const pdfFileName = `${clientId}/${orderId}/love-story-${Date.now()}.pdf`;
    const { data: pdfData, error: pdfError } = await supabaseAdmin
      .storage
      .from(BUCKET_PDFS)
      .upload(pdfFileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (pdfError) {
      console.error('Error uploading PDF to Supabase Storage:', pdfError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload PDF' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // 获取PDF的公共URL
    const { data: publicUrlData } = supabaseAdmin
      .storage
      .from(BUCKET_PDFS)
      .getPublicUrl(pdfFileName);
    
    // 更新数据库中的记录
    const { error: updateError } = await supabaseAdmin
      .from('love_story_books')
      .update({
        pdf_url: publicUrlData.publicUrl,
        status: 'completed'
      })
      .eq('order_id', orderId)
      .eq('client_id', clientId);
    
    if (updateError) {
      console.error('Error updating database record:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update database record' }),
        { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        pdf_url: publicUrlData.publicUrl
      }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...headers, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// 辅助函数：从单个完整页面生成PDF
async function generatePdfFromCompletePage(imageFile: ImageFile, orderId: string, clientId: string, supabase: any): Promise<Uint8Array> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // 从complete-pages桶下载图片
  const { data: imageData, error: imageError } = await supabase
    .storage
    .from(BUCKET_COMPLETE_PAGES)
    .download(`${clientId}/${orderId}/${imageFile.name}`);

  if (imageError || !imageData) {
    console.error(`Failed to download image ${imageFile.name}`, imageError);
    throw new Error(`Failed to download image ${imageFile.name}`);
  }

  // 将Blob转换为base64
  const imageBase64 = await blobToBase64(imageData);
  
  // 添加图片到PDF
  const imgWidth = 210; // A4宽度
  const imgHeight = 297; // A4高度
  
  pdf.addImage(imageBase64, 'PNG', 0, 0, imgWidth, imgHeight);
  
  return pdf.output('arraybuffer');
}

// 辅助函数：从多个完整页面生成PDF
async function generatePdfFromCompletePages(imageFiles: ImageFile[], orderId: string, clientId: string, supabase: any): Promise<Uint8Array> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  let currentPage = 0;

  for (const file of imageFiles) {
    // 从complete-pages桶下载图片
    const { data: imageData, error: imageError } = await supabase
      .storage
      .from(BUCKET_COMPLETE_PAGES)
      .download(`${clientId}/${orderId}/${file.name}`);

    if (imageError || !imageData) {
      console.error(`Failed to download image ${file.name}`, imageError);
      continue;
    }

    // 将Blob转换为base64
    const imageBase64 = await blobToBase64(imageData);
    
    // 如果不是第一页，添加新页
    if (currentPage > 0) {
      pdf.addPage();
    }
    
    // 添加图片到PDF
    const imgWidth = 210; // A4宽度
    const imgHeight = 297; // A4高度
    
    pdf.addImage(imageBase64, 'PNG', 0, 0, imgWidth, imgHeight);
    
    currentPage++;
  }
  
  return pdf.output('arraybuffer');
}

// 辅助函数：将Blob转换为base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
