// 导入所需模块
import { createClient } from '@supabase/supabase-js';

// 初始化Supabase客户端 - 使用正确的URL
const supabaseUrl = process.env.SUPABASE_URL || 'https://hbkgbggctzvqffqfrmhl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理OPTIONS请求（预检请求）
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许GET和POST请求
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' });
  }

  try {
    // 获取请求参数
    const { orderId, type } = req.method === 'GET' ? req.query : req.body;
    
    // 验证参数
    if (!orderId || !type) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    console.log(`处理订单 ${orderId} 的 ${type} PDF合并请求，使用Supabase URL: ${supabaseUrl}`);

    // 初始化Supabase客户端
    if (!supabaseUrl) {
      return res.status(500).json({ error: 'Supabase URL未设置' });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    if (!supabase) {
      return res.status(500).json({ error: '无法初始化Supabase客户端' });
    }

    console.log(`开始处理订单 ${orderId} 的 ${type} PDF合并请求`);

    // 记录开始时间，用于计算处理时间
    const startTime = Date.now();
    console.log(`合并处理开始时间: ${new Date(startTime).toISOString()}`);

    // 确定文件路径
    const pdfPath = `love-story/${orderId}/${type}`;
    const indexPath = `${pdfPath}-index.json`;

    // 下载索引文件
    console.log(`下载索引文件: ${indexPath}`);
    const { data: indexData, error: indexError } = await supabase
      .storage
      .from('pdfs')
      .download(indexPath);

    if (indexError) {
      console.error(`下载索引文件失败:`, indexError);
      return res.status(500).json({ error: '下载索引文件失败', details: indexError });
    }

    // 解析索引文件
    const indexContent = await indexData.text();
    const indexJson = JSON.parse(indexContent);
    const { parts, totalSize } = indexJson;

    console.log(`索引文件解析成功，共有 ${parts.length} 个部分，总大小: ${totalSize} 字节`);
    console.log(`已用时: ${(Date.now() - startTime)/1000}秒`);

    // 下载所有PDF部分
    console.log(`开始下载 ${parts.length} 个PDF部分`);
    const pdfParts = [];
    for (const partPath of parts) {
      console.log(`下载PDF部分: ${partPath}`);
      const { data: partData, error: partError } = await supabase
        .storage
        .from('pdfs')
        .download(partPath);

      if (partError) {
        console.error(`下载PDF部分失败: ${partPath}`, partError);
        return res.status(500).json({ error: '下载PDF部分失败', details: partError });
      }

      // 将PDF部分转换为Uint8Array并添加到数组中
      const arrayBuffer = await partData.arrayBuffer();
      pdfParts.push(new Uint8Array(arrayBuffer));
      console.log(`已下载 ${pdfParts.length}/${parts.length} 个部分，已用时: ${(Date.now() - startTime)/1000}秒`);
    }

    // 合并所有PDF部分
    console.log(`开始合并 ${pdfParts.length} 个PDF部分`);
    const mergedPdf = new Uint8Array(totalSize);
    let offset = 0;

    for (const part of pdfParts) {
      mergedPdf.set(part, offset);
      offset += part.byteLength;
    }
    console.log(`PDF合并完成，总大小: ${mergedPdf.byteLength} 字节，已用时: ${(Date.now() - startTime)/1000}秒`);

    // 上传合并后的PDF
    const finalPath = `${pdfPath}.pdf`;
    console.log(`准备上传合并后的PDF到: ${finalPath}，大小: ${mergedPdf.byteLength} 字节`);

    try {
      // 先尝试删除已存在的文件
      console.log('尝试删除已存在的文件...');
      await supabase
        .storage
        .from('pdfs')
        .remove([finalPath])
        .then(({ error }) => {
          if (error) {
            // 如果是因为文件不存在而删除失败，这不是错误
            if (error.message && error.message.includes('Object not found')) {
              console.log('文件不存在，无需删除');
            } else {
              console.warn('删除已存在文件时出现警告:', error);
            }
          } else {
            console.log('已成功删除旧文件');
          }
        });

      // 获取上传URL
      console.log('尝试获取签名上传URL...');
      const { data, error: signedURLError } = await supabase
        .storage
        .from('pdfs')
        .createSignedUploadUrl(finalPath);

      if (signedURLError) {
        console.error('获取签名上传URL失败:', signedURLError);
        
        // 如果签名URL失败，尝试直接上传（带upsert选项）
        console.log('尝试使用直接上传方式（带upsert选项）...');
        const { error: directUploadError } = await supabase
          .storage
          .from('pdfs')
          .upload(finalPath, mergedPdf, {
            contentType: 'application/pdf',
            upsert: true
          });
          
        if (directUploadError) {
          console.error('直接上传也失败了:', directUploadError);
          return res.status(500).json({ 
            error: '上传PDF失败', 
            details: directUploadError 
          });
        }
        
        console.log('使用直接上传成功');
        // 直接上传成功，跳到获取公共URL部分
      } else {
        // 签名URL获取成功，继续处理
        if (!data) {
          console.error('签名URL数据为空:', data);
          return res.status(500).json({ error: '签名URL数据为空', details: data });
        }

        // 检查返回的数据结构
        console.log('获取到的签名URL数据:', JSON.stringify(data));
        
        // 兼容处理signedURL和signedUrl两种字段名
        const signedURL = data.signedURL || data.signedUrl;
        
        if (!signedURL) {
          console.error('签名URL字段不存在:', data);
          return res.status(500).json({ error: '签名URL字段不存在', details: data });
        }

        console.log('获取到签名上传URL，准备上传文件');

        // 使用fetch直接上传到签名URL
        const uploadResponse = await fetch(signedURL, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/pdf'
          },
          body: mergedPdf
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error(`上传失败: ${uploadResponse.status} - ${errorText}`);
          return res.status(500).json({ 
            error: '上传PDF失败', 
            status: uploadResponse.status,
            details: errorText 
          });
        }

        console.log('PDF上传成功');
      }
    } catch (uploadError) {
      console.error('上传过程中发生错误:', uploadError);
      return res.status(500).json({ error: '上传过程中发生错误', details: uploadError.message || uploadError });
    }

    // 获取公共URL
    const { data: publicUrlData } = supabase
      .storage
      .from('pdfs')
      .getPublicUrl(finalPath);

    const publicUrl = publicUrlData.publicUrl;
    console.log(`合并后的PDF公共URL: ${publicUrl}`);

    // 更新数据库中的URL
    if (type === 'interior') {
      console.log(`更新数据库中的interior_pdf和interior_source_url字段为合并后的PDF URL`);
      const { error: updateError } = await supabase
        .from('love_story_books')
        .update({ 
          interior_pdf: publicUrl,
          interior_source_url: publicUrl
        })
        .eq('order_id', orderId);

      if (updateError) {
        console.error(`更新数据库失败:`, updateError);
        // 不返回错误，因为PDF已经成功合并和上传
        console.warn(`数据库更新失败，但PDF已成功合并和上传`);
      } else {
        console.log(`数据库更新成功，interior_source_url和interior_pdf现在指向合并后的PDF`);
      }
    } else if (type === 'cover') {
      console.log(`更新数据库中的cover_pdf和cover_source_url字段`);
      const { error: updateError } = await supabase
        .from('love_story_books')
        .update({ 
          cover_pdf: publicUrl,
          cover_source_url: publicUrl 
        })
        .eq('order_id', orderId);

      if (updateError) {
        console.error(`更新数据库失败:`, updateError);
        // 不返回错误，因为PDF已经成功合并和上传
        console.warn(`数据库更新失败，但PDF已成功合并和上传`);
      }
    }

    // 如果是GET请求，返回PDF文件
    if (req.method === 'GET') {
      // 设置响应头
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${type}.pdf"`);
      res.setHeader('Content-Length', mergedPdf.length);
      
      // 返回PDF文件
      return res.status(200).send(Buffer.from(mergedPdf));
    } else {
      // 如果是POST请求，返回成功消息和URL
      return res.status(200).json({ 
        success: true, 
        message: 'PDF合并成功', 
        url: publicUrl 
      });
    }

  } catch (error) {
    console.error(`处理请求时出错:`, error);
    return res.status(500).json({ error: '服务器内部错误', details: error.message });
  }
}
