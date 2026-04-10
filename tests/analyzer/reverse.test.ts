import { describe, it, expect } from 'vitest';
import { reverseAnalyze } from '../../src/analyzer/reverse';
import type { TableState } from '../../src/types';
import { DEFAULT_TABLE_CONFIG } from '../../src/constants';

describe('reverseAnalyze', () => {
  it('returns at least one cue option', () => {
    const state: TableState = {
      tableConfig: DEFAULT_TABLE_CONFIG,
      balls: [
        { id: 0, x: 635, y: 635, type: 'cue', number: 0, pocketed: false },
        { id: 1, x: 1270, y: 635, type: 'solid', number: 1, pocketed: false },
      ],
    };
    const aimAngle = 0;
    const targetX = 1600;
    const targetY = 635;
    const options = reverseAnalyze(state, aimAngle, { x: targetX, y: targetY });
    expect(options.length).toBeGreaterThanOrEqual(1);
  });

  it('options are sorted by deviation (ascending)', () => {
    const state: TableState = {
      tableConfig: DEFAULT_TABLE_CONFIG,
      balls: [
        { id: 0, x: 635, y: 635, type: 'cue', number: 0, pocketed: false },
        { id: 1, x: 1270, y: 635, type: 'solid', number: 1, pocketed: false },
      ],
    };
    const options = reverseAnalyze(state, 0, { x: 1800, y: 400 });
    for (let i = 1; i < options.length; i++) {
      expect(options[i].deviation).toBeGreaterThanOrEqual(options[i - 1].deviation);
    }
  });

  it('each option has a label', () => {
    const state: TableState = {
      tableConfig: DEFAULT_TABLE_CONFIG,
      balls: [
        { id: 0, x: 635, y: 635, type: 'cue', number: 0, pocketed: false },
        { id: 1, x: 1270, y: 635, type: 'solid', number: 1, pocketed: false },
      ],
    };
    const options = reverseAnalyze(state, 0, { x: 1600, y: 635 });
    for (const opt of options) {
      expect(opt.label.length).toBeGreaterThan(0);
    }
  });
});
