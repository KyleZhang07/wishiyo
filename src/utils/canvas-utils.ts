/**
 * 工具函数，用于处理 Canvas 相关操作
 */

/**
 * 获取 Canvas 的数据 URL
 * @param canvas Canvas 元素
 * @param format 图像格式，默认为 'image/png'
 * @param quality 图像质量，默认为 1.0（最高质量）
 * @returns Canvas 的数据 URL
 */
export const getCanvasDataURL = (
  canvas: HTMLCanvasElement,
  format: string = 'image/png',
  quality: number = 1.0
): string => {
  return canvas.toDataURL(format, quality);
};

/**
 * 从 DOM 中获取 Canvas 元素
 * @param selector Canvas 元素的选择器
 * @returns Canvas 元素或 null（如果未找到）
 */
export const getCanvasFromDOM = (selector: string): HTMLCanvasElement | null => {
  const element = document.querySelector(selector) as HTMLCanvasElement;
  return element && element.tagName.toLowerCase() === 'canvas' ? element : null;
};

/**
 * 获取所有 Canvas 元素
 * @returns 所有 Canvas 元素的数组
 */
export const getAllCanvasElements = (): HTMLCanvasElement[] => {
  const canvasElements = document.querySelectorAll('canvas');
  return Array.from(canvasElements) as HTMLCanvasElement[];
};

/**
 * 将多个 Canvas 合并为一个
 * @param canvases 要合并的 Canvas 数组
 * @param padding 每个 Canvas 之间的间距（像素）
 * @returns 合并后的 Canvas
 */
export const mergeCanvases = (
  canvases: HTMLCanvasElement[],
  padding: number = 0
): HTMLCanvasElement => {
  if (!canvases.length) {
    throw new Error('No canvases provided for merging');
  }

  // 创建一个新的 Canvas
  const mergedCanvas = document.createElement('canvas');
  const ctx = mergedCanvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get 2D context for merged canvas');
  }

  // 计算合并后 Canvas 的尺寸
  // 假设所有 Canvas 宽度相同，高度可能不同
  const width = canvases[0].width;
  let totalHeight = 0;

  // 计算总高度，包括间距
  canvases.forEach((canvas) => {
    totalHeight += canvas.height;
  });
  
  // 添加间距
  if (canvases.length > 1) {
    totalHeight += (canvases.length - 1) * padding;
  }

  // 设置合并 Canvas 的尺寸
  mergedCanvas.width = width;
  mergedCanvas.height = totalHeight;

  // 绘制所有 Canvas
  let currentY = 0;
  canvases.forEach((canvas) => {
    ctx.drawImage(canvas, 0, currentY);
    currentY += canvas.height + padding;
  });

  return mergedCanvas;
};

/**
 * 根据选择器获取并合并多个 Canvas
 * @param selectors Canvas 元素的选择器数组
 * @param padding 每个 Canvas 之间的间距（像素）
 * @returns 合并后的 Canvas 数据 URL，如果未找到 Canvas 则返回 null
 */
export const mergeCanvasesBySelectors = (
  selectors: string[],
  padding: number = 0
): string | null => {
  try {
    const canvases = selectors
      .map((selector) => getCanvasFromDOM(selector))
      .filter((canvas): canvas is HTMLCanvasElement => canvas !== null);

    if (canvases.length === 0) {
      console.error('No canvases found with the provided selectors');
      return null;
    }

    const mergedCanvas = mergeCanvases(canvases, padding);
    return getCanvasDataURL(mergedCanvas);
  } catch (error) {
    console.error('Error merging canvases by selectors:', error);
    return null;
  }
};
