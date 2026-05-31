# 植物尺寸系统统一重构 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 消除植物尺寸在三处渲染路径中的分散硬编码，统一到 `getPlacementParams()` → `getPlacementRect()` 单一路径。

**Architecture:** Plant 基类提供 `getPlacementParams()` 作为唯一尺寸入口；Game.js 虚影通过 `_getPlantPlacementParams()` 桥接（无需植物实例时），调用同一 `getPlacementRect()`；删除所有硬编码分支。

**Tech Stack:** JavaScript ES Modules, HTML5 Canvas

---

### 任务 1: Plant 基类改动

**Files:**
- Modify: `game/js/Plant.js`

- [ ] **Step 1: getRenderSize 默认值 70→80**

找到并修改：

```javascript
// 修改前：
getRenderSize() { return 70; }
// 修改后：
getRenderSize() { return 80; }
```

- [ ] **Step 2: 新增 getPlacementParams()**

在 `getAspectRatio()` 方法之后添加：

```javascript
getPlacementParams() {
  return {
    bodyType: this.getBodyType(),
    renderSize: this.getRenderSize(),
    aspectRatio: this.getAspectRatio()
  };
}
```

---

### 任务 2: PeaShooter wishadel 覆盖 getRenderSize

**Files:**
- Modify: `game/js/PeaShooter.js`

- [ ] **Step 1: wishadel 皮肤时覆盖 getRenderSize**

找到 PeaShooter 类中已有的 `getRenderSize()` 和 `getAspectRatio()` 方法。修改 `getRenderSize()` 使其在 wishadel 皮肤时返回 160：

```javascript
getRenderSize() {
  if (this.skinId === 'wishadel') return 160;
  return 80;
}

getAspectRatio() {
  return this.skinId === 'wishadel' ? 1.21 : 1.0;
}
```

（如果 `getAspectRatio()` 已有 wishadel 分支则保留不变）

- [ ] **Step 2: 确认 wishadel 渲染宽度匹配**

Wishadel 的 `render()` 方法中 `drawW = this.width * 2` 已经是 160（width=80*2），与 `getRenderSize()=160` 一致。无需改动。

---

### 任务 3: Squash.js 回退到统一尺寸

**Files:**
- Modify: `game/js/Squash.js`

- [ ] **Step 1: 回退 width/height 到基类默认值**

```javascript
// 修改前：
this.width = 100;
this.height = 108;
// 修改后：
this.width = 80;
this.height = 80;
```

- [ ] **Step 2: 回退 getRenderSize / getAspectRatio**

删除 Squash 中的覆盖，使用基类默认值（80 / 1.0）：

```javascript
// 删除：
getRenderSize() { return 100; }
getAspectRatio() { return 1.08; }

// 改为不覆盖（继承基类默认 80 / 1.0）
// 如果 Squash.js 中原本没有显式覆盖，则无需操作
```

- [ ] **Step 3: 确认 render 方法使用 fit-to-box**

Squash 的 render 中 idle 态使用 fit-to-box 底部锚定，尺寸从 `this.width/this.height` 读取（现为 80×80），自动适配。无需额外改动。

---

### 任务 4: Game.js 虚影重构

**Files:**
- Modify: `game/js/Game.js`

这是最大的单文件改动。分四步：

- [ ] **Step 1: 新增 `_getPlantPlacementParams(plantType)` 方法**

在 `_getSkinGhostImage` 方法附近添加：

```javascript
_getPlantPlacementParams(plantType) {
  // Visitor
  if (getVisitorDef(plantType)) {
    return { bodyType: 'humanoid', renderSize: 80, aspectRatio: 0.98 };
  }
  // Peashooter wishadel skin
  if (plantType === 'peashooter') {
    const skinId = (this.playerData.equippedSkins || {})[plantType];
    if (skinId === 'wishadel') {
      return { bodyType: 'humanoid', renderSize: 160, aspectRatio: 1.21 };
    }
  }
  // FireChen cart skin
  if (plantType === 'cart') {
    const skinId = (this.playerData.equippedSkins || {})[plantType];
    if (skinId === 'fireChen') {
      return { bodyType: 'humanoid', renderSize: 80, aspectRatio: 1.0 };
    }
  }
  // CherryBomb has unique aspect ratio
  if (plantType === 'cherrybomb') {
    return { bodyType: 'plant', renderSize: 80, aspectRatio: 0.72 };
  }
  // Default plant
  return { bodyType: 'plant', renderSize: 80, aspectRatio: 1.0 };
}
```

- [ ] **Step 2: 删除网格虚影硬编码分支**

找到 `render()` 方法中 drag ghost 渲染的硬编码分支（约在 239-258 行）。删除以下代码段：

```javascript
// 删除以下全部：
let bodyType = 'plant';
let renderSize = 80;
let ghostAspect = 1.0;
let ghostScale = 1;
let skinId = null;
if (isVisitor) {
  bodyType = 'humanoid';
  ghostAspect = 0.98;
} else if (plantType === 'peashooter') {
  skinId = (this.playerData.equippedSkins || {})[plantType];
  if (skinId === 'wishadel') {
    bodyType = 'humanoid';
    ghostAspect = 1.21;
    ghostScale = 2;
  }
} else if (plantType === 'cherrybomb') {
  ghostAspect = 0.72;
} else if (plantType === 'nut') {
  ghostAspect = 1.0;
} else if (plantType === 'squash') {
  ghostAspect = 1.08; renderSize = 100;
} else if (plantType === 'jalapeno') {
  ghostAspect = 1.0; renderSize = 80;
} else if (plantType === 'repeater') {
  ghostAspect = 1.0; renderSize = 80;
} else if (plantType === 'twinsunflower') {
  ghostAspect = 1.0; renderSize = 80;
} else if (plantType === 'gatlingpea') {
  ghostAspect = 1.0; renderSize = 80;
}
```

- [ ] **Step 3: 替换为统一调用**

在删除位置插入：

```javascript
const params = this._getPlantPlacementParams(plantType);
const bodyType = params.bodyType;
const renderSize = params.renderSize;
const ghostAspect = params.aspectRatio;
const ghostScale = 1;
```

- [ ] **Step 4: 虚影绘制使用 rect.w/h 作为容器尺寸**

找到虚影图像绘制的 `actualW/actualH` 计算（约在 262-265 行），替换为直接使用 rect 尺寸：

```javascript
// 修改前：
const baseW = GAME_CONFIG.CELL_WIDTH * rect.scale;
const baseH = GAME_CONFIG.CELL_HEIGHT * rect.scale;
const actualW = baseW * ghostScale;
const actualH = baseH * ghostScale;

// 修改后：
const actualW = rect.w * ghostScale;
const actualH = rect.h * ghostScale;
```

同时删除不再使用的 `wishadelShift` 变量和其相关逻辑（wishadel 现在通过 getRenderSize=160 自然扩展，不需要特殊偏移）：

```javascript
// 删除：
const wishadelShift = (plantType === 'peashooter' && skinId === 'wishadel');

// 图像绘制中的 wishadelShift 条件也一并简化，dx/dy 统一使用：
const dx = rect.x + (actualW - dw) / 2;
const dy = rect.y + actualH - dh;
```

- [ ] **Step 5: 鼠标拖拽虚影同步修改**

找到鼠标拖拽虚影的 `actualW/actualH` 计算（约在 410-415 行），同样修改为使用 `rect.w/h`。注意鼠标虚影的 rect 来自 `getPlacementRect` 调用，确保传参与网格虚影一致。

---

### 任务 5: CLAUDE.md 规则写入

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 在"游戏基础设定规则"后追加植物尺寸系统规则**

```markdown
## 植物尺寸系统（高优先级）

1. 每个植物的虚影和实际渲染尺寸由 Plant 基类的 getPlacementParams() 统一提供，包含 bodyType、renderSize、aspectRatio。
2. 三级渲染（网格虚影、拖拽虚影、实际放置）必须通过同一入口 Lawn.getPlacementRect() 获取位置和尺寸，禁止在任何渲染路径中硬编码植物尺寸参数。
3. 实际形象和网格虚影的大小和位置必须相同。
4. 拖拽虚影和网格虚影的大小必须相同。
5. 新增植物时，只需在 PlantConfig 的 combat 中声明 bodyType，其余自动继承基类默认值（renderSize=80, aspectRatio=1.0）。
```

---

### 实现顺序

```
任务 1 (Plant 基类) → 任务 2 (PeaShooter wishadel) → 任务 3 (Squash 回退)
                                                              ↓
任务 5 (CLAUDE.md) ←──────────────────────── 任务 4 (Game.js 虚影重构)
```

任务 1-3 可并行执行（互不依赖），任务 4 依赖前三个完成，任务 5 独立执行。
