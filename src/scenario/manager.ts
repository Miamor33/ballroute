import type { TableState } from '../types';
import { DEFAULT_TABLE_CONFIG } from '../constants';
import { PRESETS, type PresetScenario } from './presets';

const STORAGE_KEY = 'ballroute-custom-scenarios';

export class ScenarioManager {
  listPresets(): PresetScenario[] {
    return PRESETS;
  }

  loadPreset(id: string): TableState {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) throw new Error(`Preset not found: ${id}`);
    return {
      tableConfig: DEFAULT_TABLE_CONFIG,
      balls: preset.balls.map((b) => ({ ...b })),
    };
  }

  saveCustom(name: string, state: TableState): void {
    const customs = this.getAllCustom();
    customs[name] = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
  }

  loadCustom(name: string): TableState | undefined {
    const customs = this.getAllCustom();
    return customs[name];
  }

  listCustom(): string[] {
    return Object.keys(this.getAllCustom());
  }

  deleteCustom(name: string): void {
    const customs = this.getAllCustom();
    delete customs[name];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
  }

  private getAllCustom(): Record<string, TableState> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  }
}
