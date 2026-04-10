import type { Ball } from '../types';
import { DEFAULT_TABLE_CONFIG } from '../constants';

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  balls: Ball[];
}

const W = DEFAULT_TABLE_CONFIG.width;
const H = DEFAULT_TABLE_CONFIG.height;

export const PRESETS: PresetScenario[] = [
  {
    id: 'straight-follow',
    name: '直线跟进/缩回',
    description: '白球和目标球在一条直线上，练习高杆跟进和低杆缩回',
    balls: [
      { id: 0, x: W * 0.25, y: H / 2, type: 'cue', number: 0, pocketed: false },
      { id: 1, x: W * 0.55, y: H / 2, type: 'solid', number: 1, pocketed: false },
    ],
  },
  {
    id: 'position-short',
    name: '定点走位 - 近距离',
    description: '短距离击球后白球走位到指定区域',
    balls: [
      { id: 0, x: W * 0.3, y: H * 0.5, type: 'cue', number: 0, pocketed: false },
      { id: 1, x: W * 0.5, y: H * 0.35, type: 'solid', number: 1, pocketed: false },
      { id: 2, x: W * 0.65, y: H * 0.7, type: 'solid', number: 2, pocketed: false },
    ],
  },
  {
    id: 'position-long',
    name: '定点走位 - 远距离',
    description: '长台击球后的走位控制',
    balls: [
      { id: 0, x: W * 0.15, y: H * 0.5, type: 'cue', number: 0, pocketed: false },
      { id: 1, x: W * 0.75, y: H * 0.4, type: 'solid', number: 1, pocketed: false },
    ],
  },
  {
    id: 'one-cushion',
    name: '一库走位',
    description: '白球碰撞后需要打一个库边到达目标区域',
    balls: [
      { id: 0, x: W * 0.25, y: H * 0.6, type: 'cue', number: 0, pocketed: false },
      { id: 1, x: W * 0.5, y: H * 0.4, type: 'solid', number: 1, pocketed: false },
      { id: 2, x: W * 0.7, y: H * 0.75, type: 'solid', number: 2, pocketed: false },
    ],
  },
  {
    id: 'two-cushion',
    name: '两库走位',
    description: '白球碰撞后需要打两个库边',
    balls: [
      { id: 0, x: W * 0.2, y: H * 0.3, type: 'cue', number: 0, pocketed: false },
      { id: 1, x: W * 0.45, y: H * 0.5, type: 'solid', number: 1, pocketed: false },
    ],
  },
  {
    id: 'english-practice',
    name: '塞球走位',
    description: '练习侧旋对库边反弹角的影响',
    balls: [
      { id: 0, x: W * 0.3, y: H * 0.5, type: 'cue', number: 0, pocketed: false },
      { id: 1, x: W * 0.6, y: H * 0.2, type: 'solid', number: 1, pocketed: false },
    ],
  },
];
