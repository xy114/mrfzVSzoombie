import * as THREE from 'three';
import {
  WORLD_WIDTH, WORLD_HEIGHT,
  GAME_CONFIG
} from './constants.js';

const { LAWN_ROWS, LAWN_COLS, CELL_WIDTH, CELL_HEIGHT } = GAME_CONFIG;

/**
 * 创建草坪地面
 */
function createGround() {
  const geometry = new THREE.PlaneGeometry(WORLD_WIDTH, WORLD_HEIGHT);
  const material = new THREE.MeshToonMaterial({ color: 0x5a8f3c });
  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2; // 平放在 XZ 平面
  ground.position.y = 0;
  ground.receiveShadow = true;
  return ground;
}

/**
 * 创建格子线
 * 手动绘制 5 行 × 9 列的网格线，因为 GridHelper 只支持正方形网格
 */
function createGridLines() {
  const material = new THREE.LineBasicMaterial({ color: 0x3d6b2e, transparent: true, opacity: 0.5 });
  const group = new THREE.Group();

  const halfW = WORLD_WIDTH / 2;   // 450
  const halfH = WORLD_HEIGHT / 2;  // 270
  const yOffset = 0.005; // 略高于地面防止 z-fighting

  // 水平线（分隔行）：共 LAWN_ROWS + 1 = 6 条
  for (let i = 0; i <= LAWN_ROWS; i++) {
    const z = -halfH + i * CELL_HEIGHT;
    const points = [
      new THREE.Vector3(-halfW, yOffset, z),
      new THREE.Vector3(halfW, yOffset, z)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    group.add(new THREE.Line(geometry, material));
  }

  // 竖直线（分隔列）：共 LAWN_COLS + 1 = 10 条
  for (let i = 0; i <= LAWN_COLS; i++) {
    const x = -halfW + i * CELL_WIDTH;
    const points = [
      new THREE.Vector3(x, yOffset, -halfH),
      new THREE.Vector3(x, yOffset, halfH)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    group.add(new THREE.Line(geometry, material));
  }

  return group;
}

/**
 * 创建光照
 */
function createLights() {
  const lights = new THREE.Group();

  // 环境光：防止暗部纯黑
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  lights.add(ambient);

  // 主方向光：产生明暗面和阴影
  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(5, 15, 5);
  directional.castShadow = true;
  directional.shadow.mapSize.width = 1024;
  directional.shadow.mapSize.height = 1024;
  directional.shadow.camera.near = 0.5;
  directional.shadow.camera.far = 50;
  directional.shadow.camera.left = -500;
  directional.shadow.camera.right = 500;
  directional.shadow.camera.top = 300;
  directional.shadow.camera.bottom = -300;
  lights.add(directional);

  return lights;
}

/**
 * 创建完整战斗场景
 * @param {THREE.Scene} scene - Three.js 场景实例
 */
export function createBattleScene(scene) {
  scene.background = new THREE.Color(0x87ceeb); // 天蓝色背景

  // 地面
  scene.add(createGround());

  // 格子线
  scene.add(createGridLines());

  // 光照
  scene.add(createLights());
}

/**
 * 创建格子坐标计算辅助函数
 * 将网格坐标 (row, col) 转换为世界空间坐标
 * @param {number} row - 行 (0-4)
 * @param {number} col - 列 (0-8)
 * @returns {{x: number, z: number}} 世界空间坐标
 */
export function cellToWorld(row, col) {
  const halfW = WORLD_WIDTH / 2;
  const halfH = WORLD_HEIGHT / 2;
  return {
    x: -halfW + col * CELL_WIDTH + CELL_WIDTH / 2,
    z: -halfH + row * CELL_HEIGHT + CELL_HEIGHT / 2
  };
}
