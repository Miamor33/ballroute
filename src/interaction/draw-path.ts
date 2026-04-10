import type { TableRenderer } from '../renderer/renderer';
import { bus } from '../events';

export class DrawPath {
  drawing = false;
  points: { x: number; y: number }[] = [];
  enabled = false;
  canvas: HTMLCanvasElement;
  renderer: TableRenderer;

  constructor(
    canvas: HTMLCanvasElement,
    renderer: TableRenderer,
  ) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.canvas.addEventListener('pointerdown', this.onDown.bind(this));
    this.canvas.addEventListener('pointermove', this.onMove.bind(this));
    this.canvas.addEventListener('pointerup', this.onUp.bind(this));
  }

  enable(): void { this.enabled = true; }
  disable(): void { this.enabled = false; this.drawing = false; this.points = []; }

  private onDown(e: PointerEvent): void {
    if (!this.enabled) return;
    this.drawing = true;
    this.points = [];
    const pos = this.renderer.screenToTable(e.clientX, e.clientY);
    this.points.push(pos);
  }

  private onMove(e: PointerEvent): void {
    if (!this.drawing) return;
    const pos = this.renderer.screenToTable(e.clientX, e.clientY);
    this.points.push(pos);
    bus.emit('path-drawing', { points: [...this.points] });
  }

  private onUp(_e: PointerEvent): void {
    if (!this.drawing) return;
    this.drawing = false;
    if (this.points.length > 2) {
      bus.emit('path-complete', { points: [...this.points] });
    }
    this.points = [];
  }

  getPoints(): { x: number; y: number }[] {
    return this.points;
  }
}
