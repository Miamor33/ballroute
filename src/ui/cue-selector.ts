import { bus } from '../events';
import { MAX_CUE_OFFSET } from '../constants';
import { getCueLabel } from '../analyzer/cue-mapping';

export class CueSelector {
  el: HTMLDivElement;
  offsetX = 0;
  offsetY = 0;
  dragging = false;

  constructor(mount: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'cue-selector';
    this.el.innerHTML = `
      <canvas id="cue-ball-canvas" width="36" height="36"></canvas>
      <span id="cue-label">中杆</span>
    `;
    mount.appendChild(this.el);

    this.injectStyles();
    this.draw();

    const canvas = this.el.querySelector('#cue-ball-canvas') as HTMLCanvasElement;
    canvas.addEventListener('pointerdown', this.onDown.bind(this));
    canvas.addEventListener('pointermove', this.onMove.bind(this));
    canvas.addEventListener('pointerup', this.onUp.bind(this));
  }

  private onDown(e: PointerEvent): void {
    this.dragging = true;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    this.updateFromEvent(e);
  }

  private onMove(e: PointerEvent): void {
    if (!this.dragging) return;
    this.updateFromEvent(e);
  }

  private onUp(_e: PointerEvent): void {
    this.dragging = false;
  }

  private updateFromEvent(e: PointerEvent): void {
    const canvas = this.el.querySelector('#cue-ball-canvas') as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = (e.clientX - rect.left - cx) / cx;
    const dy = -(e.clientY - rect.top - cy) / cy;

    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag > MAX_CUE_OFFSET) {
      this.offsetX = (dx / mag) * MAX_CUE_OFFSET;
      this.offsetY = (dy / mag) * MAX_CUE_OFFSET;
    } else {
      this.offsetX = dx;
      this.offsetY = dy;
    }

    this.draw();
    const label = getCueLabel(this.offsetX, this.offsetY);
    this.el.querySelector('#cue-label')!.textContent = label;
    bus.emit('cue-offset-changed', { offsetX: this.offsetX, offsetY: this.offsetY });
  }

  private draw(): void {
    const canvas = this.el.querySelector('#cue-ball-canvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const r = 16;
    const cx = 18;
    const cy = 18;

    ctx.clearRect(0, 0, 36, 36);

    const grad = ctx.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, r);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.5, '#ddd');
    grad.addColorStop(1, '#aaa');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();

    const dotX = cx + this.offsetX * r / MAX_CUE_OFFSET;
    const dotY = cy - this.offsetY * r / MAX_CUE_OFFSET;
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  getOffset(): { offsetX: number; offsetY: number } {
    return { offsetX: this.offsetX, offsetY: this.offsetY };
  }

  private injectStyles(): void {
    if (document.getElementById('cue-selector-styles')) return;
    const style = document.createElement('style');
    style.id = 'cue-selector-styles';
    style.textContent = `
      #cue-selector { display: flex; align-items: center; gap: 8px; }
      #cue-ball-canvas { cursor: pointer; border-radius: 50%; }
      #cue-label { font-size: 11px; color: #69f0ae; font-weight: 600; }
    `;
    document.head.appendChild(style);
  }
}
