import type { Ball, BallState, CueParams } from '../types';
import { BALL_RADIUS, MAX_CUE_OFFSET } from '../constants';

const MAX_SPEED = 8000; // mm/s at force=1

export function cueParamsToBallState(
  cueBall: Ball,
  params: CueParams,
): BallState {
  let ox = params.offsetX;
  let oy = params.offsetY;

  const offsetMag = Math.sqrt(ox * ox + oy * oy);
  if (offsetMag > MAX_CUE_OFFSET) {
    const scale = MAX_CUE_OFFSET / offsetMag;
    ox *= scale;
    oy *= scale;
  }

  const speed = params.force * MAX_SPEED;
  const vx = speed * Math.cos(params.aimAngle);
  const vy = speed * Math.sin(params.aimAngle);

  const spinFactor = speed / BALL_RADIUS * 1.5;
  const wx = -oy * spinFactor;
  const wy = ox * spinFactor;
  const wz = -ox * spinFactor * 0.8;

  return {
    id: cueBall.id,
    x: cueBall.x,
    y: cueBall.y,
    vx, vy,
    wx, wy, wz,
    pocketed: false,
  };
}

export function getCueLabel(offsetX: number, offsetY: number): string {
  const threshold = 0.15;
  const parts: string[] = [];

  if (offsetY > threshold) parts.push('高杆');
  else if (offsetY < -threshold) parts.push('低杆');

  if (offsetX < -threshold) parts.push('左塞');
  else if (offsetX > threshold) parts.push('右塞');

  return parts.length === 0 ? '中杆' : parts.join('+');
}
