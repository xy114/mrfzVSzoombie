# 植物 & 投射物 GIF 动画系统 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将僵尸 GIF 动画系统的成熟模式应用到全部 4 种植物和 3 种投射物上，新增樱桃炸弹爆炸特效。

**Architecture:** 完全复用 `GifAnimator` + `window.__gifManifest` + `createAnimator()` 基础设施。每个单位构造函数末尾创建循环 animator，render 优先绘制 GIF 帧 → 回退静态图 → 回退程序化绘制。樱桃炸弹爆炸参照 `DeathEffect` 模式新建 `ExplosionEffect`。

**Tech Stack:** Canvas 2D, ES modules, gifuct-js (预解析)

---

### Task 1: 注册 `cherrybomb_explosion` GIF 资源

**Files:**
- Modify: `index.html:354-372`
- Modify: `game/js/AssetManager.js:10-73`

- [ ] **Step 1: index.html GIF_PATHS 新增**

在 `GIF_PATHS` 对象末尾（`sun` 之后）加一行：

```js
cherrybomb_explosion: 'resources/plants/爆炸！.gif',
```

- [ ] **Step 2: AssetManager.imagePaths 新增**

在 `imagePaths` 对象末尾加一行：

```js
cherrybomb_explosion: 'resources/plants/爆炸！.gif',
```

- [ ] **Step 3: 验证**

重启 `npm start`，进入战斗，控制台应显示 `GIF parsing done: 19/19`（原18+1）。

- [ ] **Step 4: Commit**

```bash
git add index.html game/js/AssetManager.js
git commit -m "feat: register cherrybomb_explosion GIF resource"
```

---

### Task 2: 创建 ExplosionEffect

**Files:**
- Create: `game/js/ExplosionEffect.js`

- [ ] **Step 1: 写入文件**

```js
import { assetManager } from './AssetManager.js';
import { GifAnimator } from './GifAnimator.js';

export class ExplosionEffect {
  constructor(x, y, targetWidth, gifKey) {
    this.x = x;
    this.y = y;
    this.targetWidth = targetWidth;
    this.active = true;
    this.life = 0;

    const gifData = assetManager.getGifFrames(gifKey);
    if (gifData) {
      const frames = gifData.frames.map(f => ({ canvas: f.canvas, delay: f.delay }));
      this._animator = new GifAnimator(frames, gifData.width, gifData.height);
      this._animator.setLoop(false);
      this._gifWidth = gifData.width;
      this._gifHeight = gifData.height;
      this.maxLife = gifData.frames.reduce((sum, f) => sum + f.delay, 0) + 500;
    } else {
      this._animator = null;
      this.maxLife = 1000;
    }
  }

  update(deltaTime) {
    this.life += deltaTime;
    if (this._animator) {
      this._animator.update(deltaTime);
      if (!this._animator.isActive && this.life >= this.maxLife - 500) {
        this.active = false;
      }
    } else if (this.life >= this.maxLife) {
      this.active = false;
    }
  }

  render(ctx) {
    if (!this._animator || !this._animator.isActive) return;

    const progress = this.life / this.maxLife;
    const alpha = Math.max(0, 1 - progress * progress);

    ctx.save();
    ctx.globalAlpha = alpha;

    const frame = this._animator.getCurrentCanvas();
    const scale = this.targetWidth / this._gifWidth;
    const drawW = this.targetWidth;
    const drawH = Math.round(this._gifHeight * scale);
    const drawY = this.y + this.targetWidth * 0.5 - drawH;

    ctx.drawImage(frame, this.x, drawY, drawW, drawH);

    ctx.restore();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add game/js/ExplosionEffect.js
git commit -m "feat: add ExplosionEffect for cherry bomb explosion GIF"
```

---

### Task 3: 集成 ExplosionEffect 到 Game.js

**Files:**
- Modify: `game/js/Game.js:1-5, 50-54, 139-145, 260-264, 542-545`

- [ ] **Step 1: 添加 import**

在文件顶部现有 import 之后加：

```js
import { ExplosionEffect } from './ExplosionEffect.js';
```

- [ ] **Step 2: 构造函数添加 explosionEffects 数组**

在 `this.deathEffects = [];` 之后加：

```js
this.explosionEffects = [];
```

- [ ] **Step 3: update 中添加 explosionEffects 过滤循环**

在 `this.deathEffects = this.deathEffects.filter(...)` 之后加：

```js
this.explosionEffects = this.explosionEffects.filter(ee => {
  ee.update(deltaTime);
  return ee.active;
});
```

- [ ] **Step 4: render 中添加 explosionEffects 绘制**

在 `this.deathEffects.forEach(de => de.render(this.ctx));` 之后加：

```js
this.explosionEffects.forEach(ee => ee.render(this.ctx));
```

- [ ] **Step 5: 添加 addExplosionEffect 方法**

在 `addDeathEffect(de) { this.deathEffects.push(de); }` 之后加：

```js
addExplosionEffect(ee) { this.explosionEffects.push(ee); }
```

- [ ] **Step 6: Commit**

```bash
git add game/js/Game.js
git commit -m "feat: integrate ExplosionEffect into Game loop"
```

---

### Task 4: CherryBomb — GIF 动画 + 爆炸特效

**Files:**
- Modify: `game/js/CherryBomb.js`

- [ ] **Step 1: 添加 GifAnimator import**

```js
import { GifAnimator } from './GifAnimator.js';
```

- [ ] **Step 2: 构造函数末尾创建 animator + 更新 explode 方法**

修改构造函数，在末尾加：

```js
this._animator = assetManager.createAnimator('cherrybomb');
```

修改 `explode(game)` 方法，在 `this.alive = false;` 之后加：

```js
game.addExplosionEffect(new ExplosionEffect(
  this.x, this.y + this.height * 0.3, this.width, 'cherrybomb_explosion'
));
```

需要 import ExplosionEffect：

```js
import { ExplosionEffect } from './ExplosionEffect.js';
```

- [ ] **Step 3: 修改 render 方法**

将 `render(ctx)` 方法改为优先使用 GIF 帧：

```js
render(ctx) {
  if (this.exploded) return;
  if (this._animator) {
    const frame = this._animator.getCurrentCanvas();
    const scale = this.width / this._animator.naturalWidth;
    const drawW = this.width;
    const drawH = Math.round(this._animator.naturalHeight * scale);
    const drawY = this.y + this.height - drawH;
    ctx.drawImage(frame, this.x, drawY, drawW, drawH);
    return;
  }
  const img = assetManager.getImage('cherrybomb');
  if (img) {
    const s = Math.min(this.width / img.naturalWidth, this.height / img.naturalHeight);
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    ctx.drawImage(img, this.x + (this.width - dw) / 2, this.y + (this.height - dh) / 2, dw, dh);
  } else {
    drawCherryBomb(ctx, this.x, this.y, this.width, this.height, this.armed);
  }
}
```

- [ ] **Step 4: update 方法添加 animator 更新**

在 `update(deltaTime, game)` 开头加：

```js
if (this._animator) this._animator.update(deltaTime);
```

- [ ] **Step 5: Commit**

```bash
git add game/js/CherryBomb.js
git commit -m "feat: add GIF animation and explosion effect to CherryBomb"
```

---

### Task 5: Sunflower — GIF 动画

**Files:**
- Modify: `game/js/Sunflower.js`

- [ ] **Step 1: 添加 import**

```js
import { GifAnimator } from './GifAnimator.js';
```

- [ ] **Step 2: 构造函数末尾创建 animator**

```js
this._animator = assetManager.createAnimator('sunflower');
```

- [ ] **Step 3: 修改 render + update**

将 `render(ctx)` 方法改为：

```js
render(ctx) {
  if (this._animator) {
    const frame = this._animator.getCurrentCanvas();
    const scale = this.width / this._animator.naturalWidth;
    const drawW = this.width;
    const drawH = Math.round(this._animator.naturalHeight * scale);
    const drawY = this.y + this.height - drawH;
    ctx.drawImage(frame, this.x, drawY, drawW, drawH);
    return;
  }
  const img = assetManager.getImage('sunflower');
  if (img) {
    ctx.drawImage(img, this.x, this.y, this.width, this.height);
  } else {
    drawSunflower(ctx, this.x, this.y, this.width, this.height);
  }
}
```

在 `update(deltaTime, game)` 开头加：

```js
if (this._animator) this._animator.update(deltaTime);
```

- [ ] **Step 4: Commit**

```bash
git add game/js/Sunflower.js
git commit -m "feat: add GIF animation to Sunflower"
```

---

### Task 6: PeaShooter — GIF 动画

**Files:**
- Modify: `game/js/PeaShooter.js`

- [ ] **Step 1: 添加 GifAnimator import**

```js
import { GifAnimator } from './GifAnimator.js';
```

- [ ] **Step 2: 构造函数末尾创建 animator**

```js
this._animator = assetManager.createAnimator('peashooter');
```

- [ ] **Step 3: 修改 render + update**

将 `render(ctx)` 方法改为 GIF 优先，保留 shooting 静态图和 wishadel 皮肤逻辑：

```js
render(ctx) {
  const isWishadel = this.skinId === 'wishadel';
  const rw = this.width;
  const rh = this.height;

  // Wishadel skin uses static image (no GIF for skin)
  if (isWishadel) {
    const img = assetManager.getImageNoBg('wishadel_combat');
    if (img) {
      const s = Math.min(rw / img.naturalWidth, rh / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      ctx.drawImage(img, this.x + (rw - dw) / 2, this.y + (rh - dh) / 2, dw, dh);
    }
    if (this._aimTarget && this._aimTarget.alive) {
      this._renderCrosshair(ctx, this._aimTarget);
    }
    return;
  }

  // GIF animation (default peashooter)
  if (this._animator) {
    const frame = this._animator.getCurrentCanvas();
    const scale = this.width / this._animator.naturalWidth;
    const drawW = this.width;
    const drawH = Math.round(this._animator.naturalHeight * scale);
    const drawY = this.y + this.height - drawH;
    ctx.drawImage(frame, this.x, drawY, drawW, drawH);
    return;
  }

  // Fallback to static image
  let img = null;
  if (this.shooting) {
    img = assetManager.getImage('peashooter_shoot');
  }
  if (!img) {
    img = assetManager.getImage('peashooter');
  }
  if (img) {
    const s = Math.min(rw / img.naturalWidth, rh / img.naturalHeight);
    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    ctx.drawImage(img, this.x + (rw - dw) / 2, this.y + (rh - dh) / 2, dw, dh);
  } else {
    drawPeashooter(ctx, this.x, this.y, rw, rh, this.shooting);
  }
}
```

在 `update(deltaTime, game)` 开头加：

```js
if (this._animator) this._animator.update(deltaTime);
```

- [ ] **Step 4: Commit**

```bash
git add game/js/PeaShooter.js
git commit -m "feat: add GIF animation to PeaShooter"
```

---

### Task 7: Nut — GIF 动画

**Files:**
- Modify: `game/js/Nut.js`

- [ ] **Step 1: 添加 GifAnimator import**

```js
import { GifAnimator } from './GifAnimator.js';
```

- [ ] **Step 2: 构造函数末尾创建 animator**

```js
this._animator = assetManager.createAnimator('nut');
```

- [ ] **Step 3: 修改 render + update**

将 `render(ctx)` 方法改为：

```js
render(ctx) {
  if (this._animator) {
    const frame = this._animator.getCurrentCanvas();
    const scale = this.width / this._animator.naturalWidth;
    const drawW = this.width;
    const drawH = Math.round(this._animator.naturalHeight * scale);
    const drawY = this.y + this.height - drawH;
    ctx.drawImage(frame, this.x, drawY, drawW, drawH);
    // Skill active overlay
    if (this.isSkillActive) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(this.x, drawY, drawW, drawH);
      ctx.restore();
    }
    return;
  }
  const img = assetManager.getImage('nut');
  if (img) {
    ctx.drawImage(img, this.x, this.y, this.width, this.height);
  } else {
    drawNut(ctx, this.x, this.y, this.width, this.height, this.isSkillActive);
  }
}
```

在 `update(deltaTime, game)` 开头加：

```js
if (this._animator) this._animator.update(deltaTime);
```

- [ ] **Step 4: Commit**

```bash
git add game/js/Nut.js
git commit -m "feat: add GIF animation to Nut"
```

---

### Task 8: Bullet (豌豆) — GIF 动画

**Files:**
- Modify: `game/js/Bullet.js:1-29`

- [ ] **Step 1: 添加 GifAnimator import**

```js
import { GifAnimator } from './GifAnimator.js';
```

- [ ] **Step 2: Bullet 构造函数末尾创建 animator**

```js
this._animator = assetManager.createAnimator('pea');
```

- [ ] **Step 3: 修改 Bullet.render + update**

将 `render(ctx)` 改为 GIF 优先：

```js
render(ctx) {
  if (this._animator) {
    const frame = this._animator.getCurrentCanvas();
    ctx.drawImage(frame, this.x, this.y, this.width, this.height);
    return;
  }
  const img = assetManager.getImage('pea');
  if (img) {
    ctx.drawImage(img, this.x, this.y, 20, 20);
  } else {
    drawPea(ctx, this.x + 10, this.y + 10, 10);
  }
}
```

在 `update(deltaTime)` 开头加：

```js
if (this._animator) this._animator.update(deltaTime);
```

- [ ] **Step 4: Commit**

```bash
git add game/js/Bullet.js
git commit -m "feat: add GIF animation to Bullet (pea)"
```

---

### Task 9: FirePeaBullet (火豆) — GIF 动画

**Files:**
- Modify: `game/js/Bullet.js:336-352`

- [ ] **Step 1: FirePeaBullet 构造函数末尾创建 animator**

在 `this.skipCollisionCheck = true;` 之后加：

```js
this._animator = assetManager.createAnimator('firePea');
```

- [ ] **Step 2: 修改 FirePeaBullet.render + update**

将 `render(ctx)` 中非爆炸部分改为 GIF 优先：

```js
render(ctx) {
  if (this.exploded) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const alpha = Math.max(0, this._explosionTimer / 350);
    drawFireExplosion(ctx, cx, cy, this._explosionR, alpha);
    return;
  }
  if (this._animator) {
    const frame = this._animator.getCurrentCanvas();
    ctx.drawImage(frame, this.x - 3, this.y - 3, this.width + 6, this.height + 6);
    return;
  }
  const img = assetManager.getImage('firePea');
  if (img) {
    const dw = this.width + 6;
    const dh = this.height + 6;
    ctx.drawImage(img, this.x - 3, this.y - 3, dw, dh);
  } else {
    drawFirePea(ctx, this.x + this.width / 2, this.y + this.height / 2, 12);
  }
}
```

在 `update(deltaTime, game)` 开头（`if (this.exploded)` 之前）加：

```js
if (this._animator) this._animator.update(deltaTime);
```

- [ ] **Step 3: Commit**

```bash
git add game/js/Bullet.js
git commit -m "feat: add GIF animation to FirePeaBullet"
```

---

### Task 10: Sun (太阳) — GIF 动画

**Files:**
- Modify: `game/js/Sun.js`

- [ ] **Step 1: 添加 GifAnimator import**

```js
import { GifAnimator } from './GifAnimator.js';
```

- [ ] **Step 2: Sun 构造函数末尾创建 animator**

```js
this._animator = assetManager.createAnimator('sun');
```

- [ ] **Step 3: 修改 Sun.render + update**

将 `render(ctx)` 改为 GIF 优先：

```js
render(ctx) {
  ctx.save();
  ctx.globalAlpha = this.alpha;
  if (this._animator) {
    const frame = this._animator.getCurrentCanvas();
    ctx.drawImage(frame, this.x, this.y, this.width, this.height);
  } else {
    const img = assetManager.getImage('sun');
    if (img) {
      ctx.drawImage(img, this.x, this.y, 40, 40);
    } else {
      drawSun(ctx, this.x + 20, this.y + 20, 18);
    }
  }
  ctx.restore();
}
```

在 `update(deltaTime)` 开头加：

```js
if (this._animator) this._animator.update(deltaTime);
```

- [ ] **Step 4: Commit**

```bash
git add game/js/Sun.js
git commit -m "feat: add GIF animation to Sun"
```

---

### Task 11: 验证 & 收尾

- [ ] **Step 1: 启动游戏验证**

```bash
npm start
```

检查项目：
1. 向日葵：循环晃动动画
2. 豌豆射手：循环动画，射击时短暂显示射击图，维什戴尔皮肤不受影响
3. 坚果：循环动画，技能激活时蓝色护盾叠加可见
4. 樱桃炸弹：循环动画 → 引爆后播放爆炸 GIF → 消失
5. 豌豆/火豆投射物：飞行动画
6. 太阳：下落动画
7. 断网/回退：静态图和程序化绘制均正常工作

- [ ] **Step 2: Commit (如有微调)**

```bash
git add -A
git commit -m "chore: final adjustments for plant GIF animation"
```
