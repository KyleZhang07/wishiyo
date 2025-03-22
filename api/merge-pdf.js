import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // 启用 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, type } = req.query;

  if (!orderId || !type) {
    return res.status(400).json({ error: 'Missing orderId or type parameter' });
  }

  try {
    // 初始化 Supabase 客户端
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 获取索引文件
    const indexPath = `love-story/${orderId}/${type}-index.json`;
    const { data: indexData, error: indexError } = await supabase
      .storage
      .from('pdfs')
      .download(indexPath);

    if (indexError) {
      console.error('获取索引文件失败:', indexError);
      return res.status(500).json({ error: 'Failed to download index file', details: indexError });
    }

    // 解析索引文件
    const indexContent = new TextDecoder().decode(indexData);
    const index = JSON.parse(indexContent);

    // 下载所有 PDF 部分
    const pdfParts = [];
    for (const partPath of index.parts) {
      console.log(`下载PDF部分: ${partPath}`);
      const { data: partData, error: partError } = await supabase
        .storage
        .from('pdfs')
        .download(partPath);

      if (partError) {
        console.error(`下载PDF部分失败: ${partPath}`, partError);
        return res.status(500).json({ error: `Failed to download part: ${partPath}`, details: partError });
      }

      pdfParts.push(new Uint8Array(partData));
    }

    // 合并所有 PDF 部分
    const totalSize = index.totalSize;
    const mergedPdf = new Uint8Array(totalSize);
    let offset = 0;

    for (const part of pdfParts) {
      mergedPdf.set(part, offset);
      offset += part.byteLength;
    }

    // 设置响应头
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}.pdf"`);
    res.setHeader('Content-Length', totalSize);

    // 发送合并后的 PDF
    return res.status(200).send(Buffer.from(mergedPdf));

  } catch (error) {
    console.error('合并PDF时出错:', error);
    return res.status(500).json({ error: error.message });
  }
}
