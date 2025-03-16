import { createClient } from '@supabase/supabase-js';
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

// 定义封面样式类型
const coverStyles = [
  {
    id: 'classic',
    name: 'Classic',
    background: '#f6f4ea', 
    titleColor: '#444444', 
    subtitleColor: '#633d63', 
    authorColor: '#222222', 
    font: 'playfair',
    borderColor: '#EAC46E'
  },
  {
    id: 'modern',
    name: 'Modern',
    background: '#000000',
    titleColor: '#4caf50',
    subtitleColor: '#ffffff',
    authorColor: '#4caf50',
    font: 'montserrat'
  },
  {
    id: 'playful',
    name: 'Playful',
    background: '#4A89DC',
    titleColor: '#FFEB3B',
    subtitleColor: '#FFFFFF',
    authorColor: '#FFEB3B',
    font: 'comic-sans'
  },
  {
    id: 'elegant',
    name: 'Elegant',
    background: '#FFFFFF',
    titleColor: '#000000',
    subtitleColor: '#333333',
    authorColor: '#000000',
    font: 'didot'
  },
  {
    id: 'vintage',
    name: 'Vintage',
    background: '#F5F5DC',
    titleColor: '#8B4513',
    subtitleColor: '#A0522D',
    authorColor: '#8B4513',
    font: 'playfair',
    borderColor: '#D2B48C'
  }
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      orderId,
      pageType, // 'cover', 'intro', 或 'content'
      pageNumber = 0,
      coverTitle,
      subtitle,
      authorName,
      recipientName,
      contentText,
      imageUrl,
      styleId = 'classic',
      clientId
    } = req.body;

    if (!orderId || !pageType) {
      return res.status(400).json({ 
        error: 'Required parameters missing', 
        details: 'orderId and pageType are required' 
      });
    }

    // 初始化Supabase客户端
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Missing Supabase credentials' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 注册字体
    try {
      registerFont(path.join(process.cwd(), 'fonts', 'PlayfairDisplay-Regular.ttf'), { family: 'Playfair Display' });
      registerFont(path.join(process.cwd(), 'fonts', 'Montserrat-Regular.ttf'), { family: 'Montserrat' });
      registerFont(path.join(process.cwd(), 'fonts', 'ComicNeue-Regular.ttf'), { family: 'Comic Sans' });
      registerFont(path.join(process.cwd(), 'fonts', 'GFSDidot-Regular.ttf'), { family: 'Didot' });
    } catch (error) {
      console.warn('Warning: Font registration may have failed:', error.message);
      // 继续执行，我们将使用系统默认字体
    }

    // 创建高分辨率 Canvas (300ppi)
    // 8.5×11 英寸 @ 300ppi = 2550×3300 像素
    const canvas = createCanvas(2550, 3300);
    const ctx = canvas.getContext('2d');

    // 获取选择的样式
    const style = coverStyles.find(s => s.id === styleId) || coverStyles[0];

    // 设置字体家族
    let fontFamily = 'serif'; // 默认为衬线字体
    if (style.font === 'montserrat') {
      fontFamily = 'Montserrat, sans-serif';
    } else if (style.font === 'comic-sans') {
      fontFamily = 'Comic Sans, cursive';
    } else if (style.font === 'didot') {
      fontFamily = 'Didot, serif';
    } else if (style.font === 'playfair') {
      fontFamily = 'Playfair Display, serif';
    }

    // 根据页面类型执行不同的渲染逻辑
    let buffer;
    
    if (pageType === 'cover') {
      buffer = await renderCover(
        canvas, 
        ctx, 
        {
          style,
          fontFamily,
          title: coverTitle,
          subtitle,
          authorName,
          recipientName,
          imageUrl
        }
      );
    } else if (pageType === 'intro') {
      buffer = await renderIntro(
        canvas, 
        ctx, 
        {
          style,
          fontFamily,
          title: coverTitle || 'Our Love Story',
          text: contentText,
          imageUrl,
          recipientName
        }
      );
    } else if (pageType === 'content') {
      buffer = await renderContent(
        canvas, 
        ctx, 
        {
          style,
          fontFamily,
          text: contentText,
          imageUrl,
          pageNumber
        }
      );
    } else {
      return res.status(400).json({ error: 'Invalid pageType. Must be one of: cover, intro, content' });
    }

    if (!buffer) {
      return res.status(500).json({ error: 'Failed to render image' });
    }

    // 上传到 Supabase Storage
    const timestamp = Date.now();
    let fileName;
    
    if (pageType === 'cover') {
      fileName = `${clientId}/love-story-cover-${timestamp}.jpg`;
    } else if (pageType === 'intro') {
      fileName = `${clientId}/love-story-intro-${timestamp}.jpg`;
    } else {
      fileName = `${clientId}/love-story-content-${pageNumber}-${timestamp}.jpg`;
    }
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
        metadata: {
          client_id: clientId,
          order_id: orderId,
          ppi: '300',
          type: pageType
        }
      });
      
    if (error) {
      return res.status(500).json({ 
        error: 'Failed to upload image', 
        details: error 
      });
    }
    
    // 获取公共 URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);
    
    // 保存元数据以便PDF生成时使用
    const metadata = {
      style_id: styleId,
      title: coverTitle,
      subtitle: subtitle,
      author_name: authorName,
      person_name: recipientName
    };
    
    // 更新数据库记录
    const { data: pageData, error: pageError } = await supabase.from('love_story_pages')
      .upsert({
        order_id: orderId,
        page_type: pageType,
        page_number: pageNumber,
        image_path: fileName,
        image_url: publicUrlData.publicUrl,
        created_at: new Date().toISOString(),
        metadata: metadata // 添加样式和内容信息
      });
      
    if (pageError) {
      console.error('Warning: Failed to update database record:', pageError);
      // 继续返回URL，因为图像已成功上传
    }
    
    // 返回图像 URL
    return res.status(200).json({ 
      success: true,
      url: publicUrlData.publicUrl,
      fileName: fileName,
      pageData: pageData
    });
  } catch (error) {
    console.error('Error rendering image:', error);
    return res.status(500).json({ 
      error: 'Failed to render image', 
      details: error.message 
    });
  }
}

// 渲染封面
async function renderCover(canvas, ctx, options) {
  const { style, fontFamily, title, subtitle, authorName, recipientName, imageUrl } = options;
  
  // 清除画布
  ctx.fillStyle = style.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 加载背景图像
  try {
    // 加载项目中的背景资源（如果存在）
    let blueTexture, greenLeaf, rainbow;
    
    try {
      // 根据样式ID加载相应的背景图像
      if (style.id === 'modern') {
        blueTexture = await loadImage(path.join(process.cwd(), 'public', 'assets', 'blue-texture.jpg'));
      } else if (style.id === 'playful') {
        greenLeaf = await loadImage(path.join(process.cwd(), 'public', 'assets', 'leaves.jpg'));
      } else if (style.id === 'elegant') {
        rainbow = await loadImage(path.join(process.cwd(), 'public', 'assets', 'rainbow2.jpg'));
      }
    } catch (err) {
      console.warn('Warning: Failed to load background image:', err.message);
      // 继续使用背景色
    }

    // 根据样式应用不同的背景
    if (style.id === 'classic') {
      // 绘制经典风格的纹理背景
      drawTexturedBackground(ctx, canvas.width, canvas.height, style.background, 0.8);
    } else if (style.id === 'modern' && blueTexture) {
      // 绘制现代风格的蓝色纹理背景
      ctx.drawImage(blueTexture, 0, 0, canvas.width, canvas.height);
      drawSnowflakes(ctx, canvas.width, canvas.height);
    } else if (style.id === 'playful' && greenLeaf) {
      // 绘制活泼风格的绿叶背景
      ctx.drawImage(greenLeaf, 0, 0, canvas.width, canvas.height);
    } else if (style.id === 'elegant' && rainbow) {
      // 绘制优雅风格的彩虹背景
      ctx.drawImage(rainbow, 0, 0, canvas.width, canvas.height);
    } else if (style.id === 'vintage') {
      // 绘制复古风格的背景（添加边框）
      if (style.borderColor) {
        const borderWidth = canvas.width * 0.03;
        ctx.strokeStyle = style.borderColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(borderWidth/2, borderWidth/2, canvas.width - borderWidth, canvas.height - borderWidth);
      }
    }
  } catch (error) {
    console.error('Error applying background:', error);
    // 继续使用背景色
  }

  // 根据样式确定标题位置
  const titleY = style.id === 'modern' ? canvas.height * 0.15 : canvas.height * 0.1;
  const subtitleY = style.id === 'modern' ? canvas.height * 0.3 : canvas.height * 0.25;
  const authorY = style.id === 'playful' ? canvas.height * 0.85 : canvas.height * 0.92;
  const authorX = style.id === 'elegant' ? canvas.width * 0.5 : canvas.width * 0.9;

  // 绘制标题和副标题
  if (style.id === 'classic') {
    // 第一行：作者名
    ctx.font = `bold ${canvas.width * 0.07}px ${fontFamily}`;
    ctx.fillStyle = style.authorColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${authorName}'s`, canvas.width / 2, canvas.height * 0.1);
    
    // 第二行：wonderful
    ctx.font = `bold ${canvas.width * 0.05}px ${fontFamily}`;
    ctx.fillStyle = style.titleColor;
    ctx.fillText(`wonderful`, canvas.width / 2, canvas.height * 0.2);
    
    // 第三行：角色名称
    ctx.font = `bold ${canvas.width * 0.09}px ${fontFamily}`;
    ctx.fillStyle = style.subtitleColor;
    ctx.fillText(recipientName, canvas.width / 2, canvas.height * 0.3);
  } else {
    // 其他样式
    ctx.font = `bold ${canvas.width * 0.05}px ${fontFamily}`;
    ctx.fillStyle = style.titleColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title || 'Love Story', canvas.width / 2, titleY);
    
    // 副标题（角色名）
    ctx.font = `bold ${canvas.width * 0.09}px ${fontFamily}`;
    ctx.fillStyle = style.subtitleColor;
    const recipientUpper = recipientName ? recipientName.toUpperCase() : '';
    
    // Modern风格使用斜体
    if (style.id === 'modern') {
      ctx.font = `bold italic ${canvas.width * 0.09}px ${fontFamily}`;
    } else if (style.id === 'playful') {
      // Playful风格使用更大字体
      ctx.font = `bold ${canvas.width * 0.11}px ${fontFamily}`;
    }
    
    if (recipientName) {
      ctx.fillText(recipientUpper + "!", canvas.width / 2, subtitleY);
    }
  }

  // 绘制作者名
  if (authorName) {
    ctx.font = `${canvas.width * 0.03}px ${fontFamily}`;
    ctx.fillStyle = style.authorColor;
    ctx.textAlign = style.id === 'elegant' ? 'center' : 'right';
    ctx.fillText(`By ${authorName}`, 
      style.id === 'elegant' ? canvas.width / 2 : canvas.width * 0.9, 
      authorY
    );
  }

  // 加载并绘制封面图像
  if (imageUrl) {
    try {
      // 下载图像
      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();
      const image = await loadImage(Buffer.from(imageBuffer));
      
      // 计算图像尺寸和位置，计算高度时保持原始宽高比
      const imgWidth = canvas.width * 0.6;
      const imgHeight = (image.height / image.width) * imgWidth;
      const imgX = (canvas.width - imgWidth) / 2;
      const imgY = canvas.height * 0.4;
      
      ctx.drawImage(image, imgX, imgY, imgWidth, imgHeight);
    } catch (error) {
      console.error('Error loading cover image:', error);
      // 继续执行，只是没有图像
    }
  }

  // 返回图像buffer
  return canvas.toBuffer('image/jpeg', { quality: 0.95 });
}

// 渲染介绍页
async function renderIntro(canvas, ctx, options) {
  const { style, fontFamily, title, text, imageUrl, recipientName } = options;
  
  // 清除画布
  ctx.fillStyle = style.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 简单纹理背景
  if (style.id === 'classic' || style.id === 'vintage') {
    drawTexturedBackground(ctx, canvas.width, canvas.height, style.background, 0.4);
  }
  
  // 添加半透明覆盖层以使文字更易读
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fillRect(0, 0, canvas.width * 0.6, canvas.height);
  
  // 绘制标题
  ctx.font = `bold ${canvas.width * 0.06}px ${fontFamily}`;
  ctx.fillStyle = style.titleColor;
  ctx.textAlign = 'center';
  
  const titleX = canvas.width * 0.3;  // 左侧区域居中
  const titleY = canvas.height * 0.1;
  ctx.fillText(title || "Our Love Story", titleX, titleY);
  
  // 如果有收件人名称，添加一个子标题
  if (recipientName) {
    ctx.font = `bold ${canvas.width * 0.04}px ${fontFamily}`;
    ctx.fillStyle = style.subtitleColor;
    ctx.fillText(`Featuring ${recipientName}`, titleX, titleY + canvas.height * 0.08);
  }

  // 加载并绘制图像（右侧）
  if (imageUrl) {
    try {
      // 下载图像
      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();
      const image = await loadImage(Buffer.from(imageBuffer));
      
      const imgHeight = canvas.height * 0.7;
      const imgWidth = (image.width / image.height) * imgHeight;
      const imgX = canvas.width * 0.6;
      const imgY = (canvas.height - imgHeight) / 2;
      
      ctx.drawImage(image, imgX, imgY, imgWidth, imgHeight);
    } catch (error) {
      console.error('Error loading intro image:', error);
      // 继续执行，只是没有图像
    }
  }

  // 绘制介绍文本
  if (text) {
    ctx.font = `${canvas.width * 0.02}px ${fontFamily}`;
    ctx.fillStyle = style.titleColor || '#333333';
    ctx.textAlign = 'left';
    
    // 分割文本为段落
    const paragraphs = text.split('\n\n');
    let textY = canvas.height * 0.2;
    
    for (const paragraph of paragraphs) {
      // 为每个段落应用文本换行
      const maxWidth = canvas.width * 0.45;  // 左侧区域宽度
      const lines = wrapText(ctx, paragraph, maxWidth);
      
      for (const line of lines) {
        ctx.fillText(line, canvas.width * 0.1, textY);
        textY += canvas.width * 0.025;
      }
      
      // 段落间距
      textY += canvas.width * 0.03;
    }
  }

  // 返回图像buffer
  return canvas.toBuffer('image/jpeg', { quality: 0.95 });
}

// 渲染内容页
async function renderContent(canvas, ctx, options) {
  const { style, fontFamily, text, imageUrl, pageNumber } = options;
  
  // 清除画布
  ctx.fillStyle = style.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 轻微纹理背景
  if (style.id === 'classic' || style.id === 'vintage') {
    drawTexturedBackground(ctx, canvas.width, canvas.height, style.background, 0.3);
  }
  
  // 决定图像和文本的布局（偶数页图像在左侧，奇数页图像在右侧）
  const isImageLeft = pageNumber % 2 === 0;
  
  // 加载并绘制图像
  if (imageUrl) {
    try {
      // 下载图像
      const response = await fetch(imageUrl);
      const imageBuffer = await response.arrayBuffer();
      const image = await loadImage(Buffer.from(imageBuffer));
      
      // 计算图像尺寸和位置
      const imgWidth = canvas.width * 0.5;
      const imgHeight = (image.height / image.width) * imgWidth;
      const imgX = isImageLeft ? 0 : canvas.width - imgWidth;
      const imgY = (canvas.height - imgHeight) / 2;
      
      ctx.drawImage(image, imgX, imgY, imgWidth, imgHeight);
      
      // 添加半透明覆盖层在文本区域
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(
        isImageLeft ? imgWidth : 0, 
        0, 
        canvas.width * 0.5, 
        canvas.height
      );
    } catch (error) {
      console.error('Error loading content image:', error);
      // 继续执行，只是没有图像
    }
  }

  // 绘制内容文本
  if (text) {
    ctx.font = `${canvas.width * 0.024}px ${fontFamily}`;
    ctx.fillStyle = style.titleColor || '#333333';
    ctx.textAlign = 'left';
    
    // 计算文本区域
    const textX = isImageLeft ? canvas.width * 0.55 : canvas.width * 0.05;
    let textY = canvas.height * 0.1;
    
    // 分割文本为段落
    const paragraphs = text.split('\n\n');
    
    for (const paragraph of paragraphs) {
      // 为每个段落应用文本换行
      const maxWidth = canvas.width * 0.4;
      const lines = wrapText(ctx, paragraph, maxWidth);
      
      for (const line of lines) {
        ctx.fillText(line, textX, textY);
        textY += canvas.width * 0.03;
      }
      
      // 段落间距
      textY += canvas.width * 0.04;
    }
    
    // 添加页码
    ctx.font = `${canvas.width * 0.018}px ${fontFamily}`;
    ctx.fillStyle = style.authorColor || '#888888';
    ctx.textAlign = 'center';
    ctx.fillText(`${pageNumber}`, canvas.width / 2, canvas.height * 0.95);
  }

  // 返回图像buffer
  return canvas.toBuffer('image/jpeg', { quality: 0.95 });
}

// 绘制纹理背景
function drawTexturedBackground(ctx, width, height, baseColor, textureOpacity) {
  // 绘制基础颜色
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);
  
  // 添加纹理效果
  ctx.save();
  ctx.globalAlpha = textureOpacity;
  
  // 随机噪点
  for (let i = 0; i < width * height / 1000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 1 + Math.random() * 2;
    
    ctx.fillStyle = `rgba(200, 200, 200, ${Math.random() * 0.1})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 纸张纹理线条
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.lineWidth = 1;
  
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const length = Math.random() * 30 + 10;
    const angle = Math.random() * Math.PI;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length
    );
    ctx.stroke();
  }
  
  ctx.restore();
}

// 绘制雪花
function drawSnowflakes(ctx, width, height) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  
  // 小雪花
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 2 + Math.random() * 4;
    
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 雪花结晶
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2;
  
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 20 + Math.random() * 30;
    
    // 绘制六个分支
    for (let j = 0; j < 6; j++) {
      const angle = (Math.PI / 3) * j;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(
        x + Math.cos(angle) * size,
        y + Math.sin(angle) * size
      );
      ctx.stroke();
      
      // 添加小分支
      const midX = x + Math.cos(angle) * (size * 0.5);
      const midY = y + Math.sin(angle) * (size * 0.5);
      
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(
        midX + Math.cos(angle + Math.PI/3) * (size * 0.3),
        midY + Math.sin(angle + Math.PI/3) * (size * 0.3)
      );
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(
        midX + Math.cos(angle - Math.PI/3) * (size * 0.3),
        midY + Math.sin(angle - Math.PI/3) * (size * 0.3)
      );
      ctx.stroke();
    }
  }
}

// 文本换行函数
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  
  lines.push(currentLine);
  return lines;
}
