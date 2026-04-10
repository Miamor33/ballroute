import { describe, it, expect } from 'vitest';
import { forwardSimulate } from '../../src/analyzer/forward';
import type { Ball, CueParams, TableState } from '../../src/types';
import { DEFAULT_TABLE_CONFIG } from '../../src/constants';

describe('forwardSimulate', () => {
  it('returns trajectory for cue ball', () => {
    const state: TableState = {
      tableConfig: DEFAULT_TABLE_CONFIG,
      balls: [
        { id: 0, x: 635, y: 635, type: 'cue', number: 0, pocketed: false },
        { id: 1, x: 1270, y: 635, type: 'solid', number: 1, pocketed: false },
      ],
    };
    const params: CueParams = { aimAngle: 0, offsetX: 0, offsetY: 0, force: 0.5 };
    const result = forwardSimulate(state, params);
    const cueTraj = result.trajectories.get(0);
    expect(cueTraj).toBeDefined();
    expect(cueTraj!.length).toBeGreaterThan(1);
  });

  it('high cue ball has follow-through after collision', () => {
    const state: TableState = {
      tableConfig: DEFAULT_TABLE_CONFIG,
      balls: [
        { id: 0, x: 635, y: 635, type: 'cue', number: 0, pocketed: false },
        { id: 1, x: 1270, y: 635, type: 'solid', number: 1, pocketed: false },
      ],
    };
    const centerParams: CueParams = { aimAngle: 0, offsetX: 0, offsetY: 0, force: 0.5 };
    const highParams: CueParams = { aimAngle: 0, offsetX: 0, offsetY: 0.5, force: 0.5 };

    const centerResult = forwardSimulate(state, centerParams);
    const highResult = forwardSimulate(state, highParams);

    const centerTraj = centerResult.trajectories.get(0)!;
    const highTraj = highResult.trajectories.get(0)!;

    // Find the collision time for each
    const centerCollisionT = centerResult.events.find(e => e.type === 'ball-ball')?.t ?? 0;
    const highCollisionT = highResult.events.find(e => e.type === 'ball-ball')?.t ?? 0;

    // Get the point right after collision
    const centerAfter = centerTraj.find(p => p.t > centerCollisionT + 0.01);
    const highAfter = highTraj.find(p => p.t > highCollisionT + 0.01);

    expect(centerAfter).toBeDefined();
    expect(highAfter).toBeDefined();

    // High ball should have more positive vx after collision due to topspin follow-through
    expect(highAfter!.vx).toBeGreaterThan(centerAfter!.vx);

    // High ball should have significant topspin (negative wx)
    const highSpin = highTraj.find(p => p.t > highCollisionT + 0.01)?.spin;
    expect(highSpin!.wx).toBeLessThan(0);
  });
});
