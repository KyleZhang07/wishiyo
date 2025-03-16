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
  try {
    // 设置 CORS 头部，允许所有来源的请求
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    console.log(`[PDF-API] 请求方法: ${req.method}`);
    console.log(`[PDF-API] 请求头:`, JSON.stringify(req.headers, null, 2).substring(0, 500));

    // 只允许 POST 请求
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const { orderId, supabaseUrl: passedSupabaseUrl, supabaseKey: passedSupabaseKey } = req.body;
      console.log(`[PDF-API] 收到参数: orderId=${orderId}, supabaseUrl=${!!passedSupabaseUrl}, supabaseKey=${!!passedSupabaseKey}`);

      if (!orderId) {
        console.log(`[PDF-API] 错误: 缺少订单ID`);
        return res.status(400).json({ error: 'Order ID is required' });
      }

      console.log(`[PDF-API] Generate love story PDF request received for order: ${orderId}`);

      // 初始化Supabase客户端 - 优先使用传递的凭据，如果没有则使用环境变量
      const supabaseUrl = passedSupabaseUrl || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = passedSupabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('[PDF-API] 严重错误: 缺少 Supabase 凭据');
        console.error('[PDF-API] 传递凭据:', !!passedSupabaseUrl, !!passedSupabaseKey);
        console.error('[PDF-API] 环境变量:', Object.keys(process.env).filter(key => key.includes('SUPABASE')).join(', '));
        return res.status(500).json({ 
          error: 'Server configuration error', 
          details: 'Missing Supabase credentials' 
        });
      }

      console.log(`[PDF-API] Using Supabase URL: ${supabaseUrl.substring(0, 15)}...`);
      console.log(`[PDF-API] Supabase key 长度: ${supabaseKey.length}`);
      
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        console.log(`[PDF-API] Supabase 客户端创建成功`);

        // 获取love_story_books记录
        console.log(`[PDF-API] 开始查询数据库获取书籍信息: 表=love_story_books, 条件=order_id=${orderId}`);
        const { data: bookData, error: bookError } = await supabase
          .from('love_story_books')
          .select('*')
          .eq('order_id', orderId)
          .single();

        if (bookError) {
          console.error(`[PDF-API] 数据库查询错误:`, bookError);
          return res.status(404).json({ 
            error: 'Book not found', 
            details: bookError 
          });
        }

        if (!bookData) {
          console.error(`[PDF-API] 未找到书籍数据: order_id=${orderId}`);
          return res.status(404).json({ 
            error: 'Book not found', 
            details: 'No book data returned from database' 
          });
        }

        console.log(`[PDF-API] 书籍数据获取成功:`, JSON.stringify(bookData).substring(0, 200));

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
            console.log(`找到基于client_id的图像: ${clientImages.length} 个文件`);
            imageFiles = clientImages;
            
            // 为每个文件获取下载URL并存入数据库以便将来使用
            for (const file of imageFiles) {
              const { data: urlData } = supabase
                .storage
                .from('images')
                .getPublicUrl(`${clientId}/${file.name}`);
              
              imageUrls.push({
                name: file.name,
                url: urlData.publicUrl
              });
              
              // 尝试将图像信息插入到love_story_pages表中
              try {
                // 从文件名推断页面类型和编号
                let pageType = 'content';
                let pageNumber = 0;
                
                if (file.name.includes('cover')) {
                  pageType = 'cover';
                  const match = file.name.match(/cover-(\d+)/);
                  pageNumber = match ? parseInt(match[1]) : 0;
                } else if (file.name.includes('intro')) {
                  pageType = 'introduction';
                  const match = file.name.match(/intro-(\d+)/);
                  pageNumber = match ? parseInt(match[1]) : 0;
                } else if (file.name.includes('content')) {
                  const match = file.name.match(/content-(\d+)/);
                  pageNumber = match ? parseInt(match[1]) : 0;
                }
                
                // 插入数据库记录
                await supabase
                  .from('love_story_pages')
                  .upsert({
                    order_id: orderId,
                    page_number: pageNumber,
                    page_type: pageType,
                    image_url: urlData.publicUrl,
                    client_id: clientId,
                    metadata: {
                      style_id: styleId,
                      title: coverTitle,
                      subtitle: subtitle,
                      author_name: authorName,
                      person_name: personName
                    }
                  })
                  .onConflict(['order_id', 'page_number', 'page_type'])
                  .merge();
                  
              } catch (dbError) {
                console.error(`Error saving page to database: ${dbError.message}`, dbError);
                // 继续处理，不中断流程
              }
            }
          } else {
            // 如果没有找到，尝试从love-story/${orderId}路径获取
            console.log(`未找到基于client_id的图像: ${clientId}, 尝试从love-story/${orderId}路径获取...`);
            
            const { data: orderImages, error: orderListError } = await supabase
              .storage
              .from('images')
              .list(`love-story/${orderId}`);
            
            if (!orderListError && orderImages && orderImages.length > 0) {
              console.log(`找到基于order_id的图像: ${orderImages.length} 个文件`);
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
                
                // 尝试将图像信息插入到love_story_pages表中
                try {
                  // 从文件名推断页面类型和编号
                  let pageType = 'content';
                  let pageNumber = 0;
                  
                  if (file.name.includes('cover')) {
                    pageType = 'cover';
                    const match = file.name.match(/cover-(\d+)/);
                    pageNumber = match ? parseInt(match[1]) : 0;
                  } else if (file.name.includes('intro')) {
                    pageType = 'introduction';
                    const match = file.name.match(/intro-(\d+)/);
                    pageNumber = match ? parseInt(match[1]) : 0;
                  } else if (file.name.includes('content')) {
                    const match = file.name.match(/content-(\d+)/);
                    pageNumber = match ? parseInt(match[1]) : 0;
                  }
                  
                  // 插入数据库记录
                  await supabase
                    .from('love_story_pages')
                    .upsert({
                      order_id: orderId,
                      page_number: pageNumber,
                      page_type: pageType,
                      image_url: urlData.publicUrl,
                      client_id: clientId,
                      metadata: {
                        style_id: styleId,
                        title: coverTitle,
                        subtitle: subtitle,
                        author_name: authorName,
                        person_name: personName
                      }
                    })
                    .onConflict(['order_id', 'page_number', 'page_type'])
                    .merge();
                    
                } catch (dbError) {
                  console.error(`Error saving page to database: ${dbError.message}`, dbError);
                  // 继续处理，不中断流程
                }
              }
            } else {
              console.log(`未找到基于order_id的图像。clientListError:`, clientListError);
              console.log(`orderListError:`, orderListError);
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

        const { error: coverUploadError } = await supabase.storage
          .from('pdfs')
          .upload(coverPdfPath, coverPdf, {
            contentType: 'application/pdf',
            upsert: true,
            metadata: {
              client_id: clientId,
              order_id: orderId,
            }
          });

        if (coverUploadError) {
          console.error('Error uploading cover PDF:', coverUploadError);
          return res.status(500).json({ 
            error: 'Failed to upload cover PDF', 
            details: coverUploadError 
          });
        }

        const { error: interiorUploadError } = await supabase.storage
          .from('pdfs')
          .upload(interiorPdfPath, interiorPdf, {
            contentType: 'application/pdf',
            upsert: true,
            metadata: {
              client_id: clientId,
              order_id: orderId,
            }
          });

        if (interiorUploadError) {
          console.error('Error uploading interior PDF:', interiorUploadError);
          return res.status(500).json({ 
            error: 'Failed to upload interior PDF', 
            details: interiorUploadError 
          });
        }

        // 获取PDF的公共URL
        const { data: coverUrl } = supabase.storage
          .from('pdfs')
          .getPublicUrl(coverPdfPath);

        const { data: interiorUrl } = supabase.storage
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
          console.error('Error updating database:', updateError);
          return res.status(500).json({ 
            error: 'Failed to update database', 
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
    } catch (error) {
      console.error('Error handling request:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        details: error.message 
      });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      details: error.message 
    });
  }
}

// 辅助函数：生成PDF
async function generatePdf(images, options = {}) {
  try {
    console.log(`[PDF-GENERATOR] 开始生成PDF: 图像数量=${images.length}, 高分辨率=${!!options.isHighResolution}`);
    console.log(`[PDF-GENERATOR] 图像列表:`, images.map(img => typeof img === 'object' ? img.name || '未命名' : '直接URL').join(', ').substring(0, 200));
    
    // 创建PDF文档
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // PDF尺寸
    const pdfWidth = 210; // A4宽度（mm）
    const pdfHeight = 297; // A4高度（mm）

    console.log(`[PDF-GENERATOR] 创建PDF文档: 宽度=${pdfWidth}mm, 高度=${pdfHeight}mm`);

    // 用于存储处理后的图像的临时内存
    let processedImagesBuffer = [];
    let totalMemoryUsage = 0;

    // 处理并添加每个图像
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const imageUrl = typeof image === 'object' ? image.url : image;
      const imageName = typeof image === 'object' ? (image.name || `image-${i}`) : `image-${i}`;
      
      console.log(`[PDF-GENERATOR] 处理图像 ${i+1}/${images.length}: ${imageName}`);
      
      try {
        // 获取图像数据
        console.log(`[PDF-GENERATOR] 获取图像数据: ${imageUrl.substring(0, 50)}...`);
        const response = await fetch(imageUrl);
        
        // 捕获响应状态和内容类型信息
        console.log(`[PDF-GENERATOR] 图像获取成功: 状态=${response.status}, 内容类型=${response.headers.get('content-type')}`);
        
        if (!response.ok) {
          console.error(`[PDF-GENERATOR] 错误: 图像 ${imageName} 获取失败，状态码: ${response.status}`);
          continue;
        }
        
        // 获取图像数据为 ArrayBuffer
        const imageBuffer = await response.arrayBuffer();
        console.log(`[PDF-GENERATOR] 图像数据获取成功: 大小=${imageBuffer.byteLength} 字节`);
        
        if (imageBuffer.byteLength === 0) {
          console.error(`[PDF-GENERATOR] 错误: 图像 ${imageName} 数据为空`);
          continue;
        }
        
        // 使用Sharp处理图像
        console.log(`[PDF-GENERATOR] 使用Sharp处理图像: ${imageName}`);
        let processedImageBuffer; // <--- 这里修复了变量声明错误
        try {
          const quality = options.isHighResolution ? 90 : 75;
          console.log(`[PDF-GENERATOR] 压缩图像: 质量=${quality}, 原始大小=${imageBuffer.byteLength} 字节`);
          
          const sharpImage = sharp(imageBuffer);
          const metadata = await sharpImage.metadata();
          console.log(`[PDF-GENERATOR] 图像元数据: 宽度=${metadata.width}, 高度=${metadata.height}, 格式=${metadata.format}`);
          
          // 如果图像太大，适当调整大小
          if (metadata.width > 2000 || metadata.height > 2000) {
            const resizeOptions = {
              width: Math.min(metadata.width, 2000),
              height: Math.min(metadata.height, 2000),
              fit: 'inside',
              withoutEnlargement: true
            };
            console.log(`[PDF-GENERATOR] 调整图像大小: ${JSON.stringify(resizeOptions)}`);
            processedImageBuffer = await sharpImage
              .resize(resizeOptions)
              .jpeg({ quality, progressive: true })
              .toBuffer();
          } else {
            processedImageBuffer = await sharpImage
              .jpeg({ quality, progressive: true })
              .toBuffer();
          }
          
          console.log(`[PDF-GENERATOR] 图像处理完成: 处理后大小=${processedImageBuffer.byteLength} 字节, 压缩率=${((1 - processedImageBuffer.byteLength / imageBuffer.byteLength) * 100).toFixed(2)}%`);
        } catch (sharpError) {
          console.error(`[PDF-GENERATOR] Sharp处理图像失败: ${sharpError.message}`, sharpError);
          // 如果Sharp处理失败，使用原始数据
          processedImageBuffer = imageBuffer;
          console.log(`[PDF-GENERATOR] 使用原始图像数据: 大小=${processedImageBuffer.byteLength} 字节`);
        }
        
        // 保持对处理过的图像的引用
        processedImagesBuffer.push({
          name: imageName,
          data: processedImageBuffer
        });
        
        totalMemoryUsage += processedImageBuffer.byteLength;
        console.log(`[PDF-GENERATOR] 累计内存使用: ${(totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`);
        
        // 将图像添加到PDF
        const imgData = `data:image/jpeg;base64,${Buffer.from(processedImageBuffer).toString('base64')}`;
        
        // 在添加新页面之前，跳过第一页
        if (i > 0) {
          console.log(`[PDF-GENERATOR] 添加新页面: 页码=${i+1}`);
          doc.addPage();
        }
        
        // 将图像适应页面并保持宽高比
        const imageWidth = pdfWidth;
        const imageHeight = pdfHeight;
        
        console.log(`[PDF-GENERATOR] 添加图像到PDF: 页码=${i+1}, 尺寸=${imageWidth}×${imageHeight}mm, 位置=0,0`);
        doc.addImage(imgData, 'JPEG', 0, 0, imageWidth, imageHeight);
        
        // 清理已添加到PDF的图像数据以释放内存
        if (i % 5 === 0 && i > 0) {
          processedImagesBuffer = [];
          if (global.gc) {
            console.log(`[PDF-GENERATOR] 尝试执行垃圾回收`);
            global.gc();
          }
        }
      } catch (imageError) {
        console.error(`[PDF-GENERATOR] 处理图像 ${imageName} 时出错: ${imageError.message}`, imageError);
      }
    }
    
    console.log(`[PDF-GENERATOR] 所有图像已添加到PDF, 保存PDF文档`);
    // 生成PDF数据
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    console.log(`[PDF-GENERATOR] PDF生成完成: 大小=${pdfBuffer.byteLength} 字节, ${(pdfBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
    
    return pdfBuffer;
  } catch (error) {
    console.error(`[PDF-GENERATOR] 生成PDF失败: ${error.message}`, error);
    throw error;
  }
}
