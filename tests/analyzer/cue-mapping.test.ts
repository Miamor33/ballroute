import { describe, it, expect } from 'vitest';
import { cueParamsToBallState, getCueLabel } from '../../src/analyzer/cue-mapping';
import type { Ball, CueParams } from '../../src/types';

const cueBall: Ball = {
  id: 0, x: 635, y: 635, type: 'cue', number: 0, pocketed: false,
};

describe('cueParamsToBallState', () => {
  it('center hit produces forward motion with no spin', () => {
    const params: CueParams = { aimAngle: 0, offsetX: 0, offsetY: 0, force: 0.5 };
    const state = cueParamsToBallState(cueBall, params);
    expect(state.vx).toBeGreaterThan(0);
    expect(state.vy).toBeCloseTo(0, 0);
    expect(state.wz).toBeCloseTo(0, 0);
  });

  it('high hit produces topspin (negative wx for forward rolling)', () => {
    const params: CueParams = { aimAngle: 0, offsetX: 0, offsetY: 0.5, force: 0.5 };
    const state = cueParamsToBallState(cueBall, params);
    expect(state.wx).toBeLessThan(0);
  });

  it('low hit produces backspin (positive wx)', () => {
    const params: CueParams = { aimAngle: 0, offsetX: 0, offsetY: -0.5, force: 0.5 };
    const state = cueParamsToBallState(cueBall, params);
    expect(state.wx).toBeGreaterThan(0);
  });

  it('right english produces positive wz', () => {
    const params: CueParams = { aimAngle: 0, offsetX: 0.5, offsetY: 0, force: 0.5 };
    const state = cueParamsToBallState(cueBall, params);
    expect(state.wz).not.toBe(0);
  });

  it('force scales velocity', () => {
    const light: CueParams = { aimAngle: 0, offsetX: 0, offsetY: 0, force: 0.3 };
    const heavy: CueParams = { aimAngle: 0, offsetX: 0, offsetY: 0, force: 0.9 };
    const stateLight = cueParamsToBallState(cueBall, light);
    const stateHeavy = cueParamsToBallState(cueBall, heavy);
    expect(stateHeavy.vx).toBeGreaterThan(stateLight.vx);
  });

  it('offset clamped to safe zone', () => {
    const params: CueParams = { aimAngle: 0, offsetX: 1.5, offsetY: 1.5, force: 0.5 };
    const state = cueParamsToBallState(cueBall, params);
    expect(state.vx).toBeDefined();
  });
});

describe('getCueLabel', () => {
  it('center hit is 中杆', () => {
    expect(getCueLabel(0, 0)).toBe('中杆');
  });

  it('high hit is 高杆', () => {
    expect(getCueLabel(0, 0.4)).toBe('高杆');
  });

  it('combo is labeled correctly', () => {
    const label = getCueLabel(0.4, 0.4);
    expect(label).toContain('高杆');
    expect(label).toContain('右塞');
  });
});
