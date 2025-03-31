import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';

/**
 * 生成封面PDF的API端点
 */
export default async function handler(req, res) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { frontCover, spine, backCover, orderId } = req.body;

    console.log('Received request for PDF generation with order ID:', orderId);
    
    if (!frontCover || !spine || !backCover) {
      return res.status(400).json({ success: false, error: 'Missing required cover image URLs' });
    }

    console.log('Processing cover image URLs for PDF generation');

    // 获取环境变量
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, error: 'Missing Supabase credentials' });
    }

    // 初始化Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 从URL获取图片数据
    async function getImageFromUrl(imageUrl) {
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
        const base64String = Buffer.from(arrayBuffer).toString('base64');
        
        return `data:${contentType};base64,${base64String}`;
      } catch (error) {
        console.error(`Error downloading image from ${imageUrl.substring(0, 50)}...:`, error);
        throw error;
      }
    }

    // 将PDF上传到存储桶并返回公共URL
    async function uploadPdfToStorage(pdfData, fileName) {
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
        
        // 将PDF数据转换为Buffer
        const pdfBuffer = Buffer.from(pdfData.split(',')[1], 'base64');
        
        // 上传PDF文件
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('book-covers')
          .upload(`pdfs/${fileName}`, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
          });
        
        if (uploadError) {
          console.error(`Failed to upload PDF:`, uploadError);
          throw uploadError;
        }
        
        console.log(`PDF uploaded successfully:`, uploadData);
        
        // 获取公共URL
        const { data: publicUrlData } = supabase
          .storage
          .from('book-covers')
          .getPublicUrl(`pdfs/${fileName}`);
        
        const publicUrl = publicUrlData.publicUrl;
        console.log(`Public URL for PDF:`, publicUrl);
        
        return publicUrl;
      } catch (error) {
        console.error(`Error uploading PDF to storage:`, error);
        throw error;
      }
    }

    console.log('Starting to download and process images');
    
    // 获取所有图片的base64数据
    const frontCoverData = await getImageFromUrl(frontCover);
    const spineData = await getImageFromUrl(spine);
    const backCoverData = await getImageFromUrl(backCover);
    
    console.log('All images downloaded successfully');
    
    // 书籍尺寸和出血设置
    const bleed = 0.125; // 出血尺寸（英寸）
    const width = 6; // 书籍宽度（英寸）
    const height = 9; // 书籍高度（英寸）
    const spineWidth = 0.5; // 书脊宽度（英寸）
    
    // 计算总宽度（前封面+书脊+后封面）
    const totalWidth = width * 2 + spineWidth;
    
    // 添加出血区域
    const pdfWidth = totalWidth + (bleed * 2);
    const pdfHeight = height + (bleed * 2);
    
    // 创建PDF文档
    console.log(`Creating PDF document with dimensions: ${pdfWidth}x${pdfHeight} inches`);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'in',
      format: [pdfWidth, pdfHeight]
    });
    
    // 是否添加调试线（用于开发测试）
    const debugLines = false;
    
    // 设置背景色为白色
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
    
    if (debugLines) {
      console.log('Adding debug lines to PDF');
      
      // Blue outer bleed area rectangle (total document size)
      pdf.setDrawColor(0, 162, 232); // Light blue for bleed area
      pdf.setLineWidth(0.01);
      pdf.rect(0, 0, pdfWidth, pdfHeight);
      
      // Red trim line rectangle (final trim size)
      pdf.setDrawColor(255, 0, 0); // Red for trim line
      pdf.rect(bleed, bleed, totalWidth, height);
      
      // Green safe area rectangle (inside trim by 0.25")
      pdf.setDrawColor(0, 255, 0); // Green for safe area
      pdf.rect(bleed + 0.25, bleed + 0.25, totalWidth - 0.5, height - 0.5);
      
      // Purple spine lines
      pdf.setDrawColor(128, 0, 128); // Purple for spine
      // Left spine line
      pdf.line(bleed + width, bleed, bleed + width, bleed + height);
      // Right spine line
      pdf.line(bleed + width + spineWidth, bleed, bleed + width + spineWidth, bleed + height);
    }
    
    // 添加图片到PDF
    console.log('Adding back cover image to PDF');
    try {
      // 后封面（左侧）
      pdf.addImage(
        backCoverData, 
        'JPEG', 
        bleed, // x坐标
        bleed, // y坐标
        width, // 宽度
        height, // 高度
        undefined, // 别名
        'FAST' // 压缩选项
      );
      
      console.log('Adding spine image to PDF');
      // 书脊（中间）
      pdf.addImage(
        spineData, 
        'JPEG', 
        bleed + width, // x坐标
        bleed, // y坐标
        spineWidth, // 宽度
        height, // 高度
        undefined, // 别名
        'FAST' // 压缩选项
      );
      
      console.log('Adding front cover image to PDF');
      // 前封面（右侧）
      pdf.addImage(
        frontCoverData, 
        'JPEG', 
        bleed + width + spineWidth, // x坐标
        bleed, // y坐标
        width, // 宽度
        height, // 高度
        undefined, // 别名
        'FAST' // 压缩选项
      );
    } catch (error) {
      console.error('Error adding images to PDF:', error);
      return res.status(500).json({ success: false, error: `Error creating PDF: ${error.message}` });
    }
    
    // 将PDF转换为base64
    console.log('Converting PDF to base64');
    const pdfOutput = pdf.output('datauristring');
    
    // 上传PDF到Supabase存储
    console.log('Uploading PDF to Supabase storage');
    const fileName = `cover_${orderId}_${Date.now()}.pdf`;
    const coverSourceUrl = await uploadPdfToStorage(pdfOutput, fileName);
    
    // 更新数据库中的封面PDF URL
    console.log('Updating database with cover PDF URL');
    const { error: updateError } = await supabase
      .from('funny_biography_books')
      .update({ 
        cover_pdf: coverSourceUrl,
        cover_source_url: coverSourceUrl
      })
      .eq('order_id', orderId);
    
    if (updateError) {
      console.error('Error updating database:', updateError);
      return res.status(500).json({ success: false, error: `Error updating database: ${updateError.message}` });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Cover PDF generated successfully',
      coverPdfUrl: coverSourceUrl,
      coverSourceUrl
    });
  } catch (error) {
    console.error('Error in generate-cover-pdf:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'An unknown error occurred' 
    });
  }
}
