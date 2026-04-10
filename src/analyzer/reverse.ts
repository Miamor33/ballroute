import type { TableState, CueParams, CueOption } from '../types';
import { forwardSimulate } from './forward';
import { getCueLabel } from './cue-mapping';

interface Target {
  x: number;
  y: number;
}

export function reverseAnalyze(
  tableState: TableState,
  aimAngle: number,
  target: Target,
  topN = 5,
): CueOption[] {
  const candidates: CueOption[] = [];

  const offsetSteps = [-0.5, -0.3, -0.15, 0, 0.15, 0.3, 0.5];
  const forceSteps = [0.2, 0.35, 0.5, 0.65, 0.8];

  for (const offsetX of offsetSteps) {
    for (const offsetY of offsetSteps) {
      for (const force of forceSteps) {
        const params: CueParams = { aimAngle, offsetX, offsetY, force };
        const result = forwardSimulate(tableState, params);
        const cueTraj = result.trajectories.get(0);
        if (!cueTraj || cueTraj.length === 0) continue;

        const finalPos = cueTraj[cueTraj.length - 1];
        const dx = finalPos.x - target.x;
        const dy = finalPos.y - target.y;
        const deviation = Math.sqrt(dx * dx + dy * dy);

        candidates.push({
          params,
          trajectory: cueTraj,
          deviation,
          label: `${getCueLabel(offsetX, offsetY)} · ${Math.round(force * 100)}%`,
        });
      }
    }
  }

  candidates.sort((a, b) => a.deviation - b.deviation);

  const filtered: CueOption[] = [];
  for (const c of candidates) {
    if (filtered.length >= topN) break;
    const isDuplicate = filtered.some(
      (f) =>
        Math.abs(f.params.offsetX - c.params.offsetX) < 0.1 &&
        Math.abs(f.params.offsetY - c.params.offsetY) < 0.1 &&
        Math.abs(f.params.force - c.params.force) < 0.1,
    );
    if (!isDuplicate) {
      filtered.push(c);
    }
  }

  return filtered;
}
