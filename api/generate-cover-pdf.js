import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import fetch from 'node-fetch';

// Vercel环境的API配置
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // 增加请求体大小限制
    },
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

// 生成封面PDF函数
async function generateCoverPdf(frontCover, spine, backCover) {
  // 创建新的PDF文档
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [279.4, 215.9] // 11 x 8.5 英寸转换为毫米
  });
  
  try {
    // 获取图片的base64数据
    const frontCoverData = await fetchImageAsBase64(frontCover);
    const spineData = await fetchImageAsBase64(spine);
    const backCoverData = await fetchImageAsBase64(backCover);
    
    // 设置页面尺寸
    const pageWidth = 279.4; // 11英寸
    const pageHeight = 215.9; // 8.5英寸
    
    // 计算每个部分的宽度
    // 假设封面和背面各占45%,书脊占10%
    const coverWidth = pageWidth * 0.45;
    const spineWidth = pageWidth * 0.1;
    
    // 将背面图片添加到PDF (左侧)
    pdf.addImage(backCoverData, 'JPEG', 0, 0, coverWidth, pageHeight);
    
    // 将书脊图片添加到PDF (中间)
    pdf.addImage(spineData, 'JPEG', coverWidth, 0, spineWidth, pageHeight);
    
    // 将封面图片添加到PDF (右侧)
    pdf.addImage(frontCoverData, 'JPEG', coverWidth + spineWidth, 0, coverWidth, pageHeight);
    
    // 将PDF转换为Uint8Array
    const pdfOutput = pdf.output('arraybuffer');
    return new Uint8Array(pdfOutput);
  } catch (error) {
    console.error('Error generating cover PDF:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { frontCover, spine, backCover, orderId } = req.body;
    
    if (!frontCover || !spine || !backCover || !orderId) {
      return res.status(400).json({ 
        error: 'Missing required parameters', 
        details: 'frontCover, spine, backCover, and orderId are required' 
      });
    }
    
    // 获取环境变量
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase configuration missing:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseKey,
        envVars: Object.keys(process.env).filter(key => key.includes('SUPA'))
      });
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }
    
    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 生成封面PDF
    const pdfBytes = await generateCoverPdf(frontCover, spine, backCover);
    
    // 将PDF上传到Supabase Storage
    const pdfFileName = `cover_${orderId}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('book-covers')
      .upload(`pdfs/${pdfFileName}`, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      return res.status(500).json({ 
        error: 'Failed to upload cover PDF', 
        details: uploadError.message 
      });
    }
    
    // 获取PDF的公共URL
    const { data: publicUrlData } = supabase.storage
      .from('book-covers')
      .getPublicUrl(`pdfs/${pdfFileName}`);
    
    const pdfUrl = publicUrlData.publicUrl;
    
    // 更新数据库中的封面PDF URL
    const { error: updateError } = await supabase
      .from('funny_biography_books')
      .update({ 
        cover_pdf_url: pdfUrl,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId);
    
    if (updateError) {
      console.error('Failed to update cover PDF URL in database:', updateError);
      // 不中断处理流程
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Cover PDF generated and uploaded successfully',
      pdf_url: pdfUrl
    });
    
  } catch (error) {
    console.error('Error in cover PDF generation:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}
