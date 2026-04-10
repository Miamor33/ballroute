import { describe, it, expect } from 'vitest';
import {
  detectBallBallCollision,
  resolveBallBallCollision,
  detectCushionCollision,
  resolveCushionCollision,
} from '../../src/physics/collision';
import type { BallState } from '../../src/types';
import { BALL_RADIUS, DEFAULT_TABLE_CONFIG } from '../../src/constants';

function makeBall(overrides: Partial<BallState> = {}): BallState {
  return {
    id: 0, x: 500, y: 500, vx: 0, vy: 0,
    wx: 0, wy: 0, wz: 0, pocketed: false,
    ...overrides,
  };
}

describe('detectBallBallCollision', () => {
  it('detects overlapping balls', () => {
    const a = makeBall({ id: 0, x: 100, y: 100 });
    const b = makeBall({ id: 1, x: 100 + BALL_RADIUS * 1.5, y: 100 });
    expect(detectBallBallCollision(a, b)).toBe(true);
  });

  it('no collision for distant balls', () => {
    const a = makeBall({ id: 0, x: 100, y: 100 });
    const b = makeBall({ id: 1, x: 300, y: 300 });
    expect(detectBallBallCollision(a, b)).toBe(false);
  });

  it('no collision for exactly touching balls', () => {
    const a = makeBall({ id: 0, x: 100, y: 100 });
    const b = makeBall({ id: 1, x: 100 + BALL_RADIUS * 2, y: 100 });
    expect(detectBallBallCollision(a, b)).toBe(false);
  });
});

describe('resolveBallBallCollision', () => {
  it('head-on collision: moving ball stops, stationary ball moves', () => {
    const a = makeBall({ id: 0, x: 100, y: 100, vx: 1000, vy: 0 });
    const b = makeBall({ id: 1, x: 100 + BALL_RADIUS * 1.9, y: 100, vx: 0, vy: 0 });
    const [ra, rb] = resolveBallBallCollision(a, b);
    expect(Math.abs(ra.vx)).toBeLessThan(100);
    expect(rb.vx).toBeGreaterThan(800);
  });

  it('momentum is conserved', () => {
    const a = makeBall({ id: 0, x: 100, y: 100, vx: 1000, vy: 200 });
    const b = makeBall({ id: 1, x: 100 + BALL_RADIUS * 1.9, y: 105, vx: -200, vy: 100 });
    const [ra, rb] = resolveBallBallCollision(a, b);
    expect(ra.vx + rb.vx).toBeCloseTo(a.vx + b.vx, -1);
    expect(ra.vy + rb.vy).toBeCloseTo(a.vy + b.vy, -1);
  });
});

describe('detectCushionCollision', () => {
  it('detects ball hitting left cushion', () => {
    const ball = makeBall({ x: BALL_RADIUS * 0.5, y: 500, vx: -100, vy: 0 });
    const result = detectCushionCollision(ball, DEFAULT_TABLE_CONFIG);
    expect(result).not.toBeNull();
    expect(result!.side).toBe('left');
  });

  it('no collision when ball is inside table', () => {
    const ball = makeBall({ x: 500, y: 500 });
    const result = detectCushionCollision(ball, DEFAULT_TABLE_CONFIG);
    expect(result).toBeNull();
  });
});

describe('resolveCushionCollision', () => {
  it('ball bounces off right cushion', () => {
    const ball = makeBall({
      x: DEFAULT_TABLE_CONFIG.width - BALL_RADIUS * 0.5,
      y: 500, vx: 1000, vy: 200,
    });
    const resolved = resolveCushionCollision(ball, 'right');
    expect(resolved.vx).toBeLessThan(0);
    expect(Math.abs(resolved.vx)).toBeLessThan(1000);
  });

  it('sidespin modifies rebound angle', () => {
    const noSpin = makeBall({
      x: DEFAULT_TABLE_CONFIG.width - BALL_RADIUS * 0.5,
      y: 500, vx: 1000, vy: 200, wz: 0,
    });
    const withSpin = makeBall({
      x: DEFAULT_TABLE_CONFIG.width - BALL_RADIUS * 0.5,
      y: 500, vx: 1000, vy: 200, wz: 50,
    });
    const rNoSpin = resolveCushionCollision(noSpin, 'right');
    const rWithSpin = resolveCushionCollision(withSpin, 'right');
    expect(rWithSpin.vy).not.toBeCloseTo(rNoSpin.vy, 0);
  });
});
