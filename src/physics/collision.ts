import type { BallState, TableConfig } from '../types';
import { BALL_RADIUS, BALL_BALL_RESTITUTION, CUSHION_RESTITUTION } from '../constants';

export function detectBallBallCollision(a: BallState, b: BallState): boolean {
  if (a.pocketed || b.pocketed) return false;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < BALL_RADIUS * 2;
}

export function resolveBallBallCollision(
  a: BallState,
  b: BallState,
): [BallState, BallState] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist;
  const ny = dy / dist;

  const dvx = a.vx - b.vx;
  const dvy = a.vy - b.vy;
  const dvn = dvx * nx + dvy * ny;

  if (dvn <= 0) return [{ ...a }, { ...b }];

  const j = -(1 + BALL_BALL_RESTITUTION) * dvn / 2;

  const overlap = BALL_RADIUS * 2 - dist;
  const separationX = nx * overlap / 2;
  const separationY = ny * overlap / 2;

  const ra: BallState = {
    ...a,
    x: a.x - separationX,
    y: a.y - separationY,
    vx: a.vx + j * nx,
    vy: a.vy + j * ny,
    wx: a.wx,
    wy: a.wy,
    wz: a.wz,
  };

  const rb: BallState = {
    ...b,
    x: b.x + separationX,
    y: b.y + separationY,
    vx: b.vx - j * nx,
    vy: b.vy - j * ny,
    wx: b.wx,
    wy: b.wy,
    wz: b.wz,
  };

  return [ra, rb];
}

export type CushionSide = 'left' | 'right' | 'top' | 'bottom';

export interface CushionCollisionInfo {
  side: CushionSide;
}

export function detectCushionCollision(
  ball: BallState,
  config: TableConfig,
): CushionCollisionInfo | null {
  if (ball.pocketed) return null;
  if (ball.x - BALL_RADIUS < 0) return { side: 'left' };
  if (ball.x + BALL_RADIUS > config.width) return { side: 'right' };
  if (ball.y - BALL_RADIUS < 0) return { side: 'top' };
  if (ball.y + BALL_RADIUS > config.height) return { side: 'bottom' };
  return null;
}

export function resolveCushionCollision(
  ball: BallState,
  side: CushionSide,
): BallState {
  let { vx, vy, wz, x, y } = ball;

  const spinTransfer = 0.4;

  if (side === 'left' || side === 'right') {
    vx = -vx * CUSHION_RESTITUTION;
    vy = vy * CUSHION_RESTITUTION + wz * BALL_RADIUS * spinTransfer;
    wz *= 0.7;
    x = side === 'left' ? BALL_RADIUS : x;
  } else {
    vy = -vy * CUSHION_RESTITUTION;
    vx = vx * CUSHION_RESTITUTION + wz * BALL_RADIUS * spinTransfer;
    wz *= 0.7;
    y = side === 'top' ? BALL_RADIUS : y;
  }

  return { ...ball, vx, vy, wz, x, y };
}
