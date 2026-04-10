import type { TableConfig } from '../types';

export interface RenderTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function computeTransform(
  canvasWidth: number,
  canvasHeight: number,
  config: TableConfig,
  padding: number = 60,
): RenderTransform {
  const availW = canvasWidth - padding * 2;
  const availH = canvasHeight - padding * 2;
  const scale = Math.min(availW / config.width, availH / config.height);
  const offsetX = (canvasWidth - config.width * scale) / 2;
  const offsetY = (canvasHeight - config.height * scale) / 2;
  return { scale, offsetX, offsetY };
}

export function drawTable(
  ctx: CanvasRenderingContext2D,
  config: TableConfig,
  transform: RenderTransform,
): void {
  const { scale, offsetX, offsetY } = transform;
  const w = config.width * scale;
  const h = config.height * scale;

  // Outer wood frame
  const frameSize = 22 * scale;
  ctx.fillStyle = '#3a2210';
  roundRect(ctx, offsetX - frameSize, offsetY - frameSize, w + frameSize * 2, h + frameSize * 2, 12);
  ctx.fill();

  // Inner frame highlight
  const innerFrame = 11 * scale;
  ctx.fillStyle = '#5a3a1e';
  roundRect(ctx, offsetX - innerFrame, offsetY - innerFrame, w + innerFrame * 2, h + innerFrame * 2, 8);
  ctx.fill();

  // Cushion
  const cushionSize = 4 * scale;
  ctx.fillStyle = '#1b5e20';
  roundRect(ctx, offsetX - cushionSize, offsetY - cushionSize, w + cushionSize * 2, h + cushionSize * 2, 4);
  ctx.fill();

  // Playing surface
  ctx.fillStyle = '#1a6e20';
  ctx.fillRect(offsetX, offsetY, w, h);

  // Overhead light glow
  const grad = ctx.createRadialGradient(
    offsetX + w / 2, offsetY + h * 0.38, 0,
    offsetX + w / 2, offsetY + h * 0.38, w * 0.5,
  );
  grad.addColorStop(0, 'rgba(255,245,220,0.05)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(offsetX, offsetY, w, h);

  // Vignette
  const vignette = ctx.createRadialGradient(
    offsetX + w / 2, offsetY + h / 2, Math.min(w, h) * 0.3,
    offsetX + w / 2, offsetY + h / 2, Math.max(w, h) * 0.8,
  );
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  drawPockets(ctx, config, transform);
  drawDiamonds(ctx, config, transform);
}

function drawPockets(
  ctx: CanvasRenderingContext2D,
  config: TableConfig,
  transform: RenderTransform,
): void {
  const { scale, offsetX, offsetY } = transform;
  const w = config.width * scale;
  const h = config.height * scale;
  const cr = config.pocketRadius.corner * scale;
  const sr = config.pocketRadius.side * scale;

  const corners = [
    [offsetX, offsetY],
    [offsetX + w, offsetY],
    [offsetX, offsetY + h],
    [offsetX + w, offsetY + h],
  ];
  for (const [px, py] of corners) {
    const grad = ctx.createRadialGradient(px, py, cr * 0.3, px, py, cr);
    grad.addColorStop(0, '#111');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  const sides = [
    [offsetX + w / 2, offsetY],
    [offsetX + w / 2, offsetY + h],
  ];
  for (const [px, py] of sides) {
    const grad = ctx.createRadialGradient(px, py, sr * 0.3, px, py, sr);
    grad.addColorStop(0, '#111');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, sr, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDiamonds(
  ctx: CanvasRenderingContext2D,
  config: TableConfig,
  transform: RenderTransform,
): void {
  const { scale, offsetX, offsetY } = transform;
  const w = config.width * scale;
  const h = config.height * scale;
  const size = 3 * scale;

  const positions: [number, number][] = [];
  for (const frac of [0.18, 0.36, 0.64, 0.82]) {
    positions.push([offsetX + w * frac, offsetY - size]);
    positions.push([offsetX + w * frac, offsetY + h + size]);
  }
  for (const frac of [0.28, 0.5, 0.72]) {
    positions.push([offsetX - size, offsetY + h * frac]);
    positions.push([offsetX + w + size, offsetY + h * frac]);
  }

  ctx.fillStyle = '#c9a84c';
  for (const [dx, dy] of positions) {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}