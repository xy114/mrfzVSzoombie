# 小推车系统设计规格

## 概述

新增小推车（Lawn Mower）系统——开局自动部署在每行最左侧，僵尸突破防线时自动触发清场。支持原皮和火陈皮肤。

---

## 1. 架构决策

**Cart 继承 Plant**，复用图鉴/皮肤/仓库体系。推车本质是"一次性、自动触发"的防御单位，放在 Plant 体系中最自然。

| 推车特有行为 | 处理方式 |
|-------------|---------|
| 不开局手动放置 | 重写部署逻辑，由 Game 自动创建 |
| 无生命值 | `takeDamage()` 空操作，`health = 0` |
| 无需阳光消耗 | `cost = 0` |
| 不在底部栏出现 | 底部栏基于 `PLANT_DEFS` 筛选（排除 cart 类型）或 cart 自身不注册战斗 presence |

**Dragon 为独立实体**，类似 Bullet 但尺寸巨大、碰撞全图。

---

## 2. 文件变更

### 新建

| 文件 | 职责 |
|------|------|
| `game/js/Cart.js` | Cart 类（extends Plant），状态机、触发、移动、渲染 |
| `game/js/Dragon.js` | Dragon 类，火陈专属，全图碰撞、翻转渲染 |

### 修改

| 文件 | 变更 |
|------|------|
| `PlantConfig.js` | `PLANT_DEFS` 新增 `cart`；`SKIN_DEFS` 新增 `cart`（原皮 + 火陈） |
| `AssetManager.js` | 注册推车相关图片/GIF 路径 |
| `Game.js` | 新增 `carts[]`、`dragons[]`；开局部署；更新/渲染/推车触发 |
| `index.html` | GIF manifest 新增 `fireChen_combat`、`fireChen_attack`、`dragon` |

### 无需修改

- `UIManager.js` — 图鉴基于配置自动生成
- `Lawn.js` — 推车不占格子
- `main.js` — 选卡/底部栏自动排除 cart

---

## 3. Cart 状态机

```
IDLE ──(僵尸触发)──→ LAUNCHING ──(动画结束)──→ TRAVELING ──(驶出屏幕)──→ DONE
```

| 状态 | 行为 | 渲染 |
|------|------|------|
| `IDLE` | 静止等待，检测同行僵尸是否越过右边缘 | 火陈：combat GIF（循环）；原皮：静态 PNG |
| `LAUNCHING` | 仅火陈：播放 attack GIF，~500ms 时生成 Dragon | attack GIF（单次） |
| `TRAVELING` | 向右行驶 speed=5，穿透碰撞同行僵尸，致死 | 火陈：combat GIF；原皮：静态 PNG |
| `DONE` | 标记 inactive，等待 Game 清理 | 无（火陈随龙消失） |

- **原皮**：无 LAUNCHING 阶段，IDLE → 直接 TRAVELING
- **火陈消失时机**：龙 `active = false` → 火陈 `alive = false`

### 关键属性

```javascript
class Cart extends Plant {
  row;              // 所属行 (0-4)
  x, y;             // 位置（初始：第0列左侧）
  width;            // 原皮=100 (plant)；火陈=125 (humanoid)，遵循基础设定
  speed = 5;        // 行驶速度
  state;            // 'idle' | 'launching' | 'traveling' | 'done'
  skinId;           // 'default' | 'fireChen'
  _attackTimer;     // LAUNCHING 阶段计时器
  _dragonSpawned;   // 是否已生成龙
  _combatAnimator;  // 战斗 GIF（火陈）
  _attackAnimator;  // 攻击 GIF（火陈，单次播放）

  update(deltaTime, game) { ... }
  render(ctx) { ... }
  takeDamage(d) {}       // 空操作——推车不可被攻击
  getBodyType() { return this.skinId === 'fireChen' ? 'humanoid' : 'plant'; }
  getRenderSize() { return 80; }  // 遵循基础设定
}
```
- 高度由 `getRenderSize()` 结合资源宽高比自动计算，遵循 GIF 渲染规则（等比缩放至相同宽度）

---

## 4. Dragon 类

### 属性

```javascript
class Dragon {
  row;                    // 由火陈所在行决定
  x;                      // 初始：-(1300 - 龙头露出部分)，只露龙头
  y;                      // 垂直居中
  width = 1300;           // 渲染宽度
  height = 300;           // 渲染高度
  speed = 5;
  active = true;
  _animator;              // GifAnimator(dragon)，水平翻转渲染
}
```

### 龙体参数

- GIF 原始尺寸：1382×300
- 渲染尺寸：1300×300
- 龙在渲染画面中的实际宽度约 550px（其余为透明区域），其中龙头宽度约占 30%（~165px），龙身占 70%
- GIF 翻转后龙头朝右（位于龙身右端）
- 初始 X：`-(width - 龙头露出宽度)`，使龙头刚好露出画布左边缘
  - 龙头露出 ~180px → 初始 `x = -1120`

### 碰撞

- **全图检测**：不按行过滤，遍历所有活跃僵尸
- 碰撞盒重叠即致死（物理伤害 `damage = Infinity`，或直接 `zombie.alive = false`）
- 穿透——一只龙清掉所有碰到的僵尸

### 渲染

```javascript
render(ctx) {
  const frame = this._animator.getCurrentCanvas();
  ctx.save();
  ctx.translate(this.x + this.width, this.y);  // 移到翻转锚点
  ctx.scale(-1, 1);                             // 水平翻转
  ctx.drawImage(frame, 0, 0, this.width, this.height);
  ctx.restore();
}
```

GIF 原本龙向左移动，翻转后变为向右移动。

### 消失时机

`x > CANVAS_WIDTH` → `active = false` → 通知对应火陈 `alive = false`

---

## 5. 交互时序（火陈）

```
时间线 (ms)      事件
────────────────────────────────────────────
0                僵尸越过推车右边缘 → 触发
                 状态: IDLE → LAUNCHING
                 播放 fireChen_attack GIF

500              GIF 约第30帧
                 生成 Dragon 实例（只露龙头在画面左侧）

1000             攻击动画结束
                 火陈留在原地（播放 combat 待机 GIF）

~4000-5000       龙驶出右边界
                 Dragon.active = false
                 火陈 alive = false
                 两者一起消失
```

---

## 6. Game.js 集成

### 新增数组

```javascript
this.carts = [];      // Cart[]
this.dragons = [];    // Dragon[]
```

### 开局部署

```javascript
initCarts() {
  const skinId = this.playerData.equippedSkins?.cart || 'default';
  for (let row = 0; row < LAWN_ROWS; row++) {
    const cart = new Cart(row, skinId);
    // x 位置：该行第0列格子中心左侧
    const tileCenter = this.lawn.getTileCenter(row, 0);
    cart.x = tileCenter[0] - CELL_WIDTH * 0.8;  // 格子左侧适当偏移
    cart.y = tileCenter[1] - cart.height / 2;
    this.carts.push(cart);
  }
}
```

### 更新循环

在植物更新之后、子弹更新之前插入：

```javascript
// 推车 & 龙更新
this.carts.forEach(c => c.update(scaledDelta, this));
this.dragons.forEach(d => d.update(scaledDelta, this));
// 清理
this.carts = this.carts.filter(c => c.alive);
this.dragons = this.dragons.filter(d => d.active);
```

### 渲染

- 推车：植物渲染层（同行植物之前）
- 龙：推车之后、僵尸之前（或特效层）

### 推车触发检测

在 `Cart.update()` 中：遍历同行僵尸，若僵尸中心 X <= 推车右边缘 X → 触发。

---

## 7. PlantConfig 图鉴

### PLANT_DEFS

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

### SKIN_DEFS

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

## 8. 资源路径

### AssetManager 图片注册

遵循 `{unitId}_skin_{skinId}_{resourceType}` 命名规范：

| Key | 路径 |
|-----|------|
| `cart_skin_default_combat` | `resources/tools/小推车.png` |
| `cart_skin_fireChen_combat` | `resources/special/火陈-screentogif-ps.gif` |
| `cart_skin_fireChen_portrait` | `resources/special/火陈立绘.png` |
| `cart_skin_fireChen_headshot` | `resources/special/火陈立绘_大头像.png` |

- 原皮仅需 combat（战斗形象），portrait/headshot 缺失时按基础设定降级（headshot → portrait → combat）

### GIF Manifest（index.html）

| Key | 源文件 | 用途 |
|-----|--------|------|
| `fireChen_combat` | `resources/special/火陈-screentogif-ps.gif` | 战斗待机（循环） |
| `fireChen_attack` | `resources/special/火陈-attack-screentogif.gif` | 攻击动画（单次） |
| `dragon` | `resources/special/dragon-screentogif-ps.gif` | 龙飞行（循环，翻转） |

---

## 9. 关键数值汇总

| 参数 | 值 |
|------|-----|
| 原皮推车 bodyType | plant |
| 原皮推车 width | 100（= CELL_WIDTH） |
| 火陈 bodyType | humanoid |
| 火陈 width | 125 |
| 推车 getRenderSize() | 80 |
| 推车 speed | 5 |
| 龙渲染尺寸 | 1300×300 |
| 龙身实际宽度 | ~550px（在 1300px 渲染区域中） |
| 龙头宽度 | ~30%（~165px） |
| 龙头露出宽度 | ~180px |
| 龙初始 X | ~ -1120 |
| 龙 speed | 5 |
| 龙碰撞范围 | 全图 |
| 火陈攻击动画时长 | ~1000ms（~60帧） |
| 龙生成时机 | 攻击动画 ~500ms（第30帧） |
| 火陈皮肤价格 | 15000 晶核 |
| 原皮解锁 | 开局即解锁 |
