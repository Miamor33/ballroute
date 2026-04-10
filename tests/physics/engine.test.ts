import { describe, it, expect } from 'vitest';
import { PhysicsEngine } from '../../src/physics/engine';
import type { BallState } from '../../src/types';
import { DEFAULT_TABLE_CONFIG, BALL_RADIUS } from '../../src/constants';

function makeBall(overrides: Partial<BallState> = {}): BallState {
  return {
    id: 0, x: 500, y: 635, vx: 0, vy: 0,
    wx: 0, wy: 0, wz: 0, pocketed: false,
    ...overrides,
  };
}

describe('PhysicsEngine', () => {
  it('stationary balls produce empty trajectories', () => {
    const engine = new PhysicsEngine(DEFAULT_TABLE_CONFIG);
    const balls = [makeBall()];
    const result = engine.simulate(balls);
    const traj = result.trajectories.get(0);
    expect(traj).toBeDefined();
    expect(traj!.length).toBeGreaterThanOrEqual(1);
  });

  it('moving ball eventually stops', () => {
    const engine = new PhysicsEngine(DEFAULT_TABLE_CONFIG);
    const balls = [makeBall({ vx: 2000, vy: 0 })];
    const result = engine.simulate(balls);
    const traj = result.trajectories.get(0)!;
    const last = traj[traj.length - 1];
    expect(Math.abs(last.vx)).toBeLessThan(1);
    expect(Math.abs(last.vy)).toBeLessThan(1);
  });

  it('ball bounces off cushion', () => {
    const engine = new PhysicsEngine(DEFAULT_TABLE_CONFIG);
    const balls = [makeBall({ x: 2400, y: 635, vx: 2000, vy: 0 })];
    const result = engine.simulate(balls);
    const cushionEvents = result.events.filter((e) => e.type === 'ball-cushion');
    expect(cushionEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('two balls collide', () => {
    const engine = new PhysicsEngine(DEFAULT_TABLE_CONFIG);
    const balls = [
      makeBall({ id: 0, x: 500, y: 635, vx: 2000, vy: 0 }),
      makeBall({ id: 1, x: 1200, y: 635, vx: 0, vy: 0 }),
    ];
    const result = engine.simulate(balls);
    const ballEvents = result.events.filter((e) => e.type === 'ball-ball');
    expect(ballEvents.length).toBeGreaterThanOrEqual(1);
    const traj1 = result.trajectories.get(1)!;
    const last1 = traj1[traj1.length - 1];
    expect(last1.x).not.toBeCloseTo(1200, -1);
  });

  it('ball pocketed event', () => {
    const engine = new PhysicsEngine(DEFAULT_TABLE_CONFIG);
    const balls = [makeBall({ x: 50, y: 50, vx: -500, vy: -500 })];
    const result = engine.simulate(balls);
    const pocketEvents = result.events.filter((e) => e.type === 'ball-pocket');
    expect(pocketEvents.length).toBeGreaterThanOrEqual(1);
  });
});
