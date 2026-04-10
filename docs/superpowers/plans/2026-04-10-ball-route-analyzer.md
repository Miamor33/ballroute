# Ball Route 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个纯前端台球白球走位分析工具，支持正向模拟（杆法→轨迹）和反向分析（目标位置→杆法），面向中式八球进阶玩家。

**Architecture:** TypeScript + Vite + HTML5 Canvas 2D，自研物理引擎处理球体运动/旋转/摩擦/碰撞/库边反弹。模块化拆分为 PhysicsEngine、CueAnalyzer、TableRenderer、InteractionManager、ScenarioManager 五个核心模块，事件驱动通信。横屏全屏沉浸式 UI，TV 直播风格。

**Tech Stack:** TypeScript (strict), Vite, HTML5 Canvas 2D, Vitest (testing), localStorage (persistence)

**Spec:** `docs/superpowers/specs/2026-04-10-ball-route-analyzer-design.md`

---

## File Structure

```
ballgame/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── src/
│   ├── main.ts                          # 入口，初始化各模块
│   ├── constants.ts                     # 物理常量、球台参数
│   ├── types.ts                         # 所有接口/类型定义
│   ├── events.ts                        # 事件总线
│   ├── physics/
│   │   ├── motion.ts                    # 球体运动与摩擦模型
│   │   ├── collision.ts                 # 球-球、球-库边碰撞
│   │   ├── pocket.ts                    # 袋口检测
│   │   └── engine.ts                    # PhysicsEngine 主循环
│   ├── analyzer/
│   │   ├── forward.ts                   # 正向模拟
│   │   ├── reverse.ts                   # 反向推算
│   │   └── cue-mapping.ts              # 杆法参数→初始状态映射
│   ├── renderer/
│   │   ├── table.ts                     # 球台渲染（框/呢/袋口/钻石点）
│   │   ├── balls.ts                     # 球体渲染
│   │   ├── trajectory.ts               # 轨迹线渲染
│   │   └── renderer.ts                 # TableRenderer 主控
│   ├── interaction/
│   │   ├── drag.ts                      # 球拖放
│   │   ├── aim.ts                       # 瞄准线交互
│   │   ├── draw-path.ts                 # 画线模式
│   │   └── manager.ts                   # InteractionManager 主控
│   ├── ui/
│   │   ├── toolbar.ts                   # 底部工具栏
│   │   ├── cue-selector.ts             # 击球点选择器
│   │   ├── force-slider.ts             # 力度滑条
│   │   ├── result-panel.ts             # 右侧结果面板
│   │   └── mode-switch.ts              # 模式切换
│   └── scenario/
│       ├── manager.ts                   # ScenarioManager
│       └── presets.ts                   # 预设球局数据
├── tests/
│   ├── physics/
│   │   ├── motion.test.ts
│   │   ├── collision.test.ts
│   │   ├── pocket.test.ts
│   │   └── engine.test.ts
│   ├── analyzer/
│   │   ├── forward.test.ts
│   │   ├── reverse.test.ts
│   │   └── cue-mapping.test.ts
│   └── scenario/
│       └── manager.test.ts
└── public/
    └── (static assets if needed)
```

---

### Task 1: 项目脚手架

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.ts`, `src/types.ts`, `src/constants.ts`, `src/events.ts`

- [ ] **Step 1: 初始化 Vite + TypeScript 项目**

```bash
cd /Users/czhmac/IdeaProjects/ballgame
npm create vite@latest . -- --template vanilla-ts
```

选择覆盖现有文件。安装后删除默认的 `src/counter.ts`、`src/style.css` 等模板文件。

- [ ] **Step 2: 安装开发依赖**

```bash
npm install
npm install -D vitest
```

- [ ] **Step 3: 配置 vitest**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

在 `package.json` 中添加 test script：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 4: 创建 `src/types.ts` — 所有类型定义**

```typescript
export interface TableConfig {
  width: number;
  height: number;
  ballDiameter: number;
  pocketRadius: {
    corner: number;
    side: number;
  };
}

export interface Ball {
  id: number;
  x: number;
  y: number;
  type: 'cue' | 'solid' | 'stripe' | 'eight';
  number: number;
  pocketed: boolean;
}

export interface BallState {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  wx: number;
  wy: number;
  wz: number;
  pocketed: boolean;
}

export interface CueParams {
  aimAngle: number;
  offsetX: number;
  offsetY: number;
  force: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  t: number;
  vx: number;
  vy: number;
  spin: { wx: number; wy: number; wz: number };
}

export interface CollisionEvent {
  type: 'ball-ball' | 'ball-cushion' | 'ball-pocket';
  t: number;
  ballId: number;
  targetId?: number;
  position: { x: number; y: number };
}

export interface SimulationResult {
  trajectories: Map<number, TrajectoryPoint[]>;
  events: CollisionEvent[];
}

export interface CueOption {
  params: CueParams;
  trajectory: TrajectoryPoint[];
  deviation: number;
  label: string;
}

export interface TableState {
  balls: Ball[];
  tableConfig: TableConfig;
}

export type AnalysisMode = 'forward' | 'reverse-click' | 'reverse-draw';
```

- [ ] **Step 5: 创建 `src/constants.ts` — 物理常量**

```typescript
import type { TableConfig } from './types';

export const DEFAULT_TABLE_CONFIG: TableConfig = {
  width: 2540,
  height: 1270,
  ballDiameter: 57.15,
  pocketRadius: {
    corner: 42,
    side: 38,
  },
};

export const BALL_RADIUS = DEFAULT_TABLE_CONFIG.ballDiameter / 2;
export const BALL_MASS = 0.170; // kg

export const SLIDING_FRICTION = 0.2;
export const ROLLING_FRICTION = 0.01;
export const BALL_BALL_RESTITUTION = 0.95;
export const CUSHION_RESTITUTION = 0.8;

export const GRAVITY = 9800; // mm/s²

export const SIM_DT = 0.0005; // 0.5ms time step
export const SIM_MAX_TIME = 20; // 20 seconds max
export const SIM_VELOCITY_THRESHOLD = 0.1; // mm/s, below this ball is "stopped"

export const MAX_CUE_OFFSET = 0.7; // max offset ratio before miscue
```

- [ ] **Step 6: 创建 `src/events.ts` — 事件总线**

```typescript
type Listener<T = any> = (data: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<Listener>>();

  on<T>(event: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  emit<T>(event: string, data: T): void {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }

  off(event: string): void {
    this.listeners.delete(event);
  }
}

export const bus = new EventBus();
```

- [ ] **Step 7: 创建 `index.html` 骨架**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>Ball Route — 台球走位分析</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #060610; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="table-canvas"></canvas>
  <div id="ui-root"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 8: 创建 `src/main.ts` 入口占位**

```typescript
const canvas = document.getElementById('table-canvas') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

console.log('Ball Route initialized', canvas.width, canvas.height);
```

- [ ] **Step 9: 验证项目可运行**

```bash
npm run dev
```

Expected: 浏览器打开后看到黑色背景，控制台输出 "Ball Route initialized"。

```bash
npm run test
```

Expected: 没有测试文件，无错误退出。

- [ ] **Step 10: 提交**

```bash
git init
echo "node_modules\ndist\n.superpowers" > .gitignore
git add -A
git commit -m "chore: scaffold Vite + TypeScript project with types and constants"
```

---

### Task 2: 物理引擎 — 球体运动与摩擦模型

**Files:**
- Create: `src/physics/motion.ts`
- Test: `tests/physics/motion.test.ts`

- [ ] **Step 1: 编写运动模型测试**

Create `tests/physics/motion.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { updateBallState, isRolling, contactPointVelocity } from '../src/physics/motion';
import type { BallState } from '../src/types';
import { BALL_RADIUS } from '../src/constants';

function makeBall(overrides: Partial<BallState> = {}): BallState {
  return {
    id: 0, x: 500, y: 500, vx: 0, vy: 0,
    wx: 0, wy: 0, wz: 0, pocketed: false,
    ...overrides,
  };
}

describe('contactPointVelocity', () => {
  it('returns zero for stationary ball', () => {
    const ball = makeBall();
    const v = contactPointVelocity(ball);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(0);
  });

  it('is nonzero when linear and angular velocity mismatch', () => {
    const ball = makeBall({ vx: 1000, vy: 0, wx: 0, wy: 0 });
    const v = contactPointVelocity(ball);
    expect(v.x).not.toBeCloseTo(0);
  });

  it('is zero for pure rolling', () => {
    const vx = 1000;
    const ball = makeBall({ vx, vy: 0, wx: -vx / BALL_RADIUS, wy: 0 });
    const v = contactPointVelocity(ball);
    expect(v.x).toBeCloseTo(0, 0);
    expect(v.y).toBeCloseTo(0, 0);
  });
});

describe('isRolling', () => {
  it('returns true for pure rolling ball', () => {
    const vx = 1000;
    const ball = makeBall({ vx, vy: 0, wx: -vx / BALL_RADIUS, wy: 0 });
    expect(isRolling(ball)).toBe(true);
  });

  it('returns false for sliding ball', () => {
    const ball = makeBall({ vx: 1000, vy: 0, wx: 0, wy: 0 });
    expect(isRolling(ball)).toBe(false);
  });
});

describe('updateBallState', () => {
  it('sliding ball decelerates', () => {
    const ball = makeBall({ vx: 1000, vy: 0 });
    const dt = 0.001;
    const next = updateBallState(ball, dt);
    expect(Math.abs(next.vx)).toBeLessThan(Math.abs(ball.vx));
  });

  it('rolling ball decelerates slower than sliding', () => {
    const vx = 1000;
    const slidingBall = makeBall({ vx, vy: 0, wx: 0, wy: 0 });
    const rollingBall = makeBall({ vx, vy: 0, wx: -vx / BALL_RADIUS, wy: 0 });
    const dt = 0.001;
    const nextSliding = updateBallState(slidingBall, dt);
    const nextRolling = updateBallState(rollingBall, dt);
    const slidingDecel = Math.abs(slidingBall.vx - nextSliding.vx);
    const rollingDecel = Math.abs(rollingBall.vx - nextRolling.vx);
    expect(slidingDecel).toBeGreaterThan(rollingDecel);
  });

  it('ball position updates based on velocity', () => {
    const ball = makeBall({ vx: 1000, vy: 500 });
    const dt = 0.01;
    const next = updateBallState(ball, dt);
    expect(next.x).toBeGreaterThan(ball.x);
    expect(next.y).toBeGreaterThan(ball.y);
  });

  it('stationary ball stays stationary', () => {
    const ball = makeBall();
    const next = updateBallState(ball, 0.001);
    expect(next.x).toBe(ball.x);
    expect(next.y).toBe(ball.y);
    expect(next.vx).toBe(0);
    expect(next.vy).toBe(0);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/physics/motion.test.ts
```

Expected: FAIL — 模块不存在。

- [ ] **Step 3: 实现 `src/physics/motion.ts`**

```typescript
import type { BallState } from '../types';
import {
  BALL_RADIUS, SLIDING_FRICTION, ROLLING_FRICTION, GRAVITY,
} from '../constants';

export interface Vec2 {
  x: number;
  y: number;
}

export function contactPointVelocity(ball: BallState): Vec2 {
  return {
    x: ball.vx + ball.wy * BALL_RADIUS,
    y: ball.vy - ball.wx * BALL_RADIUS,
  };
}

export function isRolling(ball: BallState, threshold = 1): boolean {
  const cp = contactPointVelocity(ball);
  return Math.sqrt(cp.x * cp.x + cp.y * cp.y) < threshold;
}

export function isStopped(ball: BallState, threshold = 0.1): boolean {
  const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  const spin = Math.sqrt(ball.wx * ball.wx + ball.wy * ball.wy + ball.wz * ball.wz);
  return speed < threshold && spin * BALL_RADIUS < threshold;
}

export function updateBallState(ball: BallState, dt: number): BallState {
  if (ball.pocketed || isStopped(ball)) {
    return { ...ball };
  }

  let { vx, vy, wx, wy, wz } = ball;

  const rolling = isRolling(ball);

  if (rolling) {
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > 0) {
      const decel = ROLLING_FRICTION * GRAVITY * dt;
      const factor = Math.max(0, 1 - decel / speed);
      vx *= factor;
      vy *= factor;
      wx = -vy / BALL_RADIUS;
      wy = vx / BALL_RADIUS;
    }
  } else {
    const cp = contactPointVelocity(ball);
    const cpSpeed = Math.sqrt(cp.x * cp.x + cp.y * cp.y);

    if (cpSpeed > 0) {
      const frictionAccel = SLIDING_FRICTION * GRAVITY;
      const dvx = -(cp.x / cpSpeed) * frictionAccel * dt;
      const dvy = -(cp.y / cpSpeed) * frictionAccel * dt;

      vx += dvx;
      vy += dvy;

      const inertiaFactor = 2 / 5;
      wx += (dvy / BALL_RADIUS) / inertiaFactor;
      wy -= (dvx / BALL_RADIUS) / inertiaFactor;
    }
  }

  const spinDecel = 0.01 * GRAVITY * dt;
  const spinSpeed = Math.abs(wz);
  if (spinSpeed > 0) {
    wz *= Math.max(0, 1 - spinDecel / (spinSpeed * BALL_RADIUS));
  }

  const x = ball.x + vx * dt;
  const y = ball.y + vy * dt;

  return { ...ball, x, y, vx, vy, wx, wy, wz };
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run tests/physics/motion.test.ts
```

Expected: 全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/physics/motion.ts tests/physics/motion.test.ts
git commit -m "feat: implement ball motion and friction model with sliding-to-rolling transition"
```

---

### Task 3: 物理引擎 — 碰撞模型

**Files:**
- Create: `src/physics/collision.ts`
- Test: `tests/physics/collision.test.ts`

- [ ] **Step 1: 编写碰撞测试**

Create `tests/physics/collision.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  detectBallBallCollision,
  resolveBallBallCollision,
  detectCushionCollision,
  resolveCushionCollision,
} from '../src/physics/collision';
import type { BallState } from '../src/types';
import { BALL_RADIUS, DEFAULT_TABLE_CONFIG } from '../src/constants';

function makeBall(overrides: Partial<BallState> = {}): BallState {
  return {
    id: 0, x: 500, y: 500, vx: 0, vy: 0,
    wx: 0, wy: 0, wz: 0, pocketed: false,
    ...overrides,
  };
}

describe('detectBallBallCollision', () => {
  it('detects overlapping balls', () => {
    const a = makeBall({ id: 0, x: 100, y: 100 });
    const b = makeBall({ id: 1, x: 100 + BALL_RADIUS * 1.5, y: 100 });
    expect(detectBallBallCollision(a, b)).toBe(true);
  });

  it('no collision for distant balls', () => {
    const a = makeBall({ id: 0, x: 100, y: 100 });
    const b = makeBall({ id: 1, x: 300, y: 300 });
    expect(detectBallBallCollision(a, b)).toBe(false);
  });

  it('no collision for exactly touching balls', () => {
    const a = makeBall({ id: 0, x: 100, y: 100 });
    const b = makeBall({ id: 1, x: 100 + BALL_RADIUS * 2, y: 100 });
    expect(detectBallBallCollision(a, b)).toBe(false);
  });
});

describe('resolveBallBallCollision', () => {
  it('head-on collision: moving ball stops, stationary ball moves', () => {
    const a = makeBall({ id: 0, x: 100, y: 100, vx: 1000, vy: 0 });
    const b = makeBall({ id: 1, x: 100 + BALL_RADIUS * 1.9, y: 100, vx: 0, vy: 0 });
    const [ra, rb] = resolveBallBallCollision(a, b);
    expect(Math.abs(ra.vx)).toBeLessThan(100);
    expect(rb.vx).toBeGreaterThan(800);
  });

  it('momentum is conserved', () => {
    const a = makeBall({ id: 0, x: 100, y: 100, vx: 1000, vy: 200 });
    const b = makeBall({ id: 1, x: 100 + BALL_RADIUS * 1.9, y: 105, vx: -200, vy: 100 });
    const [ra, rb] = resolveBallBallCollision(a, b);
    expect(ra.vx + rb.vx).toBeCloseTo(a.vx + b.vx, -1);
    expect(ra.vy + rb.vy).toBeCloseTo(a.vy + b.vy, -1);
  });
});

describe('detectCushionCollision', () => {
  it('detects ball hitting left cushion', () => {
    const ball = makeBall({ x: BALL_RADIUS * 0.5, y: 500, vx: -100, vy: 0 });
    const result = detectCushionCollision(ball, DEFAULT_TABLE_CONFIG);
    expect(result).not.toBeNull();
    expect(result!.side).toBe('left');
  });

  it('no collision when ball is inside table', () => {
    const ball = makeBall({ x: 500, y: 500 });
    const result = detectCushionCollision(ball, DEFAULT_TABLE_CONFIG);
    expect(result).toBeNull();
  });
});

describe('resolveCushionCollision', () => {
  it('ball bounces off right cushion', () => {
    const ball = makeBall({
      x: DEFAULT_TABLE_CONFIG.width - BALL_RADIUS * 0.5,
      y: 500, vx: 1000, vy: 200,
    });
    const resolved = resolveCushionCollision(ball, 'right');
    expect(resolved.vx).toBeLessThan(0);
    expect(Math.abs(resolved.vx)).toBeLessThan(1000);
  });

  it('sidespin modifies rebound angle', () => {
    const noSpin = makeBall({
      x: DEFAULT_TABLE_CONFIG.width - BALL_RADIUS * 0.5,
      y: 500, vx: 1000, vy: 200, wz: 0,
    });
    const withSpin = makeBall({
      x: DEFAULT_TABLE_CONFIG.width - BALL_RADIUS * 0.5,
      y: 500, vx: 1000, vy: 200, wz: 50,
    });
    const rNoSpin = resolveCushionCollision(noSpin, 'right');
    const rWithSpin = resolveCushionCollision(withSpin, 'right');
    expect(rWithSpin.vy).not.toBeCloseTo(rNoSpin.vy, 0);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/physics/collision.test.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现 `src/physics/collision.ts`**

```typescript
import type { BallState, TableConfig } from '../types';
import { BALL_RADIUS, BALL_BALL_RESTITUTION, CUSHION_RESTITUTION } from '../constants';

export function detectBallBallCollision(a: BallState, b: BallState): boolean {
  if (a.pocketed || b.pocketed) return false;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  return dist < BALL_RADIUS * 2;
}

export function resolveBallBallCollision(
  a: BallState,
  b: BallState,
): [BallState, BallState] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist;
  const ny = dy / dist;

  const dvx = a.vx - b.vx;
  const dvy = a.vy - b.vy;
  const dvn = dvx * nx + dvy * ny;

  if (dvn <= 0) return [{ ...a }, { ...b }];

  const j = -(1 + BALL_BALL_RESTITUTION) * dvn / 2;

  const overlap = BALL_RADIUS * 2 - dist;
  const separationX = nx * overlap / 2;
  const separationY = ny * overlap / 2;

  const ra: BallState = {
    ...a,
    x: a.x - separationX,
    y: a.y - separationY,
    vx: a.vx + j * nx,
    vy: a.vy + j * ny,
  };

  const rb: BallState = {
    ...b,
    x: b.x + separationX,
    y: b.y + separationY,
    vx: b.vx - j * nx,
    vy: b.vy - j * ny,
  };

  return [ra, rb];
}

export type CushionSide = 'left' | 'right' | 'top' | 'bottom';

export interface CushionCollisionInfo {
  side: CushionSide;
}

export function detectCushionCollision(
  ball: BallState,
  config: TableConfig,
): CushionCollisionInfo | null {
  if (ball.pocketed) return null;
  if (ball.x - BALL_RADIUS < 0) return { side: 'left' };
  if (ball.x + BALL_RADIUS > config.width) return { side: 'right' };
  if (ball.y - BALL_RADIUS < 0) return { side: 'top' };
  if (ball.y + BALL_RADIUS > config.height) return { side: 'bottom' };
  return null;
}

export function resolveCushionCollision(
  ball: BallState,
  side: CushionSide,
): BallState {
  let { vx, vy, wz, x, y } = ball;

  const spinTransfer = 0.4;

  if (side === 'left' || side === 'right') {
    vx = -vx * CUSHION_RESTITUTION;
    vy = vy * CUSHION_RESTITUTION + wz * BALL_RADIUS * spinTransfer;
    wz *= 0.7;
    x = side === 'left' ? BALL_RADIUS : ball.x;
    if (side === 'right') x = x; // keep adjusted by caller
  } else {
    vy = -vy * CUSHION_RESTITUTION;
    vx = vx * CUSHION_RESTITUTION + wz * BALL_RADIUS * spinTransfer;
    wz *= 0.7;
    y = side === 'top' ? BALL_RADIUS : ball.y;
  }

  return { ...ball, vx, vy, wz, x, y };
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run tests/physics/collision.test.ts
```

Expected: 全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/physics/collision.ts tests/physics/collision.test.ts
git commit -m "feat: implement ball-ball and ball-cushion collision models"
```

---

### Task 4: 物理引擎 — 袋口检测

**Files:**
- Create: `src/physics/pocket.ts`
- Test: `tests/physics/pocket.test.ts`

- [ ] **Step 1: 编写袋口检测测试**

Create `tests/physics/pocket.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getPocketPositions, detectPocket } from '../src/physics/pocket';
import type { BallState } from '../src/types';
import { DEFAULT_TABLE_CONFIG } from '../src/constants';

function makeBall(overrides: Partial<BallState> = {}): BallState {
  return {
    id: 0, x: 500, y: 500, vx: 0, vy: 0,
    wx: 0, wy: 0, wz: 0, pocketed: false,
    ...overrides,
  };
}

describe('getPocketPositions', () => {
  it('returns 6 pocket positions', () => {
    const pockets = getPocketPositions(DEFAULT_TABLE_CONFIG);
    expect(pockets).toHaveLength(6);
  });
});

describe('detectPocket', () => {
  it('detects ball in top-left corner pocket', () => {
    const ball = makeBall({ x: 5, y: 5 });
    const result = detectPocket(ball, DEFAULT_TABLE_CONFIG);
    expect(result).toBe(true);
  });

  it('does not detect ball in center of table', () => {
    const ball = makeBall({ x: 1000, y: 600 });
    const result = detectPocket(ball, DEFAULT_TABLE_CONFIG);
    expect(result).toBe(false);
  });

  it('detects ball in side pocket', () => {
    const w = DEFAULT_TABLE_CONFIG.width;
    const h = DEFAULT_TABLE_CONFIG.height;
    const ball = makeBall({ x: w / 2, y: 2 });
    const result = detectPocket(ball, DEFAULT_TABLE_CONFIG);
    expect(result).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/physics/pocket.test.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现 `src/physics/pocket.ts`**

```typescript
import type { BallState, TableConfig } from '../types';

export interface PocketPosition {
  x: number;
  y: number;
  radius: number;
  type: 'corner' | 'side';
}

export function getPocketPositions(config: TableConfig): PocketPosition[] {
  const { width: w, height: h, pocketRadius } = config;
  return [
    { x: 0, y: 0, radius: pocketRadius.corner, type: 'corner' },
    { x: w, y: 0, radius: pocketRadius.corner, type: 'corner' },
    { x: 0, y: h, radius: pocketRadius.corner, type: 'corner' },
    { x: w, y: h, radius: pocketRadius.corner, type: 'corner' },
    { x: w / 2, y: 0, radius: pocketRadius.side, type: 'side' },
    { x: w / 2, y: h, radius: pocketRadius.side, type: 'side' },
  ];
}

export function detectPocket(
  ball: BallState,
  config: TableConfig,
): boolean {
  if (ball.pocketed) return false;
  const pockets = getPocketPositions(config);
  for (const pocket of pockets) {
    const dx = ball.x - pocket.x;
    const dy = ball.y - pocket.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < pocket.radius) {
      return true;
    }
  }
  return false;
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run tests/physics/pocket.test.ts
```

Expected: 全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/physics/pocket.ts tests/physics/pocket.test.ts
git commit -m "feat: implement pocket position calculation and detection"
```

---

### Task 5: 物理引擎 — 主循环

**Files:**
- Create: `src/physics/engine.ts`
- Test: `tests/physics/engine.test.ts`

- [ ] **Step 1: 编写引擎测试**

Create `tests/physics/engine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { PhysicsEngine } from '../src/physics/engine';
import type { BallState } from '../src/types';
import { DEFAULT_TABLE_CONFIG, BALL_RADIUS } from '../src/constants';

function makeBall(overrides: Partial<BallState> = {}): BallState {
  return {
    id: 0, x: 500, y: 635, vx: 0, vy: 0,
    wx: 0, wy: 0, wz: 0, pocketed: false,
    ...overrides,
  };
}

describe('PhysicsEngine', () => {
  it('stationary balls produce empty trajectories', () => {
    const engine = new PhysicsEngine(DEFAULT_TABLE_CONFIG);
    const balls = [makeBall()];
    const result = engine.simulate(balls);
    const traj = result.trajectories.get(0);
    expect(traj).toBeDefined();
    expect(traj!.length).toBeGreaterThanOrEqual(1);
  });

  it('moving ball eventually stops', () => {
    const engine = new PhysicsEngine(DEFAULT_TABLE_CONFIG);
    const balls = [makeBall({ vx: 2000, vy: 0 })];
    const result = engine.simulate(balls);
    const traj = result.trajectories.get(0)!;
    const last = traj[traj.length - 1];
    expect(Math.abs(last.vx)).toBeLessThan(1);
    expect(Math.abs(last.vy)).toBeLessThan(1);
  });

  it('ball bounces off cushion', () => {
    const engine = new PhysicsEngine(DEFAULT_TABLE_CONFIG);
    const balls = [makeBall({ x: 2400, y: 635, vx: 2000, vy: 0 })];
    const result = engine.simulate(balls);
    const cushionEvents = result.events.filter((e) => e.type === 'ball-cushion');
    expect(cushionEvents.length).toBeGreaterThanOrEqual(1);
  });

  it('two balls collide', () => {
    const engine = new PhysicsEngine(DEFAULT_TABLE_CONFIG);
    const balls = [
      makeBall({ id: 0, x: 500, y: 635, vx: 2000, vy: 0 }),
      makeBall({ id: 1, x: 1200, y: 635, vx: 0, vy: 0 }),
    ];
    const result = engine.simulate(balls);
    const ballEvents = result.events.filter((e) => e.type === 'ball-ball');
    expect(ballEvents.length).toBeGreaterThanOrEqual(1);
    const traj1 = result.trajectories.get(1)!;
    const last1 = traj1[traj1.length - 1];
    expect(last1.x).not.toBeCloseTo(1200, -1);
  });

  it('ball pocketed event', () => {
    const engine = new PhysicsEngine(DEFAULT_TABLE_CONFIG);
    const balls = [makeBall({ x: 50, y: 50, vx: -500, vy: -500 })];
    const result = engine.simulate(balls);
    const pocketEvents = result.events.filter((e) => e.type === 'ball-pocket');
    expect(pocketEvents.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/physics/engine.test.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现 `src/physics/engine.ts`**

```typescript
import type { BallState, TableConfig, SimulationResult, TrajectoryPoint, CollisionEvent } from '../types';
import { SIM_DT, SIM_MAX_TIME, SIM_VELOCITY_THRESHOLD } from '../constants';
import { updateBallState, isStopped } from './motion';
import { detectBallBallCollision, resolveBallBallCollision, detectCushionCollision, resolveCushionCollision } from './collision';
import { detectPocket } from './pocket';

export class PhysicsEngine {
  constructor(private config: TableConfig) {}

  simulate(initialBalls: BallState[]): SimulationResult {
    const trajectories = new Map<number, TrajectoryPoint[]>();
    const events: CollisionEvent[] = [];
    let balls = initialBalls.map((b) => ({ ...b }));

    for (const ball of balls) {
      trajectories.set(ball.id, [this.toTrajectoryPoint(ball, 0)]);
    }

    const maxSteps = Math.floor(SIM_MAX_TIME / SIM_DT);
    const recordInterval = Math.floor(0.005 / SIM_DT);

    for (let step = 0; step < maxSteps; step++) {
      const t = step * SIM_DT;

      balls = balls.map((ball) => {
        if (ball.pocketed) return ball;
        return updateBallState(ball, SIM_DT);
      });

      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          if (detectBallBallCollision(balls[i], balls[j])) {
            const [ra, rb] = resolveBallBallCollision(balls[i], balls[j]);
            balls[i] = ra;
            balls[j] = rb;
            events.push({
              type: 'ball-ball', t, ballId: balls[i].id,
              targetId: balls[j].id,
              position: { x: (ra.x + rb.x) / 2, y: (ra.y + rb.y) / 2 },
            });
          }
        }
      }

      for (let i = 0; i < balls.length; i++) {
        const ball = balls[i];
        if (ball.pocketed) continue;

        if (detectPocket(ball, this.config)) {
          balls[i] = { ...ball, pocketed: true, vx: 0, vy: 0, wx: 0, wy: 0, wz: 0 };
          events.push({
            type: 'ball-pocket', t, ballId: ball.id,
            position: { x: ball.x, y: ball.y },
          });
          continue;
        }

        const cushion = detectCushionCollision(ball, this.config);
        if (cushion) {
          balls[i] = resolveCushionCollision(ball, cushion.side);
          events.push({
            type: 'ball-cushion', t, ballId: ball.id,
            position: { x: ball.x, y: ball.y },
          });
        }
      }

      if (step % recordInterval === 0) {
        for (const ball of balls) {
          trajectories.get(ball.id)?.push(this.toTrajectoryPoint(ball, t));
        }
      }

      const allStopped = balls.every((b) => b.pocketed || isStopped(b, SIM_VELOCITY_THRESHOLD));
      if (allStopped) {
        for (const ball of balls) {
          trajectories.get(ball.id)?.push(this.toTrajectoryPoint(ball, t));
        }
        break;
      }
    }

    return { trajectories, events };
  }

  private toTrajectoryPoint(ball: BallState, t: number): TrajectoryPoint {
    return {
      x: ball.x, y: ball.y, t,
      vx: ball.vx, vy: ball.vy,
      spin: { wx: ball.wx, wy: ball.wy, wz: ball.wz },
    };
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run tests/physics/engine.test.ts
```

Expected: 全部 PASS。

- [ ] **Step 5: 提交**

```bash
git add src/physics/engine.ts tests/physics/engine.test.ts
git commit -m "feat: implement physics engine main simulation loop"
```

---

### Task 6: 杆法分析器 — 杆法映射与正向模拟

**Files:**
- Create: `src/analyzer/cue-mapping.ts`, `src/analyzer/forward.ts`
- Test: `tests/analyzer/cue-mapping.test.ts`, `tests/analyzer/forward.test.ts`

- [ ] **Step 1: 编写杆法映射测试**

Create `tests/analyzer/cue-mapping.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { cueParamsToBallState, getCueLabel } from '../src/analyzer/cue-mapping';
import type { Ball, CueParams } from '../src/types';

const cueBall: Ball = {
  id: 0, x: 635, y: 635, type: 'cue', number: 0, pocketed: false,
};

describe('cueParamsToBallState', () => {
  it('center hit produces forward motion with no spin', () => {
    const params: CueParams = { aimAngle: 0, offsetX: 0, offsetY: 0, force: 0.5 };
    const state = cueParamsToBallState(cueBall, params);
    expect(state.vx).toBeGreaterThan(0);
    expect(state.vy).toBeCloseTo(0, 0);
    expect(state.wz).toBeCloseTo(0, 0);
  });

  it('high hit produces topspin (negative wx for forward rolling)', () => {
    const params: CueParams = { aimAngle: 0, offsetX: 0, offsetY: 0.5, force: 0.5 };
    const state = cueParamsToBallState(cueBall, params);
    expect(state.wx).toBeLessThan(0);
  });

  it('low hit produces backspin (positive wx)', () => {
    const params: CueParams = { aimAngle: 0, offsetX: 0, offsetY: -0.5, force: 0.5 };
    const state = cueParamsToBallState(cueBall, params);
    expect(state.wx).toBeGreaterThan(0);
  });

  it('right english produces positive wz', () => {
    const params: CueParams = { aimAngle: 0, offsetX: 0.5, offsetY: 0, force: 0.5 };
    const state = cueParamsToBallState(cueBall, params);
    expect(state.wz).not.toBe(0);
  });

  it('force scales velocity', () => {
    const light: CueParams = { aimAngle: 0, offsetX: 0, offsetY: 0, force: 0.3 };
    const heavy: CueParams = { aimAngle: 0, offsetX: 0, offsetY: 0, force: 0.9 };
    const stateLight = cueParamsToBallState(cueBall, light);
    const stateHeavy = cueParamsToBallState(cueBall, heavy);
    expect(stateHeavy.vx).toBeGreaterThan(stateLight.vx);
  });

  it('offset clamped to safe zone', () => {
    const params: CueParams = { aimAngle: 0, offsetX: 1.5, offsetY: 1.5, force: 0.5 };
    const state = cueParamsToBallState(cueBall, params);
    expect(state.vx).toBeDefined();
  });
});

describe('getCueLabel', () => {
  it('center hit is 中杆', () => {
    expect(getCueLabel(0, 0)).toBe('中杆');
  });

  it('high hit is 高杆', () => {
    expect(getCueLabel(0, 0.4)).toBe('高杆');
  });

  it('combo is labeled correctly', () => {
    const label = getCueLabel(0.4, 0.4);
    expect(label).toContain('高杆');
    expect(label).toContain('右塞');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/analyzer/cue-mapping.test.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现 `src/analyzer/cue-mapping.ts`**

```typescript
import type { Ball, BallState, CueParams } from '../types';
import { BALL_RADIUS, MAX_CUE_OFFSET } from '../constants';

const MAX_SPEED = 8000; // mm/s at force=1

export function cueParamsToBallState(
  cueBall: Ball,
  params: CueParams,
): BallState {
  let ox = params.offsetX;
  let oy = params.offsetY;

  const offsetMag = Math.sqrt(ox * ox + oy * oy);
  if (offsetMag > MAX_CUE_OFFSET) {
    const scale = MAX_CUE_OFFSET / offsetMag;
    ox *= scale;
    oy *= scale;
  }

  const speed = params.force * MAX_SPEED;
  const vx = speed * Math.cos(params.aimAngle);
  const vy = speed * Math.sin(params.aimAngle);

  const spinFactor = speed / BALL_RADIUS * 1.5;
  const wx = -oy * spinFactor;
  const wy = ox * spinFactor;
  const wz = -ox * spinFactor * 0.8;

  return {
    id: cueBall.id,
    x: cueBall.x,
    y: cueBall.y,
    vx, vy,
    wx, wy, wz,
    pocketed: false,
  };
}

export function getCueLabel(offsetX: number, offsetY: number): string {
  const threshold = 0.15;
  const parts: string[] = [];

  if (offsetY > threshold) parts.push('高杆');
  else if (offsetY < -threshold) parts.push('低杆');

  if (offsetX < -threshold) parts.push('左塞');
  else if (offsetX > threshold) parts.push('右塞');

  return parts.length === 0 ? '中杆' : parts.join('+');
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run tests/analyzer/cue-mapping.test.ts
```

Expected: 全部 PASS。

- [ ] **Step 5: 编写正向模拟测试**

Create `tests/analyzer/forward.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { forwardSimulate } from '../src/analyzer/forward';
import type { Ball, CueParams, TableState } from '../src/types';
import { DEFAULT_TABLE_CONFIG } from '../src/constants';

describe('forwardSimulate', () => {
  it('returns trajectory for cue ball', () => {
    const state: TableState = {
      tableConfig: DEFAULT_TABLE_CONFIG,
      balls: [
        { id: 0, x: 635, y: 635, type: 'cue', number: 0, pocketed: false },
        { id: 1, x: 1270, y: 635, type: 'solid', number: 1, pocketed: false },
      ],
    };
    const params: CueParams = { aimAngle: 0, offsetX: 0, offsetY: 0, force: 0.5 };
    const result = forwardSimulate(state, params);
    const cueTraj = result.trajectories.get(0);
    expect(cueTraj).toBeDefined();
    expect(cueTraj!.length).toBeGreaterThan(1);
  });

  it('high cue ball travels further after collision', () => {
    const state: TableState = {
      tableConfig: DEFAULT_TABLE_CONFIG,
      balls: [
        { id: 0, x: 635, y: 635, type: 'cue', number: 0, pocketed: false },
        { id: 1, x: 1270, y: 635, type: 'solid', number: 1, pocketed: false },
      ],
    };
    const centerParams: CueParams = { aimAngle: 0, offsetX: 0, offsetY: 0, force: 0.5 };
    const highParams: CueParams = { aimAngle: 0, offsetX: 0, offsetY: 0.5, force: 0.5 };

    const centerResult = forwardSimulate(state, centerParams);
    const highResult = forwardSimulate(state, highParams);

    const centerFinal = centerResult.trajectories.get(0)!;
    const highFinal = highResult.trajectories.get(0)!;
    const centerEndX = centerFinal[centerFinal.length - 1].x;
    const highEndX = highFinal[highFinal.length - 1].x;

    expect(highEndX).toBeGreaterThan(centerEndX);
  });
});
```

- [ ] **Step 6: 实现 `src/analyzer/forward.ts`**

```typescript
import type { TableState, CueParams, SimulationResult, BallState } from '../types';
import { PhysicsEngine } from '../physics/engine';
import { cueParamsToBallState } from './cue-mapping';

export function forwardSimulate(
  tableState: TableState,
  cueParams: CueParams,
): SimulationResult {
  const engine = new PhysicsEngine(tableState.tableConfig);

  const ballStates: BallState[] = tableState.balls.map((ball) => {
    if (ball.type === 'cue') {
      return cueParamsToBallState(ball, cueParams);
    }
    return {
      id: ball.id,
      x: ball.x,
      y: ball.y,
      vx: 0, vy: 0,
      wx: 0, wy: 0, wz: 0,
      pocketed: ball.pocketed,
    };
  });

  return engine.simulate(ballStates);
}
```

- [ ] **Step 7: 运行所有分析器测试**

```bash
npx vitest run tests/analyzer/
```

Expected: 全部 PASS。

- [ ] **Step 8: 提交**

```bash
git add src/analyzer/ tests/analyzer/
git commit -m "feat: implement cue parameter mapping and forward simulation"
```

---

### Task 7: 杆法分析器 — 反向推算

**Files:**
- Create: `src/analyzer/reverse.ts`
- Test: `tests/analyzer/reverse.test.ts`

- [ ] **Step 1: 编写反向推算测试**

Create `tests/analyzer/reverse.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { reverseAnalyze } from '../src/analyzer/reverse';
import type { TableState } from '../src/types';
import { DEFAULT_TABLE_CONFIG } from '../src/constants';

describe('reverseAnalyze', () => {
  it('returns at least one cue option', () => {
    const state: TableState = {
      tableConfig: DEFAULT_TABLE_CONFIG,
      balls: [
        { id: 0, x: 635, y: 635, type: 'cue', number: 0, pocketed: false },
        { id: 1, x: 1270, y: 635, type: 'solid', number: 1, pocketed: false },
      ],
    };
    const aimAngle = 0;
    const targetX = 1600;
    const targetY = 635;
    const options = reverseAnalyze(state, aimAngle, { x: targetX, y: targetY });
    expect(options.length).toBeGreaterThanOrEqual(1);
  });

  it('options are sorted by deviation (ascending)', () => {
    const state: TableState = {
      tableConfig: DEFAULT_TABLE_CONFIG,
      balls: [
        { id: 0, x: 635, y: 635, type: 'cue', number: 0, pocketed: false },
        { id: 1, x: 1270, y: 635, type: 'solid', number: 1, pocketed: false },
      ],
    };
    const options = reverseAnalyze(state, 0, { x: 1800, y: 400 });
    for (let i = 1; i < options.length; i++) {
      expect(options[i].deviation).toBeGreaterThanOrEqual(options[i - 1].deviation);
    }
  });

  it('each option has a label', () => {
    const state: TableState = {
      tableConfig: DEFAULT_TABLE_CONFIG,
      balls: [
        { id: 0, x: 635, y: 635, type: 'cue', number: 0, pocketed: false },
        { id: 1, x: 1270, y: 635, type: 'solid', number: 1, pocketed: false },
      ],
    };
    const options = reverseAnalyze(state, 0, { x: 1600, y: 635 });
    for (const opt of options) {
      expect(opt.label.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/analyzer/reverse.test.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现 `src/analyzer/reverse.ts`**

```typescript
import type { TableState, CueParams, CueOption } from '../types';
import { forwardSimulate } from './forward';
import { getCueLabel } from './cue-mapping';

interface Target {
  x: number;
  y: number;
}

export function reverseAnalyze(
  tableState: TableState,
  aimAngle: number,
  target: Target,
  topN = 5,
): CueOption[] {
  const candidates: CueOption[] = [];

  const offsetSteps = [-0.5, -0.3, -0.15, 0, 0.15, 0.3, 0.5];
  const forceSteps = [0.2, 0.35, 0.5, 0.65, 0.8];

  for (const offsetX of offsetSteps) {
    for (const offsetY of offsetSteps) {
      for (const force of forceSteps) {
        const params: CueParams = { aimAngle, offsetX, offsetY, force };
        const result = forwardSimulate(tableState, params);
        const cueTraj = result.trajectories.get(0);
        if (!cueTraj || cueTraj.length === 0) continue;

        const finalPos = cueTraj[cueTraj.length - 1];
        const dx = finalPos.x - target.x;
        const dy = finalPos.y - target.y;
        const deviation = Math.sqrt(dx * dx + dy * dy);

        candidates.push({
          params,
          trajectory: cueTraj,
          deviation,
          label: `${getCueLabel(offsetX, offsetY)} · ${Math.round(force * 100)}%`,
        });
      }
    }
  }

  candidates.sort((a, b) => a.deviation - b.deviation);

  const filtered: CueOption[] = [];
  for (const c of candidates) {
    if (filtered.length >= topN) break;
    const isDuplicate = filtered.some(
      (f) =>
        Math.abs(f.params.offsetX - c.params.offsetX) < 0.1 &&
        Math.abs(f.params.offsetY - c.params.offsetY) < 0.1 &&
        Math.abs(f.params.force - c.params.force) < 0.1,
    );
    if (!isDuplicate) {
      filtered.push(c);
    }
  }

  return filtered;
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npx vitest run tests/analyzer/reverse.test.ts
```

Expected: 全部 PASS（注意：此测试可能较慢，因为网格搜索运行大量模拟）。

- [ ] **Step 5: 提交**

```bash
git add src/analyzer/reverse.ts tests/analyzer/reverse.test.ts
git commit -m "feat: implement reverse cue analysis with grid search optimization"
```

---

### Task 8: 球台渲染器

**Files:**
- Create: `src/renderer/table.ts`, `src/renderer/balls.ts`, `src/renderer/trajectory.ts`, `src/renderer/renderer.ts`

- [ ] **Step 1: 实现 `src/renderer/table.ts` — 球台绘制**

```typescript
import type { TableConfig } from '../types';

export interface RenderTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function computeTransform(
  canvasWidth: number,
  canvasHeight: number,
  config: TableConfig,
  padding: number = 60,
): RenderTransform {
  const availW = canvasWidth - padding * 2;
  const availH = canvasHeight - padding * 2;
  const scale = Math.min(availW / config.width, availH / config.height);
  const offsetX = (canvasWidth - config.width * scale) / 2;
  const offsetY = (canvasHeight - config.height * scale) / 2;
  return { scale, offsetX, offsetY };
}

export function drawTable(
  ctx: CanvasRenderingContext2D,
  config: TableConfig,
  transform: RenderTransform,
): void {
  const { scale, offsetX, offsetY } = transform;
  const w = config.width * scale;
  const h = config.height * scale;

  // Outer wood frame
  const frameSize = 22 * scale;
  ctx.fillStyle = '#3a2210';
  roundRect(ctx, offsetX - frameSize, offsetY - frameSize, w + frameSize * 2, h + frameSize * 2, 12);
  ctx.fill();

  // Inner frame highlight
  const innerFrame = 11 * scale;
  ctx.fillStyle = '#5a3a1e';
  roundRect(ctx, offsetX - innerFrame, offsetY - innerFrame, w + innerFrame * 2, h + innerFrame * 2, 8);
  ctx.fill();

  // Cushion
  const cushionSize = 4 * scale;
  ctx.fillStyle = '#1b5e20';
  roundRect(ctx, offsetX - cushionSize, offsetY - cushionSize, w + cushionSize * 2, h + cushionSize * 2, 4);
  ctx.fill();

  // Playing surface
  ctx.fillStyle = '#1a6e20';
  ctx.fillRect(offsetX, offsetY, w, h);

  // Overhead light glow
  const grad = ctx.createRadialGradient(
    offsetX + w / 2, offsetY + h * 0.38, 0,
    offsetX + w / 2, offsetY + h * 0.38, w * 0.5,
  );
  grad.addColorStop(0, 'rgba(255,245,220,0.05)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(offsetX, offsetY, w, h);

  // Vignette
  const vignette = ctx.createRadialGradient(
    offsetX + w / 2, offsetY + h / 2, Math.min(w, h) * 0.3,
    offsetX + w / 2, offsetY + h / 2, Math.max(w, h) * 0.8,
  );
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  drawPockets(ctx, config, transform);
  drawDiamonds(ctx, config, transform);
}

function drawPockets(
  ctx: CanvasRenderingContext2D,
  config: TableConfig,
  transform: RenderTransform,
): void {
  const { scale, offsetX, offsetY } = transform;
  const w = config.width * scale;
  const h = config.height * scale;
  const cr = config.pocketRadius.corner * scale;
  const sr = config.pocketRadius.side * scale;

  const corners = [
    [offsetX, offsetY],
    [offsetX + w, offsetY],
    [offsetX, offsetY + h],
    [offsetX + w, offsetY + h],
  ];
  for (const [px, py] of corners) {
    const grad = ctx.createRadialGradient(px, py, cr * 0.3, px, py, cr);
    grad.addColorStop(0, '#111');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  const sides = [
    [offsetX + w / 2, offsetY],
    [offsetX + w / 2, offsetY + h],
  ];
  for (const [px, py] of sides) {
    const grad = ctx.createRadialGradient(px, py, sr * 0.3, px, py, sr);
    grad.addColorStop(0, '#111');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, sr, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDiamonds(
  ctx: CanvasRenderingContext2D,
  config: TableConfig,
  transform: RenderTransform,
): void {
  const { scale, offsetX, offsetY } = transform;
  const w = config.width * scale;
  const h = config.height * scale;
  const size = 3 * scale;

  const positions: [number, number][] = [];
  for (const frac of [0.18, 0.36, 0.64, 0.82]) {
    positions.push([offsetX + w * frac, offsetY - size]);
    positions.push([offsetX + w * frac, offsetY + h + size]);
  }
  for (const frac of [0.28, 0.5, 0.72]) {
    positions.push([offsetX - size, offsetY + h * frac]);
    positions.push([offsetX + w + size, offsetY + h * frac]);
  }

  ctx.fillStyle = '#c9a84c';
  for (const [dx, dy] of positions) {
    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.restore();
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
```

- [ ] **Step 2: 实现 `src/renderer/balls.ts` — 球体绘制**

```typescript
import type { Ball } from '../types';
import type { RenderTransform } from './table';
import { BALL_RADIUS } from '../constants';

const BALL_COLORS: Record<number, string> = {
  0: '#f0f0f0',
  1: '#ffeb3b', 2: '#2196f3', 3: '#f44336', 4: '#9c27b0',
  5: '#ff9800', 6: '#4caf50', 7: '#7b1fa2', 8: '#212121',
  9: '#ffeb3b', 10: '#2196f3', 11: '#f44336', 12: '#9c27b0',
  13: '#ff9800', 14: '#4caf50', 15: '#7b1fa2',
};

export function drawBall(
  ctx: CanvasRenderingContext2D,
  ball: Ball,
  transform: RenderTransform,
): void {
  if (ball.pocketed) return;

  const x = ball.x * transform.scale + transform.offsetX;
  const y = ball.y * transform.scale + transform.offsetY;
  const r = BALL_RADIUS * transform.scale;

  const baseColor = BALL_COLORS[ball.number] || '#888';

  // Shadow on felt
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x + r * 0.1, y + r * 0.9, r * 0.7, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ball body
  const grad = ctx.createRadialGradient(
    x - r * 0.25, y - r * 0.3, r * 0.05,
    x, y, r,
  );

  if (ball.type === 'cue') {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#f5f5f5');
    grad.addColorStop(0.7, '#d0d0d0');
    grad.addColorStop(1, '#999');
  } else {
    grad.addColorStop(0, lightenColor(baseColor, 0.6));
    grad.addColorStop(0.3, baseColor);
    grad.addColorStop(0.8, darkenColor(baseColor, 0.3));
    grad.addColorStop(1, darkenColor(baseColor, 0.5));
  }

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Stripe band for stripe balls (9-15)
  if (ball.type === 'stripe') {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = baseColor;
    ctx.fillRect(x - r, y - r * 0.4, r * 2, r * 0.8);
    ctx.restore();
  }

  // Number circle
  if (ball.number > 0) {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.font = `bold ${r * 0.4}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(ball.number), x, y + 0.5);
  }

  // Highlight spark
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.25, y - r * 0.35, r * 0.15, r * 0.1, -0.3, 0, Math.PI * 2);
  ctx.fill();
}

function lightenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, Math.round(r + (255 - r) * amount));
  const ng = Math.min(255, Math.round(g + (255 - g) * amount));
  const nb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `rgb(${nr},${ng},${nb})`;
}

function darkenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * (1 - amount))},${Math.round(g * (1 - amount))},${Math.round(b * (1 - amount))})`;
}
```

- [ ] **Step 3: 实现 `src/renderer/trajectory.ts` — 轨迹线绘制**

```typescript
import type { TrajectoryPoint } from '../types';
import type { RenderTransform } from './table';

export function drawTrajectory(
  ctx: CanvasRenderingContext2D,
  points: TrajectoryPoint[],
  transform: RenderTransform,
  color = '#4fc3f7',
  dashPattern: number[] = [8, 5],
): void {
  if (points.length < 2) return;

  const { scale, offsetX, offsetY } = transform;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash(dashPattern);
  ctx.globalAlpha = 0.8;
  ctx.beginPath();

  const first = points[0];
  ctx.moveTo(first.x * scale + offsetX, first.y * scale + offsetY);

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    ctx.lineTo(p.x * scale + offsetX, p.y * scale + offsetY);
  }
  ctx.stroke();

  // Glow effect
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.globalAlpha = 0.06;
  ctx.beginPath();
  ctx.moveTo(first.x * scale + offsetX, first.y * scale + offsetY);
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    ctx.lineTo(p.x * scale + offsetX, p.y * scale + offsetY);
  }
  ctx.stroke();

  // Stop marker
  const last = points[points.length - 1];
  const lx = last.x * scale + offsetX;
  const ly = last.y * scale + offsetY;
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(lx, ly, 7, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(lx, ly, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

export function drawAimLine(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  transform: RenderTransform,
): void {
  const { scale, offsetX, offsetY } = transform;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(fromX * scale + offsetX, fromY * scale + offsetY);
  ctx.lineTo(toX * scale + offsetX, toY * scale + offsetY);
  ctx.stroke();
  ctx.setLineDash([]);
}
```

- [ ] **Step 4: 实现 `src/renderer/renderer.ts` — 主渲染控制器**

```typescript
import type { TableState, SimulationResult } from '../types';
import { computeTransform, drawTable, type RenderTransform } from './table';
import { drawBall } from './balls';
import { drawTrajectory, drawAimLine } from './trajectory';

export class TableRenderer {
  private ctx: CanvasRenderingContext2D;
  private transform!: RenderTransform;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  getTransform(tableState: TableState): RenderTransform {
    this.transform = computeTransform(
      this.canvas.width,
      this.canvas.height,
      tableState.tableConfig,
    );
    return this.transform;
  }

  render(
    tableState: TableState,
    simulationResult?: SimulationResult,
    aimLine?: { fromX: number; fromY: number; toX: number; toY: number },
  ): void {
    const { ctx, canvas } = this;
    this.transform = this.getTransform(tableState);

    ctx.fillStyle = '#060610';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawTable(ctx, tableState.tableConfig, this.transform);

    if (aimLine) {
      drawAimLine(ctx, aimLine.fromX, aimLine.fromY, aimLine.toX, aimLine.toY, this.transform);
    }

    if (simulationResult) {
      const cueTraj = simulationResult.trajectories.get(0);
      if (cueTraj) {
        drawTrajectory(ctx, cueTraj, this.transform, '#4fc3f7');
      }
      simulationResult.trajectories.forEach((traj, id) => {
        if (id !== 0) {
          drawTrajectory(ctx, traj, this.transform, 'rgba(255,235,59,0.3)', [5, 4]);
        }
      });
    }

    for (const ball of tableState.balls) {
      drawBall(ctx, ball, this.transform);
    }
  }

  screenToTable(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.transform.offsetX) / this.transform.scale,
      y: (sy - this.transform.offsetY) / this.transform.scale,
    };
  }

  tableToScreen(tx: number, ty: number): { x: number; y: number } {
    return {
      x: tx * this.transform.scale + this.transform.offsetX,
      y: ty * this.transform.scale + this.transform.offsetY,
    };
  }
}
```

- [ ] **Step 5: 验证渲染可视化**

更新 `src/main.ts` 以渲染球台：

```typescript
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
```

```bash
npm run dev
```

Expected: 浏览器中看到完整的球台渲染——木框、绿色台面、袋口、钻石标记、多个球（含编号和光泽效果）。

- [ ] **Step 6: 提交**

```bash
git add src/renderer/ src/main.ts
git commit -m "feat: implement Canvas table renderer with TV broadcast visual style"
```

---

### Task 9: 交互管理器 — 球拖放与瞄准线

**Files:**
- Create: `src/interaction/drag.ts`, `src/interaction/aim.ts`, `src/interaction/manager.ts`

- [ ] **Step 1: 实现 `src/interaction/drag.ts` — 球拖放**

```typescript
import type { Ball } from '../types';
import type { TableRenderer } from '../renderer/renderer';
import { BALL_RADIUS } from '../constants';
import { bus } from '../events';

export class BallDragger {
  private dragging: Ball | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private renderer: TableRenderer,
    private getBalls: () => Ball[],
  ) {
    this.canvas.addEventListener('pointerdown', this.onDown.bind(this));
    this.canvas.addEventListener('pointermove', this.onMove.bind(this));
    this.canvas.addEventListener('pointerup', this.onUp.bind(this));
  }

  private onDown(e: PointerEvent): void {
    const pos = this.renderer.screenToTable(e.clientX, e.clientY);
    const balls = this.getBalls();
    for (const ball of balls) {
      const dx = pos.x - ball.x;
      const dy = pos.y - ball.y;
      if (Math.sqrt(dx * dx + dy * dy) < BALL_RADIUS * 1.5) {
        this.dragging = ball;
        this.canvas.setPointerCapture(e.pointerId);
        return;
      }
    }
  }

  private onMove(e: PointerEvent): void {
    if (!this.dragging) return;
    const pos = this.renderer.screenToTable(e.clientX, e.clientY);
    this.dragging.x = pos.x;
    this.dragging.y = pos.y;
    bus.emit('ball-moved', { ball: this.dragging });
  }

  private onUp(_e: PointerEvent): void {
    if (this.dragging) {
      bus.emit('ball-placed', { ball: this.dragging });
      this.dragging = null;
    }
  }

  isDragging(): boolean {
    return this.dragging !== null;
  }
}
```

- [ ] **Step 2: 实现 `src/interaction/aim.ts` — 瞄准线交互**

```typescript
import type { Ball } from '../types';
import type { TableRenderer } from '../renderer/renderer';
import { BALL_RADIUS } from '../constants';
import { bus } from '../events';

export class AimController {
  private aiming = false;
  private aimAngle = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private renderer: TableRenderer,
    private getCueBall: () => Ball | undefined,
    private isDragging: () => boolean,
  ) {
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
```

- [ ] **Step 3: 实现 `src/interaction/manager.ts` — 交互管理主控**

```typescript
import type { TableState } from '../types';
import type { TableRenderer } from '../renderer/renderer';
import { BallDragger } from './drag';
import { AimController } from './aim';

export class InteractionManager {
  private dragger: BallDragger;
  private aim: AimController;

  constructor(
    canvas: HTMLCanvasElement,
    renderer: TableRenderer,
    private tableState: TableState,
  ) {
    this.dragger = new BallDragger(
      canvas, renderer,
      () => this.tableState.balls,
    );

    this.aim = new AimController(
      canvas, renderer,
      () => this.tableState.balls.find((b) => b.type === 'cue'),
      () => this.dragger.isDragging(),
    );
  }

  getAimAngle(): number {
    return this.aim.getAimAngle();
  }

  updateTableState(state: TableState): void {
    this.tableState = state;
  }
}
```

- [ ] **Step 4: 集成到 main.ts 并验证拖放和瞄准**

更新 `src/main.ts` 添加交互支持：

```typescript
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

window.addEventListener('resize', () => {
  renderer.resize();
  requestRender();
});
```

```bash
npm run dev
```

Expected: 浏览器中可以拖动球，从白球附近拖动会显示瞄准线。

- [ ] **Step 5: 提交**

```bash
git add src/interaction/ src/main.ts
git commit -m "feat: implement ball drag-and-drop and aim line interaction"
```

---

### Task 10: UI — 底部工具栏与控制面板

**Files:**
- Create: `src/ui/toolbar.ts`, `src/ui/cue-selector.ts`, `src/ui/force-slider.ts`, `src/ui/result-panel.ts`, `src/ui/mode-switch.ts`

- [ ] **Step 1: 实现 `src/ui/toolbar.ts` — 底部浮层工具栏**

```typescript
import { bus } from '../events';

export class Toolbar {
  private el: HTMLDivElement;

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
      #cue-label { font-size: 11px; color: #69f0ae; font-weight: 600; }
      #force-slider-mount {
        flex: 1; max-width: 200px;
      }
    `;
    document.head.appendChild(style);
  }
}
```

- [ ] **Step 2: 实现 `src/ui/cue-selector.ts` — 迷你击球点选择器**

```typescript
import { bus } from '../events';
import { MAX_CUE_OFFSET } from '../constants';
import { getCueLabel } from '../analyzer/cue-mapping';

export class CueSelector {
  private el: HTMLDivElement;
  private offsetX = 0;
  private offsetY = 0;
  private dragging = false;

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
    `;
    document.head.appendChild(style);
  }
}
```

- [ ] **Step 3: 实现 `src/ui/force-slider.ts` — 力度滑条**

```typescript
import { bus } from '../events';

export class ForceSlider {
  private el: HTMLDivElement;
  private force = 0.5;

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
```

- [ ] **Step 4: 实现 `src/ui/result-panel.ts` — 右侧结果面板**

```typescript
import type { CueOption } from '../types';

export class ResultPanel {
  private el: HTMLDivElement;

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
```

- [ ] **Step 5: 集成 UI 到 main.ts**

更新 `src/main.ts`，把工具栏、击球点选择器、力度滑条、结果面板组装起来，并连接正向模拟事件：

```typescript
import { TableRenderer } from './renderer/renderer';
import { InteractionManager } from './interaction/manager';
import { Toolbar } from './ui/toolbar';
import { CueSelector } from './ui/cue-selector';
import { ForceSlider } from './ui/force-slider';
import { ResultPanel } from './ui/result-panel';
import { forwardSimulate } from './analyzer/forward';
import { DEFAULT_TABLE_CONFIG } from './constants';
import { bus } from './events';
import type { TableState, SimulationResult } from './types';

const canvas = document.getElementById('table-canvas') as HTMLCanvasElement;
const uiRoot = document.getElementById('ui-root')!;
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

const toolbar = new Toolbar(uiRoot);
const cueSelector = new CueSelector(document.getElementById('cue-selector-mount')!);
const forceSlider = new ForceSlider(document.getElementById('force-slider-mount')!);
const resultPanel = new ResultPanel(uiRoot);

let currentAimLine: { fromX: number; fromY: number; toX: number; toY: number } | undefined;
let currentSimResult: SimulationResult | undefined;

bus.on('ball-moved', () => { currentSimResult = undefined; requestRender(); });
bus.on('ball-placed', () => requestRender());
bus.on('aim-changed', (data: { angle: number; targetX: number; targetY: number }) => {
  const cueBall = tableState.balls.find((b) => b.type === 'cue');
  if (cueBall) {
    currentAimLine = { fromX: cueBall.x, fromY: cueBall.y, toX: data.targetX, toY: data.targetY };
  }
  requestRender();
});

bus.on('simulate-requested', () => {
  const { offsetX, offsetY } = cueSelector.getOffset();
  const force = forceSlider.getForce();
  const aimAngle = interaction.getAimAngle();

  currentSimResult = forwardSimulate(tableState, { aimAngle, offsetX, offsetY, force });
  requestRender();
});

let renderPending = false;
function requestRender(): void {
  if (renderPending) return;
  renderPending = true;
  requestAnimationFrame(() => {
    renderer.render(tableState, currentSimResult, currentAimLine);
    renderPending = false;
  });
}

renderer.render(tableState);
window.addEventListener('resize', () => { renderer.resize(); requestRender(); });
```

- [ ] **Step 6: 验证完整交互流程**

```bash
npm run dev
```

Expected: 浏览器横屏中看到球台 + 底部工具栏（击球点选择器、力度滑条、模拟/反向/球局按钮）。拖球、设置瞄准线、选杆法、调力度后点模拟，看到轨迹线渲染。

- [ ] **Step 7: 提交**

```bash
git add src/ui/ src/main.ts
git commit -m "feat: implement toolbar, cue selector, force slider, and result panel UI"
```

---

### Task 11: 反向分析交互集成

**Files:**
- Create: `src/interaction/draw-path.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: 实现 `src/interaction/draw-path.ts` — 画线模式**

```typescript
import type { TableRenderer } from '../renderer/renderer';
import { bus } from '../events';

export class DrawPath {
  private drawing = false;
  private points: { x: number; y: number }[] = [];
  private enabled = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private renderer: TableRenderer,
  ) {
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
```

- [ ] **Step 2: 在 main.ts 中集成反向分析的点击模式和模式切换**

在 `src/main.ts` 中添加以下逻辑（在现有事件监听之后）：

```typescript
import { reverseAnalyze } from './analyzer/reverse';

let analysisMode: 'forward' | 'reverse-click' = 'forward';

bus.on('mode-change', (data: { mode: string }) => {
  if (data.mode === 'reverse-click') {
    analysisMode = 'reverse-click';
  } else {
    analysisMode = 'forward';
  }
});

canvas.addEventListener('click', (e) => {
  if (analysisMode !== 'reverse-click') return;
  const pos = renderer.screenToTable(e.clientX, e.clientY);
  const aimAngle = interaction.getAimAngle();
  const options = reverseAnalyze(tableState, aimAngle, pos);
  if (options.length > 0) {
    currentSimResult = {
      trajectories: new Map([[0, options[0].trajectory]]),
      events: [],
    };
    resultPanel.show(options);
    requestRender();
  }
});
```

- [ ] **Step 3: 验证反向分析**

```bash
npm run dev
```

Expected: 点击「反向」按钮切换到反向模式，在球台上点击任意位置，右侧滑出结果面板显示推荐杆法和备选方案，球台上显示最佳方案的轨迹。

- [ ] **Step 4: 提交**

```bash
git add src/interaction/draw-path.ts src/main.ts
git commit -m "feat: integrate reverse analysis with click-to-target interaction"
```

---

### Task 12: 预设球局管理

**Files:**
- Create: `src/scenario/presets.ts`, `src/scenario/manager.ts`
- Test: `tests/scenario/manager.test.ts`

- [ ] **Step 1: 编写 ScenarioManager 测试**

Create `tests/scenario/manager.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ScenarioManager } from '../src/scenario/manager';
import { DEFAULT_TABLE_CONFIG } from '../src/constants';
import type { TableState } from '../src/types';

describe('ScenarioManager', () => {
  let manager: ScenarioManager;

  beforeEach(() => {
    manager = new ScenarioManager();
    localStorage.clear();
  });

  it('lists preset scenarios', () => {
    const presets = manager.listPresets();
    expect(presets.length).toBeGreaterThanOrEqual(3);
  });

  it('loads a preset by id', () => {
    const presets = manager.listPresets();
    const state = manager.loadPreset(presets[0].id);
    expect(state.balls.length).toBeGreaterThanOrEqual(2);
    expect(state.balls.find((b) => b.type === 'cue')).toBeDefined();
  });

  it('saves and loads custom scenario', () => {
    const state: TableState = {
      tableConfig: DEFAULT_TABLE_CONFIG,
      balls: [
        { id: 0, x: 100, y: 100, type: 'cue', number: 0, pocketed: false },
        { id: 1, x: 200, y: 200, type: 'solid', number: 1, pocketed: false },
      ],
    };
    manager.saveCustom('test-scenario', state);
    const customs = manager.listCustom();
    expect(customs).toContain('test-scenario');
    const loaded = manager.loadCustom('test-scenario');
    expect(loaded).toBeDefined();
    expect(loaded!.balls[0].x).toBe(100);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npx vitest run tests/scenario/manager.test.ts
```

Expected: FAIL。

- [ ] **Step 3: 实现 `src/scenario/presets.ts`**

```typescript
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
```

- [ ] **Step 4: 实现 `src/scenario/manager.ts`**

```typescript
import type { TableState } from '../types';
import { DEFAULT_TABLE_CONFIG } from '../constants';
import { PRESETS, type PresetScenario } from './presets';

const STORAGE_KEY = 'ballroute-custom-scenarios';

export class ScenarioManager {
  listPresets(): PresetScenario[] {
    return PRESETS;
  }

  loadPreset(id: string): TableState {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) throw new Error(`Preset not found: ${id}`);
    return {
      tableConfig: DEFAULT_TABLE_CONFIG,
      balls: preset.balls.map((b) => ({ ...b })),
    };
  }

  saveCustom(name: string, state: TableState): void {
    const customs = this.getAllCustom();
    customs[name] = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
  }

  loadCustom(name: string): TableState | undefined {
    const customs = this.getAllCustom();
    return customs[name];
  }

  listCustom(): string[] {
    return Object.keys(this.getAllCustom());
  }

  deleteCustom(name: string): void {
    const customs = this.getAllCustom();
    delete customs[name];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customs));
  }

  private getAllCustom(): Record<string, TableState> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  }
}
```

- [ ] **Step 5: 运行测试确认通过**

```bash
npx vitest run tests/scenario/manager.test.ts
```

Expected: 全部 PASS。

- [ ] **Step 6: 提交**

```bash
git add src/scenario/ tests/scenario/
git commit -m "feat: implement scenario manager with 6 preset practice drills"
```

---

### Task 13: TV 直播风格叠加层与信息条

**Files:**
- Modify: `src/renderer/renderer.ts`
- Create: `src/ui/overlay.ts`

- [ ] **Step 1: 实现 `src/ui/overlay.ts` — TV 叠加层**

```typescript
export class TVOverlay {
  private el: HTMLDivElement;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.id = 'tv-overlay';
    this.el.innerHTML = `
      <div id="tv-logo">
        <span class="tv-dot">⬤</span> BALL ROUTE
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
    this.el.querySelector('#tv-cue-label')!.textContent = cueLabel;
    this.el.querySelector('#tv-force')!.textContent = `${Math.round(force * 100)}%`;
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
```

- [ ] **Step 2: 集成 TV 叠加层到 main.ts**

在 `src/main.ts` 中添加：

```typescript
import { TVOverlay } from './ui/overlay';
import { getCueLabel } from './analyzer/cue-mapping';

const tvOverlay = new TVOverlay(uiRoot);

bus.on('cue-offset-changed', (data: { offsetX: number; offsetY: number }) => {
  const label = getCueLabel(data.offsetX, data.offsetY);
  tvOverlay.updateInfo(label, forceSlider.getForce());
});

bus.on('force-changed', (data: { force: number }) => {
  const { offsetX, offsetY } = cueSelector.getOffset();
  const label = getCueLabel(offsetX, offsetY);
  tvOverlay.updateInfo(label, data.force);
});
```

- [ ] **Step 3: 验证 TV 风格效果**

```bash
npm run dev
```

Expected: 左上角显示 "⬤ BALL ROUTE" Logo，调整杆法或力度时左下角信息条显示当前设置。

- [ ] **Step 4: 提交**

```bash
git add src/ui/overlay.ts src/main.ts
git commit -m "feat: add TV broadcast style overlay with logo and info bar"
```

---

### Task 14: 全部测试通过 & 最终集成验证

**Files:**
- Review and fix all

- [ ] **Step 1: 运行全部测试**

```bash
npx vitest run
```

Expected: 全部 PASS。如果有失败修复后再运行。

- [ ] **Step 2: 构建生产版本**

```bash
npm run build
```

Expected: 构建成功，输出到 `dist/` 目录。

- [ ] **Step 3: 端到端手动验证清单**

```bash
npm run dev
```

逐项验证：
- [ ] 球台渲染正确（木框、台呢、袋口、钻石标记）
- [ ] 球可以拖放到任意位置
- [ ] 瞄准线可以设置
- [ ] 击球点选择器可用，标签正确更新
- [ ] 力度滑条可用
- [ ] 点击"模拟"后轨迹线正确显示
- [ ] 点击"反向"后切换模式，点击球台显示结果面板
- [ ] TV Logo 和信息条正常显示
- [ ] 横屏适配正确

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "feat: Ball Route MVP — billiard cue analysis tool with physics engine"
```
