# 战斗场景统一放置系统 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将战斗实体放置逻辑统一到 `Lawn.getPlacementRect()`，消除虚影与实际位置的偏差

**Architecture:** 在 Lawn.js 新增工厂函数，接收 bodyType/renderSize/row/col，返回统一的位置矩形。所有调用点（虚影×2、handleDrop×2、spawnZombie）均改为调用此函数，不再各自计算。

**Tech Stack:** Vanilla JS (ES modules), Canvas 2D

---

## 文件规划

| 文件 | 职责 | 改动 |
|------|------|------|
| `game/js/Lawn.js` | 新增 getPlacementRect() + 修改 plant() | +35行 |
| `game/js/Game.js` | 虚影×2 + handleDrop + spawnZombie 改为调用新函数 | ~60行改动 |
| `game/js/Zombie.js` | 新增 getRenderSize() 供统一函数使用 | +4行 |

---

### Task 1: Zombie 添加 getRenderSize()

**Files:**
- Modify: `game/js/Zombie.js`

- [ ] **Step 1: 在 Zombie 类中添加 getRenderSize 方法**

在 `takeDamage` 方法之前插入：

```js
getRenderSize() { return this.height; }
```

`game/js/Zombie.js` 位置：在 constructor 之后、update 之前或与现有方法相邻。

完整上下文 — 找到 `takeDamage(damage, damageType)` 方法，在其上方插入：

```js
  getRenderSize() { return this.height; }

  takeDamage(damage, damageType) {
```

---

### Task 2: Lawn.js 新增 getPlacementRect()，修改 plant()

**Files:**
- Modify: `game/js/Lawn.js`

- [ ] **Step 1: 新增 getPlacementRect() 公共方法**

在 `Lawn` 类中 `getAvgTileSize()` 方法之后插入：

```js
  getPlacementRect(bodyType, renderSize, row, col) {
    const sc = this.standardCell;
    const scale = sc.w / this.cellWidth;
    const sz = renderSize * scale;
    const tile = this.usePolyGrid ? this.sceneGrid.tiles[`${row},${col}`] : null;
    const cx = tile ? tile.center[0] : (col * this.cellWidth + this.cellWidth / 2);
    const cy = tile ? tile.center[1] : (row * this.cellHeight + this.cellHeight / 2);

    let x, y;
    if (bodyType === 'humanoid') {
      // 脚踩行中心偏下 20%
      const rowY = this.getRowY(row);
      const cellH = tile ? this.getTileSize(row, col).h : this.cellHeight;
      x = cx - sz / 2;
      y = rowY + cellH * 0.2 - sz;
    } else {
      // 植物：居中于格子
      x = cx - sz / 2;
      y = cy - sz / 2;
    }

    return {
      x, y,
      w: sz, h: sz,
      scale,
      rotation: this.isSlanted(col) ? -Math.PI / 4 : 0
    };
  }
```

- [ ] **Step 2: 修改 plant() 方法，内部调用 getPlacementRect**

将 `plant(row, col, plant)` 方法中设置 x/y/scale/rotation 的部分（当前 L65-87）替换为调用 getPlacementRect：

```js
  plant(row, col, plant) {
    if (this.canPlant(row, col)) {
      this.grid[row][col] = plant;
      plant.row = row;
      plant.col = col;

      const bodyType = plant.getBodyType ? plant.getBodyType() : 'plant';
      const renderSize = plant.getRenderSize ? plant.getRenderSize() : 80;
      const rect = this.getPlacementRect(bodyType, renderSize, row, col);
      plant.x = rect.x;
      plant.y = rect.y;
      plant.scale = rect.scale;
      plant.rotation = rect.rotation;

      return true;
    }
    return false;
  }
```

---

### Task 3: Game.js 虚影渲染改为调用 getPlacementRect

**Files:**
- Modify: `game/js/Game.js` (两处虚影渲染)

- [ ] **Step 1: 修改格子内虚影（render 方法 L172-231）**

将当前手动计算 cx/cy/sz 的逻辑替换为调用 `this.lawn.getPlacementRect()`。

找到以下代码块（`// Grid placement ghost` 注释下方，约 L172-231）并替换。关键改动：

```js
// Grid placement ghost — above background so it's visible during drag
if (this.dragState) {
  const { hoverRow, hoverCol, plantType } = this.dragState;
  if (hoverRow >= 0 && hoverRow < this.lawn.rows &&
      hoverCol >= 0 && hoverCol < this.lawn.cols) {
    const isVisitor = !!getVisitorDef(plantType);
    const cost = isVisitor ? 0 : this._getPlantCost(plantType);
    const canAfford = isVisitor || this.sun >= cost;
    const canPlace = this.lawn.canPlant(hoverRow, hoverCol) && canAfford && !this.isPlantOnCooldown(plantType);

    if (canPlace) {
      const tile = this.lawn.sceneGrid.tiles[`${hoverRow},${hoverCol}`];
      if (tile) {
        const bodyType = isVisitor ? 'humanoid' : 'plant';
        let renderSize = 80;
        if (isVisitor) {
          renderSize = 80;
        } else if (plantType === 'peashooter') {
          const skinId = (this.playerData.plantSkins || {})[plantType];
          renderSize = skinId === 'wishadel' ? 96 : 80;
        }
        // Nut/CherryBomb/Sunflower 不需要 skin override

        const rect = this.lawn.getPlacementRect(bodyType, renderSize, hoverRow, hoverCol);
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;

        this.ctx.save();
        this.ctx.globalAlpha = 0.45;
        if (this.lawn.isSlanted(hoverCol)) {
          this.ctx.translate(cx, cy);
          this.ctx.rotate(-Math.PI / 4);
          this.ctx.translate(-cx, -cy);
        }

        let img = null;
        if (isVisitor) {
          img = assetManager.getImageNoBg('visitor_katana_zero');
          if (img) {
            const imgScale = Math.min(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
            const dw = img.naturalWidth * imgScale;
            const dh = img.naturalHeight * imgScale;
            this.ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
          }
        } else {
          img = this._getSkinGhostImage(plantType);
          if (img) {
            const imgScale = Math.min(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
            const dw = img.naturalWidth * imgScale;
            const dh = img.naturalHeight * imgScale;
            this.ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
          }
        }
        if (!img) {
          const gx = rect.x, gy = rect.y;
          if (plantType === 'sunflower') drawSunflower(this.ctx, gx, gy, rect.w, rect.h);
          else if (plantType === 'peashooter') drawPeashooter(this.ctx, gx, gy, rect.w, rect.h, false);
          else if (plantType === 'nut') drawNut(this.ctx, gx, gy, rect.w, rect.h, false);
          else if (plantType === 'cherrybomb') drawCherryBomb(this.ctx, gx, gy, rect.w, rect.h, false);
        }
        this.ctx.restore();
      }
    }
  }
}
```

- [ ] **Step 2: 修改拖拽虚影（render 方法 L291-334）**

找到 `// Drag ghost — always on top of all characters` 注释下方的代码块。拖拽虚影随鼠标移动，位置不能从 getPlacementRect 获取，但 **sz（尺寸）** 需要保持一致的 renderSize 计算。

将当前的 `baseRenderSize` 计算部分改为与格子虚影相同的逻辑：

```js
// Drag ghost — always on top of all characters
if (this.dragState && this.dragState.mouseX !== undefined) {
  const { plantType, mouseX, mouseY } = this.dragState;
  const isVisitor = !!getVisitorDef(plantType);
  const cost = isVisitor ? 0 : this._getPlantCost(plantType);
  this.ctx.save();
  this.ctx.globalAlpha = (isVisitor || this.sun >= cost) ? 0.65 : 0.35;

  const sc = this.lawn.standardCell;
  const scale = sc.w / this.lawn.cellWidth;
  let renderSize = 80;
  if (isVisitor) {
    renderSize = 80;
  } else if (plantType === 'peashooter') {
    const skinId = (this.playerData.plantSkins || {})[plantType];
    renderSize = skinId === 'wishadel' ? 96 : 80;
  }
  const sz = renderSize * scale;

  // ... 后续绘制代码不变 ...
```

---

### Task 4: Game.js handleDrop() 移除 humanoid Y 覆盖

**Files:**
- Modify: `game/js/Game.js` (handleDrop 方法 L505-575)

- [ ] **Step 1: 移除植物放置分支中的 humanoid Y 覆盖**

找到 handleDrop 中植物放置部分末尾（约 L563-571），删除以下代码：

删除：
```js
      // Humanoid: feet on line 15% below row center
      if (plant.getBodyType() === 'humanoid') {
        const rowCenter = this.lawn.getRowY(row);
        const offset = this.lawn.standardCell.h / 2 * 0.1;
        plant.y = rowCenter + offset - plant.getRenderSize() * plant.scale;
      }
```

因为 `Lawn.plant()` 内部已经通过 `getPlacementRect()` 处理了 humanoid 的 Y 位置。

- [ ] **Step 2: 移除异客放置分支中的 humanoid Y 覆盖**

找到 handleDrop 中异客放置部分末尾（约 L516-520），删除以下代码：

删除：
```js
      if (visitor.getBodyType() === 'humanoid') {
        const rowCenter = this.lawn.getRowY(row);
        const offset = this.lawn.standardCell.h / 2 * 0.1;
        visitor.y = rowCenter + offset - visitor.getRenderSize() * (visitor.scale || 1);
      }
```

---

### Task 5: Game.js spawnZombie() 改用 getPlacementRect

**Files:**
- Modify: `game/js/Game.js` (spawnZombie 方法 L598-613)

- [ ] **Step 1: 将 Y 计算改为调用 getPlacementRect**

找到 `spawnZombie(type)` 方法。将当前的 Y 计算：

```js
  spawnZombie(type = 'normal') {
    const row = Math.floor(Math.random() * this.lawn.rows);
    const x = GAME_CONFIG.CANVAS_WIDTH;
    const offset = this.lawn.standardCell.h / 2 * 0.1;
    const y = this.lawn.getRowY(row) + offset - 115;  // humanoid feet 15% below center
```

替换为：

```js
  spawnZombie(type = 'normal') {
    const row = Math.floor(Math.random() * this.lawn.rows);
    const x = GAME_CONFIG.CANVAS_WIDTH;
    const rect = this.lawn.getPlacementRect('humanoid', 115, row, 0);
    const y = rect.y;
```

---

### Task 6: 验证 — 启动应用目视检查

- [ ] **Step 1: 启动应用**

```
npm start
```

- [ ] **Step 2: 检查项**

| 检查项 | 预期 |
|--------|------|
| 拖拽豌豆射手到格子 | 虚影与实际位置一致 |
| 拖拽维什戴尔到格子 | 虚影与实际位置一致（脚踩地线） |
| 拖拽武士零到格子 | 虚影与实际位置一致 |
| 僵尸生成位置 | 脚踩地线（行中心偏下 20%） |
| 空格键触发原皮豌豆技能 | 火焰豌豆正常发射 |
| 点击维什戴尔触发技能 | 瞄准/射击正常 |
