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
async function generatePdf(imageFiles, orderId, clientId, supabase) {
  console.log(`Generating PDF for order ${orderId} with ${imageFiles.length} images`);
  
  // 创建新的PDF文档，使用A4尺寸
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // A4尺寸：210mm x 297mm
  const pageWidth = 210;
  const pageHeight = 297;
  
  // 处理每个图片
  for (let i = 0; i < imageFiles.length; i++) {
    const imageUrl = imageFiles[i];
    
    try {
      // 如果不是第一页，添加新页
      if (i > 0) {
        pdf.addPage();
      }
      
      // 获取图片的base64数据
      const imgData = await fetchImageAsBase64(imageUrl);
      
      // 将图片添加到PDF，填充整个页面
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      
      console.log(`Added image ${i + 1}/${imageFiles.length} to PDF`);
    } catch (error) {
      console.error(`Error processing image ${i + 1}:`, error);
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
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    // 获取环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }
    
    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 获取订单信息
    const { data: orders, error: orderError } = await supabase
      .from('love_story_orders')
      .select('*')
      .eq('order_id', orderId)
      .single();
    
    if (orderError || !orders) {
      return res.status(404).json({ 
        error: 'Order not found', 
        details: orderError?.message || 'No order found with the provided ID' 
      });
    }
    
    // 获取图片文件
    const { data: imageData, error: imageError } = await supabase
      .from('love_story_images')
      .select('*')
      .eq('order_id', orderId)
      .order('position', { ascending: true });
    
    if (imageError) {
      return res.status(500).json({ 
        error: 'Failed to fetch images', 
        details: imageError.message 
      });
    }
    
    if (!imageData || imageData.length === 0) {
      return res.status(404).json({ error: 'No images found for this order' });
    }
    
    // 提取图片URL
    const imageUrls = imageData.map(img => img.image_url);
    
    // 生成PDF
    const pdfBytes = await generatePdf(imageUrls, orderId, orders.client_id, supabase);
    
    // 将PDF上传到Supabase Storage
    const pdfFileName = `love_story_${orderId}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('love-story-pdfs')
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
      .from('love-story-pdfs')
      .getPublicUrl(pdfFileName);
    
    const pdfUrl = publicUrlData.publicUrl;
    
    // 更新订单状态
    const { error: updateError } = await supabase
      .from('love_story_orders')
      .update({ 
        pdf_url: pdfUrl,
        status: 'pdf_generated',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);
    
    if (updateError) {
      return res.status(500).json({ 
        error: 'Failed to update order status', 
        details: updateError.message 
      });
    }
    
    // 触发打印请求检查
    try {
      await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/order-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          checkOrderId: orderId,
          type: 'love_story'
        })
      });
    } catch (printCheckError) {
      console.error('Error triggering print request check:', printCheckError);
      // 不中断处理流程
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'PDF generated and uploaded successfully',
      pdf_url: pdfUrl
    });
    
  } catch (error) {
    console.error('Error in PDF generation:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
