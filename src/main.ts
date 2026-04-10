import { TableRenderer } from './renderer/renderer';
import { InteractionManager } from './interaction/manager';
import { DEFAULT_TABLE_CONFIG } from './constants';
import { bus } from './events';
import type { TableState } from './types';

const canvas = document.getElementById('table-canvas') as HTMLCanvasElement;
const renderer = new TableRenderer(canvas);

const tableState: TableState = {
  tableConfig: DEFAULT_TABLE_CONFIG,
  balls: [
    { id: 0, x: 635, y: 635, type: 'cue', number: 0, pocketed: false },
    { id: 1, x: 1400, y: 500, type: 'solid', number: 1, pocketed: false },
    { id: 2, x: 1600, y: 750, type: 'solid', number: 2, pocketed: false },
    { id: 3, x: 1800, y: 400, type: 'solid', number: 3, pocketed: false },
    { id: 8, x: 1270, y: 635, type: 'eight', number: 8, pocketed: false },
    { id: 11, x: 1500, y: 900, type: 'stripe', number: 11, pocketed: false },
  ],
};

const interaction = new InteractionManager(canvas, renderer, tableState);

let currentAimLine: { fromX: number; fromY: number; toX: number; toY: number } | undefined;

bus.on('ball-moved', () => requestRender());
bus.on('ball-placed', () => requestRender());
bus.on('aim-changed', (data: { angle: number; targetX: number; targetY: number }) => {
  const cueBall = tableState.balls.find((b) => b.type === 'cue');
  if (cueBall) {
    currentAimLine = {
      fromX: cueBall.x, fromY: cueBall.y,
      toX: data.targetX, toY: data.targetY,
    };
  }
  requestRender();
});

let renderPending = false;
function requestRender(): void {
  if (renderPending) return;
  renderPending = true;
  requestAnimationFrame(() => {
    renderer.render(tableState, undefined, currentAimLine);
    renderPending = false;
  });
}

renderer.render(tableState);

void interaction;

window.addEventListener('resize', () => {
  renderer.resize();
  requestRender();
});
