import type { TableConfig } from './types';

export const DEFAULT_TABLE_CONFIG: TableConfig = {
  width: 2540,
  height: 1270,
  ballDiameter: 57.15,
  pocketRadius: {
    corner: 42,
    side: 38,
  },
};

export const BALL_RADIUS = DEFAULT_TABLE_CONFIG.ballDiameter / 2;
export const BALL_MASS = 0.170; // kg

export const SLIDING_FRICTION = 0.2;
export const ROLLING_FRICTION = 0.01;
export const BALL_BALL_RESTITUTION = 0.95;
export const CUSHION_RESTITUTION = 0.8;

export const GRAVITY = 9800; // mm/s²

export const SIM_DT = 0.0005; // 0.5ms time step
export const SIM_MAX_TIME = 20; // 20 seconds max
export const SIM_VELOCITY_THRESHOLD = 0.1; // mm/s, below this ball is "stopped"

export const MAX_CUE_OFFSET = 0.7; // max offset ratio before miscue
