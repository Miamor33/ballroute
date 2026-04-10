import type { Ball } from '../types';
import type { RenderTransform } from './table';
import { BALL_RADIUS } from '../constants';

const BALL_COLORS: Record<number, string> = {
  0: '#f0f0f0',
  1: '#ffeb3b', 2: '#2196f3', 3: '#f44336', 4: '#9c27b0',
  5: '#ff9800', 6: '#4caf50', 7: '#7b1fa2', 8: '#212121',
  9: '#ffeb3b', 10: '#2196f3', 11: '#f44336', 12: '#9c27b0',
  13: '#ff9800', 14: '#4caf50', 15: '#7b1fa2',
};

export function drawBall(
  ctx: CanvasRenderingContext2D,
  ball: Ball,
  transform: RenderTransform,
): void {
  if (ball.pocketed) return;

  const x = ball.x * transform.scale + transform.offsetX;
  const y = ball.y * transform.scale + transform.offsetY;
  const r = BALL_RADIUS * transform.scale;

  const baseColor = BALL_COLORS[ball.number] || '#888';

  // Shadow on felt
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x + r * 0.1, y + r * 0.9, r * 0.7, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball body
  const grad = ctx.createRadialGradient(
    x - r * 0.25, y - r * 0.3, r * 0.05,
    x, y, r,
  );

  if (ball.type === 'cue') {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#f5f5f5');
    grad.addColorStop(0.7, '#d0d0d0');
    grad.addColorStop(1, '#999');
  } else {
    grad.addColorStop(0, lightenColor(baseColor, 0.6));
    grad.addColorStop(0.3, baseColor);
    grad.addColorStop(0.8, darkenColor(baseColor, 0.3));
    grad.addColorStop(1, darkenColor(baseColor, 0.5));
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Stripe band for stripe balls (9-15)
  if (ball.type === 'stripe') {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = baseColor;
    ctx.fillRect(x - r, y - r * 0.4, r * 2, r * 0.8);
    ctx.restore();
  }

  // Number circle
  if (ball.number > 0) {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.font = `bold ${r * 0.4}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(ball.number), x, y + 0.5);
  }

  // Highlight spark
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.25, y - r * 0.35, r * 0.15, r * 0.1, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function lightenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, Math.round(r + (255 - r) * amount));
  const ng = Math.min(255, Math.round(g + (255 - g) * amount));
  const nb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `rgb(${nr},${ng},${nb})`;
}

function darkenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * (1 - amount))},${Math.round(g * (1 - amount))},${Math.round(b * (1 - amount))})`;
}