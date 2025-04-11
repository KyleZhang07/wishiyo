// 导入预定义的雪花图案

import { snowflakePatterns, drawSnowflake } from './snowflake-patterns';

interface SnowNightBackgroundProps {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  baseColor?: string;
  snowOpacity?: number;
}

/**
 * 在画布上绘制背景和雪花效果，使用预定义的真实雪花图案
 * 包含多种不同类型的雪花，从简单的六角形到复杂的晶体结构
 */
const drawSnowNightBackground = ({
  ctx,
  width,
  height,
  baseColor = '#0a1a3f', // 深蓝色基底
  snowOpacity = 0.9
}: SnowNightBackgroundProps) => {
  // 保存当前绘图状态
  ctx.save();

  // 只有当baseColor不是'transparent'时才绘制背景
  if (baseColor !== 'transparent') {
    // 绘制渐变蓝色背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#071536'); // 更深的蓝色
    gradient.addColorStop(0.3, '#102a58'); // 深蓝色
    gradient.addColorStop(0.7, '#1e3a6a'); // 中蓝色
    gradient.addColorStop(1, '#0a1a3f'); // 深蓝色

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

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
  }

  // 删除纹理代码，只保留雪花代码

  // 绘制不同大小的雪花
  ctx.fillStyle = `rgba(255, 255, 255, ${snowOpacity})`;

  // 小圆形雪花 - 作为背景点缀
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 1 + Math.random() * 2;

    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 中圆形雪花 - 作为背景点缀
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 3 + Math.random() * 3;

    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 绘制中等大小的圆形雪花 - 减少数量从80到50个
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 4 + Math.random() * 4; // 中等大小的圆形

    // 绘制圆形雪花
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    // 添加微妙的光晕效果
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(x - size/4, y - size/4, size/3, 0, Math.PI * 2);
    ctx.fill();

    // 重置填充颜色
    ctx.fillStyle = `rgba(255, 255, 255, ${snowOpacity})`;
  }

  // 使用预定义的雪花图案绘制大小雪花 - 调整数量到18个
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 15 + Math.random() * 10; // 更大的雪花
    const patternIndex = Math.floor(Math.random() * snowflakePatterns.length);
    const pattern = snowflakePatterns[patternIndex];

    // 绘制大雪花
    drawSnowflake(
      ctx,
      x,
      y,
      size,
      pattern,
      `rgba(255, 255, 255, ${snowOpacity})`,
      3 // 更粗的线条
    );

    // 绘制中心圆
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.beginPath();
    ctx.arc(x, y, size / 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 恢复绘图状态
  ctx.restore();
};

export default drawSnowNightBackground;
