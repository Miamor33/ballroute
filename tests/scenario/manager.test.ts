import { describe, it, expect, beforeEach } from 'vitest';
import { ScenarioManager } from '../../src/scenario/manager';
import { DEFAULT_TABLE_CONFIG } from '../../src/constants';
import type { TableState } from '../../src/types';

// localStorage polyfill for vitest node environment
if (typeof localStorage === 'undefined' || typeof (localStorage as any).clear !== 'function') {
  let store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
}

describe('ScenarioManager', () => {
  let manager: ScenarioManager;

  beforeEach(() => {
    manager = new ScenarioManager();
    localStorage.clear();
  });

  it('lists preset scenarios', () => {
    const presets = manager.listPresets();
    expect(presets.length).toBeGreaterThanOrEqual(3);
  });

  it('loads a preset by id', () => {
    const presets = manager.listPresets();
    const state = manager.loadPreset(presets[0].id);
    expect(state.balls.length).toBeGreaterThanOrEqual(2);
    expect(state.balls.find((b) => b.type === 'cue')).toBeDefined();
  });

  it('saves and loads custom scenario', () => {
    const state: TableState = {
      tableConfig: DEFAULT_TABLE_CONFIG,
      balls: [
        { id: 0, x: 100, y: 100, type: 'cue', number: 0, pocketed: false },
        { id: 1, x: 200, y: 200, type: 'solid', number: 1, pocketed: false },
      ],
    };
    manager.saveCustom('test-scenario', state);
    const customs = manager.listCustom();
    expect(customs).toContain('test-scenario');
    const loaded = manager.loadCustom('test-scenario');
    expect(loaded).toBeDefined();
    expect(loaded!.balls[0].x).toBe(100);
  });
});
