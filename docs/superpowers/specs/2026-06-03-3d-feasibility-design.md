# 游戏 3D 化技术可行性调研 - 设计方案

## 1. 项目背景与目标

| 属性 | 内容 |
|------|------|
| 调研目的 | 评估将现有 2D 塔防游戏战斗场景升级为 3D 渲染的技术可行性和最佳路径 |
| 适用分支 | `3Dpossibility` |
| 产出物 | 技术评估报告 + 可运行 3D 原型 |
| 约束 | 不允许修改现有项目代码，所有调研产物存放于独立 `3d/` 文件夹 |

### 1.1 决策记录

| 决策项 | 结论 |
|--------|------|
| 技术路线 | Three.js + Electron（方案 A），不换框架只换渲染层 |
| 资产策略 | 尽量复用 2D UI 和素材，3D 仅替换核心战斗场景的角色渲染 |
| 摄像机视角 | 固定俯视 2.5D，正交相机，无旋转/缩放交互 |
| 视觉风格 | 卡通渲染 + 赛璐璐着色 + 描边（参考明日方舟 Q 版风格） |
| 技术栈约束 | 无预设限制，选择最合适方案 |
| 产出物 | 技术评估报告 + 可运行原型 |

## 2. 整体架构与文件夹结构

### 2.1 独立实验室原则

`3d/` 文件夹是零侵入的独立实验空间：不引用、不修改、不依赖现有 `game/` 目录下的任何代码。拥有自己的 HTML 入口、JS 源码和资源。

### 2.2 目录结构

```
mrfzVSzoombie/           ← 现有项目，完全不动
├── game/                ← 现有 2D 游戏逻辑
├── index.html           ← 现有游戏入口
├── electron/            ← 现有打包
│
└── 3d/                  ← 🆕 新增，独立实验室
    ├── README.md           ← 3D 调研说明
    ├── index.html          ← 3D 原型入口（独立页面）
    ├── report/
    │   └── 3d-feasibility-report.md   ← 技术评估报告
    ├── src/
    │   ├── main.js          ← Three.js 场景初始化
    │   ├── scene.js         ← 战斗场景搭建（草坪、格子）
    │   ├── plant.js         ← 3D 植物渲染（占位→正式模型）
    │   ├── zombie.js        ← 3D 僵尸渲染（占位→正式模型）
    │   ├── camera.js        ← 2.5D 固定俯视摄像机
    │   ├── toon-material.js ← 卡通渲染材质/描边
    │   └── utils.js         ← 辅助函数
    └── assets/
        └── models/          ← 3D 模型文件（.glb / .gltf）
```

### 2.3 启动方式

- 不依赖 Electron，不依赖 `server.js`
- 使用简单本地 HTTP 服务器打开 `3d/index.html`（如 `npx serve 3d/`）
- 或用 `file://` 协议 + importmap 加载 Three.js CDN

### 2.4 数据共享策略

如需和原游戏的尺寸/格子数据保持一致，采用**复制常量**方式：将 `constants.js` 中的 `GAME_CONFIG` 数值手动复制到 `3d/src/` 中，不 import 引用，确保文件夹可独立运行。

## 3. 3D 渲染管线

### 3.1 摄像机设定

- 类型：`THREE.OrthographicCamera`（正交相机，无透视变形）
- 位置：正上方俯视
- 朝向：垂直向下
- 视野：覆盖 5行 × 9列 草坪，参考 `GAME_CONFIG` 中 `CANVAS_WIDTH=900 / CANVAS_HEIGHT=540` 比例
- 交互：固定不动，无旋转/缩放

### 3.2 场景层级结构

```
Scene
├── AmbientLight（环境光，防止暗部纯黑）
├── DirectionalLight（主方向光，产生明暗面）
├── GroundPlane（草坪地面，PlaneGeometry + 浅绿材质）
├── GridLines（格子线，GridHelper 或手绘）
├── PlantsGroup（所有 3D 植物实例）
├── ZombiesGroup（所有 3D 僵尸实例）
└── ProjectilesGroup（子弹/弹道）
```

### 3.3 卡通渲染实现

| 效果 | 实现方式 |
|------|----------|
| 赛璐璐着色 | `THREE.MeshToonMaterial`，自带色阶过渡，减少中间调 |
| 描边 | 优先采用反 hull 法（复制模型放大 + 黑色 + 翻转法线 + 背面渲染），性能优且不依赖后处理管线；备选方案为 `OutlinePass`（需 EffectComposer） |
| 阴影 | `PCFSoftShadowMap`，地面投影增加立体感 |

固定俯视视角下，描边效果非常明显——角色轮廓清晰是卡通风格的关键。

### 3.4 模型加载策略

- 格式：**glTF 2.0（.glb）**，使用 Three.js `GLTFLoader`
- 初期原型：Three.js 内置几何体拼合（BoxGeometry + SphereGeometry + CylinderGeometry）作为占位模型
- 正式模型：从 Blender 导出 glb，应用 MeshToonMaterial
- 动画：glb 内嵌骨骼动画或 morph target，Three.js `AnimationMixer` 播放

### 3.5 渲染循环

```
requestAnimationFrame 驱动
  → 更新角色位置
  → 播放模型动画（AnimationMixer.update）
  → 渲染一帧（renderer.render）
```

## 4. 原型范围与阶段规划

### 4.1 原型 MVP 范围

原型不跑完整游戏循环，只需证明：**3D 卡通渲染角色可以在 2.5D 俯视视角下看起来不错**。

| 要素 | 内容 | 数据来源 |
|------|------|----------|
| 草坪 | 5×9 格子地面 + 格子线 | 复制 `GAME_CONFIG` 常量 |
| 植物 | 1 个占位模型（推荐向日葵） | `PlantConfig` 中 bodyType 尺寸 |
| 僵尸 | 1 个占位模型（推荐普通僵尸） | `ZOMBIE_TYPES` 常量 |
| 子弹 | 1 个弹道演示（可选） | 飞行路径 |
| 动画 | 植物待机 + 僵尸行走 | mixamo 或简单关键帧 |

不需要波次、不需要 UI 交互、不需要阳光系统。一个静态场景 + 角色待机动画即可。

### 4.2 阶段划分

```
Phase 1: 场景搭建
  ├── Three.js 初始化 + 正交摄像机
  ├── 草坪地面 + 格子线
  └── 光照 + 阴影

Phase 2: 卡通渲染验证
  ├── MeshToonMaterial + 描边效果
  └── 光照调试（确保俯视角度下卡通效果可辨识）

Phase 3: 角色占位
  ├── 几何体拼合向日葵占位模型
  ├── 几何体拼合僵尸占位模型
  └── 确认尺寸比例与原游戏一致

Phase 4: 动画
  ├── 植物待机动画
  └── 僵尸行走动画

Phase 5: 报告撰写
  └── 3d/report/3d-feasibility-report.md
```

### 4.3 报告与原型的关系

| 报告章节 | 原型验证内容 |
|----------|--------------|
| 技术可行性 | Three.js 在 Electron 环境的运行表现 |
| 视觉评估 | 2.5D 俯视下卡通渲染的可辨识度 |
| 性能评估 | FPS 基准（多个模型同屏） |
| 资产管线 | Blender 导出 glb → Three.js 加载的全流程 |
| 风险评估 | 描边效果、抗锯齿、与 HTML UI 叠加的兼容性 |

## 5. 技术方案对比（选择依据）

### 5.1 方案概览

| 方案 | 引擎 | 迁移成本 | 3D 能力 | UI 复用 | 推荐度 |
|------|------|----------|---------|---------|--------|
| A | Three.js + Electron | 低 | 中高 | 100% | ✅ 首选 |
| B | Babylon.js + Electron | 中低 | 高 | 100% | 备选 |
| C | Unity 引擎 | 极高 | 最强 | 0% | 不推荐 |

### 5.2 选择理由

用户场景为固定 2.5D 俯视 + 复用 UI + 调研原型。Three.js 用最小改动换取刚好够用的 3D 能力，是当前约束下的最优解。Babylon.js 的额外游戏引擎特性在此场景下大材小用，Unity 的迁移代价与调研目的严重不匹配。
