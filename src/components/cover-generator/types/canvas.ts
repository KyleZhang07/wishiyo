
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
  width: 2400,
  height: 1000,
  spine: 100,
  gap: 30
};
