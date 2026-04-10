import type { TrajectoryPoint } from '../types';
import type { RenderTransform } from './table';

export function drawTrajectory(
  ctx: CanvasRenderingContext2D,
  points: TrajectoryPoint[],
  transform: RenderTransform,
  color = '#4fc3f7',
  dashPattern: number[] = [8, 5],
): void {
  if (points.length < 2) return;

  const { scale, offsetX, offsetY } = transform;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash(dashPattern);
  ctx.globalAlpha = 0.8;
  ctx.beginPath();

  const first = points[0];
  ctx.moveTo(first.x * scale + offsetX, first.y * scale + offsetY);

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    ctx.lineTo(p.x * scale + offsetX, p.y * scale + offsetY);
  }
  ctx.stroke();

  // Glow effect
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.globalAlpha = 0.06;
  ctx.beginPath();
  ctx.moveTo(first.x * scale + offsetX, first.y * scale + offsetY);
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    ctx.lineTo(p.x * scale + offsetX, p.y * scale + offsetY);
  }
  ctx.stroke();

  // Stop marker
  const last = points[points.length - 1];
  const lx = last.x * scale + offsetX;
  const ly = last.y * scale + offsetY;
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(lx, ly, 7, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(lx, ly, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

export function drawAimLine(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  transform: RenderTransform,
): void {
  const { scale, offsetX, offsetY } = transform;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(fromX * scale + offsetX, fromY * scale + offsetY);
  ctx.lineTo(toX * scale + offsetX, toY * scale + offsetY);
  ctx.stroke();
  ctx.setLineDash([]);
}