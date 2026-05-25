# 异客系统 & 武士零 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增异客系统（首位角色：武士零 Katana Zero），包含全局时间缩放、拖拽放置、战斗面板、图鉴"？？？"区域。

**Architecture:** 在 `BattleManager` 层引入 `timeScale` 乘数，所有战斗实体使用 `scaledDelta = deltaTime * timeScale`，武士零使用真实 `deltaTime`。新增 `Visitor.js`（异客基类+武士零）、`VisitorConfig.js`、`DamageNumber.js`、`SlashEffect.js` 四个模块。拖拽放置统一改造植物+异客。面板从左侧弹出（明日方舟风格）。

**Tech Stack:** Vanilla JS (ES modules), Canvas 2D, CSS Grid/Flexbox

---

### Task 1: 全局时间缩放架构 — Game.js

**Files:**
- Modify: `game/js/Game.js:1-120`
- Modify: `game/js/constants.js:1-7`

- [ ] **Step 1: 在 constant.js 添加时间缩放常量**

```js
// 在 GAME_CONFIG 中添加:
export const GAME_CONFIG = {
  CANVAS_WIDTH: 900,
  CANVAS_HEIGHT: 540,
  LAWN_ROWS: 5,
  LAWN_COLS: 9,
  CELL_WIDTH: 100,
  CELL_HEIGHT: 108,
  FPS: 60,
  TIME_PANEL: 0.25,      // 打开面板时的时间流速
  TIME_STOP: 0.05        // 时停时的流速
};
```

- [ ] **Step 2: 在 BattleManager 构造函数添加 timeScale 和 visitors 数组**

在 `Game.js` 构造函数中添加（`this.dragState` 之后）:

```js
this.timeScale = 1.0;
this.visitors = [];
this.damageNumbers = [];
this.slashEffects = [];
```

- [ ] **Step 3: 修改 update() 使用 scaledDelta**

将 `Game.js` 的 `update(deltaTime)` 方法开头改为:

```js
update(deltaTime) {
  if (this.battleEnded) return;
  const currentTime = performance.now();
  this._currentTime = currentTime;

  const scaledDelta = deltaTime * this.timeScale;

  // Update plant cooldowns
  let cooldownsChanged = false;
  for (const type of Object.keys(this.plantCooldowns)) {
    if (this.plantCooldowns[type] > 0) {
      this.plantCooldowns[type] = Math.max(0, this.plantCooldowns[type] - scaledDelta);
      cooldownsChanged = true;
    }
  }
  if (cooldownsChanged && this.onCooldownUpdate) {
    this.onCooldownUpdate(this.getCooldowns());
  }

  this.waveManager.update(scaledDelta, currentTime);

  this.sunSpawnTimer += scaledDelta;
  if (this.sunSpawnTimer >= SUN_CONFIG.SPAWN_INTERVAL) {
    this.sunSpawnTimer = 0;
    this.spawnRandomSun();
  }

  this.plants.forEach(plant => plant.update(scaledDelta, this));

  this.bullets = this.bullets.filter(bullet => {
    if (bullet instanceof FireBullet) {
      bullet.update(scaledDelta, this);
    } else {
      bullet.update(scaledDelta);
    }
    return bullet.active;
  });

  this.zombies.forEach(zombie => zombie.update(scaledDelta, this));

  this.suns = this.suns.filter(sun => {
    sun.update(scaledDelta);
    return sun.active;
  });

  // Visitors update with REAL deltaTime (unaffected by timeScale)
  this.visitors.forEach(v => v.update(deltaTime, this));

  // Damage numbers
  this.damageNumbers = this.damageNumbers.filter(dn => {
    dn.update(deltaTime);
    return dn.active;
  });

  // Slash effects
  this.slashEffects = this.slashEffects.filter(se => {
    se.update(deltaTime);
    return se.active;
  });

  this.checkCollisions();
  this.trackDeadZombies();
  this.checkVictory();
  this.checkGameOver();
}
```

- [ ] **Step 4: 在 render() 末尾添加新图层的渲染**

在 `render()` 的 `this.suns.forEach(sun => sun.render(this.ctx));` 之后、drag ghost 之前添加:

```js
// Visitors
this.visitors.forEach(v => v.render(this.ctx));

// Slash effects
this.slashEffects.forEach(se => se.render(this.ctx));

// Damage numbers (on top of everything)
this.damageNumbers.forEach(dn => dn.render(this.ctx));
```

- [ ] **Step 5: 添加时停视觉叠加**

在 `render()` 末尾（drag ghost 之后，方法结束前）添加:

```js
// Time-stop visual overlay
if (this.timeScale <= GAME_CONFIG.TIME_STOP + 0.01) {
  // Purple overlay
  this.ctx.save();
  this.ctx.globalAlpha = 0.2;
  this.ctx.fillStyle = '#a000c8';
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  this.ctx.restore();
}
```

- [ ] **Step 6: 添加 addVisitor、setTimeScale 辅助方法**

在 `addSun` 方法附近添加:

```js
addVisitor(visitor) { this.visitors.push(visitor); }
addDamageNumber(dn) { this.damageNumbers.push(dn); }
addSlashEffect(se) { this.slashEffects.push(se); }

setTimeScale(scale) {
  this.timeScale = scale;
}
```

- [ ] **Step 7: 导入新模块**

在 `Game.js` 顶部添加导入:

```js
import { KatanaZero } from './Visitor.js';
import { DamageNumber } from './DamageNumber.js';
import { SlashEffect } from './SlashEffect.js';
```

- [ ] **Step 8: 提交**

```bash
git add game/js/Game.js game/js/constants.js
git commit -m "feat: add global timeScale architecture and visitor combat layers"
```

---

### Task 2: 异客数据定义 — VisitorConfig.js

**Files:**
- Create: `game/js/VisitorConfig.js`

- [ ] **Step 1: 创建 VisitorConfig.js**

```js
export const VISITOR_DEFS = [
  {
    id: 'katana_zero',
    name: '武士零',
    displayName: '???',
    description: '似乎是来自世界之外的力量',
    category: 'visitor',
    combat: {
      health: 300,
      attack: 0,           // 无普攻
      activeSkillDamage: 50,       // 每刀基础伤害
      activeSkillHpRatio: 0.10,    // 每刀附加 10% 敌人最大HP
      activeSkillSlashes: 10,      // 10刀
      activeSkillCooldown: 10000,  // 10s
      activeSkillDuration: 500,    // 0.5s 时停
      passiveSkillDamage: 100,
      passiveSkillHpRatio: 0.70,
      passiveSkillCooldown: 3000,  // 3s
      passiveSkillDuration: 300    // 0.3s 时停
    },
    unlockLevel: null,     // 默认解锁
    assets: {
      normal: 'visitor_katana_zero',
      timeStop: 'visitor_katana_zero_time',
      slash: 'visitor_slash'
    }
  }
];

// Reserved placeholder IDs for future visitors
export const VISITOR_PLACEHOLDER_IDS = ['visitor_placeholder_1', 'visitor_placeholder_2', 'visitor_placeholder_3'];

export function getVisitorDef(visitorId) {
  return VISITOR_DEFS.find(v => v.id === visitorId) || null;
}

export function getAllVisitorDefs() {
  return VISITOR_DEFS;
}

export function getVisitorDisplayName(visitorId) {
  const def = getVisitorDef(visitorId);
  return def ? def.displayName : '???';
}
```

- [ ] **Step 2: 提交**

```bash
git add game/js/VisitorConfig.js
git commit -m "feat: add visitor data definitions"
```

---

### Task 3: 异客资源路径 — AssetManager.js

**Files:**
- Modify: `game/js/AssetManager.js`

- [ ] **Step 1: 添加异客资源路径**

在 `AssetManager.js` 的 `imagePaths` 对象末尾（`crystal_icon` 之后）添加:

```js
// Visitor resources
visitor_katana_zero: 'resources/special/Katana Zero.jpg',
visitor_katana_zero_time: 'resources/special/Katana Zero time.png',
visitor_slash: 'resources/special/刀光.png'
```

- [ ] **Step 2: 提交**

```bash
git add game/js/AssetManager.js
git commit -m "feat: add visitor resource paths to AssetManager"
```

---

### Task 4: 异客存储状态 — StorageManager.js

**Files:**
- Modify: `game/js/StorageManager.js`

- [ ] **Step 1: 在 DEFAULT_SAVE 添加异客相关字段**

```js
const DEFAULT_SAVE = {
  // ... existing fields ...
  savedSquads: {},
  visitorSquad: [],       // 异客编队 (最多3个 visitor ID)
  unlockedVisitors: ['katana_zero']  // 已解锁的异客
};
```

- [ ] **Step 2: 添加异客存储方法**

在 squad 方法区域附近添加:

```js
// Visitor system
isVisitorUnlocked(visitorId) {
  if (saveData.devMode) return true;
  return (saveData.unlockedVisitors || []).includes(visitorId);
},

unlockVisitor(visitorId) {
  if (!saveData.unlockedVisitors) saveData.unlockedVisitors = [];
  if (!saveData.unlockedVisitors.includes(visitorId)) {
    saveData.unlockedVisitors.push(visitorId);
    this.save();
    return true;
  }
  return false;
},

getVisitorSquad() {
  return saveData.visitorSquad || [];
},

saveVisitorSquad(visitorIds) {
  saveData.visitorSquad = visitorIds;
  this.save();
},

getUnlockedVisitors() {
  return (saveData.unlockedVisitors || []).filter(id => this.isVisitorUnlocked(id));
}
```

- [ ] **Step 3: 提交**

```bash
git add game/js/StorageManager.js
git commit -m "feat: add visitor storage (unlock + squad) to StorageManager"
```

---

### Task 5: 伤害数字 — DamageNumber.js

**Files:**
- Create: `game/js/DamageNumber.js`

- [ ] **Step 1: 创建 DamageNumber.js**

```js
export class DamageNumber {
  constructor(x, y, value, isCrit = false) {
    this.x = x;
    this.y = y;
    this.value = Math.round(value);
    this.isCrit = isCrit;
    this.active = true;
    this.life = 0;
    this.maxLife = isCrit ? 900 : 600; // ms
    this.scale = isCrit ? 2.0 : 1.0;
    this.vy = -1.2; // float upward (px per ms)
  }

  update(deltaTime) {
    this.life += deltaTime;
    this.y += this.vy * deltaTime;
    if (this.isCrit && this.life < 150) {
      // Scale up quickly then shrink
      this.scale = 2.0 + (this.life / 150) * 0.5;
    } else if (this.isCrit) {
      this.scale = Math.max(1.0, 2.5 - (this.life - 150) / 300);
    }
    if (this.life >= this.maxLife) {
      this.active = false;
    }
  }

  render(ctx) {
    const alpha = Math.max(0, 1 - this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${Math.round(this.isCrit ? 28 : 20) * this.scale}px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Outline
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(String(this.value), this.x, this.y);

    // Fill — red for all damage
    ctx.fillStyle = this.isCrit ? '#ff3333' : '#e03030';
    ctx.fillText(String(this.value), this.x, this.y);

    // Inner highlight for crit
    if (this.isCrit && this.life < 200) {
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = alpha * (1 - this.life / 200);
      ctx.fillText(String(this.value), this.x, this.y);
    }

    ctx.restore();
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add game/js/DamageNumber.js
git commit -m "feat: add DamageNumber floating text system"
```

---

### Task 6: 刀光特效 — SlashEffect.js

**Files:**
- Create: `game/js/SlashEffect.js`

- [ ] **Step 1: 创建 SlashEffect.js**

```js
import { assetManager } from './AssetManager.js';

export class SlashEffect {
  constructor(x, y, w, h, isPassive = true) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.isPassive = isPassive; // passive = overlay on enemy, active = surround trails
    this.active = true;
    this.life = 0;
    this.maxLife = 100; // 0.1s
    this.angles = isPassive ? [] : [0, 36, 72, 108, 144, 180, 216, 252, 288, 324];
    // For active (trail), generate random positions around enemy
    if (!isPassive) {
      this.trails = [];
      const cx = x + w / 2, cy = y + h / 2;
      const r = Math.max(w, h) * 0.8;
      for (const angle of this.angles) {
        const rad = (angle * Math.PI) / 180;
        this.trails.push({
          x: cx + Math.cos(rad) * r,
          y: cy + Math.sin(rad) * r,
          angle: rad,
          alpha: 1
        });
      }
    }
  }

  update(deltaTime) {
    this.life += deltaTime;
    if (this.life >= this.maxLife) {
      this.active = false;
    }
  }

  render(ctx) {
    const progress = this.life / this.maxLife;
    const alpha = 1 - progress;
    const slashImg = assetManager.getImage('visitor_slash');

    ctx.save();
    ctx.globalAlpha = alpha;

    if (this.isPassive && slashImg) {
      // Passive: overlay on enemy
      ctx.drawImage(slashImg, this.x, this.y, this.w, this.h);
    } else if (!this.isPassive && slashImg && this.trails) {
      // Active: trail version — draw slash at each angle around enemy
      for (const t of this.trails) {
        ctx.save();
        ctx.globalAlpha = alpha * t.alpha;
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle);
        const sz = Math.min(this.w, this.h) * 0.6;
        ctx.drawImage(slashImg, -sz / 2, -sz / 2, sz, sz);
        ctx.restore();
      }
    } else {
      // Fallback: programmatic slash lines
      const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
      ctx.strokeStyle = '#ff4444';
      ctx.lineWidth = 2;
      if (this.isPassive) {
        ctx.beginPath();
        ctx.moveTo(this.x, cy);
        ctx.lineTo(this.x + this.w, cy + this.h * 0.3);
        ctx.moveTo(this.x + this.w, cy);
        ctx.lineTo(this.x, cy + this.h * 0.3);
        ctx.stroke();
      } else {
        for (const t of this.trails) {
          ctx.beginPath();
          ctx.moveTo(t.x - 10, t.y - 15);
          ctx.lineTo(t.x + 10, t.y + 15);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add game/js/SlashEffect.js
git commit -m "feat: add SlashEffect visual system (passive overlay + active trails)"
```

---

### Task 7: 异客基类 + 武士零 — Visitor.js

**Files:**
- Create: `game/js/Visitor.js`

- [ ] **Step 1: 创建 Visitor.js — 异客基类和武士零**

```js
import { GAME_CONFIG } from './constants.js';
import { getVisitorDef } from './VisitorConfig.js';
import { assetManager } from './AssetManager.js';
import { DamageNumber } from './DamageNumber.js';
import { SlashEffect } from './SlashEffect.js';

// === Visitor Base Class ===
export class Visitor {
  constructor(x, y, row, visitorId) {
    const def = getVisitorDef(visitorId);
    this.id = visitorId;
    this.x = x;
    this.y = y;
    this.row = row;
    this.width = 60;
    this.height = 80;
    this.health = def.combat.health;
    this.maxHealth = def.combat.health;
    this.alive = true;
    this.category = 'visitor';
    this.scale = 1;
    this.rotation = 0;
    this._timeStopForm = false;
    this._passiveCooldownRemaining = 0;
    this._activeCooldownRemaining = 0;
    this._skillActive = false;
    this._skillTimer = 0;
    this._panelOpen = false;
    this._pendingPassive = false;
  }

  update(deltaTime, game) {
    // Skill state machines are handled by subclasses
    if (this._passiveCooldownRemaining > 0) {
      this._passiveCooldownRemaining = Math.max(0, this._passiveCooldownRemaining - deltaTime);
    }
    if (this._activeCooldownRemaining > 0) {
      this._activeCooldownRemaining = Math.max(0, this._activeCooldownRemaining - deltaTime);
    }

    // Process pending passive trigger
    if (this._pendingPassive) {
      this._pendingPassive = false;
      this._executePassive(game);
    }
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
    }
    // Trigger passive
    if (this.alive && this._passiveCooldownRemaining <= 0) {
      this._pendingPassive = true;
    }
  }

  _executePassive(game) { /* override in subclass */ }

  isOnCooldown(type) {
    if (type === 'active') return this._activeCooldownRemaining > 0;
    if (type === 'passive') return this._passiveCooldownRemaining > 0;
    return false;
  }

  getCooldownRatio(type) {
    const def = getVisitorDef(this.id);
    if (type === 'active') {
      return 1 - this._activeCooldownRemaining / def.combat.activeSkillCooldown;
    }
    if (type === 'passive') {
      return 1 - this._passiveCooldownRemaining / def.combat.passiveSkillCooldown;
    }
    return 0;
  }

  render(ctx) {
    const imgKey = this._timeStopForm ? 'visitor_katana_zero_time' : 'visitor_katana_zero';
    const img = assetManager.getImage(imgKey);
    if (img) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      // Fallback
      ctx.fillStyle = this._timeStopForm ? '#a040d0' : '#607080';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText('???', this.x + 15, this.y + 45);
    }

    // Skill cooldown bar
    if (this._activeCooldownRemaining > 0) {
      const ratio = this.getCooldownRatio('active');
      ctx.fillStyle = '#333';
      ctx.fillRect(this.x, this.y + this.height + 2, this.width, 4);
      ctx.fillStyle = '#c040ff';
      ctx.fillRect(this.x, this.y + this.height + 2, this.width * ratio, 4);
    }
  }
}

// === Katana Zero ===
export class KatanaZero extends Visitor {
  constructor(x, y, row) {
    super(x, y, row, 'katana_zero');
  }

  _executePassive(game) {
    const def = getVisitorDef('katana_zero');
    game.setTimeScale(GAME_CONFIG.TIME_STOP);
    this._timeStopForm = true;
    this._passiveCooldownRemaining = def.combat.passiveSkillCooldown;

    // Find enemies in same row
    const targets = game.zombies.filter(z => z.alive && z.row === this.row);
    for (const z of targets) {
      const dmg = def.combat.passiveSkillDamage + z.maxHealth * def.combat.passiveSkillHpRatio;
      z.takeDamage(dmg, 'magic');
      z._pauseTimer = 100; // pause enemy for slash duration

      game.addSlashEffect(new SlashEffect(z.x, z.y, z.width, z.height, true));
      game.addDamageNumber(new DamageNumber(
        z.x + z.width / 2, z.y, dmg, true
      ));
    }

    // Schedule time-stop end
    setTimeout(() => {
      game.setTimeScale(1.0);
      this._timeStopForm = false;
    }, def.combat.passiveSkillDuration);
  }

  executeActive(game) {
    if (this._activeCooldownRemaining > 0) return false;
    const def = getVisitorDef('katana_zero');

    game.setTimeScale(GAME_CONFIG.TIME_STOP);
    this._timeStopForm = true;
    this._activeCooldownRemaining = def.combat.activeSkillCooldown;

    // Freeze all enemies temporarily
    const targets = game.zombies.filter(z => z.alive);
    let totalDmg = 0;

    for (const z of targets) {
      for (let i = 0; i < def.combat.activeSkillSlashes; i++) {
        const dmg = def.combat.activeSkillDamage + z.maxHealth * def.combat.activeSkillHpRatio;
        z.takeDamage(dmg, 'magic');
        totalDmg += dmg;
        z._pauseTimer = 100;
      }
      game.addSlashEffect(new SlashEffect(z.x, z.y, z.width, z.height, false));
    }

    // Show combined damage number above first target or center
    if (targets.length > 0) {
      const mid = targets[Math.floor(targets.length / 2)];
      game.addDamageNumber(new DamageNumber(
        mid.x + mid.width / 2, mid.y - 20, totalDmg, true
      ));
    }

    // Enemies remain paused while slash is visible, then resume
    setTimeout(() => {
      game.setTimeScale(1.0);
      this._timeStopForm = false;
      for (const z of targets) {
        z._pauseTimer = 0;
      }
    }, def.combat.activeSkillDuration);

    return true;
  }
}
```

- [ ] **Step 2: 修改 Zombie.js 以支持暂停机制**

在 `Zombie.js` 的 `update()` 开头添加:

```js
update(deltaTime, game) {
  // Pause during slash effect
  if (this._pauseTimer > 0) {
    this._pauseTimer -= deltaTime;
    return; // Skip movement/attack this frame
  }
  // ... rest of existing code
}
```

在构造函数中初始化 `this._pauseTimer = 0;`

- [ ] **Step 3: 提交**

```bash
git add game/js/Visitor.js game/js/Zombie.js
git commit -m "feat: add Visitor base class and KatanaZero with skills + zombie pause"
```

---

### Task 8: 拖拽放置改造 — Game.js + UIManager.js + main.js

**Files:**
- Modify: `game/js/Game.js` (handlePlantClick → handlePlantDrop)
- Modify: `game/js/UIManager.js` (dragState 管理)
- Modify: `game/js/main.js` (canvas 事件)

当前 `main.js` 已有拖拽基础框架（`dragState`、`onmousemove`、`onclick`）。现在需要补全：

- [ ] **Step 1: 在 Game.js 中改造 handlePlantClick 为 handleDrop，支持异客**

将 `handlePlantClick` 方法重命名为 `handleDrop`，并在末尾添加异客放置逻辑:

```js
handleDrop(x, y, plantType) {
  // Check if visitor
  const visitorDef = getVisitorDef(plantType);
  if (visitorDef) {
    const { row, col } = this.lawn.getCellFromPosition(x, y);
    if (!this.lawn.canPlant(row, col)) return false;
    const plantX = col * GAME_CONFIG.CELL_WIDTH;
    const plantY = row * GAME_CONFIG.CELL_HEIGHT;
    const visitor = new KatanaZero(plantX, plantY, row);
    this.addVisitor(visitor);
    this.lawn.plant(row, col, visitor);
    return true;
  }

  // Existing plant logic...
  const { row, col } = this.lawn.getCellFromPosition(x, y);
  if (!this.lawn.canPlant(row, col)) return false;
  // ... (rest of existing plant placement code)
}
```

- [ ] **Step 2: 在 main.js 中修改 onclick 以调用 handleDrop**

将 `canvas.onclick` 中的:
```js
const placed = bm.handlePlantClick(x, y, ui.dragState.plantType);
```
改为:
```js
const placed = bm.handleDrop(x, y, ui.dragState.plantType);
```

- [ ] **Step 3: 在 UIManager 添加 drag/drop 接口方法**

在 `UIManager` 类中添加:

```js
startDrag(plantType) {
  this.dragState = { plantType, mouseX: 0, mouseY: 0, hoverRow: -1, hoverCol: -1 };
}

deselectPlant() {
  this.dragState = null;
}
```

- [ ] **Step 4: 无效放置红色闪烁反馈**

在 `main.js` 的 `onclick` 中，`handleDrop` 返回 false 时触发格子红色闪烁:

```js
if (!placed) {
  const cell = bm.lawn.getCellFromPosition(x, y);
  if (cell.row >= 0 && cell.col >= 0) {
    bm._flashCell = { row: cell.row, col: cell.col, timer: 300 };
  }
}
```

在 `Game.js` 的 `render()` 末尾添加:

```js
// Flash red on invalid placement
if (this._flashCell && this._flashCell.timer > 0) {
  this._flashCell.timer -= 16; // approximate frame time
  const alpha = this._flashCell.timer / 300 * 0.5;
  const tile = this.lawn.sceneGrid.tiles[`${this._flashCell.row},${this._flashCell.col}`];
  if (tile) {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = '#ff0000';
    this.ctx.fillRect(tile.center[0] - 25, tile.center[1] - 25, 50, 50);
    this.ctx.restore();
  }
}
```

- [ ] **Step 5: 提交**

```bash
git add game/js/Game.js game/js/UIManager.js game/js/main.js
git commit -m "feat: complete drag-and-drop placement with visitor support + red flash"
```

---

### Task 9: 战斗内异客卡面（右上角）— UIManager.js + main.js

**Files:**
- Modify: `game/js/UIManager.js`
- Modify: `game/js/main.js`
- Modify: `index.html`

- [ ] **Step 1: 在 index.html combat 页面添加异客卡面容器的 DOM**

在 `#combat-footer` 之前添加:

```html
<div id="visitor-cards" style="display:none; position:absolute; top:60px; right:12px; display:flex; gap:8px; z-index:50;"></div>
```

- [ ] **Step 2: 在 UIManager 添加 renderVisitorCards 方法**

```js
renderVisitorCards(visitorSquad) {
  const container = document.getElementById('visitor-cards');
  if (!container) return;
  container.innerHTML = '';
  if (!visitorSquad || visitorSquad.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'flex';

  const placedVisitors = this.battleManager
    ? this.battleManager.visitors.map(v => v.id)
    : [];

  for (const vid of visitorSquad) {
    const def = getVisitorDef(vid);
    if (!def) continue;
    const placed = placedVisitors.includes(vid);
    const card = document.createElement('div');
    card.className = 'visitor-combat-card' + (placed ? ' placed' : '');
    card.style.cssText = 'width:72px;height:96px;border:2px solid #7d3eb0;border-radius:6px;overflow:hidden;cursor:pointer;position:relative;';

    if (placed) {
      card.style.opacity = '0.4';
      card.style.cursor = 'default';
    } else {
      card.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.startDrag(vid);
      });
      card.addEventListener('click', (e) => {
        // Click (without drag) opens panel for visitor
        const visitor = this.battleManager.visitors.find(v => v.id === vid);
        if (visitor) {
          this.showVisitorPanel(visitor);
        }
      });
    }

    // Visitor icon
    const canvas = document.createElement('canvas');
    canvas.width = 72; canvas.height = 96;
    const cctx = canvas.getContext('2d');
    const img = assetManager.getImage('visitor_katana_zero');
    if (img) {
      cctx.drawImage(img, 0, 0, 72, 96);
    } else {
      cctx.fillStyle = '#333';
      cctx.fillRect(0, 0, 72, 96);
      cctx.fillStyle = '#c040ff';
      cctx.font = 'bold 18px sans-serif';
      cctx.textAlign = 'center';
      cctx.fillText('???', 36, 52);
    }
    card.appendChild(canvas);

    container.appendChild(card);
  }
}
```

- [ ] **Step 3: 在 main.js 的 startCombat 中调用 renderVisitorCards**

在 `ui.setupCombatFooter(availablePlants)` 之后添加:

```js
const visitorSquad = StorageManager.getVisitorSquad();
ui.renderVisitorCards(visitorSquad);
```

- [ ] **Step 4: 提交**

```bash
git add game/js/UIManager.js game/js/main.js index.html
git commit -m "feat: add top-right visitor combat cards with drag+click"
```

---

### Task 10: 战斗内面板（左侧弹出）— UIManager.js + index.html + ui.css

**Files:**
- Modify: `game/js/UIManager.js`
- Modify: `index.html`
- Modify: `game/css/ui.css`

- [ ] **Step 1: 在 index.html 添加面板 DOM（在 combat 页面内）**

```html
<div id="visitor-panel" class="visitor-panel" style="display:none;">
  <div class="vp-bg"></div>
  <div class="vp-content">
    <div class="vp-portrait">
      <canvas id="vp-canvas" width="200" height="280"></canvas>
    </div>
    <div class="vp-info">
      <div class="vp-name" id="vp-name">???</div>
      <div class="vp-hp" id="vp-hp">HP: ---</div>
      <div class="vp-atk" id="vp-atk">ATK: ---</div>
      <div class="vp-skills">
        <div class="vp-skill" id="vp-active-skill">
          <div class="vp-skill-name">主动技能</div>
          <div class="vp-skill-desc" id="vp-active-desc"></div>
          <button class="vp-skill-btn" id="vp-active-btn">释 放</button>
        </div>
        <div class="vp-skill" id="vp-passive-skill">
          <div class="vp-skill-name">被动技能</div>
          <div class="vp-skill-desc" id="vp-passive-desc"></div>
        </div>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: 在 UIManager 添加 showVisitorPanel 和 hideVisitorPanel 方法**

```js
showVisitorPanel(visitor) {
  if (!this.battleManager) return;

  // Slow time
  this.battleManager.setTimeScale(GAME_CONFIG.TIME_PANEL);

  const panel = document.getElementById('visitor-panel');
  if (!panel) return;
  panel.style.display = 'flex';

  const def = getVisitorDef(visitor.id);
  document.getElementById('vp-name').textContent = def ? def.displayName : '???';
  document.getElementById('vp-hp').textContent = `HP: ${Math.round(visitor.health)} / ${visitor.maxHealth}`;

  const dmgPerSlash = def.combat.activeSkillDamage + ' + ' + (def.combat.activeSkillHpRatio * 100) + '% 敌人最大HP';
  document.getElementById('vp-active-desc').textContent =
    `时停0.5s，10连斩 · 每刀: ${dmgPerSlash} · 冷却${def.combat.activeSkillCooldown / 1000}s`;
  document.getElementById('vp-passive-desc').textContent =
    `受击时停0.3s · 同行斩击 · 每刀100+70%敌人最大HP · 冷却${def.combat.passiveSkillCooldown / 1000}s`;

  // Portrait
  const canvas = document.getElementById('vp-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const img = assetManager.getImage('visitor_katana_zero');
    if (img) {
      ctx.drawImage(img, 0, 0, 200, 280);
    } else {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, 200, 280);
      ctx.fillStyle = '#c040ff';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('???', 100, 150);
    }
  }

  // Wire skill button
  const skillBtn = document.getElementById('vp-active-btn');
  if (skillBtn) {
    const newBtn = skillBtn.cloneNode(true);
    skillBtn.parentNode.replaceChild(newBtn, skillBtn);
    if (visitor._activeCooldownRemaining > 0) {
      newBtn.disabled = true;
      newBtn.textContent = '冷却中...';
    }
    newBtn.addEventListener('click', () => {
      this.hideVisitorPanel();
      visitor.executeActive(this.battleManager);
    });
  }

  // Close on click outside panel
  const closeHandler = (e) => {
    if (!panel.contains(e.target) && e.target !== panel) {
      this.hideVisitorPanel();
      document.removeEventListener('click', closeHandler);
    }
  };
  setTimeout(() => document.addEventListener('click', closeHandler), 50);
}

hideVisitorPanel() {
  const panel = document.getElementById('visitor-panel');
  if (panel) panel.style.display = 'none';
  if (this.battleManager) {
    this.battleManager.setTimeScale(1.0);
  }
}
```

- [ ] **Step 3: 添加面板 CSS（ui.css）**

```css
/* Visitor Panel — Arknights-style left slide */
.visitor-panel {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 360px;
  z-index: 90;
  display: flex;
  animation: vpSlideIn 0.2s ease-out;
}
@keyframes vpSlideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }

.vp-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(20,10,40,0.95), rgba(10,5,20,0.98));
  border-right: 2px solid rgba(160,60,220,0.4);
}

.vp-content {
  position: relative;
  display: flex;
  gap: 16px;
  padding: 24px;
  z-index: 1;
}

.vp-portrait { flex-shrink: 0; }

.vp-info { color: #e0d0f0; font-family: "Microsoft YaHei", sans-serif; }
.vp-name { font-size: 24px; font-weight: bold; color: #c070ff; margin-bottom: 12px; }
.vp-hp, .vp-atk { font-size: 15px; margin-bottom: 6px; }
.vp-skills { margin-top: 16px; }
.vp-skill { margin-bottom: 16px; }
.vp-skill-name { font-size: 14px; color: #a080c0; font-weight: bold; margin-bottom: 4px; }
.vp-skill-desc { font-size: 12px; color: #8478a0; line-height: 1.4; margin-bottom: 8px; }
.vp-skill-btn {
  padding: 8px 24px;
  background: rgba(160,60,220,0.25);
  border: 1px solid rgba(160,60,220,0.5);
  color: #c070ff;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px;
}
.vp-skill-btn:hover { background: rgba(160,60,220,0.4); }
.vp-skill-btn:disabled { opacity: 0.4; cursor: default; }
```

- [ ] **Step 4: 提交**

```bash
git add game/js/UIManager.js index.html game/css/ui.css
git commit -m "feat: add left-side visitor info panel with Arknights-style design"
```

---

### Task 11: 编队异客行 — UIManager.js + index.html + ui.css

**Files:**
- Modify: `game/js/UIManager.js` (showSquadSelect 区域)
- Modify: `index.html` (squad modal 内)
- Modify: `game/css/ui.css`

- [ ] **Step 1: 在 index.html 的 squad-grid 之后添加异客行 DOM**

在 `#squad-grid` 之后、`squad-footer` 之前:

```html
<div class="visitor-squad-section">
  <div class="visitor-squad-header">
    <span class="visitor-squad-title">???</span>
    <span class="visitor-squad-subtitle">你准备好放弃大脑了吗</span>
  </div>
  <div class="visitor-squad-grid" id="visitor-squad-grid"></div>
</div>
```

- [ ] **Step 2: 在 UIManager 添加 renderVisitorSquad 方法**

```js
renderVisitorSquad() {
  const grid = document.getElementById('visitor-squad-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const maxSlots = 3;
  const currentSquad = StorageManager.getVisitorSquad();
  const padded = [...currentSquad];
  while (padded.length < maxSlots) padded.push(null);

  for (let i = 0; i < maxSlots; i++) {
    const vid = padded[i];
    const slot = document.createElement('div');
    slot.className = 'visitor-squad-slot';
    slot.dataset.slotIndex = i;

    if (vid) {
      slot.classList.add('filled');
      const def = getVisitorDef(vid);
      const canvas = document.createElement('canvas');
      canvas.width = 56; canvas.height = 70;
      const cctx = canvas.getContext('2d');
      const img = assetManager.getImage('visitor_katana_zero');
      if (img) {
        cctx.drawImage(img, 0, 0, 56, 70);
      } else {
        cctx.fillStyle = '#333';
        cctx.fillRect(0, 0, 56, 70);
        cctx.fillStyle = '#c040ff';
        cctx.font = '14px sans-serif';
        cctx.textAlign = 'center';
        cctx.fillText('???', 28, 38);
      }
      slot.appendChild(canvas);
      if (def) {
        const nameEl = document.createElement('span');
        nameEl.className = 'slot-visitor-name';
        nameEl.textContent = def.displayName;
        slot.appendChild(nameEl);
      }
      // Remove
      const removeBtn = document.createElement('button');
      removeBtn.className = 'slot-remove-btn';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sq = StorageManager.getVisitorSquad();
        sq[i] = null;
        StorageManager.saveVisitorSquad(sq.filter(Boolean));
        this.renderVisitorSquad();
      });
      slot.appendChild(removeBtn);
    } else {
      const emptyIcon = document.createElement('span');
      emptyIcon.className = 'slot-empty-text';
      emptyIcon.textContent = '+';
      slot.appendChild(emptyIcon);
      slot.addEventListener('click', () => this.showVisitorPicker(i));
    }
    grid.appendChild(slot);
  }
}

showVisitorPicker(slotIndex) {
  this._visitorSlotIndex = slotIndex;
  // For now, only Katana Zero exists — directly assign
  const currentSquad = StorageManager.getVisitorSquad();
  if (!currentSquad.includes('katana_zero')) {
    currentSquad[slotIndex] = 'katana_zero';
    StorageManager.saveVisitorSquad(currentSquad.filter(Boolean));
  }
  this.renderVisitorSquad();
}

saveVisitorSquadOnStart() {
  const grid = document.getElementById('visitor-squad-grid');
  // Already saved via StorageManager during picks; just read back
  return StorageManager.getVisitorSquad();
}
```

- [ ] **Step 3: 在 showSquadSelect / _wireSquadButtons 中调用 renderVisitorSquad**

在 `showSquadSelect()` 方法末尾添加:

```js
this.renderVisitorSquad();
```

在 start 按钮的点击处理中（保存编队之后），将异客编队一并传入 startCombat:

```js
const visitorSquad = this.saveVisitorSquadOnStart();
StorageManager.saveSquad(squad);
this.hideModal();
this.startCombat(this._pendingLevelId, squad, visitorSquad);
```

- [ ] **Step 4: 更新 startCombat 事件以携带 visitorSquad**

修改 `startCombat` 方法签名，并在 dispatch 中携带 visitorSquad:

```js
startCombat(levelId, squad, visitorSquad = []) {
  const event = new CustomEvent('startCombat', {
    detail: { levelId, squad, visitorSquad }
  });
  window.dispatchEvent(event);
}
```

- [ ] **Step 5: 添加 CSS**

```css
/* Visitor Squad Section */
.visitor-squad-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(160,60,220,0.25);
}

.visitor-squad-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
}

.visitor-squad-title {
  font-size: 20px;
  font-weight: bold;
  color: #c070ff;
  letter-spacing: 4px;
}

.visitor-squad-subtitle {
  font-size: 13px;
  color: #7060a0;
  font-style: italic;
}

.visitor-squad-grid {
  display: flex;
  gap: 12px;
}

.visitor-squad-slot {
  width: 72px;
  height: 96px;
  border: 1px solid rgba(160,60,220,0.3);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(20,10,40,0.5);
  transition: border-color 0.2s;
}
.visitor-squad-slot:hover { border-color: rgba(160,60,220,0.7); }
.visitor-squad-slot.filled { border-color: rgba(160,60,220,0.6); }
.slot-visitor-name { font-size: 11px; color: #a080c0; margin-top: 2px; }
```

- [ ] **Step 6: 提交**

```bash
git add game/js/UIManager.js index.html game/css/ui.css
git commit -m "feat: add visitor squad row in formation interface"
```

---

### Task 12: 图鉴"???"区域 — UIManager.js + ui.css

**Files:**
- Modify: `game/js/UIManager.js` (renderHandbook 之后追加)
- Modify: `game/css/ui.css`

- [ ] **Step 1: 在 renderHandbook 末尾追加异客区域渲染**

在 `renderHandbook()` 方法末尾（`this._setupDragScroll` 之前）添加:

```js
// === Visitor section ===
this._renderVisitorHandbook();
```

- [ ] **Step 2: 实现 _renderVisitorHandbook**

```js
_renderVisitorHandbook() {
  const allVisitors = getAllVisitorDefs();
  const placeholderCount = 3; // reserved placeholder slots
  const totalCards = allVisitors.length + placeholderCount;

  // Add section separator
  const sep = document.createElement('div');
  sep.className = 'hb-visitor-separator';
  sep.innerHTML = '<div class="hb-visitor-title">???</div><div class="hb-visitor-subtitle">似乎是来自世界之外的力量</div>';
  this.$hbPlantGrid.appendChild(sep);

  const cardW = 168;
  const srcW = 316, srcH = 473;
  const cardH = Math.round(cardW * srcH / srcW);

  // Render unlocked visitors
  for (const v of allVisitors) {
    const isUnlocked = StorageManager.isVisitorUnlocked(v.id);
    const card = document.createElement('canvas');
    card.className = 'hb-card visitor-card';
    card.width = cardW;
    card.height = cardH;
    const ctx = card.getContext('2d');

    if (isUnlocked) {
      const img = assetManager.getImage('visitor_katana_zero');
      if (img) {
        const scale = Math.min(cardW / img.naturalWidth, (cardH * 0.55) / img.naturalHeight);
        const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
        ctx.drawImage(img, (cardW - dw) / 2, 20, dw, dh);
      }
    } else {
      // Dark silhouette
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(cardW * 0.25, 20, cardW * 0.5, cardH * 0.55);
      ctx.fillStyle = '#333';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', cardW / 2, cardH * 0.45);
    }

    // Card background (same as plant)
    const cardBg = assetManager.getImage('plant_card_bg');
    if (cardBg) {
      ctx.drawImage(cardBg, 0, 0, cardW, cardH);
    }

    if (!isUnlocked) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, cardW, cardH);
      card.classList.add('locked');
    }

    // Name
    ctx.textAlign = 'center';
    ctx.fillStyle = isUnlocked ? 'rgb(89,32,8)' : '#484440';
    ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
    ctx.fillText(isUnlocked ? v.name : '???', cardW / 2, cardH * 0.72);

    // Description
    ctx.fillStyle = isUnlocked ? 'rgb(89,32,8)' : '#484440';
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillText(isUnlocked ? v.description : '未解锁', cardW / 2, cardH * 0.78);

    if (isUnlocked) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => this.showVisitorDetail(v.id));
    }

    this.$hbPlantGrid.appendChild(card);
  }

  // Placeholder cards
  for (let i = 0; i < placeholderCount; i++) {
    const card = document.createElement('canvas');
    card.className = 'hb-card visitor-card locked';
    card.width = cardW;
    card.height = cardH;
    const ctx = card.getContext('2d');

    // Dark silhouette
    ctx.fillStyle = '#111';
    ctx.fillRect(cardW * 0.3, 20, cardW * 0.4, cardH * 0.5);
    ctx.fillStyle = '#222';
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', cardW / 2, cardH * 0.4);

    const cardBg = assetManager.getImage('plant_card_bg');
    if (cardBg) ctx.drawImage(cardBg, 0, 0, cardW, cardH);

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, cardW, cardH);

    ctx.fillStyle = '#484440';
    ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('???', cardW / 2, cardH * 0.72);

    this.$hbPlantGrid.appendChild(card);
  }
}
```

- [ ] **Step 3: 添加详细视图 showVisitorDetail**

```js
showVisitorDetail(visitorId) {
  const def = getVisitorDef(visitorId);
  if (!def) return;
  this._detailType = 'visitor';
  this._detailId = visitorId;

  this.$hbDetailName.textContent = def.name;
  this.$hbDetailThreat.style.display = 'none';

  const canvas = this.$hbDetailCanvas;
  if (canvas) {
    canvas.width = 200; canvas.height = 260;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = assetManager.getImage('visitor_katana_zero');
    if (img) {
      const s = Math.min(200 / img.naturalWidth, 260 / img.naturalHeight);
      ctx.drawImage(img, (200 - img.naturalWidth * s) / 2, (260 - img.naturalHeight * s) / 2,
        img.naturalWidth * s, img.naturalHeight * s);
    }
  }

  let statsHTML = '';
  statsHTML += `<div class="hb-stat-row">
    <span class="hb-stat-label">生命值</span>
    <span class="hb-stat-value">${def.combat.health}</span>
  </div>`;
  statsHTML += `<div class="hb-stat-row">
    <span class="hb-stat-label">攻击</span>
    <span class="hb-stat-value">无（纯技能型）</span>
  </div>`;
  statsHTML += `<div class="hb-stat-row">
    <span class="hb-stat-label">主动技能</span>
    <span class="hb-stat-value">时停0.5s · 10连斩 · 每刀50+10%最大HP · 冷却${def.combat.activeSkillCooldown / 1000}s</span>
  </div>`;
  statsHTML += `<div class="hb-stat-row">
    <span class="hb-stat-label">被动技能</span>
    <span class="hb-stat-value">受击时停0.3s · 同行斩 · 每刀100+70%最大HP · 冷却${def.combat.passiveSkillCooldown / 1000}s</span>
  </div>`;

  this.$hbDetailStats.innerHTML = statsHTML;
  this.$hbDetailOverlay.style.display = 'flex';

  // Hide action section (no upgrade for visitors)
  const actionSec = this.$hbDetailOverlay.querySelector('.hb-detail-action-section');
  if (actionSec) actionSec.style.display = 'none';
}
```

- [ ] **Step 4: 添加 CSS**

```css
/* Visitor Handbook Section */
.hb-visitor-separator {
  grid-column: 1 / -1;
  padding: 20px 0 8px;
  margin-top: 12px;
  border-top: 1px solid rgba(160,60,220,0.2);
}

.hb-visitor-title {
  font-size: 22px;
  font-weight: bold;
  color: #c070ff;
  letter-spacing: 6px;
  padding-left: 4px;
  border-left: 3px solid #c070ff;
}

.hb-visitor-subtitle {
  font-size: 13px;
  color: #7060a0;
  font-style: italic;
  margin-top: 6px;
  padding-left: 10px;
}

.visitor-card {
  border-color: rgba(160,60,220,0.25) !important;
}
.visitor-card:hover {
  border-color: #c070ff !important;
}
```

- [ ] **Step 5: 提交**

```bash
git add game/js/UIManager.js game/css/ui.css
git commit -m "feat: add visitor ??? section to plant handbook"
```

---

### Task 13: 战斗内 Canvas 点击 — 识别异客 + 集成面板

**Files:**
- Modify: `game/js/main.js`

- [ ] **Step 1: 在 canvas.onclick 中添加异客点击识别**

在现有的植物技能点击检测之后、sun collection 之后添加:

```js
// Click visitor — open panel
for (const visitor of bm.visitors) {
  const dx = x - visitor.x;
  const dy = y - visitor.y;
  if (dx > -10 && dx < visitor.width + 10 && dy > -10 && dy < visitor.height + 10) {
    ui.showVisitorPanel(visitor);
    return;
  }
}
```

- [ ] **Step 2: 提交**

```bash
git add game/js/main.js
git commit -m "feat: wire visitor click to panel in combat canvas"
```

---

### Task 14: 集成测试 — 端到端流程验证

- [ ] **Step 1: 启动应用**

```bash
npm start
```

- [ ] **Step 2: 验证图鉴"???"区域**

1. 主页 → 点击"植物图鉴"按钮
2. 滚动到底部，确认看到"??? "标题 + "似乎是来自世界之外的力量"副标题
3. 确认有武士零卡片和 3 张占位卡
4. 点击武士零卡片 → 确认弹出详细面板

- [ ] **Step 3: 验证编队异客行**

1. 主页 → 点击"作战" → 选择关卡 → 点击"作战"
2. 确认编队界面下方有"???"行 + "你准备好放弃大脑了吗"副标题
3. 点击异客槽位 + 选择武士零

- [ ] **Step 4: 验证拖拽放置**

1. 开始战斗后，确认底部植物卡面可拖拽到草坪
2. 确认右上角异客卡面可拖拽到草坪
3. 拖到无效位置 → 确认红色闪烁
4. 放置后异客卡面变灰

- [ ] **Step 5: 验证战斗面板**

1. 点击草坪上的武士零 → 确认左侧面板弹出
2. 确认面板显示立绘 + 属性 + 技能
3. 点击面板外 → 面板关闭，时间恢复

- [ ] **Step 6: 验证主动技能**

1. 打开面板 → 点击"释放"按钮
2. 确认时停效果（紫色 overlay + 全场减速）
3. 确认所有敌人出现刀光特效
4. 确认敌人头上飘红字伤害
5. 确认 0.5s 后恢复正常

- [ ] **Step 7: 验证被动技能**

1. 让僵尸接近武士零并攻击他
2. 确认触发被动时停
3. 确认同行敌人出现刀光 + 伤害红字
4. 确认 3s 冷却正常

- [ ] **Step 8: 提交**

```bash
git add -A
git commit -m "test: verify end-to-end visitor system integration"
```

---

### 自检清单

1. **Spec 覆盖**: 时间缩放 ✓ / 武士零主动+被动 ✓ / 面板 ✓ / 拖拽放置 ✓ / 编队异客行 ✓ / 战斗卡面 ✓ / 图鉴"???" ✓ / 伤害数字 ✓ / 刀光 ✓
2. **占位符**: 无 TBD/TODO
3. **类型一致性**: `Visitor` 基类方法 (`takeDamage`, `executeActive`, `_executePassive`) 在 Visitor.js 和 UIManager.js 中一致。`DamageNumber` 构造函数参数 (`x, y, value, isCrit`) 在 Visitor.js 调用中一致。
