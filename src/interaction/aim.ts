import type { Ball } from '../types';
import type { TableRenderer } from '../renderer/renderer';
import { BALL_RADIUS } from '../constants';
import { bus } from '../events';

export class AimController {
  private aiming = false;
  private aimAngle = 0;
  private canvas: HTMLCanvasElement;
  private renderer: TableRenderer;
  private getCueBall: () => Ball | undefined;
  private isDragging: () => boolean;

  constructor(
    canvas: HTMLCanvasElement,
    renderer: TableRenderer,
    getCueBall: () => Ball | undefined,
    isDragging: () => boolean,
  ) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.getCueBall = getCueBall;
    this.isDragging = isDragging;
    this.canvas.addEventListener('pointerdown', this.onDown.bind(this));
    this.canvas.addEventListener('pointermove', this.onMove.bind(this));
    this.canvas.addEventListener('pointerup', this.onUp.bind(this));
  }

  private onDown(e: PointerEvent): void {
    if (this.isDragging()) return;
    const cueBall = this.getCueBall();
    if (!cueBall) return;

    const pos = this.renderer.screenToTable(e.clientX, e.clientY);
    const dx = pos.x - cueBall.x;
    const dy = pos.y - cueBall.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > BALL_RADIUS * 1.5 && dist < BALL_RADIUS * 10) {
      this.aiming = true;
      this.updateAngle(pos.x, pos.y, cueBall);
    }
  }

  private onMove(e: PointerEvent): void {
    if (!this.aiming) return;
    const cueBall = this.getCueBall();
    if (!cueBall) return;
    const pos = this.renderer.screenToTable(e.clientX, e.clientY);
    this.updateAngle(pos.x, pos.y, cueBall);
  }

  private onUp(_e: PointerEvent): void {
    this.aiming = false;
  }

  private updateAngle(targetX: number, targetY: number, cueBall: Ball): void {
    this.aimAngle = Math.atan2(targetY - cueBall.y, targetX - cueBall.x);
    bus.emit('aim-changed', { angle: this.aimAngle, targetX, targetY });
  }

  getAimAngle(): number {
    return this.aimAngle;
  }

  isAiming(): boolean {
    return this.aiming;
  }
}
