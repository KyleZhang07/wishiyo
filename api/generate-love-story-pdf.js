import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import fetch from 'node-fetch';
import sharp from 'sharp';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import fs from 'fs';

// Vercel API配置
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // 增加限制以处理大型图像
    },
    // 将超时时间增加到60秒，因为渲染可能需要时间
    maxDuration: 60,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // 初始化Supabase客户端
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Missing Supabase credentials' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 获取love_story_books记录
    const { data: bookData, error: bookError } = await supabase
      .from('love_story_books')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (bookError || !bookData) {
      return res.status(404).json({ 
        error: 'Book not found', 
        details: bookError 
      });
    }

    // 获取client_id，用于查找图片
    const clientId = bookData.client_id;
    
    if (!clientId) {
      return res.status(404).json({ 
        error: 'Client ID not found in book record' 
      });
    }
    
    // 尝试从数据库获取或从相关表中推断样式和内容信息
    // 注意：这些值通常在前端存储在localStorage中，服务器端无法直接访问
    // 我们需要有备选逻辑来处理这种情况
    
    // 默认样式和内容设置
    const defaultStyle = {
      id: 'classic',
      background: '#f6f4ea',
      titleColor: '#444444',
      subtitleColor: '#633d63',
      authorColor: '#222222',
      font: 'playfair',
      borderColor: '#EAC46E'
    };
    
    const defaultContent = {
      title: 'THE MAGIC IN',
      subtitle: bookData.person_name || 'Our Love Story',
      authorName: 'With Love',
      personName: bookData.person_name || 'My Love'
    };
    
    // 尝试从数据库中找到更多信息
    // 查询love_story_pages表以获取样式信息
    const { data: pagesMetadata, error: metadataError } = await supabase
      .from('love_story_pages')
      .select('metadata')
      .eq('order_id', orderId)
      .limit(1);
    
    let styleId = 'classic';
    let coverTitle = defaultContent.title;
    let subtitle = defaultContent.subtitle;
    let authorName = defaultContent.authorName;
    let personName = defaultContent.personName;
    
    // 如果能找到页面元数据，尝试提取样式信息
    if (pagesMetadata && pagesMetadata.length > 0 && pagesMetadata[0].metadata) {
      try {
        const metadata = pagesMetadata[0].metadata;
        styleId = metadata.style_id || styleId;
        coverTitle = metadata.title || coverTitle;
        subtitle = metadata.subtitle || subtitle;
        authorName = metadata.author_name || authorName;
        personName = metadata.person_name || personName;
      } catch (error) {
        console.warn('Unable to parse page metadata:', error);
      }
    } else {
      console.log('No metadata found for order', orderId, 'using default style and content');
    }

    // 从love_story_pages表获取已渲染的页面图像
    const { data: pagesData, error: pagesError } = await supabase
      .from('love_story_pages')
      .select('*')
      .eq('order_id', orderId)
      .order('page_number', { ascending: true });

    if (pagesError) {
      return res.status(500).json({ 
        error: 'Failed to fetch page data', 
        details: pagesError 
      });
    }

    // 如果没有找到已渲染的页面，尝试从storage直接获取图片
    let imageUrls = [];
    
    if (!pagesData || pagesData.length === 0) {
      console.log(`No rendered pages found for order ${orderId}, searching in storage...`);
      
      // 尝试从两个可能的路径获取图片
      let imageFiles = [];
      
      // 首先尝试从基于client_id的路径获取
      const { data: clientImages, error: clientListError } = await supabase
        .storage
        .from('images')
        .list(`${clientId}`);
      
      if (!clientListError && clientImages && clientImages.length > 0) {
        imageFiles = clientImages;
        
        // 为每个文件获取下载URL
        for (const file of imageFiles) {
          const { data: urlData } = supabase
            .storage
            .from('images')
            .getPublicUrl(`${clientId}/${file.name}`);
          
          imageUrls.push({
            name: file.name,
            url: urlData.publicUrl
          });
        }
      } else {
        // 如果没有找到，尝试从love-story/${orderId}路径获取
        const { data: orderImages, error: orderListError } = await supabase
          .storage
          .from('images')
          .list(`love-story/${orderId}`);
        
        if (!orderListError && orderImages && orderImages.length > 0) {
          imageFiles = orderImages;
          
          // 为每个文件获取下载URL
          for (const file of imageFiles) {
            const { data: urlData } = supabase
              .storage
              .from('images')
              .getPublicUrl(`love-story/${orderId}/${file.name}`);
            
            imageUrls.push({
              name: file.name,
              url: urlData.publicUrl
            });
          }
        }
      }
    } else {
      // 使用已渲染的页面URL
      imageUrls = pagesData.map(page => ({
        name: page.page_type + (page.page_type === 'content' ? `-${page.page_number}` : ''),
        url: page.image_url,
        type: page.page_type,
        number: page.page_number
      }));
    }

    if (imageUrls.length === 0) {
      return res.status(400).json({ 
        error: 'No images found for PDF generation'
      });
    }

    // 对图片进行分类和排序
    const coverImages = imageUrls.filter(img => img.name.includes('cover') || img.type === 'cover').sort((a, b) => a.number - b.number);
    const introImages = imageUrls.filter(img => img.name.includes('intro') || img.type === 'intro').sort((a, b) => a.number - b.number);
    const contentImages = imageUrls.filter(img => img.name.includes('content') || img.type === 'content').sort((a, b) => {
      // 从文件名中提取数字用于排序
      if (a.number !== undefined && b.number !== undefined) {
        return a.number - b.number;
      }
      
      const aMatch = a.name.match(/content-(\d+)/);
      const bMatch = b.name.match(/content-(\d+)/);
      
      const aNum = aMatch ? parseInt(aMatch[1]) : 0;
      const bNum = bMatch ? parseInt(bMatch[1]) : 0;
      
      return aNum - bNum;
    });

    // 检查是否有足够的图片
    if (coverImages.length === 0 || (introImages.length === 0 && contentImages.length === 0)) {
      return res.status(400).json({ 
        error: 'Insufficient images for PDF generation', 
        details: {
          coverImagesCount: coverImages.length,
          introImagesCount: introImages.length,
          contentImagesCount: contentImages.length
        }
      });
    }

    console.log(`Generating PDFs for order ${orderId} with ${coverImages.length} cover images, ${introImages.length} intro images, and ${contentImages.length} content images`);

    // 生成封面PDF
    const coverPdf = await generatePdf(coverImages, { isHighResolution: true });
    
    // 生成内页PDF（合并intro和content图片）
    const interiorPdf = await generatePdf([...introImages, ...contentImages], { isHighResolution: true });

    // 上传PDF到Storage
    const coverPdfPath = `love-story/${orderId}/cover.pdf`;
    const interiorPdfPath = `love-story/${orderId}/interior.pdf`;

    const { data: coverUploadData, error: coverUploadError } = await supabase
      .storage
      .from('pdfs')
      .upload(coverPdfPath, coverPdf, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (coverUploadError) {
      return res.status(500).json({ 
        error: 'Failed to upload cover PDF', 
        details: coverUploadError 
      });
    }

    const { data: interiorUploadData, error: interiorUploadError } = await supabase
      .storage
      .from('pdfs')
      .upload(interiorPdfPath, interiorPdf, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (interiorUploadError) {
      return res.status(500).json({ 
        error: 'Failed to upload interior PDF', 
        details: interiorUploadError 
      });
    }

    // 获取PDF的公共URL
    const { data: coverUrl } = supabase
      .storage
      .from('pdfs')
      .getPublicUrl(coverPdfPath);

    const { data: interiorUrl } = supabase
      .storage
      .from('pdfs')
      .getPublicUrl(interiorPdfPath);

    // 更新love_story_books记录
    const { data: updateData, error: updateError } = await supabase
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
      .select();

    if (updateError) {
      return res.status(500).json({ 
        error: 'Failed to update book record', 
        details: updateError 
      });
    }

    return res.status(200).json({
      success: true,
      coverPdfUrl: coverUrl.publicUrl,
      interiorPdfUrl: interiorUrl.publicUrl,
      book: updateData
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ 
      error: 'Failed to generate PDF', 
      details: error.message 
    });
  }
}

// 辅助函数：生成PDF
async function generatePdf(images, options = {}) {
  const { isHighResolution = false } = options;
  
  // 创建PDF，使用A4尺寸
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  let currentPage = 0;

  for (const image of images) {
    try {
      // 获取图像数据
      let imageData;
      if (typeof image === 'string') {
        // 如果直接提供了图像URL
        const response = await fetch(image);
        imageData = await response.arrayBuffer();
      } else if (image.url) {
        // 如果提供了包含URL的对象
        const response = await fetch(image.url);
        imageData = await response.arrayBuffer();
      } else {
        console.error('Invalid image format', image);
        continue;
      }

      // 使用sharp处理图像（可以调整尺寸、格式等）
      if (isHighResolution) {
        // 高分辨率处理 - 确保图像具有适当的DPI
        const processedImage = await sharp(Buffer.from(imageData))
          .jpeg({ quality: 95 })
          .toBuffer();
        
        imageData = processedImage;
      }

      // 转换为base64
      const base64Image = `data:image/jpeg;base64,${Buffer.from(imageData).toString('base64')}`;

      // 添加新页（除了第一页）
      if (currentPage > 0) {
        pdf.addPage();
      }

      // 添加图像到PDF，确保图像填满整个A4页面
      pdf.addImage(
        base64Image,
        'JPEG',
        0, // x坐标
        0, // y坐标
        210, // 宽度（A4纸宽度为210mm）
        297, // 高度（A4纸高度为297mm）
        undefined, // 别名
        'FAST' // 压缩选项
      );

      currentPage++;
    } catch (error) {
      console.error(`Error processing image:`, error);
      // 继续处理下一张图片，而不是中断整个过程
    }
  }

  // 返回PDF的ArrayBuffer
  return Buffer.from(pdf.output('arraybuffer'));
}
