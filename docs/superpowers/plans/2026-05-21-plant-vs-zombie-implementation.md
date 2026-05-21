# Plant vs Zombie 游戏实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可运行的植物大战僵尸风格塔防游戏核心体验版

**Architecture:**
- 使用 Electron 作为桌面应用框架
- HTML5 Canvas 用于游戏渲染
- 原生 JavaScript 实现游戏逻辑，无外部游戏引擎依赖
- 模块化设计：Game 主循环、Plant/Zombie 实体类、UI 组件分离

**Tech Stack:**
- Electron (桌面应用框架)
- HTML5 Canvas (游戏渲染)
- Vanilla JavaScript (游戏逻辑)
- CSS3 (UI 样式)

---

## 项目文件结构

```
mrfzVSzoombie/
├── index.html                    # 游戏入口页面
├── game/
│   ├── js/
│   │   ├── Game.js              # 游戏主循环、状态管理
│   │   ├── constants.js         # 游戏常量（格子大小、行数、列数等）
│   │   ├── Lawn.js               # 草坪/格子系统
│   │   ├── Sun.js                # 阳光资源类
│   │   ├── Plant.js              # 植物基类
│   │   ├── Sunflower.js          # 向日葵类
│   │   ├── PeaShooter.js         # 豌豆射手类
│   │   ├── Zombie.js             # 僵尸基类
│   │   ├── NormalZombie.js       # 普通僵尸类
│   │   ├── ConeZombie.js         # 路障僵尸类
│   │   ├── Bullet.js             # 普通子弹类
│   │   ├── FireBullet.js         # 火焰豌豆类
│   │   ├── Skill.js              # 技能基类
│   │   ├── FirePeaSkill.js       # 火焰豌豆技能
│   │   ├── WaveManager.js        # 波次管理
│   │   ├── GameUI.js             # 游戏 UI
│   │   ├── CollisionManager.js   # 碰撞检测
│   │   └── main.js               # 游戏入口脚本
│   └── css/
│       └── game.css              # 游戏样式
├── electron/
│   ├── main.js                  # Electron 主进程
│   └── preload.js               # 预加载脚本
└── assets/                      # 资源目录（图片、音效等）
```

---

## Phase 1: 项目基础搭建

### Task 1: 初始化 Electron 项目

**Files:**
- Create: `electron/main.js`
- Create: `electron/preload.js`
- Modify: `package.json` (添加 Electron 配置)

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "mrfz-vs-zombie",
  "version": "1.0.0",
  "description": "Plant vs Zombie style tower defense game",
  "main": "electron/main.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron ."
  },
  "devDependencies": {
    "electron": "^28.0.0"
  }
}
```

- [ ] **Step 2: 创建 Electron 主进程**

```javascript
// electron/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
```

- [ ] **Step 3: 创建预加载脚本**

```javascript
// electron/preload.js
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  platform: 'electron'
});
```

- [ ] **Step 4: 更新 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>植物大战僵尸</title>
  <link rel="stylesheet" href="game/css/game.css">
</head>
<body>
  <div id="game-container">
    <div id="game-header">
      <span id="sun-count">☀️ 150</span>
      <span id="wave-info">波次 1</span>
    </div>
    <canvas id="game-canvas"></canvas>
    <div id="game-footer">
      <div class="plant-card" data-plant="sunflower">
        <span>🌻</span>
        <span>50</span>
      </div>
      <div class="plant-card" data-plant="peashooter">
        <span>🫛</span>
        <span>100</span>
      </div>
    </div>
  </div>
  <script src="game/js/main.js" type="module"></script>
</body>
</html>
```

- [ ] **Step 5: 创建基础 CSS**

```css
/* game/css/game.css */
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: #1a1a2e;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
}
#game-container {
  display: flex;
  flex-direction: column;
  border: 3px solid #4ade80;
  border-radius: 12px;
  overflow: hidden;
}
#game-header {
  background: linear-gradient(180deg, #2d3748, #1a202c);
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  color: #fff;
  font-size: 18px;
}
#sun-count { color: #fbbf24; }
#game-canvas {
  display: block;
  background: linear-gradient(180deg, #87CEEB 0%, #90EE90 100%);
}
#game-footer {
  background: #2d3748;
  padding: 10px;
  display: flex;
  gap: 10px;
  justify-content: center;
}
.plant-card {
  background: rgba(255,255,255,0.1);
  border: 2px solid #4ade80;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 24px;
  transition: transform 0.1s;
}
.plant-card:hover { transform: scale(1.05); }
.plant-card span:last-child { font-size: 14px; color: #fbbf24; }
```

- [ ] **Step 6: 安装依赖并测试**

Run: `cd e:/clone/mrfzVSzoombie && npm install`
Run: `cd e:/clone/mrfzVSzoombie && npm start`
Expected: 窗口打开，显示游戏界面

- [ ] **Step 7: 提交**

```bash
git add -A && git commit -m "feat: initialize Electron project with basic game structure"
```

---

### Task 2: 创建游戏常量与草坪系统

**Files:**
- Create: `game/js/constants.js`
- Create: `game/js/Lawn.js`
- Create: `game/js/Game.js` (核心游戏类)

- [ ] **Step 1: 创建游戏常量**

```javascript
// game/js/constants.js
export const GAME_CONFIG = {
  CANVAS_WIDTH: 900,
  CANVAS_HEIGHT: 540,
  LAWN_ROWS: 5,
  LAWN_COLS: 9,
  CELL_WIDTH: 100,
  CELL_HEIGHT: 108,
  FPS: 60
};

export const PLANT_TYPES = {
  SUNFLOWER: { name: 'sunflower', cost: 50, cooldown: 5000 },
  PEASHOOTER: { name: 'peashooter', cost: 100, cooldown: 5000 }
};

export const ZOMBIE_TYPES = {
  NORMAL: { name: 'normal', health: 100, speed: 0.3 },
  CONE: { name: 'cone', health: 200, speed: 0.3 }
};

export const BULLET_CONFIG = {
  PEASHOOTER: { speed: 5, damage: 20 },
  FIRE_PEA: { speed: 7, damage: 50, explosionRadius: 1.5 }
};

export const SUN_CONFIG = {
  INITIAL: 150,
  SUNFLOWER_INTERVAL: 7000,
  SUN_VALUE: 25
};
```

- [ ] **Step 2: 创建草坪系统**

```javascript
// game/js/Lawn.js
import { GAME_CONFIG } from './constants.js';

export class Lawn {
  constructor() {
    this.rows = GAME_CONFIG.LAWN_ROWS;
    this.cols = GAME_CONFIG.LAWN_COLS;
    this.cellWidth = GAME_CONFIG.CELL_WIDTH;
    this.cellHeight = GAME_CONFIG.CELL_HEIGHT;
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
  }

  canPlant(row, col) {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols && !this.grid[row][col];
  }

  plant(row, col, plant) {
    if (this.canPlant(row, col)) {
      this.grid[row][col] = plant;
      plant.row = row;
      plant.col = col;
      plant.x = col * this.cellWidth;
      plant.y = row * this.cellHeight;
      return true;
    }
    return false;
  }

  removePlant(row, col) {
    const plant = this.grid[row][col];
    this.grid[row][col] = null;
    return plant;
  }

  getPlant(row, col) {
    return this.grid[row][col];
  }

  getCellFromPosition(x, y) {
    const col = Math.floor(x / this.cellWidth);
    const row = Math.floor(y / this.cellHeight);
    return { row, col };
  }

  render(ctx) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = col * this.cellWidth;
        const y = row * this.cellHeight;
        ctx.strokeRect(x, y, this.cellWidth, this.cellHeight);
      }
    }
  }
}
```

- [ ] **Step 3: 创建游戏主类**

```javascript
// game/js/Game.js
import { GAME_CONFIG, SUN_CONFIG } from './constants.js';
import { Lawn } from './Lawn.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = GAME_CONFIG.CANVAS_WIDTH;
    this.canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
    this.lawn = new Lawn();
    this.plants = [];
    this.zombies = [];
    this.bullets = [];
    this.suns = [];
    this.sun = SUN_CONFIG.INITIAL;
    this.wave = 1;
    this.isRunning = false;
    this.lastTime = 0;
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  gameLoop() {
    if (!this.isRunning) return;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.update(deltaTime);
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }

  update(deltaTime) {
    // 植物更新
    this.plants.forEach(plant => plant.update(deltaTime, this));
    // 子弹更新
    this.bullets = this.bullets.filter(bullet => {
      bullet.update(deltaTime);
      return bullet.x < GAME_CONFIG.CANVAS_WIDTH;
    });
    // 僵尸更新
    this.zombies.forEach(zombie => zombie.update(deltaTime, this));
    // 阳光更新
    this.suns = this.suns.filter(sun => {
      sun.update(deltaTime);
      return sun.active;
    });
    // 碰撞检测
    this.checkCollisions();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.lawn.render(this.ctx);
    this.plants.forEach(plant => plant.render(this.ctx));
    this.bullets.forEach(bullet => bullet.render(this.ctx));
    this.zombies.forEach(zombie => zombie.render(this.ctx));
    this.suns.forEach(sun => sun.render(this.ctx));
  }

  checkCollisions() {
    // 碰撞检测逻辑
  }

  addPlant(plant) {
    this.plants.push(plant);
  }

  addZombie(zombie) {
    this.zombies.push(zombie);
  }

  addBullet(bullet) {
    this.bullets.push(bullet);
  }

  addSun(sun) {
    this.suns.push(sun);
  }

  collectSun(value) {
    this.sun += value;
    this.updateSunDisplay();
  }

  spendSun(value) {
    if (this.sun >= value) {
      this.sun -= value;
      this.updateSunDisplay();
      return true;
    }
    return false;
  }

  updateSunDisplay() {
    const sunElement = document.getElementById('sun-count');
    if (sunElement) sunElement.textContent = `☀️ ${this.sun}`;
  }

  updateWaveDisplay() {
    const waveElement = document.getElementById('wave-info');
    if (waveElement) waveElement.textContent = `波次 ${this.wave}`;
  }
}
```

- [ ] **Step 4: 创建游戏入口脚本**

```javascript
// game/js/main.js
import { Game } from './Game.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const game = new Game(canvas);
  game.start();
  window.game = game;
});
```

- [ ] **Step 5: 测试运行**

Run: `cd e:/clone/mrfzVSzoombie && npm start`
Expected: Canvas 渲染 5x9 网格草坪，标题栏显示阳光数量和波次

- [ ] **Step 6: 提交**

```bash
git add -A && git commit -m "feat: add constants, lawn grid system and core game loop"
```

---

## Phase 2: 植物系统

### Task 3: 实现向日葵

**Files:**
- Create: `game/js/Plant.js` (植物基类)
- Create: `game/js/Sunflower.js` (向日葵)

- [ ] **Step 1: 创建植物基类**

```javascript
// game/js/Plant.js
import { GAME_CONFIG } from './constants.js';

export class Plant {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = GAME_CONFIG.CELL_WIDTH;
    this.height = GAME_CONFIG.CELL_HEIGHT;
    this.health = 100;
    this.maxHealth = 100;
    this.alive = true;
  }

  update(deltaTime, game) {
    // 子类实现
  }

  render(ctx) {
    // 子类实现
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.alive = false;
    }
  }
}
```

- [ ] **Step 2: 创建向日葵类**

```javascript
// game/js/Sunflower.js
import { Plant } from './Plant.js';
import { Sun } from './Sun.js';
import { SUN_CONFIG } from './constants.js';

export class Sunflower extends Plant {
  constructor(x, y) {
    super(x, y);
    this.sunTimer = 0;
    this.sunInterval = SUN_CONFIG.SUNFLOWER_INTERVAL;
  }

  update(deltaTime, game) {
    this.sunTimer += deltaTime;
    if (this.sunTimer >= this.sunInterval) {
      this.sunTimer = 0;
      const sunX = this.x + Math.random() * 50;
      const sunY = this.y + Math.random() * 30;
      game.addSun(new Sun(sunX, sunY));
    }
  }

  render(ctx) {
    ctx.font = '50px Arial';
    ctx.fillText('🌻', this.x + 20, this.y + 70);
    // 血条
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(this.x + 10, this.y + 5, 80 * healthPercent, 5);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(this.x + 10, this.y + 5, 80, 5);
  }
}
```

- [ ] **Step 3: 更新 Game.js 添加向日葵创建逻辑**

```javascript
// game/js/Game.js - 添加 handlePlantClick 方法
import { Sunflower } from './Sunflower.js';
import { PeaShooter } from './PeaShooter.js';

export class Game {
  // ... 现有代码 ...

  handlePlantClick(x, y, plantType) {
    const { row, col } = this.lawn.getCellFromPosition(x, y);
    if (!this.lawn.canPlant(row, col)) return false;

    const plantX = col * this.cellWidth;
    const plantY = row * this.cellHeight;

    if (plantType === 'sunflower') {
      if (this.spendSun(50)) {
        const sunflower = new Sunflower(plantX, plantY);
        this.lawn.plant(row, col, sunflower);
        this.addPlant(sunflower);
        return true;
      }
    } else if (plantType === 'peashooter') {
      if (this.spendSun(100)) {
        const peashooter = new PeaShooter(plantX, plantY);
        this.lawn.plant(row, col, peashooter);
        this.addPlant(peashooter);
        return true;
      }
    }
    return false;
  }
}
```

- [ ] **Step 4: 更新 main.js 添加点击事件**

```javascript
// game/js/main.js
import { Game } from './Game.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const game = new Game(canvas);
  let selectedPlant = null;

  const plantCards = document.querySelectorAll('.plant-card');
  plantCards.forEach(card => {
    card.addEventListener('click', () => {
      const plantType = card.dataset.plant;
      if (selectedPlant === plantType) {
        selectedPlant = null;
        card.style.borderColor = '#4ade80';
      } else {
        plantCards.forEach(c => c.style.borderColor = '#4ade80');
        selectedPlant = plantType;
        card.style.borderColor = '#fbbf24';
      }
    });
  });

  canvas.addEventListener('click', (e) => {
    if (selectedPlant && window.game) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      window.game.handlePlantClick(x, y, selectedPlant);
    }
  });

  game.start();
  window.game = game;
});
```

- [ ] **Step 5: 测试向日葵功能**

Run: `cd e:/clone/mrfzVSzoombie && npm start`
Expected: 点击向日葵卡片，再点击草坪格子，可种植向日葵；向日葵定时生成阳光

- [ ] **Step 6: 提交**

```bash
git add -A && git commit -m "feat: implement Sunflower plant with sun production"
```

---

### Task 4: 实现豌豆射手

**Files:**
- Create: `game/js/PeaShooter.js`
- Create: `game/js/Bullet.js`
- Modify: `game/js/Game.js` (添加子弹碰撞检测)

- [ ] **Step 1: 创建豌豆射手类**

```javascript
// game/js/PeaShooter.js
import { Plant } from './Plant.js';
import { Bullet } from './Bullet.js';
import { BULLET_CONFIG } from './constants.js';

export class PeaShooter extends Plant {
  constructor(x, y) {
    super(x, y);
    this.shootTimer = 0;
    this.shootInterval = 1500;
    this.skillCooldown = 0;
    this.skillMaxCooldown = 10000;
    this.isSkillActive = false;
    this.skillDuration = 2000;
    this.skillTimer = 0;
  }

  update(deltaTime, game) {
    // 检查前方是否有僵尸
    const hasZombieAhead = game.zombies.some(z => z.row === this.row && z.x > this.x);

    if (hasZombieAhead) {
      this.shootTimer += deltaTime;
      if (this.shootTimer >= this.shootInterval) {
        this.shootTimer = 0;
        const bullet = new Bullet(this.x + 80, this.y + 40, this.row);
        game.addBullet(bullet);
      }
    }

    // 技能冷却
    if (this.skillCooldown > 0) {
      this.skillCooldown -= deltaTime;
    }

    // 技能持续时间
    if (this.isSkillActive) {
      this.skillTimer -= deltaTime;
      if (this.skillTimer <= 0) {
        this.isSkillActive = false;
      }
    }
  }

  useSkill(game) {
    if (this.skillCooldown <= 0) {
      this.skillCooldown = this.skillMaxCooldown;
      this.isSkillActive = true;
      this.skillTimer = this.skillDuration;
      const fireBullet = new FireBullet(this.x + 80, this.y + 40, this.row);
      game.addBullet(fireBullet);
      return true;
    }
    return false;
  }

  render(ctx) {
    const emoji = this.isSkillActive ? '🔥' : '🫛';
    ctx.font = '50px Arial';
    ctx.fillText(emoji, this.x + 20, this.y + 70);

    // 血条
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(this.x + 10, this.y + 5, 80 * healthPercent, 5);

    // 技能冷却指示
    if (this.skillCooldown > 0) {
      const cooldownPercent = this.skillCooldown / this.skillMaxCooldown;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(this.x + 10, this.y + 95, 80 * cooldownPercent, 5);
    } else {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(this.x + 10, this.y + 95, 80, 5);
    }
  }
}
```

- [ ] **Step 2: 创建子弹类**

```javascript
// game/js/Bullet.js
import { BULLET_CONFIG } from './constants.js';

export class Bullet {
  constructor(x, y, row) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.speed = BULLET_CONFIG.PEASHOOTER.speed;
    this.damage = BULLET_CONFIG.PEASHOOTER.damage;
    this.width = 20;
    this.height = 20;
    this.active = true;
  }

  update(deltaTime) {
    this.x += this.speed * (deltaTime / 16);
  }

  render(ctx) {
    ctx.font = '20px Arial';
    ctx.fillText('🟢', this.x, this.y + 15);
  }
}
```

- [ ] **Step 3: 更新碰撞检测**

```javascript
// game/js/Game.js - 更新 checkCollisions 方法
checkCollisions() {
  // 子弹与僵尸碰撞
  this.bullets.forEach(bullet => {
    if (!bullet.active) return;
    this.zombies.forEach(zombie => {
      if (zombie.row === bullet.row) {
        const dx = bullet.x - zombie.x;
        if (dx > -20 && dx < 50) {
          bullet.active = false;
          zombie.takeDamage(bullet.damage);
        }
      }
    });
  });

  // 清理
  this.bullets = this.bullets.filter(b => b.active);
  this.zombies = this.zombies.filter(z => z.alive);
  this.plants = this.plants.filter(p => p.alive);
}
```

- [ ] **Step 4: 测试豌豆射手**

Run: `cd e:/clone/mrfzVSzoombie && npm start`
Expected: 豌豆射手在僵尸靠近时自动发射豌豆子弹

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "feat: implement PeaShooter with auto-attack and bullet system"
```

---

## Phase 3: 僵尸系统

### Task 5: 实现僵尸基类和普通僵尸

**Files:**
- Create: `game/js/Zombie.js`
- Create: `game/js/NormalZombie.js`

- [ ] **Step 1: 创建僵尸基类**

```javascript
// game/js/Zombie.js
import { GAME_CONFIG } from './constants.js';

export class Zombie {
  constructor(x, y, row) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.width = 60;
    this.height = 80;
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 0.3;
    this.damage = 10;
    this.alive = true;
    this.attacking = false;
    this.targetPlant = null;
  }

  update(deltaTime, game) {
    // 寻找前方的植物
    const plantInFront = game.plants.find(p =>
      p.row === this.row &&
      p.x < this.x + 100 &&
      p.x > this.x - 20
    );

    if (plantInFront) {
      this.attacking = true;
      this.targetPlant = plantInFront;
      this.attack(deltaTime);
    } else {
      this.attacking = false;
      this.targetPlant = null;
      this.x -= this.speed * (deltaTime / 16);
    }

    // 移除死亡的僵尸
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  attack(deltaTime) {
    if (this.targetPlant) {
      this.targetPlant.takeDamage(this.damage * (deltaTime / 1000));
    }
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  render(ctx) {
    const emoji = this.health > 100 ? '🚧' : '🧟';
    ctx.font = '50px Arial';
    ctx.fillText(emoji, this.x, this.y + 50);

    // 血条
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x + 5, this.y - 5, 50 * healthPercent, 5);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(this.x + 5, this.y - 5, 50, 5);
  }
}
```

- [ ] **Step 2: 创建普通僵尸**

```javascript
// game/js/NormalZombie.js
import { Zombie } from './Zombie.js';
import { ZOMBIE_TYPES } from './constants.js';

export class NormalZombie extends Zombie {
  constructor(x, y, row) {
    super(x, y, row);
    this.health = ZOMBIE_TYPES.NORMAL.health;
    this.maxHealth = ZOMBIE_TYPES.NORMAL.health;
    this.speed = ZOMBIE_TYPES.NORMAL.speed;
    this.type = 'normal';
  }
}
```

- [ ] **Step 3: 创建路障僵尸**

```javascript
// game/js/ConeZombie.js
import { Zombie } from './Zombie.js';
import { ZOMBIE_TYPES } from './constants.js';

export class ConeZombie extends Zombie {
  constructor(x, y, row) {
    super(x, y, row);
    this.health = ZOMBIE_TYPES.CONE.health;
    this.maxHealth = ZOMBIE_TYPES.CONE.health;
    this.speed = ZOMBIE_TYPES.CONE.speed;
    this.type = 'cone';
  }
}
```

- [ ] **Step 4: 更新 Game.js 添加僵尸生成**

```javascript
// game/js/Game.js - 添加 spawnZombie 方法
import { NormalZombie } from './NormalZombie.js';
import { ConeZombie } from './ConeZombie.js';

export class Game {
  // ... 现有代码 ...

  spawnZombie(type = 'normal') {
    const row = Math.floor(Math.random() * 5);
    const x = GAME_CONFIG.CANVAS_WIDTH;
    const y = row * GAME_CONFIG.CELL_HEIGHT;

    const zombie = type === 'cone'
      ? new ConeZombie(x, y, row)
      : new NormalZombie(x, y, row);

    this.addZombie(zombie);
  }
}
```

- [ ] **Step 5: 测试僵尸生成**

Run: `cd e:/clone/mrfzVSzoombie && npm start`
Run (在控制台): `window.game.spawnZombie('normal')`
Expected: 僵尸从右侧出现并向左移动

- [ ] **Step 6: 提交**

```bash
git add -A && git commit -m "feat: implement Zombie base class and Normal/Cone zombie types"
```

---

## Phase 4: 技能系统

### Task 6: 实现火焰豌豆技能

**Files:**
- Create: `game/js/FireBullet.js`
- Create: `game/js/Skill.js`
- Create: `game/js/FirePeaSkill.js`
- Modify: `game/js/PeaShooter.js` (已在上方更新)
- Modify: `game/js/Game.js` (更新碰撞检测支持范围伤害)

- [ ] **Step 1: 创建火焰豌豆类**

```javascript
// game/js/FireBullet.js
import { BULLET_CONFIG } from './constants.js';

export class FireBullet {
  constructor(x, y, row) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.speed = BULLET_CONFIG.FIRE_PEA.speed;
    this.damage = BULLET_CONFIG.FIRE_PEA.damage;
    this.explosionRadius = BULLET_CONFIG.FIRE_PEA.explosionRadius;
    this.width = 25;
    this.height = 25;
    this.active = true;
    this.exploded = false;
  }

  update(deltaTime, game) {
    if (this.exploded) {
      this.active = false;
      return;
    }

    this.x += this.speed * (deltaTime / 16);

    // 检查是否碰到僵尸
    const hitZombie = game.zombies.find(z =>
      z.row === this.row &&
      z.x < this.x + 30 &&
      z.x > this.x - 30
    );

    if (hitZombie) {
      this.explode(game);
    }

    // 超出屏幕
    if (this.x > game.canvas.width) {
      this.active = false;
    }
  }

  explode(game) {
    this.exploded = true;
    this.active = false;

    const centerX = this.x;
    const centerY = this.y;

    // 3x3 范围伤害
    const cellWidth = 100;
    const cellHeight = 108;
    const centerCol = Math.floor(centerX / cellWidth);
    const centerRow = this.row;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const targetRow = centerRow + dr;
        const targetCol = centerCol + dc;

        // 伤害该格子内的所有僵尸
        game.zombies.forEach(zombie => {
          if (zombie.row === targetRow) {
            const zombieCol = Math.floor(zombie.x / cellWidth);
            if (Math.abs(zombieCol - targetCol) <= 1) {
              zombie.takeDamage(this.damage);
            }
          }
        });

        // 伤害该格子内的植物
        game.plants.forEach(plant => {
          if (plant.row === targetRow) {
            const plantCol = Math.floor(plant.x / cellWidth);
            if (Math.abs(plantCol - targetCol) <= 1) {
              plant.takeDamage(this.damage * 0.5);
            }
          }
        });
      }
    }
  }

  render(ctx) {
    ctx.font = '25px Arial';
    ctx.fillText('🔥', this.x - 5, this.y + 15);

    // 爆炸特效
    if (this.exploded) {
      ctx.font = '40px Arial';
      ctx.fillText('💥', this.x - 20, this.y + 25);
    }
  }
}
```

- [ ] **Step 2: 更新 Game.js 支持火焰豌豆**

```javascript
// game/js/Game.js - 更新 import 和碰撞检测
import { FireBullet } from './FireBullet.js';

export class Game {
  // ... 现有代码 ...

  checkCollisions() {
    // 普通子弹与僵尸碰撞
    this.bullets.forEach(bullet => {
      if (!bullet.active || bullet instanceof FireBullet) return;
      this.zombies.forEach(zombie => {
        if (zombie.row === bullet.row) {
          const dx = bullet.x - zombie.x;
          if (dx > -20 && dx < 50) {
            bullet.active = false;
            zombie.takeDamage(bullet.damage);
          }
        }
      });
    });

    // 火焰豌豆碰撞和爆炸
    this.bullets.forEach(bullet => {
      if (bullet instanceof FireBullet) {
        bullet.update(16, this);
      }
    });

    // 清理
    this.bullets = this.bullets.filter(b => b.active);
    this.zombies = this.zombies.filter(z => z.alive);
    this.plants = this.plants.filter(p => p.alive);
  }
}
```

- [ ] **Step 3: 测试火焰豌豆技能**

Run: `cd e:/clone/mrfzVSzoombie && npm start`
Expected: 点击豌豆射手可释放火焰豌豆，触碰僵尸后产生爆炸

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "feat: implement Fire Pea skill with 3x3 explosion damage"
```

---

## Phase 5: 波次系统与阳光系统

### Task 7: 实现阳光系统和波次管理

**Files:**
- Create: `game/js/Sun.js`
- Create: `game/js/WaveManager.js`
- Modify: `game/js/Game.js`

- [ ] **Step 1: 创建阳光类**

```javascript
// game/js/Sun.js
export class Sun {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.targetY = y + 50;
    this.width = 40;
    this.height = 40;
    this.active = true;
    this.lifetime = 10000;
    this.timer = 0;
    this.falling = true;
    this.collected = false;
  }

  update(deltaTime) {
    this.timer += deltaTime;

    if (this.falling) {
      this.y += 1;
      if (this.y >= this.targetY) {
        this.falling = false;
      }
    }

    if (this.timer >= this.lifetime) {
      this.active = false;
    }
  }

  collect() {
    this.active = false;
    return 25;
  }

  render(ctx) {
    ctx.font = '35px Arial';
    ctx.fillText('☀️', this.x, this.y + 25);
  }
}
```

- [ ] **Step 2: 创建波次管理器**

```javascript
// game/js/WaveManager.js
export class WaveManager {
  constructor(game) {
    this.game = game;
    this.wave = 1;
    this.zombiesToSpawn = 0;
    this.spawnInterval = 3000;
    this.lastSpawnTime = 0;
    this.waveComplete = true;
    this.zombiesInWave = 3;
  }

  update(deltaTime, currentTime) {
    if (this.waveComplete) {
      this.startNextWave();
    }

    if (this.zombiesToSpawn > 0 && currentTime - this.lastSpawnTime >= this.spawnInterval) {
      this.lastSpawnTime = currentTime;
      this.zombiesToSpawn--;
      const type = Math.random() < 0.3 ? 'cone' : 'normal';
      this.game.spawnZombie(type);
    }

    // 检测波次完成
    if (this.zombiesToSpawn === 0 && this.game.zombies.length === 0) {
      this.waveComplete = true;
    }
  }

  startNextWave() {
    this.wave++;
    this.zombiesInWave = 3 + this.wave * 2;
    this.zombiesToSpawn = this.zombiesInWave;
    this.spawnInterval = Math.max(1000, 3000 - this.wave * 100);
    this.waveComplete = false;
    this.game.updateWaveDisplay();
  }
}
```

- [ ] **Step 3: 更新 Game.js 集成波次管理器**

```javascript
// game/js/Game.js - 添加 WaveManager
import { WaveManager } from './WaveManager.js';

export class Game {
  constructor(canvas) {
    // ... 现有初始化 ...
    this.waveManager = new WaveManager(this);
  }

  update(deltaTime) {
    const currentTime = performance.now();

    // 波次更新
    this.waveManager.update(deltaTime, currentTime);

    // 植物更新
    this.plants.forEach(plant => plant.update(deltaTime, this));

    // 子弹更新
    this.bullets = this.bullets.filter(bullet => {
      if (bullet instanceof FireBullet) {
        bullet.update(deltaTime, this);
      } else {
        bullet.update(deltaTime);
      }
      return bullet.active;
    });

    // 僵尸更新
    this.zombies.forEach(zombie => zombie.update(deltaTime, this));

    // 阳光更新
    this.suns = this.suns.filter(sun => {
      sun.update(deltaTime);
      return sun.active;
    });

    // 碰撞检测
    this.checkCollisions();

    // 游戏结束检测
    this.checkGameOver();
  }

  checkGameOver() {
    const reachedLeft = this.zombies.some(z => z.x < 10);
    if (reachedLeft) {
      this.isRunning = false;
      alert('游戏结束！僵尸入侵了你的院子！');
    }
  }
}
```

- [ ] **Step 4: 更新点击事件支持阳光收集**

```javascript
// game/js/main.js - 更新点击事件
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 检查是否点击阳光
  if (window.game) {
    for (const sun of window.game.suns) {
      const dx = x - sun.x;
      const dy = y - sun.y;
      if (dx > -20 && dx < 40 && dy > -20 && dy < 40) {
        const value = sun.collect();
        window.game.collectSun(value);
        return;
      }
    }
  }

  // 检查是否点击植物卡片
  if (selectedPlant && window.game) {
    window.game.handlePlantClick(x, y, selectedPlant);
  }
});
```

- [ ] **Step 5: 测试完整流程**

Run: `cd e:/clone/mrfzVSzoombie && npm start`
Expected:
- 游戏自动开始波次
- 僵尸从右侧入侵
- 阳光可点击收集
- 向日葵产阳光
- 豌豆射手攻击
- 波次逐渐增加

- [ ] **Step 6: 提交**

```bash
git add -A && git commit -m "feat: implement Sun collection, WaveManager and game loop integration"
```

---

## Phase 6: 完善与打包

### Task 8: 完善技能释放交互

**Files:**
- Modify: `game/js/main.js`

- [ ] **Step 1: 添加技能释放交互**

```javascript
// game/js/main.js - 添加技能释放
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 检查是否点击阳光
  if (window.game) {
    for (const sun of window.game.suns) {
      const dx = x - sun.x;
      const dy = y - sun.y;
      if (dx > -20 && dx < 40 && dy > -20 && dy < 40) {
        const value = sun.collect();
        window.game.collectSun(value);
        return;
      }
    }

    // 检查是否点击豌豆射手释放技能
    for (const plant of window.game.plants) {
      if (plant.constructor.name === 'PeaShooter') {
        const px = plant.x;
        const py = plant.y;
        const dx = x - px;
        const dy = y - py;
        if (dx > -10 && dx < 90 && dy > -10 && dy < 100) {
          plant.useSkill(window.game);
          return;
        }
      }
    }
  }

  // 检查是否点击植物卡片
  if (selectedPlant && window.game) {
    window.game.handlePlantClick(x, y, selectedPlant);
  }
});

// 添加键盘快捷键
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && window.game) {
    e.preventDefault();
    for (const plant of window.game.plants) {
      if (plant.constructor.name === 'PeaShooter') {
        plant.useSkill(window.game);
        break;
      }
    }
  }
});
```

- [ ] **Step 2: 测试技能释放**

Run: `cd e:/clone/mrfzVSzoombie && npm start`
Expected: 点击豌豆射手或按空格键释放火焰豌豆技能

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "feat: add skill release interaction with mouse click and keyboard"
```

---

### Task 9: Electron 打包配置

**Files:**
- Modify: `package.json`
- Create: `build.js` (打包脚本)

- [ ] **Step 1: 更新 package.json 添加打包脚本**

```json
{
  "name": "mrfz-vs-zombie",
  "version": "1.0.0",
  "description": "Plant vs Zombie style tower defense game",
  "main": "electron/main.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron .",
    "build": "electron-builder --win portable",
    "build:installer": "electron-builder --win nsis"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.0.0"
  },
  "build": {
    "appId": "com.mrfz.vszombie",
    "productName": "植物大战僵尸",
    "win": {
      "target": ["portable"],
      "icon": "assets/icon.ico"
    }
  }
}
```

- [ ] **Step 2: 创建资源目录**

Run: `mkdir -p e:/clone/mrfzVSzoombie/assets`

- [ ] **Step 3: 测试开发模式**

Run: `cd e:/clone/mrfzVSzoombie && npm start`
Expected: Electron 应用正常启动

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "chore: add Electron build configuration"
```

---

## 实施检查清单

- [ ] Task 1: Electron 项目初始化
- [ ] Task 2: 游戏常量与草坪系统
- [ ] Task 3: 向日葵实现
- [ ] Task 4: 豌豆射手实现
- [ ] Task 5: 僵尸系统
- [ ] Task 6: 火焰豌豆技能
- [ ] Task 7: 阳光和波次系统
- [ ] Task 8: 技能释放交互
- [ ] Task 9: Electron 打包配置

---

## 预期成果

完成所有任务后，您将拥有一个：
- ✅ 可在 Windows 上运行的桌面游戏
- ✅ 包含向日葵和豌豆射手两种植物
- ✅ 包含普通僵尸和路障僵尸
- ✅ 具有火焰豌豆技能（3x3 范围爆炸）
- ✅ 无限波次挑战模式
- ✅ 可打包为独立 .exe 文件
