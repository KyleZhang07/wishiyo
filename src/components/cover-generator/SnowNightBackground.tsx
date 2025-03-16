import React from 'react';

interface SnowNightBackgroundProps {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  baseColor?: string;
  snowOpacity?: number;
}

/**
 * 在画布上绘制深蓝色线条纹理背景和雪花
 */
const drawSnowNightBackground = ({
  ctx,
  width,
  height,
  baseColor = '#0a1a3f', // 深蓝色基底
  snowOpacity = 0.9
}: SnowNightBackgroundProps) => {
  // 绘制渐变蓝色背景
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#071536'); // 更深的蓝色
  gradient.addColorStop(0.3, '#102a58'); // 深蓝色
  gradient.addColorStop(0.7, '#1e3a6a'); // 中蓝色
  gradient.addColorStop(1, '#0a1a3f'); // 深蓝色
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // 保存当前绘图状态
  ctx.save();
  
  // 先添加一层微妙的水彩纹理
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 100 + Math.random() * 200;
    
    // 使用不同的蓝色色调
    const blueHue = 210 + Math.random() * 30;
    const blueSaturation = 50 + Math.random() * 30;
    const blueLightness = 20 + Math.random() * 20;
    const opacity = 0.05 + Math.random() * 0.15;
    
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `hsla(${blueHue}, ${blueSaturation}%, ${blueLightness}%, ${opacity})`);
    gradient.addColorStop(1, `hsla(${blueHue}, ${blueSaturation}%, ${blueLightness}%, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 绘制主要油画曲线纹理，模拟水彩画效果
  ctx.lineWidth = 15;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // 绘制8-12条主要曲线
  const numCurves = 8 + Math.floor(Math.random() * 5);
  
  // 第一轮：绘制较粗的底层曲线
  for (let i = 0; i < numCurves; i++) {
    // 使用不同的蓝色色调
    const blueHue = 210 + Math.random() * 30; // 蓝色色调范围
    const blueSaturation = 60 + Math.random() * 20; // 饱和度
    const blueLightness = 20 + Math.random() * 15; // 亮度
    const opacity = 0.3 + Math.random() * 0.4; // 透明度
    
    ctx.strokeStyle = `hsla(${blueHue}, ${blueSaturation}%, ${blueLightness}%, ${opacity})`;
    ctx.lineWidth = 25 + Math.random() * 20;
    
    // 曲线的起点和终点
    const startY = (i * height / numCurves) + Math.random() * (height / numCurves / 2);
    const endY = startY + Math.random() * 60 - 30;
    
    // 控制点，使曲线有波浪感
    const cp1x = width * 0.25 + Math.random() * (width * 0.2) - width * 0.1;
    const cp1y = startY + Math.random() * 120 - 60;
    const cp2x = width * 0.75 + Math.random() * (width * 0.2) - width * 0.1;
    const cp2y = endY + Math.random() * 120 - 60;
    
    // 绘制贝塞尔曲线
    ctx.beginPath();
    ctx.moveTo(0, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, width, endY);
    ctx.stroke();
  }
  
  // 第二轮：绘制中等粗细的曲线，形成层次感
  for (let i = 0; i < numCurves + 2; i++) {
    const blueHue = 215 + Math.random() * 30;
    const blueSaturation = 70 + Math.random() * 15;
    const blueLightness = 25 + Math.random() * 20;
    const opacity = 0.2 + Math.random() * 0.4;
    
    ctx.strokeStyle = `hsla(${blueHue}, ${blueSaturation}%, ${blueLightness}%, ${opacity})`;
    ctx.lineWidth = 10 + Math.random() * 15;
    
    const startY = Math.random() * height;
    const endY = startY + Math.random() * 100 - 50;
    
    const cp1x = width * 0.2 + Math.random() * (width * 0.2);
    const cp1y = startY + Math.random() * 150 - 75;
    const cp2x = width * 0.6 + Math.random() * (width * 0.3);
    const cp2y = endY + Math.random() * 150 - 75;
    
    ctx.beginPath();
    ctx.moveTo(0, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, width, endY);
    ctx.stroke();
  }
  
  // 第三轮：绘制较细的曲线，增加纹理细节
  for (let i = 0; i < numCurves + 5; i++) {
    const blueHue = 200 + Math.random() * 40;
    const blueSaturation = 50 + Math.random() * 30;
    const blueLightness = 30 + Math.random() * 25;
    const opacity = 0.15 + Math.random() * 0.3;
    
    ctx.strokeStyle = `hsla(${blueHue}, ${blueSaturation}%, ${blueLightness}%, ${opacity})`;
    ctx.lineWidth = 3 + Math.random() * 7;
    
    const startY = Math.random() * height;
    const endY = startY + Math.random() * 80 - 40;
    
    const cp1x = width * 0.3 + Math.random() * (width * 0.4) - width * 0.2;
    const cp1y = startY + Math.random() * 100 - 50;
    const cp2x = width * 0.7 + Math.random() * (width * 0.4) - width * 0.2;
    const cp2y = endY + Math.random() * 100 - 50;
    
    ctx.beginPath();
    ctx.moveTo(0, startY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, width, endY);
    ctx.stroke();
  }
  
  // 添加水彩边缘效果
  for (let i = 0; i < 20; i++) {
    const y = Math.random() * height;
    const length = 50 + Math.random() * 150;
    const thickness = 5 + Math.random() * 15;
    
    const blueHue = 210 + Math.random() * 30;
    const blueSaturation = 60 + Math.random() * 20;
    const blueLightness = 25 + Math.random() * 20;
    const opacity = 0.1 + Math.random() * 0.2;
    
    // 随机选择从左边或右边开始
    const fromLeft = Math.random() > 0.5;
    const startX = fromLeft ? 0 : width - length;
    
    ctx.fillStyle = `hsla(${blueHue}, ${blueSaturation}%, ${blueLightness}%, ${opacity})`;
    
    // 创建不规则形状模拟水彩边缘
    ctx.beginPath();
    ctx.moveTo(startX, y);
    ctx.lineTo(startX + length, y + (Math.random() * thickness * 2 - thickness));
    ctx.lineTo(startX + length, y + thickness);
    ctx.lineTo(startX, y + (Math.random() * thickness * 2 - thickness));
    ctx.closePath();
    ctx.fill();
  }
  
  // 添加微妙的颗粒纹理，模拟水彩纸效果
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 1.5;
    const opacity = Math.random() * 0.1;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
    ctx.fillRect(x, y, size, size);
  }
  
  // 绘制不同大小的雪花
  ctx.fillStyle = `rgba(255, 255, 255, ${snowOpacity})`;
  
  // 小雪花
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 1 + Math.random() * 2;
    
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 中雪花
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 3 + Math.random() * 3;
    
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 大雪花
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 5 + Math.random() * 4;
    
    // 为大雪花添加发光效果
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    glowGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // 雪花中心
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 恢复绘图状态
  ctx.restore();
};

export default drawSnowNightBackground;
