# 5种新植物 + 3种新僵尸 设计规格

## 概述

新增倭瓜、火爆辣椒、双重射手、双胞向日葵、机枪射手五种植物，以及旗帜僵尸、铁桶僵尸、小丑僵尸三种僵尸。全部单位解锁条件设为 6-1（关卡未实装，等同于不解锁），仅开发模式可测试。

---

## 冷却体系重分级

| 级别 | 冷却 | 现有植物 | 新植物 |
|---|---|---|---|
| 短 | 5s | 向日葵、豌豆射手 | — |
| 中 | 10s | 坚果（从15s下调） | 倭瓜、双胞向日葵、双重射手、机枪射手 |
| 长 | 20s | 樱桃炸弹（从30s下调） | 火爆辣椒 |

需同步修改 `constants.js` 中 `PLANT_TYPES.NUT.cooldown`（15000→10000）和 `PLANT_TYPES.CHERRY_BOMB.cooldown`（30000→20000）。

---

## 新增植物

### 1. 倭瓜 (Squash.js)

- **继承**: Plant
- **资源**: `resources/plants/窝瓜.gif`（常态）、`resources/plants/窝瓜跳跃.gif`（下落砸击）
- **属性**: 伤害 80, 宽高 80×80, 单目标物理伤害
- **状态机**: `idle → rising → falling → impact → recovery → idle`
  1. idle: 常态 GIF, 扫描前方 1 cell（同行 zombie.x 在 [plant.x+50, plant.x+150]）
  2. rising (~400ms): y 线性上升到目标上方 (target.y - 60), 进入无敌帧
  3. falling: 到达顶点后切换跳跃 GIF, 描绘下落过程
  4. impact: GIF 到帧数 * 0.7 处结算 damage * 3 物理伤害, 设目标 `_squashed = true`
  5. recovery: 动画播完, y 回原位, 切回常态
- **技能**: 自晕 10s（期间不攻击不跳跃）, 眩晕结束后 ATK × 1.5 永久。冷却 15s
- **小丑交互**: 跳跃砸死小丑时设 `_squashed = true`, 小丑检测此标记跳过爆炸
- **Plant 基类补充**: `_invulnerable` 字段, `takeDamage` 中跳过无敌单位
- **PlantConfig**: cost 175, cooldown 10000, unlockLevel '6-1'
- **PLANT_TYPES**: `SQUASH: { name: 'squash', cost: 175, cooldown: 10000 }`

### 2. 火爆辣椒 (Jalapeno.js)

- **继承**: Plant（一次性植物, 参照 CherryBomb 模式）
- **资源**: `resources/plants/火爆辣椒·.gif`（常态）、`resources/plants/火.gif`（整行爆炸）
- **属性**: 伤害 180, 一次性使用
- **状态机**: `idle → deploying(1.5s) → exploding → dead`
  1. deploying: 1.5s 部署期, 无敌
  2. exploding: 辣椒自身隐藏, 渲染火.gif 覆盖整行 (900×~100px), 首帧结算伤害
  3. 遍历同行所有存活僵尸: `z.takeDamage(60 + damage * 2, 'magic')`
  4. 火.gif 单次播放, 播完后 active = false
- **无技能**: skillDescription 为空
- **PlantConfig**: cost 125, cooldown 20000, unlockLevel '6-1'
- **PLANT_TYPES**: `JALAPENO: { name: 'jalapeno', cost: 125, cooldown: 20000 }`

### 3. 双重射手 (Repeater.js)

- **继承**: PeaShooter（复用射击框架）
- **资源**: `resources/plants/双重射手.gif`
- **普通攻击**: 先后发射 2 颗豌豆, 间隔 200ms, y 偏移 -6/+6px, 各独立碰撞命中消失
- **技能**: 发射 2 颗穿透火豆（PiercingFirePea），间隔 150ms, y 偏移 ±6px
  - PiercingFirePea: `skipCollisionCheck = true`, 自 update 遍历同行僵尸造成伤害, 命中不消失, 飞出画布才销毁
  - 伤害: damage * 1.5, 法术伤害
  - 冷却 10s
- **PlantConfig**: cost 200, cooldown 10000, unlockLevel '6-1'
- **PLANT_TYPES**: `REPEATER: { name: 'repeater', cost: 200, cooldown: 10000 }`
- **新增 Bullet 类型**: `PiercingFirePea` — 穿透不消失

### 4. 双胞向日葵 (TwinSunflower.js)

- **继承**: Sunflower（复用产阳光逻辑）
- **资源**: `resources/plants/双胞向日葵.gif`
- **普通生产**: 一次产 2 阳光, x 错开 ±15px
- **技能**: 太阳光束, 冷却 15s
  - 锁定释放瞬间当前阳光余额作为伤害值, 法术伤害
  - 照射整行, 每秒一跳共 3 跳, 持续 3s
  - Canvas 绘制: 金黄色半透明矩形从植物位置延伸到画布右边缘 `rgba(255,215,0,0.35)`
  - 施法期间不产阳光, 可被啃食
- **阳光生产间隔**: 10s（区别于向日葵的 7s）
- **PlantConfig**: cost 125, cooldown 10000, unlockLevel '6-1'
- **PLANT_TYPES**: `TWIN_SUNFLOWER: { name: 'twinsunflower', cost: 125, cooldown: 10000 }`

### 5. 机枪射手 (GatlingPea.js)

- **继承**: PeaShooter
- **资源**: `resources/plants/机枪射手.gif`
- **普通攻击**: 4 发子弹, 依次间隔 120ms, y 偏移 -6/-2/+2/+6px, 独立碰撞
- **技能**: 五行火豆弹幕, 冷却 15s
  - 5 行同时启动, 每行从射手 x 位向右发射
  - 同行内 5 发依次间隔 150ms
  - 每发火豆命中消失, 法术伤害: 50 + damage * 1.0
- **PlantConfig**: cost 350, cooldown 10000, unlockLevel '6-1'
- **PLANT_TYPES**: `GATLING_PEA: { name: 'gatlingpea', cost: 350, cooldown: 10000 }`

---

## 新增僵尸

### 1. 旗帜僵尸 (FlagZombie.js)

- **继承**: Zombie
- **资源**: `resources/zombies/旗帜僵尸.gif`（走路）、`resources/zombies/旗帜僵尸啃食.gif`（攻击）、`resources/zombies/僵尸死.gif`（死亡）
- **数值**: 与普通僵尸完全相同 (HP 100, 防 0, 速 0.3, 伤 20)
- **不退化**: 无装备碎裂逻辑
- **WaveManager**: 每波次第一次 spawn 强制为 flag, 后续正常随机（不含 flag）
- **ZombieConfig**: category 'normal', firstEncounter '6-1', threatLevel 1

### 2. 铁桶僵尸 (BucketZombie.js)

- **继承**: Zombie
- **资源**: `resources/zombies/铁桶僵尸.gif`、`resources/zombies/铁桶僵尸啃食.gif`、`resources/zombies/僵尸死.gif`
- **数值**: HP 300, 防 40, 速 0.3, 伤 20
- **退化**: HP ≤ 90 (30%) 时退化为 normal, 防御归零, 切换普通僵尸 animator, 短暂显示碎裂特效
- **ZombieConfig**: category 'elite', firstEncounter '6-1', threatLevel 3

### 3. 小丑僵尸 (ClownZombie.js)

- **继承**: Zombie
- **资源**: `resources/zombies/小丑僵尸.gif`、`resources/zombies/准备爆炸.gif`、`resources/zombies/爆炸！（小丑僵尸）.gif`
- **数值**: HP 150, 防 0, 速 0.4, 伤 0（不攻击）
- **行为**: 接近植物时不啃食, 继续前进
- **爆炸触发**: 被击杀或被阻挡(speed=0)时触发
  - 倭瓜砸死 (`_squashed = true`) 时跳过爆炸
  - 播放准备爆炸.gif → 爆炸！gif, 播放期间无敌
  - 3×3 cell 范围, 300 物理伤害, 不分敌我（伤害范围内植物和其他僵尸）
  - 爆炸动画播完后自身销毁
- **ZombieConfig**: category 'elite', firstEncounter '6-1', threatLevel 2

---

## 文件变更清单

### 新建文件 (8)
- `game/js/Squash.js` — 倭瓜
- `game/js/Jalapeno.js` — 火爆辣椒
- `game/js/Repeater.js` — 双重射手
- `game/js/TwinSunflower.js` — 双胞向日葵
- `game/js/GatlingPea.js` — 机枪射手
- `game/js/FlagZombie.js` — 旗帜僵尸
- `game/js/BucketZombie.js` — 铁桶僵尸
- `game/js/ClownZombie.js` — 小丑僵尸

### 修改文件 (11)
- `game/js/constants.js` — PLANT_TYPES / ZOMBIE_TYPES 新增 + 冷却调整
- `game/js/PlantConfig.js` — 5 种植物的定义 + 皮肤 default
- `game/js/ZombieConfig.js` — 3 种僵尸定义
- `game/js/Plant.js` — 添加 `_invulnerable` 字段支持
- `game/js/Zombie.js` — takeDamage 添加 bucket 退化分支 + clown 爆炸钩子
- `game/js/Bullet.js` — 新增 `PiercingFirePea` 类
- `game/js/Game.js` — handleDrop 新增 5 个 plant case + spawnZombie 新增 3 个 zombie case + update 处理 clown 阻挡 + addBullet 支持
- `game/js/WaveManager.js` — 每波首位强制 flag zombie
- `game/js/AssetManager.js` — imagePaths 注册新 GIF
- `game/js/UIManager.js` — 图鉴渲染适配
- `index.html` — GIF_PATHS 注册新 GIF
