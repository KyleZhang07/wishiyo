
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
  width: 3600, // Increased from 2400
  height: 1800, // Increased from 1000
  spine: 180,  // Increased from 100
  gap: 50      // Increased from 30
};
