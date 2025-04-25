import { supabase } from '@/integrations/supabase/client';
import { uploadImageToStorage, deleteImageFromStorage } from '@/integrations/supabase/storage';

// 获取字体样式
export const getFontFamily = (fontName: string): string => {
  const fontMap: Record<string, string> = {
    // 基本字体
    'playfair': 'Playfair Display, serif',
    'montserrat': 'Montserrat, sans-serif',
    'didot': 'Didot, serif',
    'georgia': 'Georgia, serif',
    'default': 'Georgia, serif',

    // 插画书字体
    'comic-sans': "'Comic Sans MS', cursive",
    'patrick-hand': "'Patrick Hand', cursive",
    'amatic-sc': "'Amatic SC', cursive",
    'caveat': "'Caveat', cursive"
  };

  return fontMap[fontName] || fontMap['default'];
};

// 渲染内容图片到Canvas
export const renderContentToCanvas = (
  contentImage: string,
  contentText: string,
  index: number,
  style: string = 'modern',
  fontId: string = 'comic-sans'
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
          // 使用传入的字体ID获取字体
          const fontFamily = getFontFamily(fontId);

          // 根据字体类型调整字体大小
          let adjustedFontSize = fontSize;
          if (fontId === 'patrick-hand' || fontId === 'amatic-sc' || fontId === 'caveat') {
            // 增大Patrick Hand、Amatic SC和Caveat字体的渲染字号
            adjustedFontSize = fontSize + 1;
          }

          ctx.font = `bold ${adjustedFontSize}px ${fontFamily}`;

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
              const fontFamily = getFontFamily(fontId);

              // 根据字体类型调整字体大小
              let adjustedFontSize = fontSize;
              if (fontId === 'patrick-hand' || fontId === 'amatic-sc' || fontId === 'caveat') {
                // 增大Patrick Hand、Amatic SC和Caveat字体的渲染字号
                adjustedFontSize = fontSize + 1;
              }

              ctx.font = `bold ${adjustedFontSize}px ${fontFamily}`;
              const metrics = ctx.measureText(testLine);
              const testWidth = metrics.width;

              if (testWidth > maxWidth && n > 0) {
                // 使用相同的字体大小调整逻辑
                let adjustedFontSize = fontSize;
                if (fontId === 'patrick-hand' || fontId === 'amatic-sc' || fontId === 'caveat') {
                  adjustedFontSize = fontSize + 1;
                }

                drawStrokedText(line, x, lineY, adjustedFontSize);
                line = words[n] + ' ';
                lineY += lineHeight;
              } else {
                line = testLine;
              }
            }

            if (line) {
              // 使用相同的字体大小调整逻辑
              let adjustedFontSize = fontSize;
              if (fontId === 'patrick-hand' || fontId === 'amatic-sc' || fontId === 'caveat') {
                adjustedFontSize = fontSize + 1;
              }

              drawStrokedText(line, x, lineY, adjustedFontSize);
              lineY += lineHeight * 2; // 增加句子之间的间距，添加空行效果
            }
          }
        };

        // 绘制内容文本 - 只在图片左侧50%区域
        const textFontSize = canvas.width * 0.021; // 基础字体大小
        const textX = canvas.width * 0.07; // 左侧边距 - 与参考图像匹配
        const textY = canvas.height * 0.18; // 降低文字起始位置，使其更靠近上边缘
        const maxWidth = canvas.width * 0.36; // 限制文本宽度在左侧区域内

        // 设置文本对齐为左对齐
        ctx.textAlign = 'left';

        // 根据字体类型调整行高
        let lineHeight = textFontSize * 1.2; // 默认行高
        if (fontId === 'patrick-hand' || fontId === 'amatic-sc' || fontId === 'caveat') {
          // 为增大的字体调整行高
          lineHeight = textFontSize * 1.3;
        }

        // 绘制文本
        wrapText(
          contentText || "A beautiful moment captured in this image.",
          textX,
          textY,
          maxWidth,
          lineHeight, // 使用调整后的行高
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
  supabaseImages: any[] = [],
  fontId: string = 'comic-sans'
): Promise<{
  leftImageUrl: string,
  rightImageUrl: string
}> => {
  try {
    // 渲染图片到Canvas
    const renderedImage = await renderContentToCanvas(contentImage, contentText, index, style, fontId);

    // 裁剪图片并上传
    console.log(`Splitting content image ${index} into two parts...`);
    const { leftUrl, rightUrl } = await splitImageAndUpload(
      renderedImage,
      `content-${index}`,
      supabaseImages
    );

    return {
      leftImageUrl: leftUrl,
      rightImageUrl: rightUrl
    };
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
  supabaseImages: any[] = [],
  fontId: string = 'comic-sans'
): Promise<{
  leftImageUrl: string,
  rightImageUrl: string
}> => {
  try {
    // 渲染图片到Canvas
    const renderedImage = await renderContentToCanvas(introImage, introText, 0, style, fontId);

    // 裁剪图片并上传
    console.log('Splitting intro image into two parts...');
    const { leftUrl, rightUrl } = await splitImageAndUpload(
      renderedImage,
      'intro',
      supabaseImages
    );

    return {
      leftImageUrl: leftUrl,
      rightImageUrl: rightUrl
    };
  } catch (error) {
    console.error('Error rendering and uploading intro image:', error);
    throw error;
  }
};

// 渲染祝福语到Canvas
export const renderBlessingToCanvas = (
  blessingText: string,
  authorName: string,
  recipientName: string,
  textTone: string = 'Heartfelt'
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // 创建Canvas元素
      const canvas = document.createElement('canvas');
      canvas.width = 2400;  // 宽度
      canvas.height = 2400; // 高度 - 正方形比例
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // 样式定义 - 统一使用简洁样式，类似参考图片
      let textColor, mainFont;

      // 根据不同的语调只调整文本颜色和字体，背景保持纯白
      if (textTone === 'Heartfelt') {
        textColor = '#333333';  // 深灰色文本
        mainFont = 'Palatino, serif';
      } else if (textTone === 'Playful') {
        textColor = '#333333';  // 深灰色文本
        mainFont = 'Palatino, serif';
      } else if (textTone === 'Inspirational') {
        textColor = '#333333';  // 深灰色文本
        mainFont = 'Palatino, serif';
      } else {
        // 默认风格
        textColor = '#333333';  // 深灰色文本
        mainFont = 'Times New Roman, serif';
      }

      // 填充纯白色背景
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 生成适合每种风格的祝福语
      let blessing = blessingText;

      // 如果没有提供祝福语，则根据风格生成
      if (!blessing || blessing.trim() === '') {
        if (textTone === 'Heartfelt') {
          blessing = `Dear ${recipientName},\n\nIn the quiet moments of reflection, I find my heart filled with gratitude for the beautiful journey we've shared. Each memory we've created together is a treasure I hold dear.\n\nWith all my love,\n${authorName}`;
        } else if (textTone === 'Playful') {
          blessing = `Hey ${recipientName}!\n\nGuess what? You're absolutely amazing! Every adventure with you turns into an epic story, and I can't wait to see what fun we'll have next! Here's to more laughter and silly moments!\n\nCheers,\n${authorName}`;
        } else if (textTone === 'Inspirational') {
          blessing = `To ${recipientName},\n\nMay your path be filled with light, your heart with courage, and your spirit with joy. Remember that you have the strength to overcome any challenge life presents.\n\nBelieving in you always,\n${authorName}`;
        } else {
          blessing = `Dear ${recipientName},\n\nSending you warm wishes and fond memories. May this book remind you of all the special moments we've shared.\n\nWith affection,\n${authorName}`;
        }
      }

      // 绘制祝福语文本 - 使用更小的字号
      ctx.fillStyle = textColor;

      // 设置较小的字体大小，类似参考图片
      const bodyFontSize = canvas.width * 0.025; // 减小字体大小
      const signatureFontSize = canvas.width * 0.025; // 保持签名与正文字体一致

      // 绘制主体文本 - 自动换行
      ctx.font = `${bodyFontSize}px ${mainFont}`;
      ctx.textAlign = 'center'; // 居中对齐所有文本

      // 分割文本行
      const lines = blessing.split('\n');
      let y = canvas.height * 0.4; // 将文本垂直位置调整到画布中间位置

      // 处理文本换行
      lines.forEach(line => {
        if (line.trim() === '') {
          // 空行，增加更多距离
          y += bodyFontSize * 2.5; // 增加空行间距从1.2到2.5
          return;
        }

        // 文本自动换行
        const words = line.split(' ');
        let currentLine = '';
        const maxWidth = canvas.width * 0.6; // 控制文本宽度，留出足够边距

        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const testLine = currentLine + (currentLine ? ' ' : '') + word;
          const metrics = ctx.measureText(testLine);

          if (metrics.width > maxWidth && currentLine) {
            // 如果这行太长，绘制当前行并开始新行
            ctx.fillText(currentLine, canvas.width / 2, y); // 居中绘制
            currentLine = word;
            y += bodyFontSize * 1.5;
          } else {
            currentLine = testLine;
          }
        }

        // 绘制最后一行
        if (currentLine) {
          ctx.fillText(currentLine, canvas.width / 2, y); // 居中绘制
          y += bodyFontSize * 2.2; // 增加行距从1.8到2.2
        }
      });

      // 转换为图像数据
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      resolve(imageData);
    } catch (error) {
      reject(error);
    }
  });
};

// 渲染并上传祝福语图片
export const renderAndUploadBlessingImage = async (
  blessingText: string,
  authorName: string,
  recipientName: string,
  textTone: string = 'Heartfelt',
  supabaseImages: any[] = []
): Promise<string> => {
  try {
    // 渲染图片到Canvas
    const renderedImage = await renderBlessingToCanvas(blessingText, authorName, recipientName, textTone);

    // 使用时间戳确保文件名唯一
    const timestamp = Date.now();

    // 文件名格式
    const fileName = `blessing-${timestamp}`;

    // 上传到Supabase Storage
    const storageUrl = await uploadImageToStorage(
      renderedImage,
      'images',
      fileName
    );

    // 删除之前生成的blessing图片
    try {
      // 查找所有包含"blessing-"的图片
      const oldRenderedImages = supabaseImages.filter(img =>
        img.name.includes('blessing-') &&
        !img.name.includes(fileName)
      );

      if (oldRenderedImages.length > 0) {
        console.log(`Found ${oldRenderedImages.length} old blessing images to delete`);

        // 并行删除所有旧图片
        const deletePromises = oldRenderedImages.map(img => {
          // 从完整路径中提取文件名
          const pathParts = img.name.split('/');
          const filename = pathParts[pathParts.length - 1];
          console.log(`Deleting old blessing image: ${filename}`);
          return deleteImageFromStorage(filename, 'images');
        });

        // 等待所有删除操作完成
        await Promise.all(deletePromises);
        console.log('Successfully deleted old blessing images');
      }
    } catch (deleteError) {
      console.error('Error deleting old blessing images:', deleteError);
      // 继续处理，即使删除失败
    }

    return storageUrl;
  } catch (error) {
    console.error('Error rendering and uploading blessing image:', error);
    throw error;
  }
};

// 将图片沿中线垂直裁剪为两部分，并分别上传
export const splitImageAndUpload = async (
  imageData: string,
  baseFileName: string,
  supabaseImages: any[] = []
): Promise<{leftUrl: string, rightUrl: string}> => {
  try {
    // 创建一个新的图像对象来加载原始图像
    const img = new Image();
    img.crossOrigin = 'anonymous';

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          // 创建左侧画布
          const leftCanvas = document.createElement('canvas');
          leftCanvas.width = img.width / 2;  // 图片的左半部分
          leftCanvas.height = img.height;
          const leftCtx = leftCanvas.getContext('2d');

          // 创建右侧画布
          const rightCanvas = document.createElement('canvas');
          rightCanvas.width = img.width / 2;  // 图片的右半部分
          rightCanvas.height = img.height;
          const rightCtx = rightCanvas.getContext('2d');

          if (!leftCtx || !rightCtx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // 在左侧画布上绘制图像的左半部分
          leftCtx.drawImage(
            img,                  // 源图像
            0, 0,                 // 源图像起始点(左上角)
            img.width / 2, img.height, // 源图像的宽高(取左半部分)
            0, 0,                 // 目标画布的起始点
            leftCanvas.width, leftCanvas.height  // 目标画布的尺寸
          );

          // 在右侧画布上绘制图像的右半部分
          rightCtx.drawImage(
            img,                  // 源图像
            img.width / 2, 0,     // 源图像起始点(中线左上角)
            img.width / 2, img.height, // 源图像的宽高(取右半部分)
            0, 0,                 // 目标画布的起始点
            rightCanvas.width, rightCanvas.height  // 目标画布的尺寸
          );

          // 转换为图像数据 - 使用最高质量1.0确保无损
          const leftImageData = leftCanvas.toDataURL('image/jpeg', 1.0);
          const rightImageData = rightCanvas.toDataURL('image/jpeg', 1.0);

          // 使用时间戳确保文件名唯一
          const timestamp = Date.now();

          // 为左右两部分分别创建文件名
          const leftFileName = `${baseFileName}-1-${timestamp}`;
          const rightFileName = `${baseFileName}-2-${timestamp}`;

          // 上传到Supabase Storage
          const leftStorageUrl = await uploadImageToStorage(
            leftImageData,
            'images',
            leftFileName
          );

          const rightStorageUrl = await uploadImageToStorage(
            rightImageData,
            'images',
            rightFileName
          );

          // 删除之前生成的切分图片
          try {
            // 查找所有包含基本文件名并后缀为-1或-2的图片
            const oldSplitImages = supabaseImages.filter(img =>
              (img.name.includes(`${baseFileName}-1-`) || img.name.includes(`${baseFileName}-2-`)) &&
              !img.name.includes(leftFileName) &&
              !img.name.includes(rightFileName)
            );

            if (oldSplitImages.length > 0) {
              console.log(`Found ${oldSplitImages.length} old split images to delete for ${baseFileName}`);

              // 并行删除所有旧图片
              const deletePromises = oldSplitImages.map(img => {
                // 从完整路径中提取文件名
                const pathParts = img.name.split('/');
                const filename = pathParts[pathParts.length - 1];
                console.log(`Deleting old split image: ${filename}`);
                return deleteImageFromStorage(filename, 'images');
              });

              // 等待所有删除操作完成
              await Promise.all(deletePromises);
              console.log(`Successfully deleted old split images for ${baseFileName}`);
            }
          } catch (deleteError) {
            console.error(`Error deleting old split images for ${baseFileName}:`, deleteError);
            // 继续处理，即使删除失败
          }

          resolve({
            leftUrl: leftStorageUrl,
            rightUrl: rightStorageUrl
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for splitting'));
      };

      img.src = imageData;
    });
  } catch (error) {
    console.error('Error splitting and uploading image:', error);
    throw error;
  }
};

// 渲染结束页面到Canvas
export const renderEndingToCanvas = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // 创建Canvas元素 - 与blessing页面保持相同尺寸
      const canvas = document.createElement('canvas');
      canvas.width = 2400;  // 宽度
      canvas.height = 2400; // 高度 - 正方形比例
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // 填充纯白色背景
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 设置文本样式
      ctx.fillStyle = '#333333'; // 深灰色文本
      const mainFont = 'Georgia, serif';

      // 设置字体大小
      const titleFontSize = canvas.width * 0.03;
      const bodyFontSize = canvas.width * 0.02;

      // 绘制标题
      ctx.font = `bold ${titleFontSize}px ${mainFont}`;
      ctx.textAlign = 'center';
      ctx.fillText('WISHIYO', canvas.width / 2, canvas.height * 0.4);

      // 绘制版权信息
      ctx.font = `${bodyFontSize}px ${mainFont}`;

      const currentYear = new Date().getFullYear();
      const copyrightText = ` ${currentYear} Wishiyo. All rights reserved.`;
      ctx.fillText(copyrightText, canvas.width / 2, canvas.height * 0.47);

      // 添加额外信息
      const infoLines = [
        'This book was created with love using Wishiyo.',
        'No part of this publication may be reproduced, distributed, or',
        'transmitted in any form or by any means without prior written permission.',
        '',
        'Printed in the United States of America',
        '',
        'www.wishiyo.com'
      ];

      let y = canvas.height * 0.53;
      infoLines.forEach(line => {
        ctx.fillText(line, canvas.width / 2, y);
        y += bodyFontSize * 1.5;
      });

      // 转换为图像数据
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      resolve(imageData);
    } catch (error) {
      reject(error);
    }
  });
};

// 渲染并上传结束页面图片
export const renderAndUploadEndingImage = async (
  supabaseImages: any[] = []
): Promise<string> => {
  try {
    // 渲染结束页面
    const imageData = await renderEndingToCanvas();

    // 生成唯一文件名
    const timestamp = new Date().getTime();
    const fileName = `ending-page-${timestamp}`;

    // 检查是否有现有图片需要删除
    const existingImage = supabaseImages.find(img => img.name.startsWith('ending-page-'));
    if (existingImage) {
      await deleteImageFromStorage(existingImage.name, 'images');
    }

    // 上传到Supabase Storage
    const publicUrl = await uploadImageToStorage(
      imageData,
      'images',
      fileName
    );

    if (!publicUrl) {
      throw new Error('Failed to upload ending image: No public URL returned');
    }

    return publicUrl;
  } catch (error) {
    console.error('Error in renderAndUploadEndingImage:', error);
    throw error;
  }
};