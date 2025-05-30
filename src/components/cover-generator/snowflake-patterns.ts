// 预定义的雪花形状数据
// 每个雪花由一系列点和线段组成，形成精美的结晶结构

// 雪花类型1：优雅的树枝状雪花
export const snowflakeType1 = [
  // 主要分支 - 更长更优雅
  { x1: 0, y1: 0, x2: 0, y2: -1 },         // 上
  { x1: 0, y1: 0, x2: 0.866, y2: -0.5 },   // 右上
  { x1: 0, y1: 0, x2: 0.866, y2: 0.5 },    // 右下
  { x1: 0, y1: 0, x2: 0, y2: 1 },          // 下
  { x1: 0, y1: 0, x2: -0.866, y2: 0.5 },   // 左下
  { x1: 0, y1: 0, x2: -0.866, y2: -0.5 },  // 左上

  // 上分支的精美树枝结构
  { x1: 0, y1: -0.3, x2: 0.15, y2: -0.45 },
  { x1: 0, y1: -0.3, x2: -0.15, y2: -0.45 },
  { x1: 0.15, y1: -0.45, x2: 0.2, y2: -0.6 },
  { x1: -0.15, y1: -0.45, x2: -0.2, y2: -0.6 },
  { x1: 0, y1: -0.6, x2: 0.12, y2: -0.75 },
  { x1: 0, y1: -0.6, x2: -0.12, y2: -0.75 },
  { x1: 0, y1: -0.8, x2: 0.08, y2: -0.9 },
  { x1: 0, y1: -0.8, x2: -0.08, y2: -0.9 },

  // 右上分支的精美树枝结构
  { x1: 0.26, y1: -0.15, x2: 0.38, y2: -0.28 },
  { x1: 0.26, y1: -0.15, x2: 0.35, y2: -0.05 },
  { x1: 0.38, y1: -0.28, x2: 0.5, y2: -0.32 },
  { x1: 0.35, y1: -0.05, x2: 0.48, y2: -0.02 },
  { x1: 0.52, y1: -0.3, x2: 0.62, y2: -0.42 },
  { x1: 0.52, y1: -0.3, x2: 0.65, y2: -0.22 },
  { x1: 0.69, y1: -0.4, x2: 0.78, y2: -0.48 },
  { x1: 0.69, y1: -0.4, x2: 0.8, y2: -0.32 },

  // 右下分支的精美树枝结构 (镜像右上)
  { x1: 0.26, y1: 0.15, x2: 0.38, y2: 0.28 },
  { x1: 0.26, y1: 0.15, x2: 0.35, y2: 0.05 },
  { x1: 0.38, y1: 0.28, x2: 0.5, y2: 0.32 },
  { x1: 0.35, y1: 0.05, x2: 0.48, y2: 0.02 },
  { x1: 0.52, y1: 0.3, x2: 0.62, y2: 0.42 },
  { x1: 0.52, y1: 0.3, x2: 0.65, y2: 0.22 },
  { x1: 0.69, y1: 0.4, x2: 0.78, y2: 0.48 },
  { x1: 0.69, y1: 0.4, x2: 0.8, y2: 0.32 },

  // 下分支的精美树枝结构 (镜像上分支)
  { x1: 0, y1: 0.3, x2: 0.15, y2: 0.45 },
  { x1: 0, y1: 0.3, x2: -0.15, y2: 0.45 },
  { x1: 0.15, y1: 0.45, x2: 0.2, y2: 0.6 },
  { x1: -0.15, y1: 0.45, x2: -0.2, y2: 0.6 },
  { x1: 0, y1: 0.6, x2: 0.12, y2: 0.75 },
  { x1: 0, y1: 0.6, x2: -0.12, y2: 0.75 },
  { x1: 0, y1: 0.8, x2: 0.08, y2: 0.9 },
  { x1: 0, y1: 0.8, x2: -0.08, y2: 0.9 },

  // 左下分支的精美树枝结构 (镜像右上)
  { x1: -0.26, y1: 0.15, x2: -0.38, y2: 0.28 },
  { x1: -0.26, y1: 0.15, x2: -0.35, y2: 0.05 },
  { x1: -0.38, y1: 0.28, x2: -0.5, y2: 0.32 },
  { x1: -0.35, y1: 0.05, x2: -0.48, y2: 0.02 },
  { x1: -0.52, y1: 0.3, x2: -0.62, y2: 0.42 },
  { x1: -0.52, y1: 0.3, x2: -0.65, y2: 0.22 },
  { x1: -0.69, y1: 0.4, x2: -0.78, y2: 0.48 },
  { x1: -0.69, y1: 0.4, x2: -0.8, y2: 0.32 },

  // 左上分支的精美树枝结构 (镜像右下)
  { x1: -0.26, y1: -0.15, x2: -0.38, y2: -0.28 },
  { x1: -0.26, y1: -0.15, x2: -0.35, y2: -0.05 },
  { x1: -0.38, y1: -0.28, x2: -0.5, y2: -0.32 },
  { x1: -0.35, y1: -0.05, x2: -0.48, y2: -0.02 },
  { x1: -0.52, y1: -0.3, x2: -0.62, y2: -0.42 },
  { x1: -0.52, y1: -0.3, x2: -0.65, y2: -0.22 },
  { x1: -0.69, y1: -0.4, x2: -0.78, y2: -0.48 },
  { x1: -0.69, y1: -0.4, x2: -0.8, y2: -0.32 }
];

// 雪花类型2：精致的水晶状雪花，带有优雅的曲线
export const snowflakeType2 = [
  // 主要分支 - 细长优雅
  { x1: 0, y1: 0, x2: 0, y2: -1 },
  { x1: 0, y1: 0, x2: 0.866, y2: -0.5 },
  { x1: 0, y1: 0, x2: 0.866, y2: 0.5 },
  { x1: 0, y1: 0, x2: 0, y2: 1 },
  { x1: 0, y1: 0, x2: -0.866, y2: 0.5 },
  { x1: 0, y1: 0, x2: -0.866, y2: -0.5 },

  // 上分支的水晶结构
  { x1: 0, y1: -0.25, x2: 0.12, y2: -0.35 },
  { x1: 0, y1: -0.25, x2: -0.12, y2: -0.35 },
  { x1: 0.12, y1: -0.35, x2: 0.18, y2: -0.45 },
  { x1: -0.12, y1: -0.35, x2: -0.18, y2: -0.45 },

  { x1: 0, y1: -0.5, x2: 0.1, y2: -0.6 },
  { x1: 0, y1: -0.5, x2: -0.1, y2: -0.6 },
  { x1: 0.1, y1: -0.6, x2: 0.15, y2: -0.7 },
  { x1: -0.1, y1: -0.6, x2: -0.15, y2: -0.7 },

  { x1: 0, y1: -0.75, x2: 0.08, y2: -0.85 },
  { x1: 0, y1: -0.75, x2: -0.08, y2: -0.85 },

  // 添加一些曲线连接，增加优雅感
  { x1: 0.18, y1: -0.45, x2: 0.1, y2: -0.6 },
  { x1: -0.18, y1: -0.45, x2: -0.1, y2: -0.6 },
  { x1: 0.15, y1: -0.7, x2: 0.08, y2: -0.85 },
  { x1: -0.15, y1: -0.7, x2: -0.08, y2: -0.85 },

  // 右上分支的水晶结构
  { x1: 0.22, y1: -0.13, x2: 0.32, y2: -0.22 },
  { x1: 0.22, y1: -0.13, x2: 0.3, y2: -0.05 },
  { x1: 0.32, y1: -0.22, x2: 0.42, y2: -0.28 },
  { x1: 0.3, y1: -0.05, x2: 0.4, y2: 0 },

  { x1: 0.43, y1: -0.25, x2: 0.53, y2: -0.35 },
  { x1: 0.43, y1: -0.25, x2: 0.53, y2: -0.15 },
  { x1: 0.53, y1: -0.35, x2: 0.63, y2: -0.4 },
  { x1: 0.53, y1: -0.15, x2: 0.63, y2: -0.1 },

  { x1: 0.65, y1: -0.38, x2: 0.75, y2: -0.45 },
  { x1: 0.65, y1: -0.38, x2: 0.75, y2: -0.3 },

  // 添加一些曲线连接，增加优雅感
  { x1: 0.42, y1: -0.28, x2: 0.53, y2: -0.35 },
  { x1: 0.4, y1: 0, x2: 0.53, y2: -0.15 },
  { x1: 0.63, y1: -0.4, x2: 0.75, y2: -0.45 },
  { x1: 0.63, y1: -0.1, x2: 0.75, y2: -0.3 },

  // 右下分支的水晶结构 (镜像右上)
  { x1: 0.22, y1: 0.13, x2: 0.32, y2: 0.22 },
  { x1: 0.22, y1: 0.13, x2: 0.3, y2: 0.05 },
  { x1: 0.32, y1: 0.22, x2: 0.42, y2: 0.28 },
  { x1: 0.3, y1: 0.05, x2: 0.4, y2: 0 },

  { x1: 0.43, y1: 0.25, x2: 0.53, y2: 0.35 },
  { x1: 0.43, y1: 0.25, x2: 0.53, y2: 0.15 },
  { x1: 0.53, y1: 0.35, x2: 0.63, y2: 0.4 },
  { x1: 0.53, y1: 0.15, x2: 0.63, y2: 0.1 },

  { x1: 0.65, y1: 0.38, x2: 0.75, y2: 0.45 },
  { x1: 0.65, y1: 0.38, x2: 0.75, y2: 0.3 },

  // 添加一些曲线连接，增加优雅感
  { x1: 0.42, y1: 0.28, x2: 0.53, y2: 0.35 },
  { x1: 0.4, y1: 0, x2: 0.53, y2: 0.15 },
  { x1: 0.63, y1: 0.4, x2: 0.75, y2: 0.45 },
  { x1: 0.63, y1: 0.1, x2: 0.75, y2: 0.3 },

  // 下分支的水晶结构 (镜像上分支)
  { x1: 0, y1: 0.25, x2: 0.12, y2: 0.35 },
  { x1: 0, y1: 0.25, x2: -0.12, y2: 0.35 },
  { x1: 0.12, y1: 0.35, x2: 0.18, y2: 0.45 },
  { x1: -0.12, y1: 0.35, x2: -0.18, y2: 0.45 },

  { x1: 0, y1: 0.5, x2: 0.1, y2: 0.6 },
  { x1: 0, y1: 0.5, x2: -0.1, y2: 0.6 },
  { x1: 0.1, y1: 0.6, x2: 0.15, y2: 0.7 },
  { x1: -0.1, y1: 0.6, x2: -0.15, y2: 0.7 },

  { x1: 0, y1: 0.75, x2: 0.08, y2: 0.85 },
  { x1: 0, y1: 0.75, x2: -0.08, y2: 0.85 },

  // 添加一些曲线连接，增加优雅感
  { x1: 0.18, y1: 0.45, x2: 0.1, y2: 0.6 },
  { x1: -0.18, y1: 0.45, x2: -0.1, y2: 0.6 },
  { x1: 0.15, y1: 0.7, x2: 0.08, y2: 0.85 },
  { x1: -0.15, y1: 0.7, x2: -0.08, y2: 0.85 },

  // 左下分支的水晶结构 (镜像右上)
  { x1: -0.22, y1: 0.13, x2: -0.32, y2: 0.22 },
  { x1: -0.22, y1: 0.13, x2: -0.3, y2: 0.05 },
  { x1: -0.32, y1: 0.22, x2: -0.42, y2: 0.28 },
  { x1: -0.3, y1: 0.05, x2: -0.4, y2: 0 },

  { x1: -0.43, y1: 0.25, x2: -0.53, y2: 0.35 },
  { x1: -0.43, y1: 0.25, x2: -0.53, y2: 0.15 },
  { x1: -0.53, y1: 0.35, x2: -0.63, y2: 0.4 },
  { x1: -0.53, y1: 0.15, x2: -0.63, y2: 0.1 },

  { x1: -0.65, y1: 0.38, x2: -0.75, y2: 0.45 },
  { x1: -0.65, y1: 0.38, x2: -0.75, y2: 0.3 },

  // 添加一些曲线连接，增加优雅感
  { x1: -0.42, y1: 0.28, x2: -0.53, y2: 0.35 },
  { x1: -0.4, y1: 0, x2: -0.53, y2: 0.15 },
  { x1: -0.63, y1: 0.4, x2: -0.75, y2: 0.45 },
  { x1: -0.63, y1: 0.1, x2: -0.75, y2: 0.3 },

  // 左上分支的水晶结构 (镜像右下)
  { x1: -0.22, y1: -0.13, x2: -0.32, y2: -0.22 },
  { x1: -0.22, y1: -0.13, x2: -0.3, y2: -0.05 },
  { x1: -0.32, y1: -0.22, x2: -0.42, y2: -0.28 },
  { x1: -0.3, y1: -0.05, x2: -0.4, y2: 0 },

  { x1: -0.43, y1: -0.25, x2: -0.53, y2: -0.35 },
  { x1: -0.43, y1: -0.25, x2: -0.53, y2: -0.15 },
  { x1: -0.53, y1: -0.35, x2: -0.63, y2: -0.4 },
  { x1: -0.53, y1: -0.15, x2: -0.63, y2: -0.1 },

  { x1: -0.65, y1: -0.38, x2: -0.75, y2: -0.45 },
  { x1: -0.65, y1: -0.38, x2: -0.75, y2: -0.3 },

  // 添加一些曲线连接，增加优雅感
  { x1: -0.42, y1: -0.28, x2: -0.53, y2: -0.35 },
  { x1: -0.4, y1: 0, x2: -0.53, y2: -0.15 },
  { x1: -0.63, y1: -0.4, x2: -0.75, y2: -0.45 },
  { x1: -0.63, y1: -0.1, x2: -0.75, y2: -0.3 }
];

// 雪花类型3：华丽的花瓣状雪花，带有复杂的分支结构
export const snowflakeType3 = [
  // 主要分支 - 更细长
  { x1: 0, y1: 0, x2: 0, y2: -1 },
  { x1: 0, y1: 0, x2: 0.866, y2: -0.5 },
  { x1: 0, y1: 0, x2: 0.866, y2: 0.5 },
  { x1: 0, y1: 0, x2: 0, y2: 1 },
  { x1: 0, y1: 0, x2: -0.866, y2: 0.5 },
  { x1: 0, y1: 0, x2: -0.866, y2: -0.5 },

  // 上分支的花瓣结构
  // 第一层花瓣
  { x1: 0, y1: -0.3, x2: 0.1, y2: -0.4 },
  { x1: 0, y1: -0.3, x2: -0.1, y2: -0.4 },
  { x1: 0.1, y1: -0.4, x2: 0.15, y2: -0.5 },
  { x1: -0.1, y1: -0.4, x2: -0.15, y2: -0.5 },
  { x1: 0.15, y1: -0.5, x2: 0.1, y2: -0.6 },
  { x1: -0.15, y1: -0.5, x2: -0.1, y2: -0.6 },
  { x1: 0.1, y1: -0.6, x2: 0, y2: -0.6 },
  { x1: -0.1, y1: -0.6, x2: 0, y2: -0.6 },

  // 第二层花瓣
  { x1: 0, y1: -0.65, x2: 0.08, y2: -0.75 },
  { x1: 0, y1: -0.65, x2: -0.08, y2: -0.75 },
  { x1: 0.08, y1: -0.75, x2: 0.12, y2: -0.85 },
  { x1: -0.08, y1: -0.75, x2: -0.12, y2: -0.85 },
  { x1: 0.12, y1: -0.85, x2: 0.08, y2: -0.92 },
  { x1: -0.12, y1: -0.85, x2: -0.08, y2: -0.92 },
  { x1: 0.08, y1: -0.92, x2: 0, y2: -0.95 },
  { x1: -0.08, y1: -0.92, x2: 0, y2: -0.95 },

  // 右上分支的花瓣结构
  // 第一层花瓣
  { x1: 0.26, y1: -0.15, x2: 0.34, y2: -0.22 },
  { x1: 0.26, y1: -0.15, x2: 0.34, y2: -0.08 },
  { x1: 0.34, y1: -0.22, x2: 0.42, y2: -0.26 },
  { x1: 0.34, y1: -0.08, x2: 0.42, y2: -0.04 },
  { x1: 0.42, y1: -0.26, x2: 0.48, y2: -0.18 },
  { x1: 0.42, y1: -0.04, x2: 0.48, y2: -0.12 },
  { x1: 0.48, y1: -0.18, x2: 0.48, y2: -0.12 },

  // 第二层花瓣
  { x1: 0.56, y1: -0.32, x2: 0.64, y2: -0.38 },
  { x1: 0.56, y1: -0.32, x2: 0.64, y2: -0.26 },
  { x1: 0.64, y1: -0.38, x2: 0.72, y2: -0.42 },
  { x1: 0.64, y1: -0.26, x2: 0.72, y2: -0.22 },
  { x1: 0.72, y1: -0.42, x2: 0.78, y2: -0.36 },
  { x1: 0.72, y1: -0.22, x2: 0.78, y2: -0.28 },
  { x1: 0.78, y1: -0.36, x2: 0.78, y2: -0.28 },

  // 右下分支的花瓣结构 (镜像右上)
  // 第一层花瓣
  { x1: 0.26, y1: 0.15, x2: 0.34, y2: 0.22 },
  { x1: 0.26, y1: 0.15, x2: 0.34, y2: 0.08 },
  { x1: 0.34, y1: 0.22, x2: 0.42, y2: 0.26 },
  { x1: 0.34, y1: 0.08, x2: 0.42, y2: 0.04 },
  { x1: 0.42, y1: 0.26, x2: 0.48, y2: 0.18 },
  { x1: 0.42, y1: 0.04, x2: 0.48, y2: 0.12 },
  { x1: 0.48, y1: 0.18, x2: 0.48, y2: 0.12 },

  // 第二层花瓣
  { x1: 0.56, y1: 0.32, x2: 0.64, y2: 0.38 },
  { x1: 0.56, y1: 0.32, x2: 0.64, y2: 0.26 },
  { x1: 0.64, y1: 0.38, x2: 0.72, y2: 0.42 },
  { x1: 0.64, y1: 0.26, x2: 0.72, y2: 0.22 },
  { x1: 0.72, y1: 0.42, x2: 0.78, y2: 0.36 },
  { x1: 0.72, y1: 0.22, x2: 0.78, y2: 0.28 },
  { x1: 0.78, y1: 0.36, x2: 0.78, y2: 0.28 },

  // 下分支的花瓣结构 (镜像上分支)
  // 第一层花瓣
  { x1: 0, y1: 0.3, x2: 0.1, y2: 0.4 },
  { x1: 0, y1: 0.3, x2: -0.1, y2: 0.4 },
  { x1: 0.1, y1: 0.4, x2: 0.15, y2: 0.5 },
  { x1: -0.1, y1: 0.4, x2: -0.15, y2: 0.5 },
  { x1: 0.15, y1: 0.5, x2: 0.1, y2: 0.6 },
  { x1: -0.15, y1: 0.5, x2: -0.1, y2: 0.6 },
  { x1: 0.1, y1: 0.6, x2: 0, y2: 0.6 },
  { x1: -0.1, y1: 0.6, x2: 0, y2: 0.6 },

  // 第二层花瓣
  { x1: 0, y1: 0.65, x2: 0.08, y2: 0.75 },
  { x1: 0, y1: 0.65, x2: -0.08, y2: 0.75 },
  { x1: 0.08, y1: 0.75, x2: 0.12, y2: 0.85 },
  { x1: -0.08, y1: 0.75, x2: -0.12, y2: 0.85 },
  { x1: 0.12, y1: 0.85, x2: 0.08, y2: 0.92 },
  { x1: -0.12, y1: 0.85, x2: -0.08, y2: 0.92 },
  { x1: 0.08, y1: 0.92, x2: 0, y2: 0.95 },
  { x1: -0.08, y1: 0.92, x2: 0, y2: 0.95 },

  // 左下分支的花瓣结构 (镜像右上)
  // 第一层花瓣
  { x1: -0.26, y1: 0.15, x2: -0.34, y2: 0.22 },
  { x1: -0.26, y1: 0.15, x2: -0.34, y2: 0.08 },
  { x1: -0.34, y1: 0.22, x2: -0.42, y2: 0.26 },
  { x1: -0.34, y1: 0.08, x2: -0.42, y2: 0.04 },
  { x1: -0.42, y1: 0.26, x2: -0.48, y2: 0.18 },
  { x1: -0.42, y1: 0.04, x2: -0.48, y2: 0.12 },
  { x1: -0.48, y1: 0.18, x2: -0.48, y2: 0.12 },

  // 第二层花瓣
  { x1: -0.56, y1: 0.32, x2: -0.64, y2: 0.38 },
  { x1: -0.56, y1: 0.32, x2: -0.64, y2: 0.26 },
  { x1: -0.64, y1: 0.38, x2: -0.72, y2: 0.42 },
  { x1: -0.64, y1: 0.26, x2: -0.72, y2: 0.22 },
  { x1: -0.72, y1: 0.42, x2: -0.78, y2: 0.36 },
  { x1: -0.72, y1: 0.22, x2: -0.78, y2: 0.28 },
  { x1: -0.78, y1: 0.36, x2: -0.78, y2: 0.28 },

  // 左上分支的花瓣结构 (镜像右下)
  // 第一层花瓣
  { x1: -0.26, y1: -0.15, x2: -0.34, y2: -0.22 },
  { x1: -0.26, y1: -0.15, x2: -0.34, y2: -0.08 },
  { x1: -0.34, y1: -0.22, x2: -0.42, y2: -0.26 },
  { x1: -0.34, y1: -0.08, x2: -0.42, y2: -0.04 },
  { x1: -0.42, y1: -0.26, x2: -0.48, y2: -0.18 },
  { x1: -0.42, y1: -0.04, x2: -0.48, y2: -0.12 },
  { x1: -0.48, y1: -0.18, x2: -0.48, y2: -0.12 },

  // 第二层花瓣
  { x1: -0.56, y1: -0.32, x2: -0.64, y2: -0.38 },
  { x1: -0.56, y1: -0.32, x2: -0.64, y2: -0.26 },
  { x1: -0.64, y1: -0.38, x2: -0.72, y2: -0.42 },
  { x1: -0.64, y1: -0.26, x2: -0.72, y2: -0.22 },
  { x1: -0.72, y1: -0.42, x2: -0.78, y2: -0.36 },
  { x1: -0.72, y1: -0.22, x2: -0.78, y2: -0.28 },
  { x1: -0.78, y1: -0.36, x2: -0.78, y2: -0.28 },

  // 添加一些装饰性的小点缀
  { x1: 0, y1: -0.2, x2: 0.05, y2: -0.2 },
  { x1: 0, y1: -0.2, x2: -0.05, y2: -0.2 },
  { x1: 0.173, y1: -0.1, x2: 0.173, y2: -0.15 },
  { x1: -0.173, y1: -0.1, x2: -0.173, y2: -0.15 },
  { x1: 0.173, y1: 0.1, x2: 0.173, y2: 0.15 },
  { x1: -0.173, y1: 0.1, x2: -0.173, y2: 0.15 },
  { x1: 0, y1: 0.2, x2: 0.05, y2: 0.2 },
  { x1: 0, y1: 0.2, x2: -0.05, y2: 0.2 }
];

// 雪花类型4：简洁优雅的传统雪花，适合小尺寸
export const snowflakeType4 = [
  // 主要分支 - 六个方向
  { x1: 0, y1: 0, x2: 0, y2: -1 },
  { x1: 0, y1: 0, x2: 0.866, y2: -0.5 },
  { x1: 0, y1: 0, x2: 0.866, y2: 0.5 },
  { x1: 0, y1: 0, x2: 0, y2: 1 },
  { x1: 0, y1: 0, x2: -0.866, y2: 0.5 },
  { x1: 0, y1: 0, x2: -0.866, y2: -0.5 },

  // 上分支的小分支
  { x1: 0, y1: -0.4, x2: 0.15, y2: -0.55 },
  { x1: 0, y1: -0.4, x2: -0.15, y2: -0.55 },
  { x1: 0, y1: -0.7, x2: 0.1, y2: -0.85 },
  { x1: 0, y1: -0.7, x2: -0.1, y2: -0.85 },

  // 右上分支的小分支
  { x1: 0.35, y1: -0.2, x2: 0.45, y2: -0.35 },
  { x1: 0.35, y1: -0.2, x2: 0.5, y2: -0.1 },
  { x1: 0.6, y1: -0.35, x2: 0.7, y2: -0.45 },
  { x1: 0.6, y1: -0.35, x2: 0.75, y2: -0.25 },

  // 右下分支的小分支
  { x1: 0.35, y1: 0.2, x2: 0.5, y2: 0.1 },
  { x1: 0.35, y1: 0.2, x2: 0.45, y2: 0.35 },
  { x1: 0.6, y1: 0.35, x2: 0.75, y2: 0.25 },
  { x1: 0.6, y1: 0.35, x2: 0.7, y2: 0.45 },

  // 下分支的小分支
  { x1: 0, y1: 0.4, x2: 0.15, y2: 0.55 },
  { x1: 0, y1: 0.4, x2: -0.15, y2: 0.55 },
  { x1: 0, y1: 0.7, x2: 0.1, y2: 0.85 },
  { x1: 0, y1: 0.7, x2: -0.1, y2: 0.85 },

  // 左下分支的小分支
  { x1: -0.35, y1: 0.2, x2: -0.5, y2: 0.1 },
  { x1: -0.35, y1: 0.2, x2: -0.45, y2: 0.35 },
  { x1: -0.6, y1: 0.35, x2: -0.75, y2: 0.25 },
  { x1: -0.6, y1: 0.35, x2: -0.7, y2: 0.45 },

  // 左上分支的小分支
  { x1: -0.35, y1: -0.2, x2: -0.45, y2: -0.35 },
  { x1: -0.35, y1: -0.2, x2: -0.5, y2: -0.1 },
  { x1: -0.6, y1: -0.35, x2: -0.7, y2: -0.45 },
  { x1: -0.6, y1: -0.35, x2: -0.75, y2: -0.25 }
];

// 雪花类型5：简洁优雅的传统雪花，没有六边形结构
export const snowflakeType5 = [
  // 主要分支 - 六个方向
  { x1: 0, y1: 0, x2: 0, y2: -1 },
  { x1: 0, y1: 0, x2: 0.866, y2: -0.5 },
  { x1: 0, y1: 0, x2: 0.866, y2: 0.5 },
  { x1: 0, y1: 0, x2: 0, y2: 1 },
  { x1: 0, y1: 0, x2: -0.866, y2: 0.5 },
  { x1: 0, y1: 0, x2: -0.866, y2: -0.5 },

  // 上分支的小分支
  { x1: 0, y1: -0.3, x2: 0.15, y2: -0.4 },
  { x1: 0, y1: -0.3, x2: -0.15, y2: -0.4 },
  { x1: 0, y1: -0.6, x2: 0.12, y2: -0.7 },
  { x1: 0, y1: -0.6, x2: -0.12, y2: -0.7 },
  { x1: 0, y1: -0.8, x2: 0.08, y2: -0.9 },
  { x1: 0, y1: -0.8, x2: -0.08, y2: -0.9 },

  // 右上分支的小分支
  { x1: 0.26, y1: -0.15, x2: 0.35, y2: -0.25 },
  { x1: 0.26, y1: -0.15, x2: 0.35, y2: -0.05 },
  { x1: 0.52, y1: -0.3, x2: 0.6, y2: -0.4 },
  { x1: 0.52, y1: -0.3, x2: 0.62, y2: -0.2 },
  { x1: 0.7, y1: -0.4, x2: 0.78, y2: -0.48 },
  { x1: 0.7, y1: -0.4, x2: 0.78, y2: -0.32 },

  // 右下分支的小分支
  { x1: 0.26, y1: 0.15, x2: 0.35, y2: 0.05 },
  { x1: 0.26, y1: 0.15, x2: 0.35, y2: 0.25 },
  { x1: 0.52, y1: 0.3, x2: 0.62, y2: 0.2 },
  { x1: 0.52, y1: 0.3, x2: 0.6, y2: 0.4 },
  { x1: 0.7, y1: 0.4, x2: 0.78, y2: 0.32 },
  { x1: 0.7, y1: 0.4, x2: 0.78, y2: 0.48 },

  // 下分支的小分支
  { x1: 0, y1: 0.3, x2: 0.15, y2: 0.4 },
  { x1: 0, y1: 0.3, x2: -0.15, y2: 0.4 },
  { x1: 0, y1: 0.6, x2: 0.12, y2: 0.7 },
  { x1: 0, y1: 0.6, x2: -0.12, y2: 0.7 },
  { x1: 0, y1: 0.8, x2: 0.08, y2: 0.9 },
  { x1: 0, y1: 0.8, x2: -0.08, y2: 0.9 },

  // 左下分支的小分支
  { x1: -0.26, y1: 0.15, x2: -0.35, y2: 0.05 },
  { x1: -0.26, y1: 0.15, x2: -0.35, y2: 0.25 },
  { x1: -0.52, y1: 0.3, x2: -0.62, y2: 0.2 },
  { x1: -0.52, y1: 0.3, x2: -0.6, y2: 0.4 },
  { x1: -0.7, y1: 0.4, x2: -0.78, y2: 0.32 },
  { x1: -0.7, y1: 0.4, x2: -0.78, y2: 0.48 },

  // 左上分支的小分支
  { x1: -0.26, y1: -0.15, x2: -0.35, y2: -0.25 },
  { x1: -0.26, y1: -0.15, x2: -0.35, y2: -0.05 },
  { x1: -0.52, y1: -0.3, x2: -0.6, y2: -0.4 },
  { x1: -0.52, y1: -0.3, x2: -0.62, y2: -0.2 },
  { x1: -0.7, y1: -0.4, x2: -0.78, y2: -0.48 },
  { x1: -0.7, y1: -0.4, x2: -0.78, y2: -0.32 }
];

// 所有雪花类型的集合
export const snowflakePatterns = [
  snowflakeType1,
  snowflakeType2,
  snowflakeType3,
  snowflakeType4,
  snowflakeType5
];

// 绘制雪花的函数
export const drawSnowflake = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  pattern: Array<{x1: number, y1: number, x2: number, y2: number}>,
  color: string = 'white',
  lineWidth: number = 2
) => {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.translate(x, y);
  ctx.lineCap = 'round'; // 使线条端点圆滑
  ctx.lineJoin = 'round'; // 使线条连接圆滑

  // 不再添加旋转，保持雪花原始方向

  // 绘制雪花图案
  for (const line of pattern) {
    ctx.beginPath();
    ctx.moveTo(line.x1 * size, line.y1 * size);
    ctx.lineTo(line.x2 * size, line.y2 * size);
    ctx.stroke();
  }

  // 添加一些微小的点缀，增加真实感
  if (size > 10) { // 只在较大的雪花上添加点缀
    ctx.fillStyle = color;
    const dotCount = Math.floor(Math.random() * 6) + 3; // 3-8个点缀

    for (let i = 0; i < dotCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * size * 0.4 + size * 0.2; // 在中心区域到外围之间
      const dotSize = Math.random() * size / 30 + size / 60; // 点的大小与雪花成比

      ctx.beginPath();
      ctx.arc(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        dotSize,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  ctx.restore();
};
