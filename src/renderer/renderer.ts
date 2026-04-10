import type { TableState, SimulationResult } from '../types';
import { computeTransform, drawTable, type RenderTransform } from './table';
import { drawBall } from './balls';
import { drawTrajectory, drawAimLine } from './trajectory';

export class TableRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private transform!: RenderTransform;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  getTransform(tableState: TableState): RenderTransform {
    this.transform = computeTransform(
      this.canvas.width,
      this.canvas.height,
      tableState.tableConfig,
    );
    return this.transform;
  }

  render(
    tableState: TableState,
    simulationResult?: SimulationResult,
    aimLine?: { fromX: number; fromY: number; toX: number; toY: number },
  ): void {
    const { ctx, canvas } = this;
    this.transform = this.getTransform(tableState);

    ctx.fillStyle = '#060610';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawTable(ctx, tableState.tableConfig, this.transform);

    if (aimLine) {
      drawAimLine(ctx, aimLine.fromX, aimLine.fromY, aimLine.toX, aimLine.toY, this.transform);
    }

    if (simulationResult) {
      const cueTraj = simulationResult.trajectories.get(0);
      if (cueTraj) {
        drawTrajectory(ctx, cueTraj, this.transform, '#4fc3f7');
      }
      simulationResult.trajectories.forEach((traj, id) => {
        if (id !== 0) {
          drawTrajectory(ctx, traj, this.transform, 'rgba(255,235,59,0.3)', [5, 4]);
        }
      });
    }

    for (const ball of tableState.balls) {
      drawBall(ctx, ball, this.transform);
    }
  }

  screenToTable(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.transform.offsetX) / this.transform.scale,
      y: (sy - this.transform.offsetY) / this.transform.scale,
    };
  }

  tableToScreen(tx: number, ty: number): { x: number; y: number } {
    return {
      x: tx * this.transform.scale + this.transform.offsetX,
      y: ty * this.transform.scale + this.transform.offsetY,
    };
  }
}