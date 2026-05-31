# 植物尺寸系统统一重构 设计规格

## 概述

消除植物尺寸在三处渲染路径（网格虚影、拖拽虚影、实际放置）中的分散硬编码，统一到 Plant 基类的 `getPlacementParams()` 方法。

---

## 核心原则

**所有植物新增时只需在子类中覆盖 `getPlacementParams()`，三级渲染自动同步，无需修改 Game.js。**

---

## 1. Plant 基类改动

### 文件：`game/js/Plant.js`

**`getRenderSize()` 默认值从 70 改为 80：**

```javascript
getRenderSize() { return 80; }
```

**新增 `getPlacementParams()`：**

```javascript
getPlacementParams() {
  return {
    bodyType: this.getBodyType(),
    renderSize: this.getRenderSize(),
    aspectRatio: this.getAspectRatio()
  };
}
```

`getBodyType()` 和 `getAspectRatio()` 保持不变（已有）。

---

## 2. 子类覆盖

| 植物 | 方法 | 返回值 | 说明 |
|---|---|---|---|
| PeaShooter(wishadel) | getBodyType | `'humanoid'` | 已有 |
| PeaShooter(wishadel) | getRenderSize | `160` | 视觉总宽度（消除 ghostScale） |
| PeaShooter(wishadel) | getAspectRatio | `1.21` | 已有 |
| CherryBomb | getAspectRatio | `0.72` | 已有 |
| Squash | getRenderSize | `80` | 回退到基类默认 |
| Squash | getAspectRatio | `1.0` | 回退到基类默认 |

**新增植物默认值：** 不需要任何覆盖，自动继承 `plant/80/1.0`。

---

## 3. Game.js 虚影重构

### 删除内容

删除 `render()` 方法中 drag ghost 渲染的硬编码分支（约 15 行）：

```javascript
// 删除：
if (isVisitor) { bodyType = 'humanoid'; ghostAspect = 0.98; }
else if (plantType === 'peashooter') {
  skinId = ...; if (skinId === 'wishadel') { bodyType = 'humanoid'; ghostAspect = 1.21; ghostScale = 2; }
}
else if (plantType === 'cherrybomb') { ghostAspect = 0.72; }
else if (plantType === 'nut') { ghostAspect = 1.0; }
else if (plantType === 'squash') { ... }
// ... etc.
```

删除 `actualW = baseW * ghostScale` 的 CELL_WIDTH 二次乘法层。

### 替换为

**新增辅助方法 `_getPlantPlacementParams(plantType)`：**

```javascript
_getPlantPlacementParams(plantType) {
  if (plantType === 'peashooter') {
    const skinId = (this.playerData.equippedSkins || {})[plantType];
    if (skinId === 'wishadel') {
      return { bodyType: 'humanoid', renderSize: 160, aspectRatio: 1.21 };
    }
  }
  const def = getPlantDef(plantType);
  if (def && def.combat && def.combat.bodyType === 'humanoid') {
    return { bodyType: 'humanoid', renderSize: 80, aspectRatio: 1.0 };
  }
  return { bodyType: 'plant', renderSize: 80, aspectRatio: 1.0 };
}
```

**虚影渲染统一流程：**

```javascript
const params = this._getPlantPlacementParams(plantType);
const rect = this.lawn.getPlacementRect(params.bodyType, params.renderSize, hoverRow, hoverCol, 0, params.aspectRatio);
// 虚影直接使用 rect.x, rect.y, rect.w, rect.h 作为容器
```

**网格虚影 + 拖拽虚影** 都调用同一流程，使用 fit-to-box 底部锚定绘制图像。

---

## 4. 现有植物尺寸修正

| 植物 | 改动前虚影 | 改动前实际 | 改动后（统一） |
|---|---|---|---|
| Sunflower | 80（硬编码） | 70（基类） | **80**（基类默认改为80） |
| Nut | 80（硬编码） | 70（基类） | **80** |
| CherryBomb | 80 + ghostAspect 0.72 | 70 + aspectRatio 0.72 | **80 + aspectRatio 0.72** |
| PeaShooter(wishadel) | 80 + ghostScale 2 | 80（非wishadel）| **160（renderSize）** |
| 新植物(全部) | 需硬编码 | 手动设置 | **自动继承 80/1.0** |

---

## 5. CLAUDE.md 新增规则

```
## 植物尺寸系统（高优先级）

1. 每个植物的虚影和实际渲染尺寸由 Plant 基类的 getPlacementParams() 统一提供，包含 bodyType、renderSize、aspectRatio。
2. 三级渲染（网格虚影、拖拽虚影、实际放置）必须通过同一入口 Lawn.getPlacementRect() 获取位置和尺寸，禁止在任何渲染路径中硬编码植物尺寸参数。
3. 实际形象和网格虚影的大小和位置必须相同。
4. 拖拽虚影和网格虚影的大小必须相同。
5. 新增植物时，只需在 PlantConfig 的 combat 中声明 bodyType，其余自动继承基类默认值（renderSize=80, aspectRatio=1.0）。
```

---

## 文件变更清单

| 文件 | 改动 |
|---|---|
| `game/js/Plant.js` | getRenderSize 默认 70→80，新增 getPlacementParams() |
| `game/js/PeaShooter.js` | wishadel 皮肤覆盖 getRenderSize()=160 |
| `game/js/Squash.js` | 回退 width/height 为 100/108，getRenderSize=80 |
| `game/js/Game.js` | 删除硬编码虚影分支，新增 _getPlantPlacementParams()，虚影直接用 rect.w/h |
| `CLAUDE.md` | 新增"植物尺寸系统"规则 |
