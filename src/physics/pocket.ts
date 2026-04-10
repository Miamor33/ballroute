import type { BallState, TableConfig } from '../types';

export interface PocketPosition {
  x: number;
  y: number;
  radius: number;
  type: 'corner' | 'side';
}

export function getPocketPositions(config: TableConfig): PocketPosition[] {
  const { width: w, height: h, pocketRadius } = config;
  return [
    { x: 0, y: 0, radius: pocketRadius.corner, type: 'corner' },
    { x: w, y: 0, radius: pocketRadius.corner, type: 'corner' },
    { x: 0, y: h, radius: pocketRadius.corner, type: 'corner' },
    { x: w, y: h, radius: pocketRadius.corner, type: 'corner' },
    { x: w / 2, y: 0, radius: pocketRadius.side, type: 'side' },
    { x: w / 2, y: h, radius: pocketRadius.side, type: 'side' },
  ];
}

export function detectPocket(
  ball: BallState,
  config: TableConfig,
): boolean {
  if (ball.pocketed) return false;
  const pockets = getPocketPositions(config);
  for (const pocket of pockets) {
    const dx = ball.x - pocket.x;
    const dy = ball.y - pocket.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < pocket.radius) {
      return true;
    }
  }
  return false;
}
