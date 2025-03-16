import React from 'react';

interface TexturedBackgroundProps {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  baseColor?: string;
  textureOpacity?: number;
}

/**
 * 在画布上绘制米白色斑驳纹理背景
 */
const drawTexturedBackground = ({
  ctx,
  width,
  height,
  baseColor = '#f5f5f0',
  textureOpacity = 0.7  // 增加默认透明度
}: TexturedBackgroundProps) => {
  // 绘制基础背景色
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);
  
  // 保存当前绘图状态
  ctx.save();
  
  // 绘制大型浅色区域 - 增加数量和对比度
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 150 + Math.random() * 250;
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 绘制中型斑点 - 增加数量和对比度
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 30 + Math.random() * 90;
    
    // 创建径向渐变
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 添加深色的微妙纹理线条
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 50; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = x1 + (Math.random() * 150 - 75);
    const y2 = y1 + (Math.random() * 150 - 75);
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  
  // 添加一些微小的噪点 - 增强对比度
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 1 + Math.random() * 2;
    
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.07})`;
    ctx.fillRect(x, y, size, size);
  }
  
  // 添加一些轻微的色彩变化斑点
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 2 + Math.random() * 8;
    
    const hue = 30 + Math.random() * 20; // 淡黄色到米色范围
    const saturation = 10 + Math.random() * 15;
    const lightness = 90 + Math.random() * 10;
    
    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.15)`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 恢复绘图状态
  ctx.restore();
};

export default drawTexturedBackground;
