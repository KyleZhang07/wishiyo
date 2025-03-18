import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage, deleteImageFromStorage } from '@/integrations/supabase/storage';

// 获取字体样式
export const getFontFamily = (fontName: string): string => {
  const fontMap: Record<string, string> = {
    'playfair': 'Playfair Display, serif',
    'montserrat': 'Montserrat, sans-serif',
    'didot': 'Didot, serif',
    'comic-sans': 'Comic Sans MS, cursive',
    'georgia': 'Georgia, serif',
    'default': 'Georgia, serif'
  };
  
  return fontMap[fontName] || fontMap['default'];
};

// 渲染内容图片到Canvas
export const renderContentToCanvas = (
  contentImage: string,
  contentText: string,
  index: number,
  style: string = 'modern'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // 创建Canvas元素
      const canvas = document.createElement('canvas');
      canvas.width = 4800;  // 宽度
      canvas.height = 2400; // 高度
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // 样式定义
      const styleConfig = {
        modern: {
          background: '#e8f4f8',
          textColor: '#FFFFFF',
          font: 'montserrat'
        },
        playful: {
          background: '#f0f9e8',
          textColor: '#FFFFFF',
          font: 'comic-sans'
        },
        elegant: {
          background: '#f9f3f0',
          textColor: '#FFFFFF',
          font: 'didot'
        },
        classic: {
          background: '#f5f5f0',
          textColor: '#FFFFFF',
          font: 'playfair'
        },
        vintage: {
          background: '#f5e8d0',
          textColor: '#FFFFFF',
          font: 'georgia'
        }
      };
      
      // 获取当前样式
      const currentStyle = styleConfig[style as keyof typeof styleConfig] || styleConfig.modern;
      
      // 加载图片
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // 填充背景
        ctx.fillStyle = currentStyle.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 计算图像尺寸，保持比例并填满整个画布
        const imgRatio = img.width / img.height;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;
        
        // 调整图像尺寸以覆盖整个画布，同时保持比例
        if (imgRatio > canvas.width / canvas.height) {
          // 图片较宽，以高度为基准
          drawHeight = canvas.height;
          drawWidth = drawHeight * imgRatio;
        } else {
          // 图片较高，以宽度为基准
          drawWidth = canvas.width;
          drawHeight = drawWidth / imgRatio;
        }
        
        // 计算居中位置
        const x = (canvas.width - drawWidth) / 2;
        const y = (canvas.height - drawHeight) / 2;
        
        // 绘制图像
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
        
        // 文本渲染函数 - 带有描边和阴影以确保可读性
        const drawStrokedText = (text: string, x: number, y: number, fontSize: number) => {
          // 使用Playfair Display字体，与参考图像匹配
          ctx.font = `bold ${fontSize}px Playfair Display, serif`;
          
          // 增强阴影效果以提高可读性 - 使阴影更加明显
          ctx.shadowOffsetX = 4;
          ctx.shadowOffsetY = 4;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          
          // 多层描边，确保文字在任何背景上都清晰可见
          // 第一层外描边 - 较宽的黑色描边
          ctx.lineWidth = 7;
          ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
          ctx.strokeText(text, x, y);
          
          // 第二层描边 - 中等宽度的深灰色描边
          ctx.lineWidth = 5;
          ctx.strokeStyle = 'rgba(20, 20, 20, 0.9)';
          ctx.strokeText(text, x, y);
          
          // 再绘制文字内容
          ctx.fillStyle = '#FFFFFF'; // 纯白色文字
          ctx.fillText(text, x, y);
        };
        
        // 文本换行函数，保持段落结构
        const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number, fontSize: number) => {
          // 按句子分割文本 (句号、问号、感叹号后跟空格，或者在句末)
          const sentences = text.match(/[^.!?]+[.!?]+\s*|\s*[^.!?]+[.!?]+$|\s*[^.!?]+$/g) || [text];
          let lineY = y;
          
          for (let i = 0; i < sentences.length; i++) {
            let sentence = sentences[i].trim();
            if (!sentence) continue;
            
            const words = sentence.split(' ');
            let line = '';
            
            for (let n = 0; n < words.length; n++) {
              const testLine = line + words[n] + ' ';
              ctx.font = `bold ${fontSize}px Playfair Display, serif`;
              const metrics = ctx.measureText(testLine);
              const testWidth = metrics.width;
              
              if (testWidth > maxWidth && n > 0) {
                drawStrokedText(line, x, lineY, fontSize);
                line = words[n] + ' ';
                lineY += lineHeight;
              } else {
                line = testLine;
              }
            }
            
            if (line) {
              drawStrokedText(line, x, lineY, fontSize);
              lineY += lineHeight * 2; // 增加句子之间的间距，添加空行效果
            }
          }
        };
        
        // 绘制内容文本 - 只在图片左侧50%区域
        const textFontSize = canvas.width * 0.021; // 减小字体大小
        const textX = canvas.width * 0.07; // 左侧边距 - 与参考图像匹配
        const textY = canvas.height * 0.18; // 降低文字起始位置，使其更靠近上边缘
        const maxWidth = canvas.width * 0.36; // 限制文本宽度在左侧区域内
        
        // 设置文本对齐为左对齐
        ctx.textAlign = 'left';
        
        // 绘制文本
        wrapText(
          contentText || "A beautiful moment captured in this image.",
          textX,
          textY,
          maxWidth,
          textFontSize * 1.2, // 根据参考图像调整行距
          textFontSize
        );
        
        // 转换为图像数据
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        resolve(imageData);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load content image'));
      };
      
      img.src = contentImage;
    } catch (error) {
      reject(error);
    }
  });
};

// 上传渲染后的内容图片到Supabase
export const renderAndUploadContentImage = async (
  contentImage: string,
  contentText: string,
  index: number,
  style: string = 'modern',
  supabaseImages: any[] = []
): Promise<string> => {
  try {
    // 渲染图片到Canvas
    const renderedImage = await renderContentToCanvas(contentImage, contentText, index, style);
    
    // 使用时间戳确保文件名唯一
    const timestamp = Date.now();
    
    // 修改文件名为content
    const fileName = `content-${index}-${timestamp}`;
    
    // 上传到Supabase Storage
    const storageUrl = await uploadImageToStorage(
      renderedImage,
      'images',
      fileName
    );
    
    // 删除之前生成的rendered图片
    try {
      // 查找所有包含"content-rendered"或"content"的图片
      const oldRenderedImages = supabaseImages.filter(img => 
        // 只删除content-${index}-开头的渲染图片，不删除love-story-content开头的原始图片
        img.name.includes(`content-${index}-`) && 
        !img.name.includes(fileName)
      );
      
      if (oldRenderedImages.length > 0) {
        console.log(`Found ${oldRenderedImages.length} old rendered images to delete for content ${index}`);
        
        // 并行删除所有旧图片
        const deletePromises = oldRenderedImages.map(img => {
          // 从完整路径中提取文件名
          const pathParts = img.name.split('/');
          const filename = pathParts[pathParts.length - 1];
          console.log(`Deleting old rendered image: ${filename}`);
          return deleteImageFromStorage(filename, 'images');
        });
        
        // 等待所有删除操作完成
        await Promise.all(deletePromises);
        console.log(`Successfully deleted old rendered images for content ${index}`);
      }
    } catch (deleteError) {
      console.error(`Error deleting old rendered images for content ${index}:`, deleteError);
      // 继续处理，即使删除失败
    }
    
    return storageUrl;
  } catch (error) {
    console.error('Error rendering and uploading content image:', error);
    throw error;
  }
};

// 渲染并上传介绍图片
export const renderAndUploadIntroImage = async (
  introImage: string,
  introText: string,
  style: string = 'modern',
  supabaseImages: any[] = []
): Promise<string> => {
  try {
    // 渲染图片到Canvas
    const renderedImage = await renderContentToCanvas(introImage, introText, 0, style);
    
    // 使用时间戳确保文件名唯一
    const timestamp = Date.now();
    
    // 修改文件名为intro
    const fileName = `intro-${timestamp}`;
    
    // 上传到Supabase Storage
    const storageUrl = await uploadImageToStorage(
      renderedImage,
      'images',
      fileName
    );
    
    // 删除之前生成的rendered图片
    try {
      // 查找所有包含"intro-"或"love-story-intro-rendered"的图片
      const oldRenderedImages = supabaseImages.filter(img => 
        // 只删除intro-开头的渲染图片，不删除love-story-intro开头的原始图片
        img.name.includes('intro-') && 
        !img.name.includes(fileName)
      );
      
      if (oldRenderedImages.length > 0) {
        console.log(`Found ${oldRenderedImages.length} old rendered intro images to delete`);
        
        // 并行删除所有旧图片
        const deletePromises = oldRenderedImages.map(img => {
          // 从完整路径中提取文件名
          const pathParts = img.name.split('/');
          const filename = pathParts[pathParts.length - 1];
          console.log(`Deleting old rendered intro image: ${filename}`);
          return deleteImageFromStorage(filename, 'images');
        });
        
        // 等待所有删除操作完成
        await Promise.all(deletePromises);
        console.log('Successfully deleted old rendered intro images');
      }
    } catch (deleteError) {
      console.error('Error deleting old rendered intro images:', deleteError);
      // 继续处理，即使删除失败
    }
    
    return storageUrl;
  } catch (error) {
    console.error('Error rendering and uploading intro image:', error);
    throw error;
  }
}; 