export interface TableConfig {
  width: number;
  height: number;
  ballDiameter: number;
  pocketRadius: {
    corner: number;
    side: number;
  };
}

export interface Ball {
  id: number;
  x: number;
  y: number;
  type: 'cue' | 'solid' | 'stripe' | 'eight';
  number: number;
  pocketed: boolean;
}

export interface BallState {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  wx: number;
  wy: number;
  wz: number;
  pocketed: boolean;
}

export interface CueParams {
  aimAngle: number;
  offsetX: number;
  offsetY: number;
  force: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  t: number;
  vx: number;
  vy: number;
  spin: { wx: number; wy: number; wz: number };
}

export interface CollisionEvent {
  type: 'ball-ball' | 'ball-cushion' | 'ball-pocket';
  t: number;
  ballId: number;
  targetId?: number;
  position: { x: number; y: number };
}

export interface SimulationResult {
  trajectories: Map<number, TrajectoryPoint[]>;
  events: CollisionEvent[];
}

export interface CueOption {
  params: CueParams;
  trajectory: TrajectoryPoint[];
  deviation: number;
  label: string;
}

export interface TableState {
  balls: Ball[];
  tableConfig: TableConfig;
}

export type AnalysisMode = 'forward' | 'reverse-click' | 'reverse-draw';
