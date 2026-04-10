import { bus } from '../events';

export class ForceSlider {
  el: HTMLDivElement;
  force = 0.5;

  constructor(mount: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'force-control';
    this.el.innerHTML = `
      <input type="range" id="force-range" min="0" max="100" value="50" />
      <span id="force-value" style="font-size:11px;color:#ffeb3b;font-weight:600;min-width:32px;text-align:right;">50%</span>
    `;
    mount.appendChild(this.el);

    const input = this.el.querySelector('#force-range') as HTMLInputElement;
    input.addEventListener('input', () => {
      this.force = parseInt(input.value) / 100;
      this.el.querySelector('#force-value')!.textContent = `${input.value}%`;
      bus.emit('force-changed', { force: this.force });
    });

    this.injectStyles();
  }

  getForce(): number {
    return this.force;
  }

  private injectStyles(): void {
    if (document.getElementById('force-slider-styles')) return;
    const style = document.createElement('style');
    style.id = 'force-slider-styles';
    style.textContent = `
      #force-control { display: flex; align-items: center; gap: 6px; flex: 1; }
      #force-range {
        flex: 1; height: 4px; -webkit-appearance: none; appearance: none;
        background: linear-gradient(90deg, #4caf50, #ffeb3b, #ff5722);
        border-radius: 2px; outline: none;
      }
      #force-range::-webkit-slider-thumb {
        -webkit-appearance: none; width: 14px; height: 14px;
        background: white; border-radius: 50%; cursor: pointer;
        box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      }
    `;
    document.head.appendChild(style);
  }
}
