# 植物 & 投射物 GIF 动画系统 — 设计文档

## 背景

僵尸 GIF 动画系统已完工（2026-05-27），`GifAnimator`、`window.__gifManifest`、`DeathEffect` 等基础设施成熟可用。现在将同一套模式应用到植物和投射物，替换静态首帧渲染为完整 GIF 动画。

## 范围

- **植物（4种）**：向日葵、豌豆射手、坚果、樱桃炸弹 → 循环 GIF 动画
- **樱桃炸弹爆炸特效（1种）**：`ExplosionEffect` 播放 `爆炸！.gif`
- **投射物（3种）**：豌豆、火豆、太阳 → 循环 GIF 动画

## 架构

完全复用现有基础设施，无需新建底层模块：

- `GifAnimator`（已有）：逐帧播放状态机
- `window.__gifManifest`（已有）：预解析 GIF 帧数据
- `assetManager.createAnimator(name)`（已有）：从缓存创建 animator 实例
- `assetManager.getImage(name)`（已有）：静态回退

## 设计方案

### 1. 植物本体

每个植物子类在构造函数末尾创建循环 `GifAnimator`，`render()` 优先绘制 GIF 帧，回退链不变（静态图 → 程序化绘制）。

| 植物 | GIF key | 动画类型 | 特殊处理 |
|:---|:---|:---|:---|
| Sunflower | `sunflower` | 循环 | 无 |
| Peashooter | `peashooter` | 循环 | `shooting` 时短暂切静态 `peashooter_shoot` 图，200ms 后恢复 |
| Nut | `nut` | 循环 | `isSkillActive` 时叠加蓝色护盾光泽层 |
| CherryBomb | `cherrybomb` | 循环 | `exploded` 时 spawn `ExplosionEffect`，自身消失 |

改动方式：每子类构造函数加 `this._animator = assetManager.createAnimator('<key>')`，render 方法将 `assetManager.getImage()` 替换为 `this._animator.getCurrentCanvas()`。

### 2. ExplosionEffect（新建）

完全参考 `DeathEffect` 模式：

```
constructor(x, y, targetWidth, gifKey)
  → 创建非循环 GifAnimator
  → maxLife = 所有帧 delay 之和 + 500ms
  → active = true

update(deltaTime)
  → 推进 animator
  → 播完 + 余量后 active = false

render(ctx)
  → 绘制当前 GIF 帧（等比缩放到 targetWidth，底部对齐）
  → 末尾淡出
```

### 3. 投射物

在 `Bullet` 和 `Sun` 构造函数中创建循环 GifAnimator，render 优先绘制 GIF 帧。

| 投射物 | GIF key | 类 |
|:---|:---|:---|
| 豌豆 | `pea` | Bullet |
| 火豆 | `firePea` | FirePeaBullet (extends Bullet) |
| 太阳 | `sun` | Sun |

### 4. 新增 GIF 资源

`index.html` 的 `GIF_PATHS` 和 `AssetManager.imagePaths` 各新增一项：

```js
cherrybomb_explosion: 'resources/plants/爆炸！.gif',
```

## 修改清单

| # | 文件 | 操作 | 说明 |
|:---|:---|:---|:---|
| 1 | `index.html` | 改 | `GIF_PATHS` 加 `cherrybomb_explosion` |
| 2 | `game/js/AssetManager.js` | 改 | `imagePaths` 加 `cherrybomb_explosion` |
| 3 | `game/js/Sunflower.js` | 改 | 构造创建 animator，render 用 GIF 帧 |
| 4 | `game/js/PeaShooter.js` | 改 | 同上，保留 shooting 200ms 静态图 |
| 5 | `game/js/Nut.js` | 改 | 同上，保留护盾叠加 |
| 6 | `game/js/CherryBomb.js` | 改 | 同上 + spawn ExplosionEffect |
| 7 | `game/js/ExplosionEffect.js` | **新建** | 播放 `爆炸！.gif` 一次性特效 |
| 8 | `game/js/Bullet.js` | 改 | 构造创建 animator，render 用 GIF 帧 |
| 9 | `game/js/Sun.js` | 改 | 同上 |
| 10 | `game/js/Game.js` | 改 | `explosionEffects` 数组 + update/render 集成 |

## 回退策略

所有 render 方法保留完整的静态图 + 程序化绘制回退链。GIF 不可用时自动降级，不影响游戏运行。

## 风险

- 无架构风险：完全复用已验证的僵尸 GIF 系统
- 性能：植物数量远少于僵尸，GIF 帧 Canvas 共享引用，无额外内存压力
