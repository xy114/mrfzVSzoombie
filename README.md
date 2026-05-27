# 战术指挥终端 — 植物大战僵尸 × 明日方舟

> 一款融合经典 PvZ 塔防玩法与《明日方舟》干员体系的 2D 策略游戏。
> 采用羊皮纸战术室美学风格，支持植物升星、皮肤装备、异客援护、编队管理等深度系统。

---

## 基于什么开发

- **核心玩法原型**：PopCap《植物大战僵尸》(Plants vs. Zombies) — 5×9 网格塔防
- **角色体系灵感**：Hypergryph《明日方舟》(Arknights) — 干员技能技力条、皮肤系统、异客援护

---

## 开发环境

| 项目 | 说明 |
|------|------|
| **操作系统** | Windows 10/11（开发主力）| macOS（实验性支持）|
| **运行时** | Node.js v20+ |
| **桌面容器** | Electron 42.x（Chromium + Node.js）|
| **包管理器** | npm |
| **构建工具** | electron-builder 24.x |
| **测试工具** | Playwright 1.60（E2E）|
| **图像处理** | sharp 0.34（资源预处理）|

---

## 技术栈

### 语言
- **JavaScript ES Modules**（全栈单一语言，浏览器端 + Node.js 端统一）

### 图形框架
- **HTML5 Canvas 2D API** — 纯手绘渲染管线，不使用任何第三方游戏引擎
  - 植物/僵尸/异客/子弹：Canvas 绘制 + GIF 帧动画
  - UI 界面：DOM + CSS（`index.html` + `game/css/ui.css`）
  - 羊皮纸战术室暖色调主题（CSS 变量体系，`--bg-parchment`, `--text-primary` 等）

### 技术框架
- **Electron** — 跨平台桌面容器，主进程管理窗口生命周期 + 预加载脚本桥接
- **gifuct-js** — GIF 解析库，将 GIF 文件解码为帧数据，战斗中以 `requestAnimationFrame` 循环播放
- **electron-builder** — 打包为 Windows 便携版 (.exe) / macOS DMG

### 核心技术

| 技术 | 说明 |
|------|------|
| **Canvas 2D 渲染管线** | 不使用任何游戏引擎，纯手绘 2D 渲染。所有角色、子弹、爆炸特效均通过 `CanvasRenderingContext2D` 绘制。GIF 动画由 `GifAnimator` 按帧解码播放，支持匿名/空闲/攻击多状态切换 |
| **模块化角色系统** | 植物/僵尸/异客三级继承体系（`Plant → Peashooter/Sunflower/Nut/CherryBomb`，`Zombie → NormalZombie/ConeZombie/ShieldZombie/ImpZombie`），统一 `render()`/`update()`/`takeDamage()` 接口 |
| **统一皮肤系统** | 原皮显式化设计（`id: "default"`），植物 + 异客均可装备皮肤。资源键命名规范 `{unitId}_skin_{skinId}_{resourceType}`，存储合并至 `equippedSkins`，所有立绘/头像/战斗形象经 `_drawPortrait` 统一入口渲染 |
| **技能技力条** | 借鉴 Arknights 自动回复技力机制，每个植物/异客有独立 `skillCooldown` / `skillMaxCooldown`，冷却完毕触发技能 |
| **草坪网格系统** | `Lawn.js` 管理 5×9 网格，每个格子独立追踪占用状态，支持调试模式可视化顶点与导出网格坐标 |
| **波次管理** | `WaveManager.js` 控制敌人生成节奏，精英敌人不对第一波出现，Boss 仅最后一波出现 |
| **localStorage 持久化** | 存档自动保存/加载，Dev Mode 快照备份，迁移逻辑兼容旧版数据结构 |

---

## 核心代码说明

```
mrfzVSzoombie/
├── electron/                   # Electron 主进程
│   ├── main.js                 # BrowserWindow 创建、菜单、窗口管理
│   └── preload.js              # 预加载脚本（contextBridge）
├── game/
│   ├── js/                     # 游戏逻辑 (ES Modules)
│   │   ├── main.js             # DOMContentLoaded 入口，bootstrap 流程
│   │   │                       #   → AssetManager 加载图片
│   │   │                       #   → UIManager 初始化 UI
│   │   │                       #   → startCombat 事件绑定（拖拽放置、右键取消、键盘暂停）
│   │   │
│   │   ├── Game.js             # BattleManager — 战斗主循环
│   │   │                       #   管理 plants[] / zombies[] / visitors[] / bullets[] / suns[]
│   │   │                       #   主循环：update(deltaTime) → checkCollisions() → render()
│   │   │                       #   时停系统：battleTimeScale（异客主动技能暂停所有敌人）
│   │   │
│   │   ├── Lawn.js             # 草坪网格（5 行 × 9 列）
│   │   │                       #   plant(row, col) / remove(row, col) / getCellFromPosition()
│   │   │                       #   debugGrid 模式：可视化网格顶点，拖拽编辑坐标
│   │   │
│   │   ├── UIManager.js        # 全局 UI 管理器（~2900 行）
│   │   │                       #   页面管理：主页 / 关卡选择 / 编队 / 图鉴 / 战斗
│   │   │                       #   皮肤系统：_drawPortrait 统一入口，皮肤预览/装备
│   │   │                       #   详情面板：showPlantDetail / showUnitPanel
│   │   │                       #   编队系统：renderSquadPicker + renderVisitorSquad
│   │   │
│   │   ├── StorageManager.js   # localStorage 持久化
│   │   │                       #   equippedSkins / ownedSkins / plantStars / crystals
│   │   │                       #   关卡进度 / 编队快照 / Dev Mode 快照
│   │   │
│   │   ├── Plant.js            # 植物基类 (Plant)
│   │   │   ├── PeaShooter.js   #   豌豆射手 — 皮肤切换 WishadelPea / FirePeaBullet
│   │   │   ├── Sunflower.js    #   向日葵 — 定时产阳光
│   │   │   ├── Nut.js          #   坚果 — 高血量 + 防御技能
│   │   │   └── CherryBomb.js   #   樱桃炸弹 — 一次性范围爆炸
│   │   │
│   │   ├── Zombie.js           # 僵尸基类 (Zombie)
│   │   │                       #   移动 / 啃食 / 死亡 / 装备破损（路障/持盾 → 普通）
│   │   │                       #   bodyType: 'humanoid', width: 125（小鬼 60）
│   │   │
│   │   ├── Visitor.js          # 异客系统 (Visitor)
│   │   │   └── KatanaZero      #   武士零 — 时停斩（主动）+ 同行斩（被动）
│   │   │
│   │   ├── Bullet.js           # 子弹系统
│   │   │   ├── Bullet          #   普通豌豆（物理）
│   │   │   ├── WishadelPea     #   维什戴尔平A（物理，70% 尺寸）
│   │   │   ├── WishadelShell   #   维什戴尔技能爆弹（物理，追踪 + 3 阶段爆炸动画）
│   │   │   └── FirePeaBullet   #   火焰豌豆（法术，3×3 AoE）
│   │   │
│   │   ├── DeathEffect.js      # 死亡效果 — GIF 帧序列播放
│   │   ├── GifAnimator.js      # GIF 帧动画器 — 解析帧数据，循环/单次播放
│   │   ├── AssetManager.js     # 资源管理器 — 图片预加载 + 皮肤资源键查找
│   │   ├── WaveManager.js      # 波次管理器 — 敌人生成规则
│   │   │
│   │   ├── PlantConfig.js      # 植物/皮肤定义 + 星级倍率
│   │   ├── ZombieConfig.js     # 僵尸定义 + 威胁等级
│   │   ├── VisitorConfig.js    # 异客定义 + 技能数值
│   │   ├── LevelConfig.js      # 关卡配置（序章 + 章节）
│   │   ├── constants.js        # 游戏常量（GAME_CONFIG, STAR_CONFIG 等）
│   │   │
│   │   ├── PlantRenderer.js    # 植物程序化绘制回退（无图片时使用）
│   │   ├── ZombieRenderer.js   # 僵尸程序化绘制回退
│   │   ├── ProjectileRenderer.js # 子弹程序化绘制回退
│   │   └── VisitorRenderer.js  # 异客程序化绘制回退
│   │
│   ├── css/
│   │   └── ui.css              # 全局 UI 样式（羊皮纸主题，CSS 变量）
│   │
│   └── resources/              # 游戏资源
│       ├── plants/             # 植物 GIF/PNG 资源
│       ├── zombies/            # 僵尸 GIF 资源
│       ├── special/            # 异客资源
│       └── projectiles/        # 子弹资源
│
├── assets/                     # 构建资源（图标等）
├── tools/                      # 开发工具
│   ├── calibrator.html         # 网格坐标校准器
│   ├── position-tuner.html     # 渲染位置微调工具
│   └── generate-assets.html    # 程序化资源生成器
│
├── dist/                       # 构建产物输出
├── index.html                  # 主页面（所有 UI DOM 结构）
├── 游戏基础设定.md              # 完整设计文档（角色树、皮肤系统、命名规范、渲染标准）
└── package.json                # 项目配置 + electron-builder 打包配置
```

---

## 游戏系统

详细设定见 [游戏基础设定.md](./游戏基础设定.md)

### 角色系统
| 类型 | 单位 | 生命 | 攻击 | 技能 |
|------|------|------|------|------|
| 植物 | 向日葵 | 100 | — | 产阳光（7s/25）|
| 植物 | 豌豆射手 | 100 | 20 物理 | 火焰豌豆（50 法术，3×3 AoE，冷却 10s）|
| 植物 | 豌豆射手·维什戴尔 | 100 | 20+20 物理 | 追踪爆弹（120 物理，5×5 爆炸，冷却 10s）|
| 植物 | 坚果 | 400 | — | 护甲强化（+30 防御，持续 5s，冷却 15s）|
| 植物 | 樱桃炸弹 | 100 | 50×400% 物理 | 备战引爆（3×3 范围，准备 1.5s）|
| 异客 | 武士零 | 300 | 技能型 | 时停斩 + 同行斩 |
| 敌人 | 普通僵尸 | 100 | 15 | — |
| 敌人 | 路障僵尸 | 200 | 15 | 装备破损降级 |
| 敌人 | 持盾僵尸 | 350 | 15 | 装备破损降级，物理防御 |
| 敌人 | 小鬼僵尸 | 60 | 20 | 高速 |

### 皮肤系统
- **原皮**（`id: "default"`）：每个单位默认外观，始终拥有
- **衍生皮**（`id: "wishadel"`）：付费解锁，可替换技能/属性/外观
- 资源键命名：`{unitId}_skin_{skinId}_{resourceType}`（`_portrait` / `_combat` / `_headshot`）
- 存储：`equippedSkins[unitId] = skinId`

### 升星系统
| 星级 | 生命倍率 | 攻击倍率 | 冷却倍率 | 消耗 |
|------|---------|---------|---------|------|
| 1★ | 1.0× | 1.0× | 1.0× | — |
| 2★ | 1.25× | 1.2× | 0.9× | 100 晶核 |
| 3★ | 1.6× | 1.5× | 0.75× | 300 晶核 |

### 操作说明

| 按键 | 功能 |
|------|------|
| 鼠标拖拽 | 从卡片拖拽植物到草坪放置 |
| 点击阳光 | 收集阳光 |
| 点击单位 | 查看详情面板 |
| **P / F** | 暂停 / 继续 |
| **ESC** | 取消选中 / 取消拖拽 |
| **D** | 切换调试网格模式 |
| **E** | 导出网格数据（调试模式）|

---

## 安装与运行

```bash
# 开发环境
npm install
npm start          # 启动 Electron 桌面应用

# 构建
npm run build:win  # Windows 便携版 (.exe)
npm run build:mac  # macOS DMG
```

---

*战术指挥终端 v1.3.1 — 愿你的草坪坚不可摧*
