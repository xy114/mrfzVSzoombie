# 5种新植物 + 3种新僵尸 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增倭瓜、火爆辣椒、双重射手、双胞向日葵、机枪射手 + 旗帜僵尸、铁桶僵尸、小丑僵尸，并重分级冷却体系。

**Architecture:** 所有新单位继承现有基类（Plant / PeaShooter / Sunflower / Zombie），在 Game.js handleDrop / spawnZombie 中通过 switch 分支注册，WaveManager 修改首敌逻辑。新增 PiercingFirePea 穿透子弹类型。

**Tech Stack:** JavaScript ES Modules, HTML5 Canvas, Electron

---

### 任务 1: 冷却重分级 + PLANT_TYPES/ZOMBIE_TYPES 扩展

**Files:**
- Modify: `game/js/constants.js:13-17`

- [ ] **Step 1: 调整现有冷却值并添加新条目**

将 `PLANT_TYPES` 更新为：

```javascript
export const PLANT_TYPES = {
  SUNFLOWER:     { name: 'sunflower',     cost: 50,  cooldown: 5000 },
  PEASHOOTER:    { name: 'peashooter',    cost: 100, cooldown: 5000 },
  NUT:           { name: 'nut',           cost: 50,  cooldown: 10000 },
  CHERRY_BOMB:   { name: 'cherrybomb',    cost: 150, cooldown: 20000 },
  SQUASH:        { name: 'squash',        cost: 175, cooldown: 10000 },
  JALAPENO:      { name: 'jalapeno',      cost: 125, cooldown: 20000 },
  REPEATER:      { name: 'repeater',      cost: 200, cooldown: 10000 },
  TWIN_SUNFLOWER:{ name: 'twinsunflower', cost: 125, cooldown: 10000 },
  GATLING_PEA:   { name: 'gatlingpea',    cost: 350, cooldown: 10000 }
};
```

在文件末尾添加 `ZOMBIE_TYPES`（如果不存在则新增，参照现有 ZOMBIE_TYPES 扩展）：

```javascript
export const ZOMBIE_TYPES = {
  NORMAL: { name: 'normal', health: 100, defense: 0, speed: 0.3, damage: 20 },
  CONE:   { name: 'cone',   health: 200, defense: 0, speed: 0.3, damage: 20 },
  SHIELD: { name: 'shield', health: 180, defense: 15, speed: 0.25, damage: 20 },
  IMP:    { name: 'imp',    health: 60,  defense: 0, speed: 0.6, damage: 15 },
  FLAG:   { name: 'flag',   health: 100, defense: 0, speed: 0.3, damage: 20 },
  BUCKET: { name: 'bucket', health: 300, defense: 40, speed: 0.3, damage: 20 },
  CLOWN:  { name: 'clown',  health: 150, defense: 0, speed: 0.4, damage: 0 }
};
```

---

### 任务 2: Plant 基类添加无敌帧

**Files:**
- Modify: `game/js/Plant.js:1-54`

- [ ] **Step 1: 添加 _invulnerable 字段**

在 `Plant` 构造函数中添加：

```javascript
this._invulnerable = false;
```

- [ ] **Step 2: takeDamage 跳过无敌单位**

修改 `takeDamage` 方法开头：

```javascript
takeDamage(damage, damageType = 'physical') {
    if (this._invulnerable) return;
    // ... 原有逻辑
}
```

---

### 任务 3: Zombie.js 添加 bucket 退化 + clown 爆炸钩子

**Files:**
- Modify: `game/js/Zombie.js` (takeDamage 方法约 117-151 行)

- [ ] **Step 1: 添加 bucket 退化逻辑**

在 `takeDamage` 中，现有 cone/shield 退化逻辑旁边加入：

```javascript
// Bucket degradation: HP <= 30% -> normal
if (this.health > 0 &&
    this.health <= this.maxHealth * 0.3 &&
    this.type === 'bucket') {
  this.type = 'normal';
  this.walkAnimator = assetManager.createAnimator('normal');
  this.attackAnimator = assetManager.createAnimator('normal_attack');
  this.defense = 0;
  this.deathGifKey = 'zombie_death';
  // Helmet shatter visual cue
  this._showShatterEffect = true;
  this._shatterTimer = 500;
}
```

- [ ] **Step 2: 添加 clown 爆炸相关字段和更新钩子**

在构造函数中添加：

```javascript
this._squashed = false;
this._isClown = false;
```

在 `update` 方法末尾添加小丑阻挡检测：

```javascript
// Clown blocked detection
if (this._isClown && !this._exploding) {
  if (this.speed === 0 || (this.targetPlant && this._blocked)) {
    this._triggerClownExplosion(game);
  }
}
```

---

### 任务 4: 资源注册 — AssetManager + index.html

**Files:**
- Modify: `game/js/AssetManager.js` (imagePaths 对象)
- Modify: `index.html` (GIF_PATHS 对象)

- [ ] **Step 1: AssetManager 添加图片路径**

在 `imagePaths` 中添加：

```javascript
// New plants
squash_idle: 'resources/plants/窝瓜.gif',
squash_jump: 'resources/plants/窝瓜跳跃.gif',
jalapeno: 'resources/plants/火爆辣椒·.gif',
jalapeno_fire: 'resources/plants/火.gif',
repeater: 'resources/plants/双重射手.gif',
twinsunflower: 'resources/plants/双胞向日葵.gif',
gatlingpea: 'resources/plants/机枪射手.gif',
// New zombies
flag: 'resources/zombies/旗帜僵尸.gif',
flag_attack: 'resources/zombies/旗帜僵尸啃食.gif',
bucket: 'resources/zombies/铁桶僵尸.gif',
bucket_attack: 'resources/zombies/铁桶僵尸啃食.gif',
clown: 'resources/zombies/小丑僵尸.gif',
clown_prep: 'resources/zombies/准备爆炸.gif',
clown_explosion: 'resources/zombies/爆炸！（小丑僵尸）.gif',
```

同时在对应的 skin default 段添加植物皮肤默认值：

```javascript
// New plant default skins
squash_skin_default_combat: 'resources/plants/窝瓜.gif',
squash_skin_default_portrait: 'resources/plants/窝瓜.gif',
squash_skin_default_headshot: 'resources/plants/窝瓜.gif',
jalapeno_skin_default_combat: 'resources/plants/火爆辣椒·.gif',
jalapeno_skin_default_portrait: 'resources/plants/火爆辣椒·.gif',
jalapeno_skin_default_headshot: 'resources/plants/火爆辣椒·.gif',
repeater_skin_default_combat: 'resources/plants/双重射手.gif',
repeater_skin_default_portrait: 'resources/plants/双重射手.gif',
repeater_skin_default_headshot: 'resources/plants/双重射手.gif',
twinsunflower_skin_default_combat: 'resources/plants/双胞向日葵.gif',
twinsunflower_skin_default_portrait: 'resources/plants/双胞向日葵.gif',
twinsunflower_skin_default_headshot: 'resources/plants/双胞向日葵.gif',
gatlingpea_skin_default_combat: 'resources/plants/机枪射手.gif',
gatlingpea_skin_default_portrait: 'resources/plants/机枪射手.gif',
gatlingpea_skin_default_headshot: 'resources/plants/机枪射手.gif',
```

- [ ] **Step 2: index.html GIF_PATHS 注册新 GIF**

在 `GIF_PATHS` 对象中添加：

```javascript
squash_idle: 'resources/plants/窝瓜.gif',
squash_jump: 'resources/plants/窝瓜跳跃.gif',
jalapeno: 'resources/plants/火爆辣椒·.gif',
jalapeno_fire: 'resources/plants/火.gif',
repeater: 'resources/plants/双重射手.gif',
twinsunflower: 'resources/plants/双胞向日葵.gif',
gatlingpea: 'resources/plants/机枪射手.gif',
flag: 'resources/zombies/旗帜僵尸.gif',
flag_attack: 'resources/zombies/旗帜僵尸啃食.gif',
bucket: 'resources/zombies/铁桶僵尸.gif',
bucket_attack: 'resources/zombies/铁桶僵尸啃食.gif',
clown: 'resources/zombies/小丑僵尸.gif',
clown_prep: 'resources/zombies/准备爆炸.gif',
clown_explosion: 'resources/zombies/爆炸！（小丑僵尸）.gif',
```

---

### 任务 5: PlantConfig + ZombieConfig 定义

**Files:**
- Modify: `game/js/PlantConfig.js` (PLANT_DEFS 和 SKIN_DEFS)
- Modify: `game/js/ZombieConfig.js` (ZOMBIE_DEFS)

- [ ] **Step 1: PlantConfig 添加 5 种新植物定义**

在 `PLANT_DEFS` 数组中追加：

```javascript
// --- New plants (解锁条件 6-1, 暂不可解锁) ---
{
  id: 'squash', name: '倭瓜', category: 'plant',
  description: '耐心等待，一击必杀',
  skillDescription: '陷入10秒眩晕，苏醒后攻击力永久提升50%。冷却15s',
  unlockLevel: '6-1', cost: 175, cooldownSec: 10,
  combat: {
    bodyType: 'plant', damage: 80, attackInterval: 5000,
    skillCooldown: 15000, stunDuration: 10000, attackBoost: 0.5
  }
},
{
  id: 'jalapeno', name: '火爆辣椒', category: 'plant',
  description: '焚烧整行，寸草不生',
  skillDescription: '',
  unlockLevel: '6-1', cost: 125, cooldownSec: 20,
  combat: { bodyType: 'plant', damage: 180, deployTime: 1500 }
},
{
  id: 'repeater', name: '双重射手', category: 'plant',
  description: '双管齐下，火力翻倍',
  skillDescription: '发射2颗穿透火豆，贯穿整行敌人，每颗造成攻击力150%的法术伤害。冷却10s',
  unlockLevel: '6-1', cost: 200, cooldownSec: 10,
  combat: { bodyType: 'plant', peaDamage: 20, peaSpeed: 8,
    skillCooldown: 10000, firePeaDamage: 30 }
},
{
  id: 'twinsunflower', name: '双胞向日葵', category: 'plant',
  description: '双倍光辉，源源不断',
  skillDescription: '锁定当前阳光余额，释放太阳光束照射整行3秒，每秒造成等额法术伤害。冷却15s',
  unlockLevel: '6-1', cost: 125, cooldownSec: 10,
  combat: { bodyType: 'plant', sunInterval: 10000, sunAmount: 25,
    skillCooldown: 15000, beamDuration: 3000 }
},
{
  id: 'gatlingpea', name: '机枪射手', category: 'plant',
  description: '四管齐射，弹幕压制',
  skillDescription: '召唤5行火豆弹幕，每行5发，每发造成50+100%攻击力的法术伤害。冷却15s',
  unlockLevel: '6-1', cost: 350, cooldownSec: 10,
  combat: { bodyType: 'plant', peaDamage: 20, peaSpeed: 8, bulletCount: 4,
    skillCooldown: 15000, firePeaPerRow: 5 }
}
```

在 SKIN_DEFS 中为每个新植物添加 default 皮肤：

```javascript
{
  id: 'default', plantId: 'squash', name: '默认', category: 'default',
  description: '耐心等待，一击必杀',
  skillDescription: '', cost: 0, owned: true, combat: {}
},
{
  id: 'default', plantId: 'jalapeno', name: '默认', category: 'default',
  description: '焚烧整行，寸草不生',
  skillDescription: '', cost: 0, owned: true, combat: {}
},
{
  id: 'default', plantId: 'repeater', name: '默认', category: 'default',
  description: '双管齐下，火力翻倍',
  skillDescription: '', cost: 0, owned: true, combat: {}
},
{
  id: 'default', plantId: 'twinsunflower', name: '默认', category: 'default',
  description: '双倍光辉，源源不断',
  skillDescription: '', cost: 0, owned: true, combat: {}
},
{
  id: 'default', plantId: 'gatlingpea', name: '默认', category: 'default',
  description: '四管齐射，弹幕压制',
  skillDescription: '', cost: 0, owned: true, combat: {}
},
```

- [ ] **Step 2: ZombieConfig 添加 3 种新僵尸定义**

在 `ZOMBIE_DEFS` 数组中追加：

```javascript
{
  id: 'flag', name: '旗帜僵尸', category: 'normal',
  emoji: '', description: '每波先锋，引领尸潮',
  health: 100, defense: 0, magicResist: 0, speed: 0.3, damage: 20,
  firstEncounter: '6-1', threatLevel: 1
},
{
  id: 'bucket', name: '铁桶僵尸', category: 'elite',
  emoji: '', description: '重甲铁桶，坚不可摧',
  health: 300, defense: 40, magicResist: 0, speed: 0.3, damage: 20,
  firstEncounter: '6-1', threatLevel: 3
},
{
  id: 'clown', name: '小丑僵尸', category: 'elite',
  emoji: '', description: '行走的炸弹，不分敌我',
  health: 150, defense: 0, magicResist: 0, speed: 0.4, damage: 0,
  firstEncounter: '6-1', threatLevel: 2
}
```

---

### 任务 6: PiercingFirePea 穿透子弹

**Files:**
- Modify: `game/js/Bullet.js` (在 export class 区域新增)

- [ ] **Step 1: 添加 PiercingFirePea 类**

在 `Bullet.js` 的 `export class FirePeaBullet` 之前添加：

```javascript
// Piercing fire pea — passes through all zombies in the row, dealing magic damage to each
export class PiercingFirePea {
  constructor(x, y, row, damage = 30, speed = 10) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.speed = speed;
    this.damage = damage;
    this.damageType = 'magic';
    this.width = 22;
    this.height = 22;
    this.active = true;
    this.skipCollisionCheck = true;
    this._hitSet = new Set(); // avoid double-hitting the same zombie
    this._animator = assetManager.createAnimator('firePea');
  }

  update(deltaTime, game) {
    if (this._animator) this._animator.update(deltaTime);
    this.x += this.speed * (deltaTime / 16);
    if (this.x > game.canvas.width + 30) {
      this.active = false;
      return;
    }
    // Hit all zombies in same row — piercing never consumed
    for (const z of game.zombies) {
      if (z.alive && z.row === this.row && !this._hitSet.has(z)) {
        const dist = Math.abs(z.x + z.width / 2 - (this.x + this.width / 2));
        if (dist < 35) {
          this._hitSet.add(z);
          z.takeDamage(this.damage, 'magic');
        }
      }
    }
  }

  render(ctx) {
    if (this._animator) {
      const frame = this._animator.getCurrentCanvas();
      ctx.drawImage(frame, this.x - this.width * 0.15, this.y + 7 - this.height * 0.15, this.width * 2.6 + 6, this.height * 2 + 6);
      return;
    }
    const img = assetManager.getImage('firePea');
    if (img) {
      const dw = this.width * 2.6 + 6;
      const dh = this.height * 2 + 6;
      ctx.drawImage(img, this.x - this.width * 0.15, this.y + 7 - this.height * 0.15, dw, dh);
    } else {
      drawFirePea(ctx, this.x + this.width, this.y + 7 + this.height, this.width);
    }
  }
}
```

---

### 任务 7: 倭瓜 Squash.js

**Files:**
- Create: `game/js/Squash.js`

- [ ] **Step 1: 创建 Squash 类**

```javascript
import { Plant } from './Plant.js';
import { GAME_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';

const STATE_IDLE = 0;
const STATE_RISING = 1;
const STATE_FALLING = 2;
const STATE_RECOVERY = 3;

export class Squash extends Plant {
  constructor(x, y, starLevel = 1) {
    super(x, y, starLevel);
    this.width = 80;
    this.height = 80;
    this._baseY = y;
    this._state = STATE_IDLE;
    this._stateTimer = 0;
    this._target = null;
    this._impactFrame = 0;
    this._stunned = false;
    this._stunTimer = 0;
    this._attackBoost = 1.0;
    this._damageDealt = false;

    this._idleAnim = assetManager.createAnimator('squash_idle');
    this._jumpAnim = null;
    this.skillCooldown = 0;
    this.skillMaxCooldown = 15000;
    this.baseDamage = 80;

    // Apply star scaling
    const m = (window.STAR_CONFIG && window.STAR_CONFIG[starLevel]) || { damageMult: 1.0 };
    this.baseDamage = Math.floor(80 * m.damageMult);
  }

  update(deltaTime, game) {
    if (this.skillCooldown > 0) this.skillCooldown -= deltaTime;
    if (this._stunned) {
      this._stunTimer -= deltaTime;
      if (this._stunTimer <= 0) {
        this._stunned = false;
        this._attackBoost = 1.5;
      }
      return;
    }

    if (this._idleAnim) this._idleAnim.update(deltaTime);
    if (this._jumpAnim) this._jumpAnim.update(deltaTime);

    switch (this._state) {
      case STATE_IDLE: {
        // Scan 1 cell ahead
        for (const z of game.zombies) {
          if (z.alive && z.row === this.row) {
            const dx = z.x - (this.x + 50);
            if (dx > 0 && dx < 100) {
              this._target = z;
              this._state = STATE_RISING;
              this._stateTimer = 400;
              this._jumpAnim = assetManager.createAnimator('squash_jump');
              if (this._jumpAnim) this._jumpAnim.setLoop(false);
              this._impactFrame = Math.floor((this._jumpAnim ? this._jumpAnim.frameCount : 1) * 0.7);
              this._damageDealt = false;
              this._invulnerable = true;
              break;
            }
          }
        }
        break;
      }

      case STATE_RISING: {
        const progress = 1 - this._stateTimer / 400;
        this.y = this._baseY - progress * 60;
        this._stateTimer -= deltaTime;
        if (this._stateTimer <= 0) {
          this._state = STATE_FALLING;
          this.y = this._baseY - 60;
        }
        break;
      }

      case STATE_FALLING: {
        if (this._jumpAnim) {
          const idx = this._jumpAnim._currentIndex;
          if (!this._damageDealt && idx >= this._impactFrame) {
            this._damageDealt = true;
            if (this._target && this._target.alive) {
              const dmg = Math.floor(this.baseDamage * 3 * this._attackBoost);
              this._target._squashed = true;
              this._target.takeDamage(dmg, 'physical');
            }
          }
          if (!this._jumpAnim.isActive) {
            this._state = STATE_RECOVERY;
            this._stateTimer = 200;
          }
        }
        break;
      }

      case STATE_RECOVERY: {
        this.y += (this._baseY - this.y) * 0.2;
        this._stateTimer -= deltaTime;
        if (this._stateTimer <= 0 && Math.abs(this.y - this._baseY) < 2) {
          this.y = this._baseY;
          this._state = STATE_IDLE;
          this._target = null;
          this._invulnerable = false;
        }
        break;
      }
    }
  }

  useSkill(game) {
    if (this.skillCooldown > 0 || this._stunned) return false;
    this._stunned = true;
    this._stunTimer = 10000;
    this.skillCooldown = this.skillMaxCooldown;
    return true;
  }

  render(ctx) {
    const anim = this._jumpAnim && this._jumpAnim.isActive ? this._jumpAnim : this._idleAnim;
    if (anim) {
      const frame = anim.getCurrentCanvas();
      if (frame) {
        const scale = this.width / anim.naturalWidth;
        const drawW = this.width;
        const drawH = Math.round(anim.naturalHeight * scale);
        ctx.drawImage(frame, this.x, this.y, drawW, drawH);
        return;
      }
    }
    // Fallback: draw a rect placeholder
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  getBodyType() { return 'plant'; }
  getRenderSize() { return 80; }
  getAspectRatio() { return 1.0; }
}
```

---

### 任务 8: 火爆辣椒 Jalapeno.js

**Files:**
- Create: `game/js/Jalapeno.js`

- [ ] **Step 1: 创建 Jalapeno 类**

```javascript
import { Plant } from './Plant.js';
import { assetManager } from './AssetManager.js';

export class Jalapeno extends Plant {
  constructor(x, y, starLevel = 1) {
    super(x, y, starLevel);
    this.width = 80;
    this.height = 80;
    this.baseDamage = 180;
    this._deployTime = 1500;
    this._deployTimer = 0;
    this._exploded = false;
    this._deploying = true;
    this._invulnerable = true;
    this._animator = assetManager.createAnimator('jalapeno');
    this._fireAnimator = null;
    this.row = 0; // set by Game after placement

    const m = (window.STAR_CONFIG && window.STAR_CONFIG[starLevel]) || { damageMult: 1.0 };
    this.baseDamage = Math.floor(180 * m.damageMult);
  }

  update(deltaTime, game) {
    if (this._animator) this._animator.update(deltaTime);
    if (this._fireAnimator) this._fireAnimator.update(deltaTime);

    if (this._deploying) {
      this._deployTimer += deltaTime;
      if (this._deployTimer >= this._deployTime) {
        this._deploying = false;
        this._explode(game);
      }
      return;
    }

    if (this._exploded && this._fireAnimator && !this._fireAnimator.isActive) {
      this.alive = false;
      this.active = false;
    }
  }

  _explode(game) {
    this._exploded = true;
    this._fireAnimator = assetManager.createAnimator('jalapeno_fire');
    if (this._fireAnimator) this._fireAnimator.setLoop(false);

    // First-frame damage: hit all zombies in same row
    for (const z of game.zombies) {
      if (z.alive && z.row === this.row) {
        const dmg = Math.floor(60 + this.baseDamage * 2);
        z.takeDamage(dmg, 'magic');
      }
    }
  }

  useSkill() { return false; }

  render(ctx) {
    if (this._exploded) {
      // Render fire.gif spanning the entire row
      if (this._fireAnimator) {
        const frame = this._fireAnimator.getCurrentCanvas();
        if (frame) {
          const lawnH = 100; // approximate row height
          const fireY = this.y + this.height / 2 - lawnH / 2;
          ctx.drawImage(frame, 0, fireY, 900, lawnH);
        }
      }
      return;
    }

    if (this._animator) {
      const frame = this._animator.getCurrentCanvas();
      if (frame) {
        const scale = this.width / this._animator.naturalWidth;
        const drawW = this.width;
        const drawH = Math.round(this._animator.naturalHeight * scale);
        ctx.drawImage(frame, this.x, this.y, drawW, drawH);
        return;
      }
    }
    ctx.fillStyle = '#FF4500';
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  getBodyType() { return 'plant'; }
  getRenderSize() { return 80; }
  getAspectRatio() { return 1.0; }
}
```

---

### 任务 9: 双重射手 Repeater.js

**Files:**
- Create: `game/js/Repeater.js`
- Modify: `game/js/Bullet.js` (import)

- [ ] **Step 1: 创建 Repeater 类**

```javascript
import { PeaShooter } from './PeaShooter.js';
import { Bullet, PiercingFirePea } from './Bullet.js';
import { STAR_CONFIG } from './constants.js';
import { getSkin } from './PlantConfig.js';

export class Repeater extends PeaShooter {
  constructor(x, y, starLevel = 1, skinId = null) {
    super(x, y, starLevel, skinId);
    this.skinId = skinId || 'default';
    this._animator = null;
    if (!this.skinId || this.skinId === 'default') {
      this._animator = assetManager.createAnimator('repeater');
    }
    const cfg = this._getSkinCfg();
    this._peaDamage = (cfg ? cfg.peaDamage : 20);
    this._peaSpeed = (cfg ? cfg.peaSpeed : 8);
    this._firePeaDamage = (cfg ? cfg.firePeaDamage : 30);
    this._bulletIndex = 0;
    this._firingPeas = 0;
    this._firePeaTimer = 0;
  }

  update(deltaTime, game) {
    if (this._animator) this._animator.update(deltaTime);
    if (this.skillCooldown > 0) this.skillCooldown -= deltaTime;

    // Normal attack: 2 peas, sequential
    const hasZombieInRow = game.zombies.some(z =>
      z.alive && z.row === this.row && z.x >= 0
    );
    if (hasZombieInRow) {
      this.shootTimer += deltaTime;
      if (this.shootTimer >= this.shootInterval && this._firingPeas <= 0) {
        this._firingPeas = 2;
        this._bulletIndex = 0;
        this._firePeaTimer = 0;
      }
    }

    // Sequential firing
    if (this._firingPeas > 0) {
      this._firePeaTimer -= deltaTime;
      if (this._firePeaTimer <= 0) {
        const m = STAR_CONFIG[this.starLevel] || STAR_CONFIG[1];
        const dmg = Math.floor(this._peaDamage * m.damageMult);
        const yOff = this._bulletIndex === 0 ? -6 : 6;
        const pea = new Bullet(this.x + 30, this.y + 4 + yOff, this.row, dmg);
        pea.speed = this._peaSpeed;
        game.addBullet(pea);
        this._bulletIndex++;
        this._firingPeas--;
        this._firePeaTimer = 200;
        if (this._firingPeas <= 0) {
          this.shootTimer = 0;
        }
      }
    }

    // Skill cooldown bar
    if (this.skillCooldown > 0) this.skillCooldown -= deltaTime;
  }

  useSkill(game) {
    if (this.skillCooldown > 0) return false;
    this.skillCooldown = this.skillMaxCooldown;

    const m = STAR_CONFIG[this.starLevel] || STAR_CONFIG[1];
    const dmg = Math.floor(this._firePeaDamage * m.damageMult * 1.5);

    // Fire 2 piercing fire peas sequentially
    const delays = [0, 150];
    const yOffs = [-6, 6];
    for (let i = 0; i < 2; i++) {
      setTimeout(() => {
        const pea = new PiercingFirePea(this.x + 30, this.y + 4 + yOffs[i], this.row, dmg);
        pea.speed = 10;
        game.addBullet(pea);
      }, delays[i]);
    }
    return true;
  }

  getBodyType() { return 'plant'; }
  getRenderSize() { return 80; }
  getAspectRatio() { return 1.0; }
}
```

---

### 任务 10: 双胞向日葵 TwinSunflower.js

**Files:**
- Create: `game/js/TwinSunflower.js`

- [ ] **Step 1: 创建 TwinSunflower 类**

```javascript
import { Sunflower } from './Sunflower.js';
import { assetManager } from './AssetManager.js';

export class TwinSunflower extends Sunflower {
  constructor(x, y, starLevel = 1, skinId = null) {
    super(x, y, starLevel, skinId);
    this.sunInterval = 10000;
    this.sunTimer = 0;
    this._beamActive = false;
    this._beamTimer = 0;
    this._beamDamage = 0;
    this._beamTracker = 0;
    this._beamTickCount = 0;
  }

  update(deltaTime, game) {
    // Beam skill active
    if (this._beamActive) {
      this._beamTimer -= deltaTime;
      this._beamTracker += deltaTime;
      if (this._beamTracker >= 1000 && this._beamTickCount < 3) {
        this._beamTracker -= 1000;
        this._beamTickCount++;
        // Tick damage to all zombies in same row
        for (const z of game.zombies) {
          if (z.alive && z.row === this.row) {
            z.takeDamage(this._beamDamage, 'magic');
          }
        }
      }
      if (this._beamTimer <= 0) {
        this._beamActive = false;
        this._beamTracker = 0;
        this._beamTickCount = 0;
      }
      return; // no sun production during beam
    }

    // Normal sun production — 2 suns at once
    this.sunTimer += deltaTime;
    if (this.sunTimer >= this.sunInterval) {
      this.sunTimer = 0;
      this.produceSun(game, -15);
      this.produceSun(game, 15);
    }
  }

  produceSun(game, xOffset) {
    const Sun = game.addSun; // uses addSun method
    // Direct sun creation, twin offset
    const sunObj = {
      x: this.x + this.width / 2 + xOffset,
      y: this.y,
      targetY: this.y - 30 + Math.random() * 20,
      active: true,
      falling: false,
      collected: false,
      timer: 8000,
      update(dt) {
        this.timer -= dt;
        if (this.timer <= 0) this.active = false;
      },
      render(ctx) {
        const img = assetManager.getImage('sun');
        if (img) {
          ctx.drawImage(img, this.x - 15, this.y - 15, 30, 30);
        } else {
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    game.suns.push(sunObj);
  }

  useSkill(game) {
    if (this.skillCooldown > 0 || this._beamActive) return false;
    this._beamActive = true;
    this._beamTimer = 3000;
    this._beamTracker = 0;
    this._beamTickCount = 0;
    this._beamDamage = game.sun; // lock current sun balance as damage
    this.skillCooldown = 15000;
    return true;
  }

  render(ctx) {
    // Beam visual
    if (this._beamActive) {
      ctx.save();
      const alpha = 0.3 + Math.sin(Date.now() / 100) * 0.1;
      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      const beamY = this.y + this.height / 2 - 40;
      ctx.fillRect(this.x + this.width, beamY, 900 - this.x - this.width, 80);
      ctx.restore();
    }
    super.render(ctx);
  }
}
```

---

### 任务 11: 机枪射手 GatlingPea.js

**Files:**
- Create: `game/js/GatlingPea.js`

- [ ] **Step 1: 创建 GatlingPea 类**

```javascript
import { PeaShooter } from './PeaShooter.js';
import { Bullet, FirePeaBullet } from './Bullet.js';
import { STAR_CONFIG } from './constants.js';
import { getSkin } from './PlantConfig.js';
import { assetManager } from './AssetManager.js';

export class GatlingPea extends PeaShooter {
  constructor(x, y, starLevel = 1, skinId = null) {
    super(x, y, starLevel, skinId);
    this.skinId = skinId || 'default';
    this._animator = null;
    if (!this.skinId || this.skinId === 'default') {
      this._animator = assetManager.createAnimator('gatlingpea');
    }
    this._bulletsRemaining = 0;
    this._bulletTimer = 0;
    this._bulletIndex = 0;
    this.skillMaxCooldown = 15000;
  }

  update(deltaTime, game) {
    if (this._animator) this._animator.update(deltaTime);
    if (this.skillCooldown > 0) this.skillCooldown -= deltaTime;

    // Normal attack: scan for zombies, start burst
    const hasZombieInRow = game.zombies.some(z =>
      z.alive && z.row === this.row && z.x >= 0
    );
    if (hasZombieInRow) {
      this.shootTimer += deltaTime;
      if (this.shootTimer >= this.shootInterval && this._bulletsRemaining <= 0) {
        this._bulletsRemaining = 4;
        this._bulletIndex = 0;
        this._bulletTimer = 0;
      }
    }

    // Burst fire
    if (this._bulletsRemaining > 0) {
      this._bulletTimer -= deltaTime;
      if (this._bulletTimer <= 0) {
        const m = STAR_CONFIG[this.starLevel] || STAR_CONFIG[1];
        const dmg = Math.floor(20 * m.damageMult);
        const yOffs = [-6, -2, 2, 6];
        const yOff = yOffs[this._bulletIndex];
        const pea = new Bullet(this.x + 30, this.y + 4 + yOff, this.row, dmg);
        pea.speed = 8;
        game.addBullet(pea);
        this._bulletIndex++;
        this._bulletsRemaining--;
        this._bulletTimer = 120;
        if (this._bulletsRemaining <= 0) {
          this.shootTimer = 0;
        }
      }
    }
  }

  useSkill(game) {
    if (this.skillCooldown > 0) return false;
    this.skillCooldown = this.skillMaxCooldown;

    const m = STAR_CONFIG[this.starLevel] || STAR_CONFIG[1];
    const dmg = Math.floor(50 + 20 * m.damageMult);

    // 5 rows, each row: 5 fire peas, 150ms apart, from this plant's x
    for (let row = 0; row < 5; row++) {
      let delay = 0;
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          if (!game.isRunning) return;
          const pea = new FirePeaBullet(this.x + 30, 0, row, dmg, 6);
          // Adjust y to match row
          const tileCenter = game.lawn.getTileCenter(row, 0);
          pea.y = tileCenter.y - pea.height / 2;
          pea.speed = 6;
          game.addBullet(pea);
        }, delay);
        delay += 150;
      }
    }
    return true;
  }

  getBodyType() { return 'plant'; }
  getRenderSize() { return 80; }
  getAspectRatio() { return 1.0; }
}
```

---

### 任务 12: 旗帜僵尸 + 铁桶僵尸 + 小丑僵尸

**Files:**
- Create: `game/js/FlagZombie.js`
- Create: `game/js/BucketZombie.js`
- Create: `game/js/ClownZombie.js`

- [ ] **Step 1: 旗帜僵尸 FlagZombie.js**

```javascript
import { Zombie } from './Zombie.js';

export class FlagZombie extends Zombie {
  constructor(x, y, row) {
    super(x, y, row, 'flag');
    this.type = 'flag';
    this.maxHealth = 100;
    this.health = 100;
    this.defense = 0;
    this.speed = 0.3;
    this.damage = 20;
    this.walkAnimator = null; // set by AssetManager
    this.attackAnimator = null;
    this.deathGifKey = 'zombie_death';
  }
}
```

- [ ] **Step 2: 铁桶僵尸 BucketZombie.js**

```javascript
import { Zombie } from './Zombie.js';

export class BucketZombie extends Zombie {
  constructor(x, y, row) {
    super(x, y, row, 'bucket');
    this.type = 'bucket';
    this.maxHealth = 300;
    this.health = 300;
    this.defense = 40;
    this.speed = 0.3;
    this.damage = 20;
    this.deathGifKey = 'zombie_death';
    this._shatterTimer = 0;
    this._showShatterEffect = false;
  }

  update(deltaTime, game) {
    super.update(deltaTime, game);
    if (this._showShatterEffect) {
      this._shatterTimer -= deltaTime;
      if (this._shatterTimer <= 0) {
        this._showShatterEffect = false;
      }
    }
  }
}
```

- [ ] **Step 3: 小丑僵尸 ClownZombie.js**

```javascript
import { Zombie } from './Zombie.js';
import { assetManager } from './AssetManager.js';

export class ClownZombie extends Zombie {
  constructor(x, y, row) {
    super(x, y, row, 'clown');
    this.type = 'clown';
    this.maxHealth = 150;
    this.health = 150;
    this.defense = 0;
    this.speed = 0.4;
    this.damage = 0;
    this._isClown = true;
    this._exploding = false;
    this._explosionPhase = 0; // 0=none, 1=prep, 2=boom
    this._prepAnimator = null;
    this._boomAnimator = null;
    this._exploded = false;
    this.deathGifKey = null; // no normal death — uses explosion
  }

  // Clown never attacks — override
  attack() {
    return false;
  }

  // Blocked: trigger explosion
  _triggerClownExplosion(game) {
    if (this._exploding || this._squashed) return;
    this._exploding = true;
    this._invulnerable = true;
    this._explosionPhase = 1;
    this._prepAnimator = assetManager.createAnimator('clown_prep');
    if (this._prepAnimator) this._prepAnimator.setLoop(false);
  }

  update(deltaTime, game) {
    if (this._exploding) {
      if (this._explosionPhase === 1 && this._prepAnimator) {
        this._prepAnimator.update(deltaTime);
        if (!this._prepAnimator.isActive) {
          this._explosionPhase = 2;
          this._boomAnimator = assetManager.createAnimator('clown_explosion');
          if (this._boomAnimator) this._boomAnimator.setLoop(false);
          this._applyExplosionDamage(game);
        }
      } else if (this._explosionPhase === 2 && this._boomAnimator) {
        this._boomAnimator.update(deltaTime);
        if (!this._boomAnimator.isActive) {
          this.alive = false;
          this.active = false;
        }
      }
      return;
    }

    super.update(deltaTime, game);

    // Check if blocked (speed reduced to near-zero by plant in front)
    if (!this._exploding && !this._squashed && this.targetPlant) {
      const dx = this.x - (this.targetPlant.x + this.targetPlant.width);
      if (dx < 5 && dx > -30) {
        this._triggerClownExplosion(game);
      }
    }
  }

  // Called from Zombie.takeDamage on death
  onDeath(game) {
    if (!this._exploding && !this._squashed) {
      this._triggerClownExplosion(game);
    }
  }

  _applyExplosionDamage(game) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const cellSize = Math.max(game.lawn.standardCell.w, game.lawn.standardCell.h);

    // 3x3 cell area — damage zombies AND plants
    for (const z of game.zombies) {
      if (!z.alive || z === this) continue;
      const dist = Math.sqrt((z.x + z.width/2 - cx)**2 + (z.y + z.height/2 - cy)**2);
      if (dist < cellSize * 2) {
        z.takeDamage(300, 'physical');
      }
    }
    for (const p of game.plants) {
      if (!p.alive) continue;
      const dist = Math.sqrt((p.x + p.width/2 - cx)**2 + (p.y + p.height/2 - cy)**2);
      if (dist < cellSize * 2) {
        p.takeDamage(300);
      }
    }
  }

  render(ctx) {
    if (this._exploding) {
      if (this._explosionPhase === 1 && this._prepAnimator) {
        const frame = this._prepAnimator.getCurrentCanvas();
        if (frame) ctx.drawImage(frame, this.x, this.y, this.width, this.height);
      } else if (this._explosionPhase === 2 && this._boomAnimator) {
        const frame = this._boomAnimator.getCurrentCanvas();
        if (frame) {
          const scale = 2.5;
          const dw = this._boomAnimator.naturalWidth * scale;
          const dh = this._boomAnimator.naturalHeight * scale;
          ctx.drawImage(frame, cx - dw/2, cy - dh/2, dw, dh);
        }
      }
      return;
    }

    super.render(ctx);
  }
}
```

---

### 任务 13: WaveManager 旗帜僵尸首敌

**Files:**
- Modify: `game/js/WaveManager.js`

- [ ] **Step 1: 修改 _pickZombieType 强制首敌为 flag**

在 `_pickZombieType()` 方法开头添加：

```javascript
_pickZombieType() {
    // First zombie of each wave is always a flag zombie
    if (this.zombiesToSpawn === this.zombiesInWave) {
      return 'flag';
    }
    // ... existing random selection logic
}
```

---

### 任务 14: Game.js 集成所有新单位

**Files:**
- Modify: `game/js/Game.js`

- [ ] **Step 1: 顶部 import 添加新类**

```javascript
import { Squash } from './Squash.js';
import { Jalapeno } from './Jalapeno.js';
import { Repeater } from './Repeater.js';
import { TwinSunflower } from './TwinSunflower.js';
import { GatlingPea } from './GatlingPea.js';
import { FlagZombie } from './FlagZombie.js';
import { BucketZombie } from './BucketZombie.js';
import { ClownZombie } from './ClownZombie.js';
```

- [ ] **Step 2: handleDrop 添加 5 个 plant case**

在现有 `cherrybomb` case 后追加：

```javascript
} else if (plantType === 'squash') {
  if (this.spendSun(PLANT_TYPES.SQUASH.cost)) {
    const plant = new Squash(plantX, plantY, star);
    plant.row = row;
    this.addPlant(plant);
    this.plantCooldowns.squash = PLANT_TYPES.SQUASH.cooldown;
    placed = true;
  }
} else if (plantType === 'jalapeno') {
  if (this.spendSun(PLANT_TYPES.JALAPENO.cost)) {
    const plant = new Jalapeno(plantX, plantY, star);
    plant.row = row;
    this.addPlant(plant);
    this.plantCooldowns.jalapeno = PLANT_TYPES.JALAPENO.cooldown;
    placed = true;
  }
} else if (plantType === 'repeater') {
  if (this.spendSun(PLANT_TYPES.REPEATER.cost)) {
    const plant = new Repeater(plantX, plantY, star, skin);
    plant.row = row;
    this.addPlant(plant);
    this.plantCooldowns.repeater = PLANT_TYPES.REPEATER.cooldown;
    placed = true;
  }
} else if (plantType === 'twinsunflower') {
  if (this.spendSun(PLANT_TYPES.TWIN_SUNFLOWER.cost)) {
    const plant = new TwinSunflower(plantX, plantY, star, skin);
    plant.row = row;
    this.addPlant(plant);
    this.plantCooldowns.twinsunflower = PLANT_TYPES.TWIN_SUNFLOWER.cooldown;
    placed = true;
  }
} else if (plantType === 'gatlingpea') {
  if (this.spendSun(PLANT_TYPES.GATLING_PEA.cost)) {
    const plant = new GatlingPea(plantX, plantY, star, skin);
    plant.row = row;
    this.addPlant(plant);
    this.plantCooldowns.gatlingpea = PLANT_TYPES.GATLING_PEA.cooldown;
    placed = true;
  }
}
```

- [ ] **Step 3: spawnZombie 添加 3 个 zombie case**

在 spawnZombie 的 switch/if-else 中添加：

```javascript
if (type === 'flag') {
  const tileCenter = this.lawn.getTileCenter(row, 0);
  const z = new FlagZombie(tileCenter.x, tileCenter.y, row);
  this.addZombie(z);
} else if (type === 'bucket') {
  const tileCenter = this.lawn.getTileCenter(row, 0);
  const z = new BucketZombie(tileCenter.x, tileCenter.y, row);
  this.addZombie(z);
} else if (type === 'clown') {
  const tileCenter = this.lawn.getTileCenter(row, 0);
  const z = new ClownZombie(tileCenter.x, tileCenter.y, row);
  this.addZombie(z);
}
```

- [ ] **Step 4: zombies 更新循环添加小丑死亡钩子**

在僵尸更新循环后添加：

```javascript
// Clown death explosion hook
for (const z of this.zombies) {
  if (z._isClown && !z.alive && !z._exploding && !z._exploded) {
    z.onDeath(this);
  }
}
```

---

### 任务 15: UIManager 图鉴渲染适配

**Files:**
- Modify: `game/js/UIManager.js`

- [ ] **Step 1: 图鉴植物渲染适配新植物**

在植物详情渲染的 switch/函数中，确保新植物类型被正确处理。参照现有 PeaShooter/Sunflower 渲染逻辑，为 `squash`/`jalapeno`/`repeater`/`twinsunflower`/`gatlingpea` 添加对应分支（使用对应的 GIF animator 或 fallback 绘制）。

需在 PlantRenderer 或相关渲染函数中添加对应的 draw 函数名映射。由于新植物复用现有 GIF animator 系统，图鉴渲染应自动通过 `createAnimator` 工作，主要确保 plantType 到 GIF key 的映射正确。

- [ ] **Step 2: 图鉴僵尸渲染适配新僵尸**

类似地，为 `flag`/`bucket`/`clown` 添加僵尸图鉴渲染映射。

---

### 任务 16: 设备卡渲染适配（植物选择面板）

**Files:**
- Modify: `game/js/UIManager.js`（植物卡片渲染相关区域）

- [ ] **Step 1: 确保新植物卡片能正确渲染到战斗选择面板**

新植物 `unlockLevel: '6-1'` 且开发模式下全部解锁，需确认植物选择面板（`renderPlantCards` 或类似函数）能遍历到 `PLANT_DEFS` 中的新条目。现有逻辑基于 `PLANT_DEFS` 遍历，新增后应自动生效。

---

### 实现顺序

任务按依赖关系排列，必须严格按序执行：

```
任务 1 (constants) → 任务 2 (Plant 基类) → 任务 3 (Zombie 基类)
                                              ↓
任务 4 (Asset/index.html) ←──────────────────┘
    ↓
任务 5 (PlantConfig/ZombieConfig)
    ↓
任务 6 (PiercingFirePea Bullet)
    ↓
任务 7-11 (5 种植物) ── 可并行 ──→ 任务 12 (3 种僵尸)
    ↓                                    ↓
任务 13 (WaveManager) ←──────────────────┘
    ↓
任务 14 (Game.js 集成)
    ↓
任务 15-16 (UIManager 图鉴/卡片)
```
