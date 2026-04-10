import { TableRenderer } from './renderer/renderer';
import { DEFAULT_TABLE_CONFIG } from './constants';
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

renderer.render(tableState);

window.addEventListener('resize', () => {
  renderer.resize();
  renderer.render(tableState);
});
