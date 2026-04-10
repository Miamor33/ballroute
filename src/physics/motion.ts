import type { BallState } from '../types';
import {
  BALL_RADIUS, SLIDING_FRICTION, ROLLING_FRICTION, GRAVITY,
} from '../constants';

export interface Vec2 {
  x: number;
  y: number;
}

export function contactPointVelocity(ball: BallState): Vec2 {
  return {
    x: ball.vx + ball.wx * BALL_RADIUS,
    y: ball.vy + ball.wy * BALL_RADIUS,
  };
}

export function isRolling(ball: BallState, threshold = 1): boolean {
  const cp = contactPointVelocity(ball);
  return Math.sqrt(cp.x * cp.x + cp.y * cp.y) < threshold;
}

export function isStopped(ball: BallState, threshold = 0.1): boolean {
  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  const spin = Math.sqrt(ball.wx * ball.wx + ball.wy * ball.wy + ball.wz * ball.wz);
  return speed < threshold && spin * BALL_RADIUS < threshold;
}

export function updateBallState(ball: BallState, dt: number): BallState {
  if (ball.pocketed || isStopped(ball)) {
    return { ...ball };
  }

  let { vx, vy, wx, wy, wz } = ball;

  const rolling = isRolling(ball);

  if (rolling) {
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > 0) {
      const decel = ROLLING_FRICTION * GRAVITY * dt;
      const factor = Math.max(0, 1 - decel / speed);
      vx *= factor;
      vy *= factor;
      wx = -vx / BALL_RADIUS;
      wy = -vy / BALL_RADIUS;
    }
  } else {
    const cp = contactPointVelocity(ball);
    const cpSpeed = Math.sqrt(cp.x * cp.x + cp.y * cp.y);

    if (cpSpeed > 0) {
      const frictionAccel = SLIDING_FRICTION * GRAVITY;
      const dvx = -(cp.x / cpSpeed) * frictionAccel * dt;
      const dvy = -(cp.y / cpSpeed) * frictionAccel * dt;

      vx += dvx;
      vy += dvy;

      const inertiaFactor = 2 / 5;
      wx += (dvx / BALL_RADIUS) / inertiaFactor;
      wy += (dvy / BALL_RADIUS) / inertiaFactor;
    }
  }

  const spinDecel = 0.01 * GRAVITY * dt;
  const spinSpeed = Math.abs(wz);
  if (spinSpeed > 0) {
    wz *= Math.max(0, 1 - spinDecel / (spinSpeed * BALL_RADIUS));
  }

  const x = ball.x + vx * dt;
  const y = ball.y + vy * dt;

  return { ...ball, x, y, vx, vy, wx, wy, wz };
}
