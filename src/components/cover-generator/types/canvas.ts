
export interface CanvasSize {
  width: number;
  height: number;
  spine: number;
  gap: number;
}

export interface CanvasImage {
  element: HTMLImageElement;
  scale: number;
  position: { x: number; y: number };
}

export const DEFAULT_CANVAS_SIZE: CanvasSize = {
  width: 4800,  // Increased from 3600
  height: 2400, // Increased from 1800
  spine: 240,   // Increased from 180
  gap: 80       // Increased from 50
};
