import type { TableState, CueParams, SimulationResult, BallState } from '../types';
import { PhysicsEngine } from '../physics/engine';
import { cueParamsToBallState } from './cue-mapping';

export function forwardSimulate(
  tableState: TableState,
  cueParams: CueParams,
): SimulationResult {
  const engine = new PhysicsEngine(tableState.tableConfig);

  const ballStates: BallState[] = tableState.balls.map((ball) => {
    if (ball.type === 'cue') {
      return cueParamsToBallState(ball, cueParams);
    }
    return {
      id: ball.id,
      x: ball.x,
      y: ball.y,
      vx: 0, vy: 0,
      wx: 0, wy: 0, wz: 0,
      pocketed: ball.pocketed,
    };
  });

  return engine.simulate(ballStates);
}
