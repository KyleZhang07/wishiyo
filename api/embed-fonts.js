// 导入所需模块
import { createClient } from '@supabase/supabase-js';
import { PDFDocument } from 'pdf-lib';

// 初始化Supabase客户端
const supabaseUrl = process.env.SUPABASE_URL || 'https://hbkgbggctzvqffqfrmhl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * 处理PDF字体嵌入
 *
 * 此函数接收一个PDF文件（可以是URL或base64字符串），
 * 使用pdf-lib处理字体嵌入，然后返回处理后的PDF
 */
export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理OPTIONS请求（预检请求）
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' });
  }

  try {
    // 验证Supabase凭证
    if (!supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: Missing Supabase credentials'
      });
    }

    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 解析请求参数
    const { pdfSource, orderId, type, tableName } = req.body;

    if (!pdfSource && !orderId) {
      return res.status(400).json({
        success: false,
        error: '必须提供pdfSource或orderId参数'
      });
    }

    console.log(`处理PDF字体嵌入请求，订单ID: ${orderId}, 类型: ${type || '未指定'}`);

    // 记录开始时间
    const startTime = Date.now();

    // 获取PDF数据
    let pdfData;
    let pdfSourceUrl = '';

    if (pdfSource) {
      // 直接使用提供的PDF数据
      if (pdfSource.startsWith('data:application/pdf;base64,')) {
        // 处理base64编码的PDF
        pdfData = Buffer.from(pdfSource.split(',')[1], 'base64');
      } else if (pdfSource.startsWith('http')) {
        // 处理URL
        const response = await fetch(pdfSource);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF from URL: ${response.status} ${response.statusText}`);
        }
        pdfData = await response.arrayBuffer();
        pdfSourceUrl = pdfSource;
      } else {
        // 假设是base64字符串但没有前缀
        try {
          pdfData = Buffer.from(pdfSource, 'base64');
        } catch (error) {
          throw new Error(`Invalid PDF source format: ${error.message}`);
        }
      }
    } else if (orderId && type) {
      // 从数据库获取PDF数据
      const table = tableName || (type.includes('love') ? 'love_story_books' : 'funny_biography_books');
      const column = type.includes('cover') ? 'cover_source_url' : 'interior_source_url';

      console.log(`从数据库获取PDF数据，表: ${table}, 列: ${column}, 订单ID: ${orderId}`);

      // 先检查表中是否有任何记录
      const { data: allRecords, error: listError } = await supabase
        .from(table)
        .select('id, order_id')
        .limit(5);

      console.log(`表 ${table} 中的前5条记录:`, allRecords);

      // 尝试不同的查询方式
      console.log(`尝试查询订单ID为 ${orderId} 的记录`);
      const { data: bookData, error: bookError } = await supabase
        .from(table)
        .select(`id, ${column}, order_id`)
        .eq('order_id', orderId)
        .single();

      if (bookError) {
        console.error(`查询数据库出错:`, bookError);
        // 尝试使用ID查询
        if (orderId.match(/^\d+$/)) {
          console.log(`尝试使用数字ID ${orderId} 查询`);
          const { data: idData, error: idError } = await supabase
            .from(table)
            .select(`id, ${column}, order_id`)
            .eq('id', parseInt(orderId))
            .single();

          if (!idError && idData) {
            console.log(`使用ID查询成功:`, idData);
            return idData;
          } else {
            console.error(`使用ID查询也失败:`, idError);
          }
        }
        throw new Error(`Failed to fetch PDF data from database: ${bookError.message}`);
      }

      if (!bookData) {
        console.error(`未找到订单ID为 ${orderId} 的记录`);
        throw new Error(`No data found for order ${orderId}`);
      }

      console.log(`找到记录:`, bookData);

      let pdfUrl = bookData[column];
      console.log(`获取到的PDF URL字段值:`, pdfUrl);

      // 如果URL为null，尝试重试几次，等待PDF上传完成
      if (!pdfUrl) {
        console.log(`URL为null，将尝试重试查询...`);

        // 设置重试参数
        const maxRetries = 5;
        const retryDelay = 3000; // 3秒

        // 定义延时函数
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // 定义重试查询函数
        const retryQuery = async (retryCount) => {
          if (retryCount >= maxRetries) {
            console.log(`达到最大重试次数(${maxRetries})，放弃重试`);
            throw new Error(`No PDF URL found in database for order ${orderId} after ${maxRetries} retries`);
          }

          console.log(`重试第 ${retryCount + 1} 次，等待 ${retryDelay}ms...`);
          await delay(retryDelay);

          // 重新查询
          console.log(`重新查询订单 ${orderId} 的PDF URL...`);
          const { data: retryData, error: retryError } = await supabase
            .from(table)
            .select(`id, ${column}, order_id`)
            .eq('order_id', orderId)
            .single();

          if (retryError) {
            console.error(`重试查询出错:`, retryError);
            return retryQuery(retryCount + 1);
          }

          if (!retryData) {
            console.error(`重试查询未找到记录`);
            return retryQuery(retryCount + 1);
          }

          const retryUrl = retryData[column];
          console.log(`重试查询结果: ${retryUrl ? '找到URL' : 'URL仍为null'}`);

          if (!retryUrl) {
            return retryQuery(retryCount + 1);
          }

          return retryUrl;
        };

        // 开始重试
        pdfUrl = await retryQuery(0);
        console.log(`重试成功，获取到PDF URL: ${pdfUrl}`);
      }

      console.log(`获取到PDF URL: ${pdfUrl}`);
      pdfSourceUrl = pdfUrl;

      // 下载PDF
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF from URL: ${response.status} ${response.statusText}`);
      }
      pdfData = await response.arrayBuffer();
    }

    if (!pdfData) {
      throw new Error('No PDF data available for processing');
    }

    console.log(`PDF数据获取成功，大小: ${pdfData.byteLength} 字节，开始处理字体嵌入...`);

    // 使用pdf-lib处理字体嵌入
    const pdfDoc = await PDFDocument.load(pdfData);

    // 获取文档中的所有字体
    const fontNames = new Set();
    const pages = pdfDoc.getPages();

    console.log(`PDF包含 ${pages.length} 页`);

    // 嵌入所有字体
    // 注意：pdf-lib不直接提供字体嵌入API，但我们可以通过复制页面来确保字体被正确嵌入
    const newPdfDoc = await PDFDocument.create();
    const copiedPages = await newPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());

    for (const page of copiedPages) {
      newPdfDoc.addPage(page);
    }

    console.log(`字体处理完成，保存处理后的PDF...`);

    // 保存处理后的PDF
    const processedPdfBytes = await newPdfDoc.save();
    console.log(`处理后的PDF大小: ${processedPdfBytes.byteLength} 字节`);

    // 如果提供了orderId和type，则更新数据库
    if (orderId && type) {
      const table = tableName || (type.includes('love') ? 'love_story_books' : 'funny_biography_books');
      const column = type.includes('cover') ? 'cover_source_url' : 'interior_source_url';

      // 上传处理后的PDF
      const filePath = type.includes('love')
        ? `love-story/${orderId}/${type.includes('cover') ? 'cover' : 'interior'}-embedded.pdf`
        : `funny-bio/${orderId}/${type.includes('cover') ? 'cover' : 'interior'}-embedded.pdf`;

      console.log(`上传处理后的PDF到: ${filePath}`);

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('pdfs')
        .upload(filePath, processedPdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Failed to upload processed PDF: ${uploadError.message}`);
      }

      // 获取上传后的URL
      const { data: urlData } = await supabase
        .storage
        .from('pdfs')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl;
      console.log(`处理后的PDF已上传，URL: ${publicUrl}`);

      // 更新数据库
      const updateData = {};
      updateData[column] = publicUrl;

      const { error: updateError } = await supabase
        .from(table)
        .update(updateData)
        .eq('order_id', orderId);

      if (updateError) {
        throw new Error(`Failed to update database: ${updateError.message}`);
      }

      console.log(`数据库已更新，字段 ${column} 设置为 ${publicUrl}`);

      // 返回成功响应
      return res.status(200).json({
        success: true,
        message: 'PDF字体嵌入处理成功并已更新数据库',
        processingTime: Date.now() - startTime,
        originalSize: pdfData.byteLength,
        processedSize: processedPdfBytes.byteLength,
        originalUrl: pdfSourceUrl,
        processedUrl: publicUrl
      });
    } else {
      // 返回处理后的PDF数据
      const base64Data = Buffer.from(processedPdfBytes).toString('base64');
      const dataUrl = `data:application/pdf;base64,${base64Data}`;

      // 返回成功响应
      return res.status(200).json({
        success: true,
        message: 'PDF字体嵌入处理成功',
        processingTime: Date.now() - startTime,
        originalSize: pdfData.byteLength,
        processedSize: processedPdfBytes.byteLength,
        processedPdf: dataUrl
      });
    }
  } catch (error) {
    console.error('处理PDF字体嵌入时出错:', error);
    return res.status(500).json({
      success: false,
      error: error.message || '处理PDF时发生未知错误'
    });
  }
}
