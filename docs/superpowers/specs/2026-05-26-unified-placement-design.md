# 战斗场景统一放置系统

## 背景

当前战斗场景中，植物和人类角色（人形植物、异客、僵尸）的放置逻辑分散在多处，且拖拽虚影与实际放置位置使用不同的计算路径，导致虚影位置/大小与实际不一致。

## 目标

1. 统一所有战斗实体的放置计算到一个公共函数
2. 拖拽虚影和实际放置共用同一套位置计算，消除偏差
3. 按 bodyType 区分两类放置规则：植物 vs 人类

## bodyType 分类

| 类型 | bodyType | 角色 |
|------|----------|------|
| 植物 | `plant` | 向日葵、豌豆射手、坚果、樱桃炸弹 |
| 人类 | `humanoid` | 维什戴尔(皮肤)、武士零(异客)、所有僵尸 |

## 放置规则

### 植物
- 居中于格子中心
- renderSize = 80
- 公式: `x = tileCenter.x - renderSize/2 * scale`, `y = tileCenter.y - renderSize/2 * scale`

### 人类
- X 居中于格子
- Y: 脚踩行中心偏下 20%（`rowY + cellH * 0.2`），然后向上偏移 renderSize
- 公式: `x = tileCenter.x - renderSize/2 * scale`, `y = rowY + cellH * 0.2 - renderSize * scale`
- renderSize 由具体角色决定（普通僵尸 115, 维什戴尔 96, 武士零由图片决定等）

### 通用
- scale = standardCell.w / cellWidth
- 倾斜列: rotation = -Math.PI / 4

## 公共函数

```js
function getPlacementRect({ bodyType, renderSize, row, col, lawn }) {
  // 返回 { x, y, w, h, scale, rotation }
  // w = h = renderSize * scale
}
```

位置: `game/js/Lawn.js`（与现有网格逻辑内聚）

## 调用点

| # | 位置 | 改动 |
|---|------|------|
| 1 | Game.render() 格子虚影 (L172-231) | 改为调用 getPlacementRect |
| 2 | Game.render() 拖拽虚影 (L291-334) | 改为调用 getPlacementRect |
| 3 | Game.handleDrop() 植物放置 (L460-575) | 移除 humanoid Y 覆盖，委托给 Lawn.plant() |
| 4 | Game.handleDrop() 异客放置 (L505-523) | 同上 |
| 5 | Game.spawnZombie() (L598-613) | Y 计算改用人类规则 |

Lawn.plant() 内部调用 getPlacementRect 设置 x/y/scale/rotation，外部不再覆盖。

## 虚影渲染

虚影绘制时使用 getPlacementRect 返回的 {x, y, w, h} 作为绘制矩形，不再自行计算 sz。

## 不变的部分

- 阳光消耗、冷却、解锁逻辑
- bodyType 判断
- scale/rotation 计算方式
- 维什戴尔皮肤技能逻辑
- 渲染层级排序

## 涉及文件

- `game/js/Lawn.js` — 新增 getPlacementRect(), 修改 plant()
- `game/js/Game.js` — 虚影两处、handleDrop、spawnZombie 改为调用新函数
