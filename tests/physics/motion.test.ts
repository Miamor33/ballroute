import { describe, it, expect } from 'vitest';
import { updateBallState, isRolling, contactPointVelocity } from '../../src/physics/motion';
import type { BallState } from '../../src/types';
import { BALL_RADIUS } from '../../src/constants';

function makeBall(overrides: Partial<BallState> = {}): BallState {
  return {
    id: 0, x: 500, y: 500, vx: 0, vy: 0,
    wx: 0, wy: 0, wz: 0, pocketed: false,
    ...overrides,
  };
}

describe('contactPointVelocity', () => {
  it('returns zero for stationary ball', () => {
    const ball = makeBall();
    const v = contactPointVelocity(ball);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(0);
  });

  it('is nonzero when linear and angular velocity mismatch', () => {
    const ball = makeBall({ vx: 1000, vy: 0, wx: 0, wy: 0 });
    const v = contactPointVelocity(ball);
    expect(v.x).not.toBeCloseTo(0);
  });

  it('is zero for pure rolling', () => {
    const vx = 1000;
    const ball = makeBall({ vx, vy: 0, wx: -vx / BALL_RADIUS, wy: 0 });
    const v = contactPointVelocity(ball);
    expect(v.x).toBeCloseTo(0, 0);
    expect(v.y).toBeCloseTo(0, 0);
  });
});

describe('isRolling', () => {
  it('returns true for pure rolling ball', () => {
    const vx = 1000;
    const ball = makeBall({ vx, vy: 0, wx: -vx / BALL_RADIUS, wy: 0 });
    expect(isRolling(ball)).toBe(true);
  });

  it('returns false for sliding ball', () => {
    const ball = makeBall({ vx: 1000, vy: 0, wx: 0, wy: 0 });
    expect(isRolling(ball)).toBe(false);
  });
});

describe('updateBallState', () => {
  it('sliding ball decelerates', () => {
    const ball = makeBall({ vx: 1000, vy: 0 });
    const dt = 0.001;
    const next = updateBallState(ball, dt);
    expect(Math.abs(next.vx)).toBeLessThan(Math.abs(ball.vx));
  });

  it('rolling ball decelerates slower than sliding', () => {
    const vx = 1000;
    const slidingBall = makeBall({ vx, vy: 0, wx: 0, wy: 0 });
    const rollingBall = makeBall({ vx, vy: 0, wx: -vx / BALL_RADIUS, wy: 0 });
    const dt = 0.001;
    const nextSliding = updateBallState(slidingBall, dt);
    const nextRolling = updateBallState(rollingBall, dt);
    const slidingDecel = Math.abs(slidingBall.vx - nextSliding.vx);
    const rollingDecel = Math.abs(rollingBall.vx - nextRolling.vx);
    expect(slidingDecel).toBeGreaterThan(rollingDecel);
  });

  it('ball position updates based on velocity', () => {
    const ball = makeBall({ vx: 1000, vy: 500 });
    const dt = 0.01;
    const next = updateBallState(ball, dt);
    expect(next.x).toBeGreaterThan(ball.x);
    expect(next.y).toBeGreaterThan(ball.y);
  });

  it('stationary ball stays stationary', () => {
    const ball = makeBall();
    const next = updateBallState(ball, 0.001);
    expect(next.x).toBe(ball.x);
    expect(next.y).toBe(ball.y);
    expect(next.vx).toBe(0);
    expect(next.vy).toBe(0);
  });
});
