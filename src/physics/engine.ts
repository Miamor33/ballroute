import type { BallState, TableConfig, SimulationResult, TrajectoryPoint, CollisionEvent } from '../types';
import { SIM_DT, SIM_MAX_TIME, SIM_VELOCITY_THRESHOLD } from '../constants';
import { updateBallState, isStopped } from './motion';
import { detectBallBallCollision, resolveBallBallCollision, detectCushionCollision, resolveCushionCollision } from './collision';
import { detectPocket } from './pocket';

export class PhysicsEngine {
  private config: TableConfig;
  constructor(config: TableConfig) { this.config = config; }

  simulate(initialBalls: BallState[]): SimulationResult {
    const trajectories = new Map<number, TrajectoryPoint[]>();
    const events: CollisionEvent[] = [];
    let balls = initialBalls.map((b) => ({ ...b }));

    for (const ball of balls) {
      trajectories.set(ball.id, [this.toTrajectoryPoint(ball, 0)]);
    }

    const maxSteps = Math.floor(SIM_MAX_TIME / SIM_DT);
    const recordInterval = Math.floor(0.005 / SIM_DT);

    for (let step = 0; step < maxSteps; step++) {
      const t = step * SIM_DT;

      balls = balls.map((ball) => {
        if (ball.pocketed) return ball;
        return updateBallState(ball, SIM_DT);
      });

      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          if (detectBallBallCollision(balls[i], balls[j])) {
            const [ra, rb] = resolveBallBallCollision(balls[i], balls[j]);
            balls[i] = ra;
            balls[j] = rb;
            events.push({
              type: 'ball-ball', t, ballId: balls[i].id,
              targetId: balls[j].id,
              position: { x: (ra.x + rb.x) / 2, y: (ra.y + rb.y) / 2 },
            });
          }
        }
      }

      for (let i = 0; i < balls.length; i++) {
        const ball = balls[i];
        if (ball.pocketed) continue;

        if (detectPocket(ball, this.config)) {
          balls[i] = { ...ball, pocketed: true, vx: 0, vy: 0, wx: 0, wy: 0, wz: 0 };
          events.push({
            type: 'ball-pocket', t, ballId: ball.id,
            position: { x: ball.x, y: ball.y },
          });
          continue;
        }

        const cushion = detectCushionCollision(ball, this.config);
        if (cushion) {
          balls[i] = resolveCushionCollision(ball, cushion.side);
          events.push({
            type: 'ball-cushion', t, ballId: ball.id,
            position: { x: ball.x, y: ball.y },
          });
        }
      }

      if (step % recordInterval === 0) {
        for (const ball of balls) {
          trajectories.get(ball.id)?.push(this.toTrajectoryPoint(ball, t));
        }
      }

      const allStopped = balls.every((b) => b.pocketed || isStopped(b, SIM_VELOCITY_THRESHOLD));
      if (allStopped) {
        for (const ball of balls) {
          trajectories.get(ball.id)?.push(this.toTrajectoryPoint(ball, t));
        }
        break;
      }
    }

    return { trajectories, events };
  }

  private toTrajectoryPoint(ball: BallState, t: number): TrajectoryPoint {
    return {
      x: ball.x, y: ball.y, t,
      vx: ball.vx, vy: ball.vy,
      spin: { wx: ball.wx, wy: ball.wy, wz: ball.wz },
    };
  }
}
