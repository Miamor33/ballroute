import { describe, it, expect } from 'vitest';
import { getPocketPositions, detectPocket } from '../../src/physics/pocket';
import type { BallState } from '../../src/types';
import { DEFAULT_TABLE_CONFIG } from '../../src/constants';

function makeBall(overrides: Partial<BallState> = {}): BallState {
  return {
    id: 0, x: 500, y: 500, vx: 0, vy: 0,
    wx: 0, wy: 0, wz: 0, pocketed: false,
    ...overrides,
  };
}

describe('getPocketPositions', () => {
  it('returns 6 pocket positions', () => {
    const pockets = getPocketPositions(DEFAULT_TABLE_CONFIG);
    expect(pockets).toHaveLength(6);
  });
});

describe('detectPocket', () => {
  it('detects ball in top-left corner pocket', () => {
    const ball = makeBall({ x: 5, y: 5 });
    const result = detectPocket(ball, DEFAULT_TABLE_CONFIG);
    expect(result).toBe(true);
  });

  it('does not detect ball in center of table', () => {
    const ball = makeBall({ x: 1000, y: 600 });
    const result = detectPocket(ball, DEFAULT_TABLE_CONFIG);
    expect(result).toBe(false);
  });

  it('detects ball in side pocket', () => {
    const w = DEFAULT_TABLE_CONFIG.width;
    const h = DEFAULT_TABLE_CONFIG.height;
    const ball = makeBall({ x: w / 2, y: 2 });
    const result = detectPocket(ball, DEFAULT_TABLE_CONFIG);
    expect(result).toBe(true);
  });
});
