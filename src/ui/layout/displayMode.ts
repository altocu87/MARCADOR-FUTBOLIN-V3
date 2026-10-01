export type DisplayMode = 'adaptive' | 'physical'
export const DISPLAY_MODE_KEY = 'marcador:display-mode:v1'

export function parseDisplayMode(value: string | null): DisplayMode {
  return value === 'physical' ? 'physical' : 'adaptive'
}

export function canvasScale(width: number, height: number): number {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return 1
  return Math.min(1, width / 800, height / 480)
}
