
import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage } from '@/integrations/supabase/storage';

// 生成祝福语
export const generateBlessing = async (
  personName: string,
  authorName: string,
  tone: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-blessing', {
      body: {
        personName,
        authorName,
        tone,
        style: tone // 使用相同的值，因为我们的style就是tone
      }
    });

    if (error) throw error;
    if (!data?.blessing) {
      throw new Error("Failed to generate blessing text");
    }

    return data.blessing;
  } catch (error) {
    console.error("Error generating blessing:", error);
    throw error;
  }
};

// 将祝福语渲染成图片并上传到Supabase
export const renderBlessingToImage = async (blessing: string, tone: string): Promise<string> => {
  try {
    // 创建canvas元素
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }
    
    // 根据tone设置背景和文字颜色
    let backgroundColor = '#FFF5F5'; // 默认背景色
    let textColor = '#333333';       // 默认文字颜色
    let borderColor = '#FECACA';     // 默认边框颜色
    let fontFamily = 'Georgia, serif';
    
    if (tone === 'Heartfelt') {
      backgroundColor = '#FFF5F5'; // 柔和的粉色
      textColor = '#933A3A';       // 深红色
      borderColor = '#FECACA';    // 浅粉色边框
      fontFamily = 'Georgia, serif';
    } else if (tone === 'Playful') {
      backgroundColor = '#F0FFF4'; // 柔和的绿色
      textColor = '#276749';       // 森林绿
      borderColor = '#C6F6D5';    // 浅绿色边框
      fontFamily = 'Comic Sans MS, cursive, sans-serif';
    } else if (tone === 'Inspirational') {
      backgroundColor = '#EBF8FF'; // 柔和的蓝色
      textColor = '#2B6CB0';       // 深蓝色
      borderColor = '#BEE3F8';    // 浅蓝色边框
      fontFamily = 'Trebuchet MS, sans-serif';
    }
    
    // 填充背景
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制边框
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 20;
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
    
    // 绘制内边框
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 5;
    ctx.strokeRect(80, 80, canvas.width - 160, canvas.height - 160);
    
    // 添加装饰元素 - 角落装饰
    drawCornerDecoration(ctx, 80, 80, borderColor);
    drawCornerDecoration(ctx, canvas.width - 80, 80, borderColor, true, false);
    drawCornerDecoration(ctx, 80, canvas.height - 80, borderColor, false, true);
    drawCornerDecoration(ctx, canvas.width - 80, canvas.height - 80, borderColor, true, true);
    
    // 添加"献给"文字
    ctx.fillStyle = textColor;
    ctx.font = 'bold 48px ' + fontFamily;
    ctx.textAlign = 'center';
    ctx.fillText('献给', canvas.width / 2, 200);
    
    // 绘制祝福语文本
    ctx.font = '28px ' + fontFamily;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    
    // 文本换行处理
    const words = blessing.split(' ');
    const lines = [];
    let currentLine = words[0];
    
    const maxWidth = canvas.width - 240; // 留出边距
    
    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i];
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    
    // 绘制文本行
    let y = 300;
    const lineHeight = 45;
    
    for (const line of lines) {
      ctx.fillText(line, canvas.width / 2, y);
      y += lineHeight;
    }
    
    // 添加装饰性花纹
    drawHorizontalDecoration(ctx, canvas.width / 2, y + 50, borderColor);
    
    // 转换canvas为图片并上传
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    // 使用时间戳确保文件名唯一
    const timestamp = Date.now();
    const storageUrl = await uploadImageToStorage(
      imageData, 
      'images', 
      `love-story-blessing-${timestamp}`
    );
    
    return storageUrl;
  } catch (error) {
    console.error("Error rendering blessing to image:", error);
    throw error;
  }
};

// 绘制角落装饰
const drawCornerDecoration = (
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  color: string,
  flipHorizontal = false,
  flipVertical = false
) => {
  const size = 40;
  ctx.save();
  ctx.translate(x, y);
  if (flipHorizontal) ctx.scale(-1, 1);
  if (flipVertical) ctx.scale(1, -1);
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, size);
  
  // 添加弧线装饰
  ctx.moveTo(5, 5);
  ctx.bezierCurveTo(15, 5, 15, 25, 25, 25);
  
  ctx.stroke();
  ctx.restore();
};

// 绘制水平分隔装饰
const drawHorizontalDecoration = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
) => {
  const width = 400;
  
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  // 中央线
  ctx.beginPath();
  ctx.moveTo(-width/2, 0);
  ctx.lineTo(width/2, 0);
  ctx.stroke();
  
  // 装饰元素
  const decorSize = 15;
  for (let i = -2; i <= 2; i++) {
    const xPos = i * (width/5);
    
    ctx.beginPath();
    ctx.arc(xPos, 0, decorSize/2, 0, Math.PI * 2);
    ctx.stroke();
    
    if (i !== -2 && i !== 2) {
      ctx.beginPath();
      ctx.moveTo(xPos + decorSize, -decorSize);
      ctx.lineTo(xPos - decorSize, decorSize);
      ctx.moveTo(xPos - decorSize, -decorSize);
      ctx.lineTo(xPos + decorSize, decorSize);
      ctx.stroke();
    }
  }
  
  ctx.restore();
};

// 完整流程：生成祝福语、渲染并上传
export const generateAndRenderBlessing = async (
  personName: string,
  authorName: string,
  tone: string
): Promise<{blessing: string, imageUrl: string}> => {
  const blessing = await generateBlessing(personName, authorName, tone);
  const imageUrl = await renderBlessingToImage(blessing, tone);
  return { blessing, imageUrl };
};
