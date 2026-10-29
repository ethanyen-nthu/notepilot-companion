export type Crop = { x: number; y: number; width: number; height: number };
export const fullCrop: Crop = { x: 0, y: 0, width: 1, height: 1 };
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export function cropFromPoints(a: { x: number; y: number }, b: { x: number; y: number }): Crop {
  const x = clamp(Math.min(a.x, b.x), 0, 0.95),
    y = clamp(Math.min(a.y, b.y), 0, 0.95);
  return {
    x,
    y,
    width: clamp(Math.abs(a.x - b.x), 0.05, 1 - x),
    height: clamp(Math.abs(a.y - b.y), 0.05, 1 - y),
  };
}
export function resizeCrop(
  crop: Crop,
  edge: 'left' | 'right' | 'top' | 'bottom',
  delta: number,
): Crop {
  const right = crop.x + crop.width,
    bottom = crop.y + crop.height;
  if (edge === 'left') {
    const x = clamp(crop.x + delta, 0, right - 0.05);
    return { ...crop, x, width: right - x };
  }
  if (edge === 'top') {
    const y = clamp(crop.y + delta, 0, bottom - 0.05);
    return { ...crop, y, height: bottom - y };
  }
  if (edge === 'right') return { ...crop, width: clamp(crop.width + delta, 0.05, 1 - crop.x) };
  return { ...crop, height: clamp(crop.height + delta, 0.05, 1 - crop.y) };
}
export function pixelCrop(crop: Crop, width: number, height: number) {
  if (
    ![width, height, crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) ||
    width < 1 ||
    height < 1 ||
    crop.x < 0 ||
    crop.y < 0 ||
    crop.width <= 0 ||
    crop.height <= 0 ||
    crop.x + crop.width > 1.000001 ||
    crop.y + crop.height > 1.000001
  )
    throw new Error('Invalid crop.');
  const originX = Math.floor(crop.x * width),
    originY = Math.floor(crop.y * height);
  return {
    originX,
    originY,
    width: Math.min(width - originX, Math.max(1, Math.floor(crop.width * width))),
    height: Math.min(height - originY, Math.max(1, Math.floor(crop.height * height))),
  };
}
