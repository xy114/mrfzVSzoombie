# 小推车系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现小推车系统——开局自动部署 5 行推车，被僵尸触发后向前行驶清行，支持原皮和火陈皮肤（召唤全图巨龙）。

**Architecture:** Cart 继承 Plant 复用图鉴/皮肤体系，Dragon 为独立实体类。Cart 存放在 `Game.carts[]` 独立数组（不混入 `plants[]`），Dragon 存放在 `Game.dragons[]`。

**Tech Stack:** JavaScript ES Module / Canvas 2D / 无框架

---

### Task 1: 注册图鉴与皮肤配置

**Files:**
- Modify: `game/js/PlantConfig.js`
- 无需修改 `constants.js`（推车不加入 PLANT_TYPES，因此不在底部战斗栏出现）

- [ ] **Step 1: PLANT_DEFS 新增 cart 条目**

在 `PLANT_DEFS` 数组末尾、`];` 之前插入：

```javascript
  {
    id: 'cart',
    name: '小推车',
    emoji: '🛒',
    description: '最后一道防线。当僵尸突破到草坪最左侧时自动启动，碾压整行敌人',
    unlockLevel: null,
    combat: { cost: 0, health: 0 }
  }
```

- [ ] **Step 2: SKIN_DEFS 新增 cart 皮肤定义**

在 `SKIN_DEFS` 对象末尾、`};` 之前插入：

```javascript
  cart: [
    {
      id: 'default', name: '原皮', emoji: '🛒', category: 'original',
      description: '朴实的推车，可靠的清行工具',
      skillDescription: '压扁面前的所有僵尸',
      cost: 0, owned: true, combat: {}
    },
    {
      id: 'fireChen', name: '火陈', emoji: '🔥', category: 'derived',
      description: '龙炎焚天。触发时召唤巨龙横扫全屏，全图僵尸灰飞烟灭',
      skillDescription: '被僵尸触发时召唤巨龙横扫全屏，对全图敌人造成致死伤害',
      cost: 15000, owned: false, combat: {
        bodyType: 'humanoid',
        dragonSpeed: 5,
        attackAnimDuration: 1000,
        dragonSpawnDelay: 500
      }
    }
  ]
```

---

### Task 2: 注册图片资源

**Files:**
- Modify: `game/js/AssetManager.js`

- [ ] **Step 1: imagePaths 新增推车资源**

在 `imagePaths` 对象中，皮肤资源区域（`// Skin resources` 注释附近）末尾插入：

```javascript
      // Cart default skin
      cart_skin_default_combat: 'resources/tools/小推车.png',
      // FireChen derived skin
      cart_skin_fireChen_combat: 'resources/special/火陈-screentogif-ps.gif',
      cart_skin_fireChen_portrait: 'resources/special/火陈立绘.png',
      cart_skin_fireChen_headshot: 'resources/special/火陈立绘_大头像.png',
```

插入位置：在 `cherrybomb_explosion` 行之前（即第 97 行 `cherrybomb_explosion: 'resources/plants/爆炸！.gif'` 之前）。

---

### Task 3: 注册 GIF 动画帧

**Files:**
- Modify: `index.html`

- [ ] **Step 1: GIF_PATHS 新增火陈和龙的 GIF**

在 `GIF_PATHS` 对象中，`cherrybomb_explosion` 行之前插入：

```javascript
        fireChen_combat: 'resources/special/火陈-screentogif-ps.gif',
        fireChen_attack: 'resources/special/火陈-attack-screentogif.gif',
        dragon: 'resources/special/dragon-screentogif-ps.gif',
```

即在现有 `peashooter_skin_wishadel_combat` 行和 `cherrybomb_explosion` 行之间。

---

### Task 4: 创建 Cart.js

**Files:**
- Create: `game/js/Cart.js`

- [ ] **Step 1: 创建 Cart.js 完整文件**

```javascript
import { Plant } from './Plant.js';
import { GAME_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';
import { Dragon } from './Dragon.js';

const STATE = { IDLE: 'idle', LAUNCHING: 'launching', TRAVELING: 'traveling', DONE: 'done' };

export class Cart extends Plant {
  constructor(row, skinId = 'default') {
    // Cart uses a dummy x/y — real position set below via Lawn helpers
    super(0, 0, 1);
    this.row = row;
    this.col = -1;            // Not on grid
    this.skinId = skinId;
    this.speed = 5;
    this.state = STATE.IDLE;
    this._attackTimer = 0;
    this._dragonSpawned = false;
    this._dragon = null;      // Reference to spawned Dragon

    // Set bodyType-dependent dimensions (per 游戏基础设定)
    const bodyType = this.getBodyType();
    this.width = bodyType === 'humanoid' ? 125 : GAME_CONFIG.CELL_WIDTH;

    // Calculate height via aspect ratio from combat image
    const combatImg = assetManager.getSkinCombatImage('cart', skinId);
    if (combatImg) {
      const ratio = combatImg.naturalHeight / combatImg.naturalWidth;
      this.height = Math.round(this.width * ratio);
    } else {
      this.height = this.width;
    }

    // Position: left of column 0, vertically centered on row
    // y will be refined by the caller (Game.initCarts)
    this.x = -this.width * 0.5;  // Temporary, overridden in initCarts
    this.y = 0;

    // Initialize animators for fireChen skin
    if (skinId === 'fireChen') {
      this._combatAnimator = assetManager.createAnimator('fireChen_combat');
      if (this._combatAnimator) this._combatAnimator.setLoop(true);
    }

    // Health is irrelevant — cart cannot be damaged
    this.health = 0;
    this.maxHealth = 0;
  }

  getBodyType() {
    return this.skinId === 'fireChen' ? 'humanoid' : 'plant';
  }

  getRenderSize() {
    return 80;
  }

  takeDamage(damage) {
    // Cart is invulnerable
  }

  update(deltaTime, game) {
    if (this.state === STATE.DONE) return;

    // Update animators
    if (this._combatAnimator) this._combatAnimator.update(deltaTime);
    if (this._attackAnimator) this._attackAnimator.update(deltaTime);

    switch (this.state) {
      case STATE.IDLE:
        this._checkTrigger(game);
        break;

      case STATE.LAUNCHING:
        this._attackTimer += deltaTime;
        // Spawn dragon at half the attack animation (500ms)
        if (!this._dragonSpawned && this._attackTimer >= 500) {
          this._dragonSpawned = true;
          this._dragon = new Dragon(this.row, this.y);
          game.dragons.push(this._dragon);
        }
        // Attack animation ends at ~1000ms
        if (this._attackTimer >= 1000) {
          this._attackAnimator = null; // Clean up single-play animator
          this.state = STATE.TRAVELING;
          // No traveling for fireChen — stays in place while dragon works
        }
        break;

      case STATE.TRAVELING:
        if (this.skinId === 'fireChen') {
          // FireChen stays in place; dragon does the work
          // When dragon is done, cart is done
          if (!this._dragon || !this._dragon.active) {
            this.alive = false;
            this.state = STATE.DONE;
          }
        } else {
          // Default cart: drive right
          this.x += this.speed * (deltaTime / 16);
          // Check collision with zombies in same row
          this._hitZombiesInRow(game);
          // Off-screen → done
          if (this.x > GAME_CONFIG.CANVAS_WIDTH + this.width) {
            this.alive = false;
            this.state = STATE.DONE;
          }
        }
        break;
    }
  }

  _checkTrigger(game) {
    // Trigger when any zombie in same row passes the cart's right edge
    const cartRight = this.x + this.width;
    for (const z of game.zombies) {
      if (z.row === this.row && z.alive && z.x <= cartRight) {
        this._activate(game);
        return;
      }
    }
  }

  _activate(game) {
    if (this.skinId === 'fireChen') {
      this.state = STATE.LAUNCHING;
      this._attackAnimator = assetManager.createAnimator('fireChen_attack');
      if (this._attackAnimator) this._attackAnimator.setLoop(false);
      this._attackTimer = 0;
      this._dragonSpawned = false;
    } else {
      // Default cart: immediately start traveling
      this.state = STATE.TRAVELING;
    }
  }

  _hitZombiesInRow(game) {
    const cartCenterX = this.x + this.width / 2;
    const cartCenterY = this.y + this.height / 2;
    for (const z of game.zombies) {
      if (z.row === this.row && z.alive && !z._deathDeferred) {
        const zcx = z.x + z.width / 2;
        const zcy = z.y + z.height / 2;
        const dx = Math.abs(cartCenterX - zcx);
        const dy = Math.abs(cartCenterY - zcy);
        const collisionDist = (this.width + z.width) / 2;
        if (dx < collisionDist && dy < 60) {
          // Lethal damage — directly kill the zombie
          z.health = 0;
          z.alive = false;
          z._shouldSpawnDeathEffect = true;
        }
      }
    }
  }

  render(ctx) {
    if (this.state === STATE.DONE) return;

    // LAUNCHING: render attack GIF
    if (this.state === STATE.LAUNCHING && this._attackAnimator) {
      const frame = this._attackAnimator.getCurrentCanvas();
      if (frame) {
        ctx.drawImage(frame, this.x, this.y, this.width, this.height);
      }
      return;
    }

    // FireChen combat GIF
    if (this.skinId === 'fireChen' && this._combatAnimator) {
      const frame = this._combatAnimator.getCurrentCanvas();
      if (frame) {
        ctx.drawImage(frame, this.x, this.y, this.width, this.height);
      }
      return;
    }

    // Default cart: static PNG
    const img = assetManager.getSkinCombatImage('cart', this.skinId);
    if (img) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    }
  }

  renderBars(ctx) {
    // Cart has no health bar
  }
}
```

---

### Task 5: 创建 Dragon.js

**Files:**
- Create: `game/js/Dragon.js`

- [ ] **Step 1: 创建 Dragon.js 完整文件**

```javascript
import { GAME_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';

export class Dragon {
  constructor(row, cartY) {
    this.row = row;
    this.width = 1300;
    this.height = 300;
    this.speed = 5;
    this.active = true;

    // Initial X: only the head (~180px) peeks from the left edge
    this.x = -(this.width - 180);

    // Vertically centered on the cart's row
    this.y = cartY - (this.height - 125) / 2; // Align with cart visually

    this._animator = assetManager.createAnimator('dragon');
    if (this._animator) this._animator.setLoop(true);
  }

  update(deltaTime, game) {
    if (!this.active) return;

    if (this._animator) this._animator.update(deltaTime);

    // Move right
    this.x += this.speed * (deltaTime / 16);

    // Full-map collision: kill any zombie overlapping with dragon bounds
    this._hitAllZombies(game);

    // Off-screen → done
    if (this.x > GAME_CONFIG.CANVAS_WIDTH) {
      this.active = false;
    }
  }

  _hitAllZombies(game) {
    const dLeft = this.x;
    const dRight = this.x + this.width;
    const dTop = this.y;
    const dBottom = this.y + this.height;

    for (const z of game.zombies) {
      if (!z.alive || z._deathDeferred) continue;

      const zLeft = z.x;
      const zRight = z.x + z.width;
      const zTop = z.y;
      const zBottom = z.y + z.height;

      // AABB overlap test
      if (dLeft < zRight && dRight > zLeft && dTop < zBottom && dBottom > zTop) {
        z.health = 0;
        z.alive = false;
        z._shouldSpawnDeathEffect = true;
      }
    }
  }

  render(ctx) {
    if (!this.active || !this._animator) return;

    const frame = this._animator.getCurrentCanvas();
    if (!frame) return;

    // Horizontal flip: GIF has dragon moving left, we need it moving right
    ctx.save();
    ctx.translate(this.x + this.width, this.y);
    ctx.scale(-1, 1);
    ctx.drawImage(frame, 0, 0, this.width, this.height);
    ctx.restore();
  }
}
```

---

### Task 6: 集成到 Game.js

**Files:**
- Modify: `game/js/Game.js`

- [ ] **Step 1: 在文件顶部添加 import**

在第 22 行 `import { assetManager } from './AssetManager.js';` 之后添加：

```javascript
import { Cart } from './Cart.js';
```

（Dragon 由 Cart 内部创建，不需要直接 import）

- [ ] **Step 2: 构造函数中新增数组**

在构造函数 `this.explosionEffects = [];`（第 55 行）之后添加：

```javascript
    this.carts = [];
    this.dragons = [];
```

- [ ] **Step 3: 添加 initCarts 方法**

在 `start()` 方法之前插入：

```javascript
  initCarts() {
    const skinId = (this.playerData.equippedSkins || {}).cart || 'default';
    for (let row = 0; row < this.lawn.rows; row++) {
      const cart = new Cart(row, skinId);
      // Position cart to the left of column 0
      const tileCenter = this.lawn.getTileCenter(row, 0);
      cart.x = tileCenter.x - GAME_CONFIG.CELL_WIDTH * 0.8;
      cart.y = tileCenter.y - cart.height / 2;
      this.carts.push(cart);
    }
  }
```

- [ ] **Step 4: 在 start() 中调用 initCarts**

在 `start()` 方法中，`this.lastTime = performance.now();`（第 66 行）之后添加：

```javascript
    this.initCarts();
```

- [ ] **Step 5: 更新循环中添加推车/龙更新**

在 `this.plants.forEach(...)` 行（第 116 行）之后添加：

```javascript
    // Cart & Dragon update (carts use scaledDelta like plants)
    this.carts.forEach(c => c.update(scaledDelta, this));
    this.dragons = this.dragons.filter(d => {
      d.update(scaledDelta, this);
      return d.active;
    });
    // Remove done carts
    this.carts = this.carts.filter(c => c.alive);
```

- [ ] **Step 6: 渲染循环中添加推车/龙渲染**

在 characters 构建循环中，plants 遍历之前，将 carts 加入 chars 数组。找到 `for (const plant of this.plants)`（第 285 行），在其之前插入：

```javascript
    for (const cart of this.carts) {
      if (cart.alive) chars.push({ type: 'plant', entity: cart, row: cart.row });
    }
```

龙在附件层渲染。找到 `this.bullets.forEach(bullet => bullet.render(this.ctx));`（第 270 行），在其之后添加：

```javascript
    this.dragons.forEach(dragon => dragon.render(this.ctx));
```

- [ ] **Step 7: checkGameOver 中考虑推车**

`checkGameOver()`（第 530 行）中判断失败的逻辑为 `z.x < 10`。当推车存在且未触发时，僵尸到达左侧应该先触发推车而非直接失败。修改 `checkGameOver`：

```javascript
  checkGameOver() {
    if (this.battleEnded) return;
    // Only game over if zombie reaches far left AND no idle cart in that row
    const reachedLeft = this.zombies.some(z => {
      if (z.x >= 10) return false;
      // Check if there's an idle cart that could save this row
      const cart = this.carts.find(c => c.row === z.row && c.state === 'idle');
      return !cart; // Game over only if no idle cart in this row
    });
    if (reachedLeft) {
      this.battleEnded = true;
      this.isRunning = false;
      if (this.onDefeat) {
        this.onDefeat({
          levelId: this.levelConfig.id,
          enemiesKilled: { ...this.enemiesKilled }
        });
      }
    }
  }
```

- [ ] **Step 8: _tickRetreatTimers 中排除 cart**

Cart 不在 `this.plants` 数组中（它们在 `this.carts`），所以撤退逻辑不会触及它们。无需修改。但需要确认：`_tickRetreatTimers` 中的 `this.lawn.removePlant(p.row, p.col)` 对 cart 无影响，因为 cart 的 `col = -1` 不在网格上。

---

### Task 7: 验证

**Files:** 无新建文件

- [ ] **Step 1: 启动游戏验证基础功能**

运行 `npm start`

- [ ] **Step 2: 验证检查清单**

1. **推车部署**：开局 5 行各有一个推车，位于最左侧（第 0 列左边）
2. **原皮触发**：僵尸到达推车位置 → 推车启动向右行驶 → 碰撞同行僵尸致死 → 驶出屏幕消失
3. **火陈触发**：（在存档中手动设置 `equippedSkins.cart = 'fireChen'` 测试）僵尸到达 → 播攻击动画 → 龙从左侧出现 → 全图僵尸致死 → 龙消失
4. **图鉴显示**：图鉴页面应显示小推车条目（原皮 + 火陈皮肤）
5. **底部栏无推车**：战斗中底部植物栏不应出现推车
6. **无推车时正常失败**：推车全部触发后，僵尸到达左侧 → 游戏失败

---

### 附：测试火陈皮肤的快速方法

在浏览器控制台中执行：

```javascript
// 给玩家装备火陈皮肤
const saveData = JSON.parse(localStorage.getItem('gameSave') || '{}');
saveData.equippedSkins = saveData.equippedSkins || {};
saveData.equippedSkins.cart = 'fireChen';
localStorage.setItem('gameSave', JSON.stringify(saveData));
// 然后刷新页面，进入任意关卡
```
