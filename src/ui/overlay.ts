export class TVOverlay {
  el: HTMLDivElement;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'tv-overlay';
    this.el.innerHTML = `
      <div id="tv-logo">
        <span class="tv-dot">&#9679;</span> BALL ROUTE
      </div>
      <div id="tv-info-bar" class="hidden">
        <span id="tv-cue-label">中杆</span>
        <span class="tv-sep">|</span>
        <span id="tv-force">50%</span>
      </div>
    `;
    root.appendChild(this.el);
    this.injectStyles();
  }

  updateInfo(cueLabel: string, force: number): void {
    const bar = this.el.querySelector('#tv-info-bar')!;
    bar.classList.remove('hidden');
    (this.el.querySelector('#tv-cue-label')! as HTMLElement).textContent = cueLabel;
    (this.el.querySelector('#tv-force')! as HTMLElement).textContent = `${Math.round(force * 100)}%`;
  }

  private injectStyles(): void {
    if (document.getElementById('tv-overlay-styles')) return;
    const style = document.createElement('style');
    style.id = 'tv-overlay-styles';
    style.textContent = `
      #tv-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 50; }
      #tv-logo {
        position: absolute; top: 10px; left: 14px;
        font-size: 14px; font-weight: 800; letter-spacing: 3px;
        color: rgba(255,255,255,0.55);
        text-shadow: 0 1px 6px rgba(0,0,0,0.6);
        font-family: system-ui, sans-serif;
      }
      .tv-dot { color: rgba(79,195,247,0.7); }
      #tv-info-bar {
        position: absolute; bottom: 54px; left: 14px;
        background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
        border-radius: 4px; padding: 5px 12px;
        font-size: 11px; color: #4fc3f7;
        border-left: 3px solid #4fc3f7;
        display: flex; align-items: center; gap: 10px;
        font-family: system-ui, sans-serif;
      }
      #tv-info-bar.hidden { display: none; }
      .tv-sep { color: rgba(255,255,255,0.2); }
      #tv-force { color: #ffeb3b; }
    `;
    document.head.appendChild(style);
  }
}
