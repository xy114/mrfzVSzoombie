# 3D 可行性调研原型

评估将 2D 塔防游戏战斗场景升级为 3D 渲染的技术可行性。

## 技术栈

- Three.js 0.160 (CDN importmap)
- ES Modules
- 卡通渲染：MeshToonMaterial + 反 hull 描边

## 启动

```bash
npx serve 3d/
```

浏览器打开提示的 URL（默认 http://localhost:3000）。

## 目录结构

```
3d/
├── README.md
├── index.html          ← 入口页面
├── src/
│   ├── main.js         ← 场景初始化 + 渲染循环
│   ├── constants.js    ← 游戏常量
│   ├── camera.js       ← 正交摄像机
│   ├── scene.js        ← 地面 + 格子 + 光照
│   ├── plant.js        ← 向日葵占位模型
│   ├── zombie.js       ← 僵尸占位模型
│   └── toon-material.js ← 卡通材质 + 描边
├── report/
│   └── 3d-feasibility-report.md
└── assets/
    └── models/         ← 3D 模型文件 (.glb)
```
