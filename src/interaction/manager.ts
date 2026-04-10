import type { TableState } from '../types';
import type { TableRenderer } from '../renderer/renderer';
import { BallDragger } from './drag';
import { AimController } from './aim';

export class InteractionManager {
  canvas: HTMLCanvasElement;
  renderer: TableRenderer;
  tableState: TableState;
  dragger: BallDragger;
  aim: AimController;

  constructor(
    canvas: HTMLCanvasElement,
    renderer: TableRenderer,
    tableState: TableState,
  ) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.tableState = tableState;

    this.dragger = new BallDragger(
      canvas, renderer,
      () => this.tableState.balls,
    );

    this.aim = new AimController(
      canvas, renderer,
      () => this.tableState.balls.find((b) => b.type === 'cue'),
      () => this.dragger.isDragging(),
    );
  }

  getAimAngle(): number {
    return this.aim.getAimAngle();
  }

  updateTableState(state: TableState): void {
    this.tableState = state;
  }
}
