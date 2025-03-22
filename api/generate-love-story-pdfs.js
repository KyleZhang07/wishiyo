import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
// 添加canvas依赖，为jsPDF提供Node环境支持
import 'canvas';
// 可选: 如果需要字体支持
import 'jspdf-autotable';

// 配置API路由
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb', // 增加请求体大小限制
    },
    responseLimit: '100mb', // 增加响应大小限制
  },
};

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');

  // 记录API调用
  console.log('===== VERCEL API: generate-love-story-pdfs 被调用 =====');
  console.log('请求方法:', req.method);
  console.log('请求头:', JSON.stringify(req.headers, null, 2));
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end('ok');
  }

  // 只处理POST请求
  if (req.method !== 'POST') {
    console.log('非POST请求被拒绝');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 解析请求体
    const { orderId } = req.body;
    console.log('请求体:', JSON.stringify(req.body, null, 2));

    if (!orderId) {
      console.log('缺少订单ID');
      return res.status(400).json({ error: 'Order ID is required' });
    }

    console.log(`开始处理订单 ${orderId} 的PDF生成`);

    // 创建Supabase客户端
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('缺少Supabase配置');
      console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
      console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('SUPABASE_SERVICE_ROLE_KEY是否存在:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      return res.status(500).json({ error: 'Supabase configuration missing' });
    }
    
    console.log('使用Supabase URL:', supabaseUrl);
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // 获取love_story_books记录
    const { data: bookData, error: bookError } = await supabaseAdmin
      .from('love_story_books')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (bookError || !bookData) {
      console.log(`获取书籍记录失败：${bookError}`);
      return res.status(404).json({ error: 'Book not found', details: bookError });
    }

    // 获取client_id，用于查找图片
    const clientId = bookData.client_id;
    
    if (!clientId) {
      console.log('书籍记录中缺少Client ID');
      return res.status(404).json({ error: 'Client ID not found in book record' });
    }

    // 尝试从两个可能的路径获取图片
    let imageFiles = [];
    let listError = null;
    
    // 首先尝试从基于client_id的路径获取
    const { data: clientImages, error: clientListError } = await supabaseAdmin
      .storage
      .from('images')
      .list(`${clientId}`);
    
    if (!clientListError && clientImages && clientImages.length > 0) {
      imageFiles = clientImages;
    } else {
      // 如果没有找到，尝试从love-story/${orderId}路径获取
      const { data: orderImages, error: orderListError } = await supabaseAdmin
        .storage
        .from('images')
        .list(`love-story/${orderId}`);
      
      if (!orderListError && orderImages && orderImages.length > 0) {
        imageFiles = orderImages;
        listError = null;
      } else {
        // 两个路径都没有找到图片
        imageFiles = [];
        listError = clientListError || orderListError;
      }
    }

    if (listError || !imageFiles || imageFiles.length === 0) {
      console.log(`获取图片列表失败：${listError}`);
      return res.status(500).json({ 
        error: 'Failed to list images or no images found', 
        details: listError 
      });
    }

    // 对图片进行分类和排序
    const coverImages = imageFiles.filter(file => file.name.includes('love-cover-') && !file.name.includes('back')).sort((a, b) => a.name.localeCompare(b.name));
    const backCoverImages = imageFiles.filter(file => file.name.includes('love-back-cover-')).sort((a, b) => a.name.localeCompare(b.name));
    const spineImages = imageFiles.filter(file => file.name.includes('love-spine-')).sort((a, b) => a.name.localeCompare(b.name));
    
    // 添加blessing图片筛选
    const blessingImages = imageFiles.filter(file => file.name.includes('blessing')).sort((a, b) => a.name.localeCompare(b.name));
    
    // 添加ending page图片筛选
    const endingImages = imageFiles.filter(file => file.name.includes('ending-page-')).sort((a, b) => a.name.localeCompare(b.name));
    
    // 修改介绍图片筛选逻辑，只使用 intro-数字 格式，并排除旧的 love-story-intro 格式
    const introImages = imageFiles.filter(file => {
      // 使用正则表达式匹配 intro-数字 格式，但排除love-story-intro前缀
      const introPattern = /intro-\d+/;
      return introPattern.test(file.name) && !file.name.includes('love-story-intro');
    }).sort((a, b) => {
      // 提取数字进行排序
      const numA = parseInt(a.name.match(/intro-(\d+)/)?.[1] || '0');
      const numB = parseInt(b.name.match(/intro-(\d+)/)?.[1] || '0');
      return numA - numB;
    });
    
    // 修改内容图片筛选逻辑，只使用 content-数字-数字 格式
    const contentImages = imageFiles.filter(file => {
      // 使用正则表达式匹配 content-数字-数字 格式，但排除love-story-content前缀
      const contentPattern = /content-\d+-\d+/;
      return contentPattern.test(file.name) && !file.name.includes('love-story-content');
    }).sort((a, b) => {
      // 提取第一个数字进行主排序，第二个数字进行次排序
      const matchA = a.name.match(/content-(\d+)-(\d+)/);
      const matchB = b.name.match(/content-(\d+)-(\d+)/);
      
      if (!matchA || !matchB) return 0;
      
      const firstNumA = parseInt(matchA[1]);
      const firstNumB = parseInt(matchB[1]);
      
      if (firstNumA !== firstNumB) {
        return firstNumA - firstNumB;
      }
      
      const secondNumA = parseInt(matchA[2]);
      const secondNumB = parseInt(matchB[2]);
      return secondNumA - secondNumB;
    });

    // 检查是否有足够的图片
    if (coverImages.length === 0 || introImages.length === 0 || contentImages.length === 0 || backCoverImages.length === 0 || spineImages.length === 0) {
      console.log('图片数量不足');
      return res.status(400).json({ 
        error: 'Insufficient images for PDF generation', 
        details: {
          coverImagesCount: coverImages.length,
          backCoverImagesCount: backCoverImages.length,
          spineImagesCount: spineImages.length,
          blessingImagesCount: blessingImages.length,
          introImagesCount: introImages.length,
          contentImagesCount: contentImages.length,
          endingImagesCount: endingImages.length
        }
      });
    }

    // 生成完整封面PDF (封底 + 书脊 + 封面)
    console.log('Generating cover PDF...');
    const coverPdf = await generateCoverPdf(backCoverImages[0], spineImages[0], coverImages[0], orderId, clientId, supabaseAdmin);
    
    // 生成内页PDF（按顺序合并：blessing + intro + content图片）
    console.log('Generating interior PDF...');
    const interiorPdf = await generatePdf([...blessingImages, ...introImages, ...contentImages, ...endingImages], orderId, clientId, supabaseAdmin);

    // 上传PDF到Storage
    const coverPdfPath = `love-story/${orderId}/cover.pdf`;
    const interiorPdfPath = `love-story/${orderId}/interior.pdf`;

    console.log('Uploading cover PDF...');
    const { data: coverUploadData, error: coverUploadError } = await supabaseAdmin
      .storage
      .from('pdfs')
      .upload(coverPdfPath, coverPdf, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (coverUploadError) {
      console.log(`上传封面PDF失败：${JSON.stringify(coverUploadError)}`);
      return res.status(500).json({ error: 'Failed to upload cover PDF', details: coverUploadError });
    }

    console.log('Uploading interior PDF...');
    try {
      // 获取内页PDF大小
      const interiorPdfSize = interiorPdf.length;
      console.log(`内页PDF大小: ${interiorPdfSize} 字节 (${Math.round(interiorPdfSize/1024/1024 * 100) / 100} MB)`);
      
      // 如果PDF太大，尝试分块上传
      if (interiorPdfSize > 20 * 1024 * 1024) { // 如果大于20MB
        console.log('内页PDF太大，尝试分块上传...');
        
        // 创建一个临时文件名，稍后会被替换
        const tempInteriorPdfPath = `love-story/${orderId}/interior-temp.pdf`;
        
        // 分块上传
        const { data: interiorUploadData, error: interiorUploadError } = await supabaseAdmin
          .storage
          .from('pdfs')
          .upload(tempInteriorPdfPath, interiorPdf.slice(0, 10 * 1024 * 1024), { // 只上传前10MB
            contentType: 'application/pdf',
            upsert: true
          });
          
        if (interiorUploadError) {
          console.log(`上传内页PDF失败：${JSON.stringify(interiorUploadError)}`);
          return res.status(500).json({ error: 'Failed to upload interior PDF', details: interiorUploadError });
        }
        
        // 由于文件太大，我们只上传了一部分，返回一个特殊的错误信息
        return res.status(413).json({ 
          error: 'PDF file too large', 
          message: 'The generated PDF is too large for direct upload. Please consider reducing the number of images or their quality.',
          size: interiorPdfSize
        });
      } else {
        // 正常上传
        const { data: interiorUploadData, error: interiorUploadError } = await supabaseAdmin
          .storage
          .from('pdfs')
          .upload(interiorPdfPath, interiorPdf, {
            contentType: 'application/pdf',
            upsert: true
          });
          
        if (interiorUploadError) {
          console.log(`上传内页PDF失败：${JSON.stringify(interiorUploadError)}`);
          return res.status(500).json({ error: 'Failed to upload interior PDF', details: interiorUploadError });
        }
        
        // 获取上传的PDF的公共URL
        const coverPdfUrl = supabaseAdmin.storage.from('pdfs').getPublicUrl(coverPdfPath).data.publicUrl;
        const interiorPdfUrl = supabaseAdmin.storage.from('pdfs').getPublicUrl(interiorPdfPath).data.publicUrl;
        
        // 更新数据库中的记录
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('love_story_books')
          .update({
            cover_pdf_url: coverPdfUrl,
            interior_pdf_url: interiorPdfUrl,
            status: 'pdf_generated'
          })
          .eq('order_id', orderId);
          
        if (updateError) {
          console.log(`更新数据库记录失败：${JSON.stringify(updateError)}`);
          return res.status(500).json({ error: 'Failed to update book record', details: updateError });
        }
        
        // 返回成功响应
        return res.status(200).json({
          success: true,
          message: 'PDFs generated and uploaded successfully',
          data: {
            coverPdfUrl,
            interiorPdfUrl
          }
        });
      }
    } catch (error) {
      console.log(`处理内页PDF上传时出错：${error.message || JSON.stringify(error)}`);
      return res.status(500).json({ error: 'Error processing interior PDF upload', details: error.message || error });
    }

  } catch (error) {
    console.error('Error in PDF generation:', JSON.stringify(error));
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// 新增函数：生成完整封面PDF（封底+书脊+封面）
async function generateCoverPdf(backCoverFile, spineFile, frontCoverFile, orderId, clientId, supabase) {
  // 创建PDF，设置为Lulu要求的总文档尺寸 (19" x 10.25")
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: [19, 10.25], // Lulu模板总文档尺寸
    compress: true // 启用PDF压缩
  });
  
  // 从Supabase下载图片
  async function downloadImage(file) {
    let imageData = null;
    let imageError = null;

    // 首先尝试从client_id路径获取图片
    if (clientId) {
      const clientPathResult = await supabase
        .storage
        .from('images')
        .download(`${clientId}/${file.name}`);
      
      if (!clientPathResult.error && clientPathResult.data) {
        imageData = clientPathResult.data;
        imageError = null;
      } else {
        // 如果从client_id路径获取失败，尝试从order_id路径获取
        const orderPathResult = await supabase
          .storage
          .from('images')
          .download(`love-story/${orderId}/${file.name}`);
        
        imageData = orderPathResult.data;
        imageError = orderPathResult.error;
      }
    } else {
      // 如果没有client_id，直接从order_id路径获取
      const { data, error } = await supabase
        .storage
        .from('images')
        .download(`love-story/${orderId}/${file.name}`);
      
      imageData = data;
      imageError = error;
    }

    if (imageError || !imageData) {
      console.error(`Failed to download image: ${file.name}`, JSON.stringify(imageError));
      throw new Error(`Failed to download image: ${file.name}`);
    }

    // 转换图片为base64
    const imageBase64 = await blobToBase64(imageData);
    return imageBase64;
  }
  
  // 下载所有需要的图片
  const backCoverBase64 = await downloadImage(backCoverFile);
  const spineBase64 = await downloadImage(spineFile);
  const frontCoverBase64 = await downloadImage(frontCoverFile);
  
  // Lulu模板中的精确尺寸设置
  const totalDocWidth = 19;        // 总文档宽度 (外边缘到外边缘)
  const totalDocHeight = 10.25;    // 总文档高度
  const wrapAreaWidth = 0.75;      // 出血区域宽度 (Wrap Area)
  const spineWidth = 0.25;         // 书脊宽度 (Minimum Spine Width)
  const bookCoverWidth = 8.625;    // 书籍封面宽度 (Book Cover Size)
  const bookCoverHeight = 8.75;    // 书籍封面高度
  const bookTrimWidth = 8.5;       // 书籍裁切尺寸宽度 (Book Trim Size)
  const bookTrimHeight = 8.5;      // 书籍裁切尺寸高度
  const safetyMarginWidth = 0.5;   // 安全边距宽度
  
  // 修正计算：封面和封底宽度应包括两侧的Wrap Area
  const backCoverWidth = bookCoverWidth + (wrapAreaWidth * 2);  // 10.125"
  const frontCoverWidth = backCoverWidth;  // 10.125"
  
  // 修正各部分的位置布局
  const backCoverX = 0;  // 封底从左侧开始
  const spineX = backCoverX + backCoverWidth;  // 书脊位于封底右侧 (10.125")
  const frontCoverX = spineX + spineWidth;  // 封面位于书脊右侧 (10.375")
  
  // Y轴位置（从顶部开始）
  const coverY = 0;  // 从PDF顶部开始
  
  // 添加封底（左侧）- 精确覆盖区域
  pdf.addImage(
    backCoverBase64,
    'JPEG',
    backCoverX,
    coverY,
    backCoverWidth,
    totalDocHeight,
    undefined
  );
  
  // 添加书脊（中间）
  pdf.addImage(
    spineBase64,
    'JPEG',
    spineX,
    coverY,
    spineWidth,
    totalDocHeight,
    undefined
  );
  
  // 添加封面（右侧）
  pdf.addImage(
    frontCoverBase64,
    'JPEG',
    frontCoverX,
    coverY,
    frontCoverWidth,
    totalDocHeight,
    undefined
  );
  
  // 如果需要，可以添加辅助线来标记安全边距、裁切线等（仅用于调试）
  const debugLines = false; // 设置为false关闭调试线，减小文件大小
  if (debugLines) {
    pdf.setDrawColor(255, 0, 0); // 红色
    pdf.setLineWidth(0.01);
    
    // 封底安全边距 - 修正位置
    pdf.rect(
      backCoverX + wrapAreaWidth + safetyMarginWidth, 
      (totalDocHeight - bookTrimHeight)/2 + safetyMarginWidth, 
      bookTrimWidth - (2 * safetyMarginWidth), 
      bookTrimHeight - (2 * safetyMarginWidth)
    );
    
    // 封面安全边距 - 修正位置
    pdf.rect(
      frontCoverX + wrapAreaWidth + safetyMarginWidth, 
      (totalDocHeight - bookTrimHeight)/2 + safetyMarginWidth, 
      bookTrimWidth - (2 * safetyMarginWidth), 
      bookTrimHeight - (2 * safetyMarginWidth)
    );
    
    // 标记出书脊区域
    pdf.setDrawColor(0, 0, 255); // 蓝色
    pdf.rect(spineX, 0, spineWidth, totalDocHeight);

    // 标记出裁切线（Trim Lines）
    pdf.setDrawColor(0, 162, 232); // 浅蓝色
    
    // 封底裁切线
    const backTrimLeft = backCoverX + wrapAreaWidth;
    const backTrimRight = backTrimLeft + bookTrimWidth;
    const trimTop = (totalDocHeight - bookTrimHeight) / 2;
    const trimBottom = trimTop + bookTrimHeight;
    
    // 封底裁切线
    pdf.rect(backTrimLeft, trimTop, bookTrimWidth, bookTrimHeight);
    
    // 封面裁切线
    const frontTrimLeft = frontCoverX + wrapAreaWidth;
    pdf.rect(frontTrimLeft, trimTop, bookTrimWidth, bookTrimHeight);
    
    // 标记出总文档尺寸（包括出血区域）
    pdf.setDrawColor(128, 128, 128); // 灰色
    pdf.rect(0, 0, totalDocWidth, totalDocHeight);
    
    // 添加标签文本
    pdf.setFontSize(6);
    pdf.setTextColor(0, 162, 232);
    pdf.text('TRIM AREA', backTrimLeft + (bookTrimWidth/2), trimTop - 0.1, { align: 'center' });
    pdf.text('TRIM AREA', frontTrimLeft + (bookTrimWidth/2), trimTop - 0.1, { align: 'center' });
    
    pdf.setTextColor(255, 0, 0);
    pdf.text('SAFETY MARGIN', backTrimLeft + (bookTrimWidth/2), trimTop + 0.2, { align: 'center' });
    pdf.text('SAFETY MARGIN', frontTrimLeft + (bookTrimWidth/2), trimTop + 0.2, { align: 'center' });
    
    // 添加部分标签
    pdf.setTextColor(0, 0, 255);
    pdf.text('SPINE', spineX + (spineWidth/2), totalDocHeight/2, { angle: 90, align: 'center' });
    
    pdf.text('BACK COVER', backCoverX + (backCoverWidth/2), totalDocHeight - 0.1, { align: 'center' });
    pdf.text('FRONT COVER', frontCoverX + (frontCoverWidth/2), totalDocHeight - 0.1, { align: 'center' });
    
    // 添加尺寸标注
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Total: ${totalDocWidth}" x ${totalDocHeight}"`, totalDocWidth/2, 0.2, { align: 'center' });
    pdf.text(`Back: ${backCoverWidth}"`, backCoverX + (backCoverWidth/2), 0.3, { align: 'center' });
    pdf.text(`Spine: ${spineWidth}"`, spineX + (spineWidth/2), 0.3, { align: 'center' });
    pdf.text(`Front: ${frontCoverWidth}"`, frontCoverX + (frontCoverWidth/2), 0.3, { align: 'center' });
  }
  
  // 转换PDF为Uint8Array
  const pdfOutput = pdf.output('arraybuffer');
  return new Uint8Array(pdfOutput);
}

// 辅助函数：生成PDF
async function generatePdf(imageFiles, orderId, clientId, supabase) {
  // 根据Lulu模板修改为方形格式
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [8.75, 8.75], // 总文档尺寸 8.75" x 8.75"
    compress: true // 启用PDF压缩
  });

  // Lulu内页模板尺寸设置
  const totalDocSize = 8.75;       // 总文档尺寸
  const bookTrimSize = 8.5;        // 书籍裁切尺寸
  const bleedWidth = 0.125;        // 出血区域宽度
  const safetyMarginWidth = 0.5;   // 安全边距宽度
  
  let currentPage = 0;

  // 移除重复查询client_id的代码，直接使用传入的参数
  for (const file of imageFiles) {
    let imageData = null;
    let imageError = null;

    try {
      // 首先尝试从client_id路径获取图片
      if (clientId) {
        const clientPathResult = await supabase
          .storage
          .from('images')
          .download(`${clientId}/${file.name}`);
        
        if (!clientPathResult.error && clientPathResult.data) {
          imageData = clientPathResult.data;
          imageError = null;
        } else {
          // 如果从client_id路径获取失败，尝试从order_id路径获取
          const orderPathResult = await supabase
            .storage
            .from('images')
            .download(`love-story/${orderId}/${file.name}`);
          
          imageData = orderPathResult.data;
          imageError = orderPathResult.error;
        }
      } else {
        // 如果没有client_id，直接从order_id路径获取
        const { data, error } = await supabase
          .storage
          .from('images')
          .download(`love-story/${orderId}/${file.name}`);
        
        imageData = data;
        imageError = error;
      }

      if (imageError || !imageData) {
        console.error(`Failed to download image: ${file.name}`, JSON.stringify(imageError));
        continue;
      }

      // 转换图片为base64
      const imageBase64 = await blobToBase64(imageData);

      // 添加新页（除了第一页）
      if (currentPage > 0) {
        pdf.addPage();
      }

      // 添加图片到PDF - 使用较低的图像质量以减小文件大小
      pdf.addImage(
        imageBase64,
        'JPEG',
        0, // x坐标
        0, // y坐标
        totalDocSize, // 宽度（总文档宽度）
        totalDocSize, // 高度（总文档高度）
        undefined, // 别名
        'MEDIUM' // 图像质量 - 使用中等质量而非最高质量
      );
      
      // 添加安全边距指示线（仅用于调试）
      const debugLines = false; // 设置为false关闭调试线，减小文件大小
      if (debugLines) {
        pdf.setDrawColor(255, 0, 0); // 红色
        pdf.setLineWidth(0.01);
        
        // 安全边距矩形 - 修正计算方式
        pdf.rect(
          bleedWidth + safetyMarginWidth, 
          bleedWidth + safetyMarginWidth, 
          bookTrimSize - (2 * safetyMarginWidth), 
          bookTrimSize - (2 * safetyMarginWidth)
        );
        
        // 裁切线（Trim Size）
        pdf.setDrawColor(0, 0, 255); // 蓝色
        pdf.rect(
          bleedWidth, 
          bleedWidth, 
          bookTrimSize, 
          bookTrimSize
        );
      }

      currentPage++;
    } catch (error) {
      console.error(`Error processing image ${file.name}:`, error);
      // 继续处理下一张图片，而不是中断整个过程
    }
  }
  
  // 转换PDF为Uint8Array
  const pdfOutput = pdf.output('arraybuffer');
  return new Uint8Array(pdfOutput);
}

// 辅助函数：Blob转Base64，并可选压缩图像
async function blobToBase64(blob) {
  try {
    // Node环境中使用Buffer而不是FileReader
    const buffer = Buffer.from(await blob.arrayBuffer());
    return `data:${blob.type};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('Error converting blob to base64:', error);
    throw error;
  }
}
