import type { CueOption } from '../types';

export class ResultPanel {
  el: HTMLDivElement;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'result-panel';
    this.el.classList.add('hidden');
    root.appendChild(this.el);
    this.injectStyles();
  }

  show(options: CueOption[]): void {
    this.el.classList.remove('hidden');
    const best = options[0];
    const alts = options.slice(1, 4);

    this.el.innerHTML = `
      <div class="rp-header">
        <span>分析结果</span>
        <button id="rp-close" class="rp-close-btn">✕</button>
      </div>
      <div class="rp-best">
        <div class="rp-best-label">推荐杆法</div>
        <div class="rp-best-card">
          <div class="rp-best-name">${best.label}</div>
          <div class="rp-best-stats">
            <span>力度 ${Math.round(best.params.force * 100)}%</span>
            <span>偏差 ±${Math.round(best.deviation)}mm</span>
          </div>
        </div>
      </div>
      ${alts.length > 0 ? `
        <div class="rp-section-title">备选方案</div>
        <div class="rp-alts">
          ${alts.map((opt) => `
            <div class="rp-alt-item">
              <div class="rp-alt-name">${opt.label}</div>
              <div class="rp-alt-stats">偏差 ±${Math.round(opt.deviation)}mm</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;

    this.el.querySelector('#rp-close')!.addEventListener('click', () => this.hide());
  }

  hide(): void {
    this.el.classList.add('hidden');
  }

  private injectStyles(): void {
    if (document.getElementById('result-panel-styles')) return;
    const style = document.createElement('style');
    style.id = 'result-panel-styles';
    style.textContent = `
      #result-panel {
        position: fixed; top: 0; right: 0; bottom: 0; width: 35%;
        max-width: 320px; min-width: 240px;
        background: linear-gradient(270deg, rgba(15,17,36,0.97), rgba(15,17,36,0.92) 90%, transparent);
        backdrop-filter: blur(12px); padding: 16px; z-index: 90;
        overflow-y: auto; transition: transform 0.3s ease;
        color: #e0e0e0; font-family: system-ui, sans-serif;
      }
      #result-panel.hidden { transform: translateX(100%); }
      .rp-header {
        display: flex; justify-content: space-between; align-items: center;
        font-size: 13px; font-weight: 700; color: #64b5f6; margin-bottom: 12px;
      }
      .rp-close-btn {
        background: none; border: none; color: #90a4ae; font-size: 16px; cursor: pointer;
      }
      .rp-best-card {
        background: linear-gradient(135deg, rgba(27,94,32,0.35), rgba(27,94,32,0.1));
        border: 1px solid rgba(76,175,80,0.25); border-radius: 8px;
        padding: 12px; margin-bottom: 12px;
      }
      .rp-best-label { font-size: 12px; color: #a5d6a7; margin-bottom: 6px; }
      .rp-best-name { font-size: 16px; font-weight: 700; color: #69f0ae; }
      .rp-best-stats {
        display: flex; gap: 12px; font-size: 11px; color: #a5d6a7; margin-top: 6px;
      }
      .rp-section-title {
        font-size: 11px; font-weight: 600; color: #64b5f6; margin-bottom: 8px;
      }
      .rp-alts { background: rgba(255,255,255,0.04); border-radius: 8px; }
      .rp-alt-item {
        padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04);
      }
      .rp-alt-item:last-child { border-bottom: none; }
      .rp-alt-name { font-size: 13px; color: white; }
      .rp-alt-stats { font-size: 10px; color: #90a4ae; margin-top: 3px; }
    `;
    document.head.appendChild(style);
  }
}
