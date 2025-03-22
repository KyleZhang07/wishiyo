import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import fetch from 'node-fetch';

// Vercel环境的API配置
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb', // 增加请求体大小限制
    },
    responseLimit: '100mb', // 增加响应大小限制
  },
};

// 从Supabase获取图片并转换为base64
async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
}

// 生成PDF函数
async function generatePdf(coverImage, contentImages, orderId, supabase) {
  console.log(`Generating PDF for order ${orderId} with ${contentImages.length} content images`);
  
  // 创建新的PDF文档
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // A4尺寸：210mm x 297mm
  const pageWidth = 210;
  const pageHeight = 297;
  
  // 首先添加封面
  if (coverImage) {
    try {
      const coverImgData = await fetchImageAsBase64(coverImage);
      pdf.addImage(coverImgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      console.log('Added cover image to PDF');
    } catch (error) {
      console.error('Error processing cover image:', error);
    }
  }
  
  // 处理内容图片
  for (let i = 0; i < contentImages.length; i++) {
    const imageUrl = contentImages[i];
    
    try {
      // 添加新页
      pdf.addPage();
      
      // 获取图片的base64数据
      const imgData = await fetchImageAsBase64(imageUrl);
      
      // 将图片添加到PDF，填充整个页面
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      
      console.log(`Added content image ${i + 1}/${contentImages.length} to PDF`);
    } catch (error) {
      console.error(`Error processing content image ${i + 1}:`, error);
      // 继续处理下一张图片
    }
  }
  
  // 将PDF转换为Uint8Array
  const pdfOutput = pdf.output('arraybuffer');
  return new Uint8Array(pdfOutput);
}

export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { orderId, title, author, format } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    // 获取环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseKey 
      });
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }
    
    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 1. 将图书状态更新为"处理中"
    const { error: updateError } = await supabase
      .from('funny_biography_books')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);
    
    if (updateError) {
      return res.status(500).json({ 
        error: 'Failed to update book status', 
        details: updateError.message 
      });
    }
    
    console.log(`[${orderId}] Book status set to processing`);
    
    // 2. 从数据库获取图书数据
    const { data: bookData, error: bookError } = await supabase
      .from('funny_biography_books')
      .select('*')
      .eq('order_id', orderId)
      .single();
    
    if (bookError || !bookData) {
      return res.status(404).json({ 
        error: 'Book not found', 
        details: bookError?.message || 'No book found with the provided ID' 
      });
    }
    
    // 3. 开始内容生成
    console.log(`[${orderId}] Starting content generation`);
    
    // 调用内容生成服务（如果需要）
    // 这里可以添加调用AI生成内容的代码
    
    // 4. 获取封面和内容图片
    const images = bookData.images || {};
    const coverImage = images.frontCover;
    
    // 获取内容图片
    const { data: contentImages, error: contentError } = await supabase
      .from('funny_biography_pages')
      .select('image_url, page_number')
      .eq('book_id', bookData.id)
      .order('page_number', { ascending: true });
    
    if (contentError) {
      return res.status(500).json({ 
        error: 'Failed to fetch content images', 
        details: contentError.message 
      });
    }
    
    const contentImageUrls = contentImages ? contentImages.map(img => img.image_url) : [];
    
    // 5. 生成PDF
    const pdfBytes = await generatePdf(coverImage, contentImageUrls, orderId, supabase);
    
    // 6. 将PDF上传到Supabase Storage
    const pdfFileName = `funny_biography_${orderId}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('funny-biography-pdfs')
      .upload(pdfFileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      return res.status(500).json({ 
        error: 'Failed to upload PDF', 
        details: uploadError.message 
      });
    }
    
    // 获取PDF的公共URL
    const { data: publicUrlData } = supabase.storage
      .from('funny-biography-pdfs')
      .getPublicUrl(pdfFileName);
    
    const pdfUrl = publicUrlData.publicUrl;
    
    // 7. 更新图书状态
    const { error: finalUpdateError } = await supabase
      .from('funny_biography_books')
      .update({ 
        pdf_url: pdfUrl,
        status: 'pdf_generated',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);
    
    if (finalUpdateError) {
      return res.status(500).json({ 
        error: 'Failed to update final book status', 
        details: finalUpdateError.message 
      });
    }
    
    // 8. 触发打印请求检查
    try {
      await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/order-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          checkOrderId: orderId,
          type: 'funny_biography'
        })
      });
    } catch (printCheckError) {
      console.error('Error triggering print request check:', printCheckError);
      // 不中断处理流程
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Book content generated and PDF created successfully',
      pdf_url: pdfUrl
    });
    
  } catch (error) {
    console.error('Error in book content generation:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
