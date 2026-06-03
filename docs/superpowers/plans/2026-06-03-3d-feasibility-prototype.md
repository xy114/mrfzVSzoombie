# 3D 可行性调研原型 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在独立 `3d/` 文件夹中搭建 Three.js 3D 原型，验证 2.5D 俯视视角下卡通渲染的视觉效果和技术可行性。

**Architecture:** 零侵入独立实验室。`3d/index.html` 通过 importmap 加载 Three.js CDN，`3d/src/` 下各模块各司其职（camera / scene / plant / zombie / toon-material），main.js 串联初始化与渲染循环。所有常量从 `game/js/constants.js` 手动复制，不 import 原项目代码。

**Tech Stack:** Three.js 0.160 (CDN importmap) + 原生 ES Modules + `npx serve` 本地服务器

---

## 文件结构规划

| 文件 | 职责 | 依赖 |
|------|------|------|
| `3d/README.md` | 项目说明、启动方式、目录结构 | 无 |
| `3d/index.html` | 入口页面，importmap 加载 Three.js，挂载 canvas | 无 |
| `3d/src/constants.js` | 从原项目复制的 GAME_CONFIG 常量 | 无 |
| `3d/src/camera.js` | 创建并返回正交摄像机 | constants.js |
| `3d/src/toon-material.js` | 创建 MeshToonMaterial + 反 hull 描边 | three |
| `3d/src/scene.js` | 创建地面、格子线、光照、阴影 | constants.js, three |
| `3d/src/plant.js` | 向日葵占位模型（几何体拼合） | toon-material.js, constants.js |
| `3d/src/zombie.js` | 僵尸占位模型（几何体拼合） | toon-material.js, constants.js |
| `3d/src/main.js` | 场景初始化、模型放置、渲染循环、动画更新 | 所有 src 模块 |
| `3d/report/3d-feasibility-report.md` | 技术评估报告模板 | 无 |

---

### Task 1: 创建目录结构和 README

**Files:**
- Create: `3d/README.md`
- Create: `3d/src/` (directory)
- Create: `3d/report/` (directory)
- Create: `3d/assets/models/` (directory)

- [ ] **Step 1: 创建所有目录**

```bash
mkdir -p 3d/src 3d/report 3d/assets/models
```

- [ ] **Step 2: 编写 README**

写入 `3d/README.md`：

```markdown
# 3D 可行性调研原型

评估将 2D 塔防游戏战斗场景升级为 3D 渲染的技术可行性。

## 技术栈

- Three.js 0.160 (CDN importmap)
- ES Modules
- 卡通渲染：MeshToonMaterial + 反 hull 描边

## 启动

```bash
npx serve 3d/
```

浏览器打开提示的 URL（默认 http://localhost:3000）。

## 目录结构

```
3d/
├── README.md
├── index.html          ← 入口页面
├── src/
│   ├── main.js         ← 场景初始化 + 渲染循环
│   ├── constants.js    ← 游戏常量
│   ├── camera.js       ← 正交摄像机
│   ├── scene.js        ← 地面 + 格子 + 光照
│   ├── plant.js        ← 向日葵占位模型
│   ├── zombie.js       ← 僵尸占位模型
│   └── toon-material.js ← 卡通材质 + 描边
├── report/
│   └── 3d-feasibility-report.md
└── assets/
    └── models/         ← 3D 模型文件 (.glb)
```
```

- [ ] **Step 3: 验证目录结构**

```bash
ls -R 3d/
```

预期输出：显示 `src/`、`report/`、`assets/models/`、`README.md`

---

### Task 2: 创建常量文件

**Files:**
- Create: `3d/src/constants.js`

- [ ] **Step 1: 从原项目复制常量**

写入 `3d/src/constants.js`：

```js
// 从 game/js/constants.js 手动复制，保持 3d/ 文件夹独立运行
export const GAME_CONFIG = {
  CANVAS_WIDTH: 900,
  CANVAS_HEIGHT: 540,
  LAWN_ROWS: 5,
  LAWN_COLS: 9,
  CELL_WIDTH: 100,
  CELL_HEIGHT: 108,
  FPS: 60
};

// 世界空间尺寸（与 Canvas 像素 1:1 映射）
export const WORLD_WIDTH = GAME_CONFIG.CANVAS_WIDTH;   // 900
export const WORLD_HEIGHT = GAME_CONFIG.CANVAS_HEIGHT; // 540

// 草坪在世界空间中的偏移量（左上角为原点时使用）
export const LAWN_LEFT = -WORLD_WIDTH / 2;   // -450
export const LAWN_TOP = -WORLD_HEIGHT / 2;    // -270

// 植物占位尺寸（参考 PlantConfig 默认 renderSize=80）
export const PLANT_SIZE = 40;  // 半径

// 僵尸占位尺寸
export const ZOMBIE_WIDTH = 40;
export const ZOMBIE_HEIGHT = 60;
```

---

### Task 3: 创建入口页面 index.html

**Files:**
- Create: `3d/index.html`

- [ ] **Step 1: 编写 HTML 入口**

写入 `3d/index.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>3D 可行性调研原型 - PvZ Tactics</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #1a1a2e;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: 'Microsoft YaHei', sans-serif;
      color: #ccc;
    }
    h1 { margin: 16px 0 8px; font-size: 20px; color: #fff; }
    #info { font-size: 13px; margin-bottom: 12px; color: #888; }
    #game-canvas { border-radius: 4px; box-shadow: 0 0 24px rgba(0,0,0,0.5); }
    #fps { margin-top: 8px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <h1>3D 可行性调研原型 — 2.5D 俯视卡通渲染</h1>
  <div id="info">固定正交摄像机 | MeshToonMaterial + 反 hull 描边 | Three.js 0.160</div>
  <div id="game-canvas"></div>
  <div id="fps">FPS: --</div>

  <script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three@0.160.0/build/three.module.js"
    }
  }
  </script>
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

---

### Task 4: 创建摄像机模块

**Files:**
- Create: `3d/src/camera.js`

- [ ] **Step 1: 编写正交摄像机**

写入 `3d/src/camera.js`：

```js
import * as THREE from 'three';
import { WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';

/**
 * 创建 2.5D 固定俯视正交摄像机
 * 视野精确覆盖 WORLD_WIDTH × WORLD_HEIGHT 的世界空间
 * 1 世界单位 = 1 像素，与原游戏坐标系统一致
 */
export function createCamera() {
  const left = -WORLD_WIDTH / 2;    // -450
  const right = WORLD_WIDTH / 2;    //  450
  const top = -WORLD_HEIGHT / 2;     // -270 (屏幕上方)
  const bottom = WORLD_HEIGHT / 2;   //  270 (屏幕下方)
  const near = 0.1;
  const far = 100;

  const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);

  // 摄像机置于世界正上方，垂直向下看
  camera.position.set(0, 10, 0);
  camera.lookAt(0, 0, 0);

  // 确保摄像机的"上"方向与世界 Z 轴对齐
  // 使得 top/bottom 映射到世界 Z 轴，left/right 映射到世界 X 轴
  camera.up.set(0, 0, 1);

  return camera;
}
```

---

### Task 5: 创建卡通材质 + 描边模块

**Files:**
- Create: `3d/src/toon-material.js`

- [ ] **Step 1: 编写卡通材质和描边工具函数**

写入 `3d/src/toon-material.js`：

```js
import * as THREE from 'three';

/**
 * 创建卡通赛璐璐材质
 * MeshToonMaterial 自带色阶过渡（默认 3 阶），减少中间调呈现动画质感
 * @param {number|string} color - 颜色值
 * @returns {THREE.MeshToonMaterial}
 */
export function createToonMaterial(color) {
  return new THREE.MeshToonMaterial({
    color: color,
    // 不设置 gradientMap 则使用默认 3 阶梯度
  });
}

/**
 * 反 hull 法描边
 * 复制模型几何体，放大后从背面渲染纯黑色，形成轮廓线
 * 适用于凸面体（球、盒、柱），性能优于后处理方案
 *
 * @param {THREE.Mesh} mesh - 待描边的网格
 * @param {number} [color=0x000000] - 描边颜色
 * @param {number} [thickness=0.03] - 描边厚度（相对于模型尺寸的比例）
 * @returns {THREE.Group} 包含原 mesh 和描边 mesh 的组
 */
export function addOutline(mesh, color = 0x000000, thickness = 0.03) {
  // 创建描边 mesh：使用相同几何体，纯黑材质，仅渲染背面
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: color,
    side: THREE.BackSide  // 关键：只渲染背面，防止遮挡原模型
  });

  const outlineMesh = new THREE.Mesh(mesh.geometry, outlineMaterial);
  outlineMesh.scale.setScalar(1 + thickness);
  outlineMesh.castShadow = false;
  outlineMesh.receiveShadow = false;

  const group = new THREE.Group();
  group.add(mesh);
  group.add(outlineMesh);

  return group;
}

/**
 * 便捷函数：创建带描边的卡通网格
 * @param {THREE.BufferGeometry} geometry
 * @param {number|string} color
 * @param {number} [outlineThickness=0.03]
 * @returns {THREE.Group}
 */
export function createToonMesh(geometry, color, outlineThickness = 0.03) {
  const material = createToonMaterial(color);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return addOutline(mesh, 0x000000, outlineThickness);
}
```

---

### Task 6: 创建战斗场景模块

**Files:**
- Create: `3d/src/scene.js`

- [ ] **Step 1: 编写场景搭建函数**

写入 `3d/src/scene.js`：

```js
import * as THREE from 'three';
import {
  WORLD_WIDTH, WORLD_HEIGHT,
  GAME_CONFIG
} from './constants.js';

const { LAWN_ROWS, LAWN_COLS, CELL_WIDTH, CELL_HEIGHT } = GAME_CONFIG;

/**
 * 创建草坪地面
 */
function createGround() {
  const geometry = new THREE.PlaneGeometry(WORLD_WIDTH, WORLD_HEIGHT);
  const material = new THREE.MeshToonMaterial({ color: 0x5a8f3c });
  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2; // 平放在 XZ 平面
  ground.position.y = 0;
  ground.receiveShadow = true;
  return ground;
}

/**
 * 创建格子线
 * 手动绘制 5 行 × 9 列的网格线，因为 GridHelper 只支持正方形网格
 */
function createGridLines() {
  const material = new THREE.LineBasicMaterial({ color: 0x3d6b2e, transparent: true, opacity: 0.5 });
  const group = new THREE.Group();

  const halfW = WORLD_WIDTH / 2;   // 450
  const halfH = WORLD_HEIGHT / 2;  // 270
  const yOffset = 0.005; // 略高于地面防止 z-fighting

  // 水平线（分隔行）：共 LAWN_ROWS + 1 = 6 条
  for (let i = 0; i <= LAWN_ROWS; i++) {
    const z = -halfH + i * CELL_HEIGHT;
    const points = [
      new THREE.Vector3(-halfW, yOffset, z),
      new THREE.Vector3(halfW, yOffset, z)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    group.add(new THREE.Line(geometry, material));
  }

  // 竖直线（分隔列）：共 LAWN_COLS + 1 = 10 条
  for (let i = 0; i <= LAWN_COLS; i++) {
    const x = -halfW + i * CELL_WIDTH;
    const points = [
      new THREE.Vector3(x, yOffset, -halfH),
      new THREE.Vector3(x, yOffset, halfH)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    group.add(new THREE.Line(geometry, material));
  }

  return group;
}

/**
 * 创建光照
 */
function createLights() {
  const lights = new THREE.Group();

  // 环境光：防止暗部纯黑
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  lights.add(ambient);

  // 主方向光：产生明暗面和阴影
  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(5, 15, 5);
  directional.castShadow = true;
  directional.shadow.mapSize.width = 1024;
  directional.shadow.mapSize.height = 1024;
  directional.shadow.camera.near = 0.5;
  directional.shadow.camera.far = 50;
  directional.shadow.camera.left = -500;
  directional.shadow.camera.right = 500;
  directional.shadow.camera.top = 300;
  directional.shadow.camera.bottom = -300;
  lights.add(directional);

  return lights;
}

/**
 * 创建完整战斗场景
 * @param {THREE.Scene} scene - Three.js 场景实例
 */
export function createBattleScene(scene) {
  scene.background = new THREE.Color(0x87ceeb); // 天蓝色背景

  // 地面
  scene.add(createGround());

  // 格子线
  scene.add(createGridLines());

  // 光照
  scene.add(createLights());
}

/**
 * 创建格子坐标计算辅助函数
 * 将网格坐标 (row, col) 转换为世界空间坐标
 * @param {number} row - 行 (0-4)
 * @param {number} col - 列 (0-8)
 * @returns {{x: number, z: number}} 世界空间坐标
 */
export function cellToWorld(row, col) {
  const halfW = WORLD_WIDTH / 2;
  const halfH = WORLD_HEIGHT / 2;
  return {
    x: -halfW + col * CELL_WIDTH + CELL_WIDTH / 2,
    z: -halfH + row * CELL_HEIGHT + CELL_HEIGHT / 2
  };
}
```

---

### Task 7: 创建植物模块（向日葵占位模型）

**Files:**
- Create: `3d/src/plant.js`

- [ ] **Step 1: 编写向日葵占位模型**

写入 `3d/src/plant.js`：

```js
import * as THREE from 'three';
import { createToonMesh } from './toon-material.js';
import { PLANT_SIZE } from './constants.js';

/**
 * 创建向日葵占位模型
 * 由简单几何体拼合：花盘（球形）+ 花瓣（环绕扁盒）+ 茎（细柱）
 * 返回一个 Group，附带 updateAnimation 方法用于待机动画
 */
export function createSunflower() {
  const group = new THREE.Group();

  // 花盘（中心球形，黄色）
  const headGeom = new THREE.SphereGeometry(PLANT_SIZE * 0.5, 16, 16);
  const head = createToonMesh(headGeom, 0xf5d442, 0.03);
  head.position.y = PLANT_SIZE * 0.5;
  group.add(head);

  // 花瓣（8 片，环绕花盘排列）
  const petalGeom = new THREE.BoxGeometry(PLANT_SIZE * 0.25, PLANT_SIZE * 0.1, PLANT_SIZE * 0.5);
  const petalCount = 8;
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const petal = createToonMesh(petalGeom, 0xffdd44, 0.03);
    petal.position.x = Math.cos(angle) * PLANT_SIZE * 0.55;
    petal.position.y = PLANT_SIZE * 0.5;
    petal.position.z = Math.sin(angle) * PLANT_SIZE * 0.55;
    petal.rotation.y = angle;
    group.add(petal);
  }

  // 茎（细圆柱体，绿色）
  const stemGeom = new THREE.CylinderGeometry(PLANT_SIZE * 0.08, PLANT_SIZE * 0.08, PLANT_SIZE * 0.6, 8);
  const stem = createToonMesh(stemGeom, 0x4caf50, 0.03);
  stem.position.y = PLANT_SIZE * 0.1;
  group.add(stem);

  // 叶子（两片扁盒，斜向伸出）
  const leafGeom = new THREE.BoxGeometry(PLANT_SIZE * 0.35, PLANT_SIZE * 0.05, PLANT_SIZE * 0.15);
  const leaf1 = createToonMesh(leafGeom, 0x4caf50, 0.03);
  leaf1.position.set(PLANT_SIZE * 0.2, PLANT_SIZE * 0.15, 0);
  leaf1.rotation.z = 0.4;
  const leaf2 = createToonMesh(leafGeom, 0x4caf50, 0.03);
  leaf2.position.set(-PLANT_SIZE * 0.2, PLANT_SIZE * 0.15, 0);
  leaf2.rotation.z = -0.4;
  group.add(leaf1);
  group.add(leaf2);

  return group;
}

/**
 * 更新植物待机动画（呼吸效果）
 * @param {THREE.Group} plantGroup - createSunflower 返回的组
 * @param {number} time - 累计时间（秒）
 */
export function updatePlantAnimation(plantGroup, time) {
  const breath = 1 + Math.sin(time * 2.5) * 0.04;
  plantGroup.scale.set(breath, breath, breath);
  // 花盘轻微摇摆
  plantGroup.rotation.z = Math.sin(time * 1.8) * 0.03;
}
```

---

### Task 8: 创建僵尸模块（僵尸占位模型）

**Files:**
- Create: `3d/src/zombie.js`

- [ ] **Step 1: 编写僵尸占位模型**

写入 `3d/src/zombie.js`：

```js
import * as THREE from 'three';
import { createToonMesh } from './toon-material.js';
import { ZOMBIE_WIDTH, ZOMBIE_HEIGHT } from './constants.js';

/**
 * 创建普通僵尸占位模型
 * 由简单几何体拼合：身体（盒）+ 头部（球）+ 手臂（柱）+ 腿（柱）
 * 返回一个 Group，附带 updateAnimation 方法用于行走动画
 */
export function createNormalZombie() {
  const group = new THREE.Group();

  const bodyColor = 0x6b8e6b;   // 灰绿 zombie 色调
  const limbColor = 0x556b55;
  const headColor = 0x8fbc8f;

  // 身体（长方体）
  const bodyGeom = new THREE.BoxGeometry(ZOMBIE_WIDTH * 0.7, ZOMBIE_HEIGHT * 0.4, ZOMBIE_WIDTH * 0.5);
  const body = createToonMesh(bodyGeom, bodyColor, 0.03);
  body.position.y = ZOMBIE_HEIGHT * 0.25;
  group.add(body);

  // 头部（球体）
  const headGeom = new THREE.SphereGeometry(ZOMBIE_WIDTH * 0.32, 12, 12);
  const head = createToonMesh(headGeom, headColor, 0.03);
  head.position.y = ZOMBIE_HEIGHT * 0.52;
  group.add(head);

  // 左臂（上半段）
  const leftUpperArmGeom = new THREE.CylinderGeometry(ZOMBIE_WIDTH * 0.08, ZOMBIE_WIDTH * 0.08, ZOMBIE_HEIGHT * 0.25, 6);
  const leftUpperArm = createToonMesh(leftUpperArmGeom, limbColor, 0.03);
  leftUpperArm.position.set(-ZOMBIE_WIDTH * 0.45, ZOMBIE_HEIGHT * 0.35, 0);
  group.add(leftUpperArm);

  // 左臂（下半段）
  const leftLowerArmGeom = new THREE.CylinderGeometry(ZOMBIE_WIDTH * 0.07, ZOMBIE_WIDTH * 0.07, ZOMBIE_HEIGHT * 0.22, 6);
  const leftLowerArm = new THREE.Mesh(leftLowerArmGeom, new THREE.MeshToonMaterial({ color: limbColor }));
  leftLowerArm.castShadow = true;
  // 组合到上半段下方
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.copy(leftUpperArm.position);
  leftLowerArm.position.y = -ZOMBIE_HEIGHT * 0.22;
  leftArmGroup.add(leftLowerArm);
  // 替换原来的 upper arm 为完整手臂组
  group.remove(leftUpperArm);
  leftArmGroup.add(leftUpperArm);
  group.add(leftArmGroup);

  // 右臂（对称，结构同上）
  const rightUpperArmGeom = new THREE.CylinderGeometry(ZOMBIE_WIDTH * 0.08, ZOMBIE_WIDTH * 0.08, ZOMBIE_HEIGHT * 0.25, 6);
  const rightUpperArm = createToonMesh(rightUpperArmGeom, limbColor, 0.03);
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(ZOMBIE_WIDTH * 0.45, ZOMBIE_HEIGHT * 0.35, 0);
  const rightLowerArmGeom = new THREE.CylinderGeometry(ZOMBIE_WIDTH * 0.07, ZOMBIE_WIDTH * 0.07, ZOMBIE_HEIGHT * 0.22, 6);
  const rightLowerArm = new THREE.Mesh(rightLowerArmGeom, new THREE.MeshToonMaterial({ color: limbColor }));
  rightLowerArm.castShadow = true;
  rightLowerArm.position.y = -ZOMBIE_HEIGHT * 0.22;
  rightArmGroup.add(rightUpperArm);
  rightArmGroup.add(rightLowerArm);
  group.add(rightArmGroup);

  // 左腿
  const leftLegGeom = new THREE.CylinderGeometry(ZOMBIE_WIDTH * 0.09, ZOMBIE_WIDTH * 0.09, ZOMBIE_HEIGHT * 0.3, 6);
  const leftLeg = createToonMesh(leftLegGeom, limbColor, 0.03);
  leftLeg.position.set(-ZOMBIE_WIDTH * 0.18, -ZOMBIE_HEIGHT * 0.1, 0);
  group.add(leftLeg);

  // 右腿
  const rightLegGeom = new THREE.CylinderGeometry(ZOMBIE_WIDTH * 0.09, ZOMBIE_WIDTH * 0.09, ZOMBIE_HEIGHT * 0.3, 6);
  const rightLeg = createToonMesh(rightLegGeom, limbColor, 0.03);
  rightLeg.position.set(ZOMBIE_WIDTH * 0.18, -ZOMBIE_HEIGHT * 0.1, 0);
  group.add(rightLeg);

  // 存储手臂引用用于动画
  group.userData = { leftArmGroup, rightArmGroup };

  return group;
}

/**
 * 更新僵尸行走/待机动画
 * @param {THREE.Group} zombieGroup - createNormalZombie 返回的组
 * @param {number} time - 累计时间（秒）
 */
export function updateZombieAnimation(zombieGroup, time) {
  // 身体上下晃动
  zombieGroup.position.y = Math.abs(Math.sin(time * 3)) * 0.12;

  // 手臂前后摆动
  const { leftArmGroup, rightArmGroup } = zombieGroup.userData;
  if (leftArmGroup) {
    leftArmGroup.rotation.x = Math.sin(time * 3) * 0.4;
  }
  if (rightArmGroup) {
    rightArmGroup.rotation.x = Math.sin(time * 3 + Math.PI) * 0.4;
  }
}
```

---

### Task 9: 创建主入口模块

**Files:**
- Create: `3d/src/main.js`

- [ ] **Step 1: 编写主入口，串联所有模块**

写入 `3d/src/main.js`：

```js
import * as THREE from 'three';
import { createCamera } from './camera.js';
import { createBattleScene, cellToWorld } from './scene.js';
import { createSunflower, updatePlantAnimation } from './plant.js';
import { createNormalZombie, updateZombieAnimation } from './zombie.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';

// --- 初始化渲染器 ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(WORLD_WIDTH, WORLD_HEIGHT);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比防止性能问题
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const container = document.getElementById('game-canvas');
container.appendChild(renderer.domElement);

// --- 初始化场景 ---
const scene = new THREE.Scene();
createBattleScene(scene);

// --- 初始化摄像机 ---
const camera = createCamera();

// --- 放置植物（向日葵在格子 (2, 3) 即第 3 行第 4 列） ---
const sunflower = createSunflower();
const sunflowerPos = cellToWorld(2, 3);
sunflower.position.set(sunflowerPos.x, 0, sunflowerPos.z);
scene.add(sunflower);

// --- 放置僵尸（普通僵尸在格子 (2, 7) 即第 3 行第 8 列） ---
const zombie = createNormalZombie();
const zombiePos = cellToWorld(2, 7);
zombie.position.set(zombiePos.x, 0, zombiePos.z);
scene.add(zombie);

// --- FPS 计数器 ---
const fpsElement = document.getElementById('fps');
let frameCount = 0;
let lastFpsTime = performance.now();

// --- 渲染循环 ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // 更新动画
  updatePlantAnimation(sunflower, elapsed);
  updateZombieAnimation(zombie, elapsed);

  // 渲染
  renderer.render(scene, camera);

  // FPS 统计
  frameCount++;
  if (elapsed - lastFpsTime >= 1.0) {
    const fps = Math.round(frameCount / (elapsed - lastFpsTime));
    fpsElement.textContent = `FPS: ${fps}`;
    frameCount = 0;
    lastFpsTime = elapsed;
  }
}

// --- 启动 ---
animate();
console.log('3D 可行性原型已启动');
console.log(`渲染器: WebGL ${renderer.capabilities.isWebGL2 ? '2.0' : '1.0'}`);
console.log(`视口: ${WORLD_WIDTH}×${WORLD_HEIGHT}`);
```

- [ ] **Step 2: 验证文件完整性**

```bash
ls -la 3d/src/
```

预期输出：列出 `main.js`、`constants.js`、`camera.js`、`scene.js`、`plant.js`、`zombie.js`、`toon-material.js`

---

### Task 10: 启动原型并验证渲染效果

- [ ] **Step 1: 安装 serve（如未安装）**

```bash
npx serve --version 2>/dev/null || echo "serve 将在下一步自动下载运行"
```

- [ ] **Step 2: 启动本地服务器**

```bash
npx serve 3d/
```

预期输出：显示 `http://localhost:3000` 地址

- [ ] **Step 3: 手动验证清单**

在浏览器中打开 `http://localhost:3000`，逐项检查：

| 检查项 | 预期结果 |
|--------|----------|
| 页面加载 | 标题、副标题、Canvas 均可见 |
| 草坪地面 | 浅绿色平面覆盖整个视口 |
| 格子线 | 5 行 × 9 列深绿色网格线清晰可见 |
| 向日葵模型 | 黄色花盘 + 绿色茎叶，在格子 (2,3) 位置 |
| 僵尸模型 | 灰绿色人形，在格子 (2,7) 位置 |
| 卡通描边 | 两个模型均有黑色轮廓线 |
| 阴影 | 角色下方地面有柔和投影 |
| 待机动画 | 向日葵轻微呼吸缩放，僵尸上下晃动 + 手臂摆动 |
| FPS 显示 | 页面底部实时 FPS ≥ 55 |
| 控制台 | 无报错，显示初始化信息 |

---

### Task 11: 编写技术评估报告

**Files:**
- Create: `3d/report/3d-feasibility-report.md`

- [ ] **Step 1: 编写报告**

写入 `3d/report/3d-feasibility-report.md`：

```markdown
# 3D 化技术可行性评估报告

> 基于 Three.js + Electron 方案的 2.5D 俯视卡通渲染原型验证

## 1. 技术可行性

| 评估维度 | 结论 | 说明 |
|----------|------|------|
| Three.js 集成 | [待填写] | WebGL 渲染器在 Electron 环境下的兼容性 |
| ES Module + importmap | [待填写] | CDN 加载 Three.js 的稳定性和加载速度 |
| 正交摄像机 2.5D | [待填写] | 固定俯视视角下世界坐标与像素坐标的 1:1 映射 |

## 2. 视觉评估

| 评估维度 | 结论 | 说明 |
|----------|------|------|
| 卡通渲染效果 | [待填写] | MeshToonMaterial 在俯视角度下的色阶过渡表现 |
| 描边效果 | [待填写] | 反 hull 法的轮廓清晰度，是否存在破面/锯齿 |
| 阴影质量 | [待填写] | PCFSoftShadowMap 在俯视视角的投影自然度 |
| 与原游戏风格匹配度 | [待填写] | 3D 卡通渲染是否保持了原游戏的 Q 版观感 |

## 3. 性能评估

| 场景 | 模型数量 | FPS | 说明 |
|------|----------|-----|------|
| 2 模型同屏 | 2 | [待填写] | 向日葵 + 僵尸 |
| 10 模型同屏 | 10 | [待填写] | 5 植物 + 5 僵尸 |
| 50 模型同屏 | 50 | [待填写] | 满编战斗场景模拟 |

## 4. 资产管线评估

| 评估维度 | 结论 | 说明 |
|----------|------|------|
| Blender → glb 导出 | [待填写] | 导出流程、材质兼容性 |
| GLTFLoader 加载 | [待填写] | 加载速度、内存占用 |
| 骨骼动画播放 | [待填写] | AnimationMixer 的兼容性和性能 |
| 占位模型 → 正式模型替换 | [待填写] | 替换流程的便捷性 |

## 5. 风险评估

| 风险项 | 严重程度 | 缓解措施 |
|--------|----------|----------|
| 描边在复杂模型上的表现 | [待填写] | 反 hull 法对凹面体可能产生伪影，复杂模型需改用后处理 OutlinePass |
| 大量模型同屏性能 | [待填写] | 实例化渲染 (InstancedMesh) 或 LOD |
| HTML UI 与 WebGL Canvas 叠加 | [待填写] | CSS z-index 分层管理，需在 Electron 环境实测 |
| 移动端兼容性 | [待填写] | 当前仅目标 Windows 桌面端，暂不评估 |
| 描边 + 阴影的性能开销 | [待填写] | 反 hull 法增加 GPU 顶点数，但简单几何体影响可忽略 |

## 6. 结论与建议

[待填写]

### 是否建议推进 3D 化？

[待填写]

### 推荐的实施路径

[待填写]
```

---

## 自审

### 1. Spec 覆盖检查

| 规格章节 | 对应任务 |
|----------|----------|
| 2.2 目录结构 | Task 1, Task 2 |
| 2.3 启动方式 | Task 3 (importmap), Task 10 (npx serve) |
| 3.1 摄像机设定 | Task 4 |
| 3.2 场景层级结构 | Task 6 |
| 3.3 卡通渲染实现 | Task 5 |
| 3.4 模型加载策略 | Task 5 (createToonMesh), Task 7/8 (占位几何体) |
| 3.5 渲染循环 | Task 9 (main.js animate) |
| 4.1 原型 MVP 范围 | Task 7 (向日葵), Task 8 (僵尸), Task 9 (场景组合) |
| 4.2 Phase 1-5 | Task 4-11 完整覆盖 |
| 4.3 报告与原型关系 | Task 11 |

### 2. 占位符扫描

无 "TBD"、"TODO"、"implement later" 等占位符。报告中 `[待填写]` 是预期的——原型验证后才能填入实际数据。

### 3. 类型一致性检查

- `createSunflower()` → 返回 `THREE.Group`，由 `updatePlantAnimation(plantGroup, time)` 消费 ✓
- `createNormalZombie()` → 返回 `THREE.Group`，由 `updateZombieAnimation(zombieGroup, time)` 消费 ✓
- `cellToWorld(row, col)` → 返回 `{x, z}`，在 main.js 中用于设置角色位置 ✓
- 所有模块导入路径均为相对路径 `'./xxx.js'`，与 ES Module importmap 兼容 ✓
