import { bus } from '../events';

export class Toolbar {
  el: HTMLDivElement;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'toolbar';
    this.el.innerHTML = `
      <div class="toolbar-inner">
        <div id="cue-selector-mount"></div>
        <div id="force-slider-mount"></div>
        <div class="toolbar-actions">
          <button id="btn-simulate" class="toolbar-btn">🎯 模拟</button>
          <button id="btn-reverse" class="toolbar-btn">🔍 反向</button>
          <button id="btn-scenarios" class="toolbar-btn">📋 球局</button>
        </div>
      </div>
    `;
    root.appendChild(this.el);

    this.el.querySelector('#btn-simulate')!.addEventListener('click', () => {
      bus.emit('simulate-requested', {});
    });
    this.el.querySelector('#btn-reverse')!.addEventListener('click', () => {
      bus.emit('mode-change', { mode: 'reverse-click' });
    });

    this.injectStyles();
  }

  private injectStyles(): void {
    if (document.getElementById('toolbar-styles')) return;
    const style = document.createElement('style');
    style.id = 'toolbar-styles';
    style.textContent = `
      #toolbar {
        position: fixed; bottom: 0; left: 0; right: 0; height: 48px;
        background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 100%);
        display: flex; align-items: flex-end; padding: 0 14px 10px; z-index: 100;
      }
      .toolbar-inner {
        display: flex; align-items: center; gap: 12px; width: 100%;
      }
      .toolbar-actions { display: flex; gap: 6px; margin-left: auto; }
      .toolbar-btn {
        padding: 6px 14px; border-radius: 16px; font-size: 11px;
        background: rgba(255,255,255,0.1); color: #b0bec5; border: none;
        cursor: pointer; backdrop-filter: blur(4px); white-space: nowrap;
      }
      .toolbar-btn:active { background: rgba(255,255,255,0.2); }
    `;
    document.head.appendChild(style);
  }
}
