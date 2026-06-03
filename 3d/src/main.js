import * as THREE from 'three';
import { createCamera } from './camera.js';
import { createBattleScene, cellToWorld } from './scene.js';
import { createSunflower, updatePlantAnimation } from './plant.js';
import { createNormalZombie, updateZombieAnimation } from './zombie.js';
import { loadModel } from './model-loader.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';

// --- 初始化渲染器 ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(WORLD_WIDTH, WORLD_HEIGHT);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比防止性能问题
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const container = document.getElementById('game-canvas');
container.appendChild(renderer.domElement);

// --- 初始化场景 ---
const scene = new THREE.Scene();
createBattleScene(scene);

// --- 初始化摄像机 ---
const camera = createCamera();

// --- 放置植物（向日葵在格子 (2, 3) 即第 3 行第 4 列） ---
const sunflower = createSunflower();
const sunflowerPos = cellToWorld(2, 3);
sunflower.position.set(sunflowerPos.x, 0, sunflowerPos.z);
scene.add(sunflower);

// --- 放置僵尸（普通僵尸在格子 (2, 7) 即第 3 行第 8 列） ---
const zombie = createNormalZombie();
const zombiePos = cellToWorld(2, 7);
zombie.position.set(zombiePos.x, 0, zombiePos.z);
scene.add(zombie);

// ============================================================
// 可选：替换为真实 glTF 模型
// 1. 将 .glb 文件放入 assets/models/ 目录
// 2. 取消下面注释即可加载真实模型替换程序化占位
// ============================================================
// loadModel('assets/models/sunflower.glb').then(model => {
//   const pos = cellToWorld(2, 3);
//   model.position.set(pos.x, 0, pos.z);
//   scene.remove(sunflower);
//   scene.add(model);
//   console.log('向日葵模型已加载');
// }).catch(err => console.warn('向日葵模型未找到，使用程序化模型', err.message));
//
// loadModel('assets/models/zombie.glb').then(model => {
//   const pos = cellToWorld(2, 7);
//   model.position.set(pos.x, 0, pos.z);
//   scene.remove(zombie);
//   scene.add(model);
//   console.log('僵尸模型已加载');
// }).catch(err => console.warn('僵尸模型未找到，使用程序化模型', err.message));

// --- FPS 计数器 ---
const fpsElement = document.getElementById('fps');
let frameCount = 0;
let lastFpsTime = performance.now();

// --- 渲染循环 ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // 更新动画
  updatePlantAnimation(sunflower, elapsed);
  updateZombieAnimation(zombie, elapsed);

  // 渲染
  renderer.render(scene, camera);

  // FPS 统计
  frameCount++;
  if (elapsed - lastFpsTime >= 1.0) {
    const fps = Math.round(frameCount / (elapsed - lastFpsTime));
    fpsElement.textContent = `FPS: ${fps}`;
    frameCount = 0;
    lastFpsTime = elapsed;
  }
}

// --- 启动 ---
animate();
console.log('3D 可行性原型已启动');
console.log(`渲染器: WebGL ${renderer.capabilities.isWebGL2 ? '2.0' : '1.0'}`);
console.log(`视口: ${WORLD_WIDTH}x${WORLD_HEIGHT}`);
