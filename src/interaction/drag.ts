import type { Ball } from '../types';
import type { TableRenderer } from '../renderer/renderer';
import { BALL_RADIUS } from '../constants';
import { bus } from '../events';

export class BallDragger {
  private dragging: Ball | null = null;
  private canvas: HTMLCanvasElement;
  private renderer: TableRenderer;
  private getBalls: () => Ball[];

  constructor(
    canvas: HTMLCanvasElement,
    renderer: TableRenderer,
    getBalls: () => Ball[],
  ) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.getBalls = getBalls;
    this.canvas.addEventListener('pointerdown', this.onDown.bind(this));
    this.canvas.addEventListener('pointermove', this.onMove.bind(this));
    this.canvas.addEventListener('pointerup', this.onUp.bind(this));
  }

  private onDown(e: PointerEvent): void {
    const pos = this.renderer.screenToTable(e.clientX, e.clientY);
    const balls = this.getBalls();
    for (const ball of balls) {
      const dx = pos.x - ball.x;
      const dy = pos.y - ball.y;
      if (Math.sqrt(dx * dx + dy * dy) < BALL_RADIUS * 1.5) {
        this.dragging = ball;
        this.canvas.setPointerCapture(e.pointerId);
        return;
      }
    }
  }

  private onMove(e: PointerEvent): void {
    if (!this.dragging) return;
    const pos = this.renderer.screenToTable(e.clientX, e.clientY);
    this.dragging.x = pos.x;
    this.dragging.y = pos.y;
    bus.emit('ball-moved', { ball: this.dragging });
  }

  private onUp(_e: PointerEvent): void {
    if (this.dragging) {
      bus.emit('ball-placed', { ball: this.dragging });
      this.dragging = null;
    }
  }

  isDragging(): boolean {
    return this.dragging !== null;
  }
}
