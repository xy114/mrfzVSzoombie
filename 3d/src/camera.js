import * as THREE from 'three';
import { WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';

/**
 * 创建 2.5D 固定俯视正交摄像机
 * 视野精确覆盖 WORLD_WIDTH × WORLD_HEIGHT 的世界空间
 * 1 世界单位 = 1 像素，与原游戏坐标系统一致
 */
export function createCamera() {
  const left = -WORLD_WIDTH / 2;    // -450
  const right = WORLD_WIDTH / 2;    //  450
  const top = -WORLD_HEIGHT / 2;     // -270 (屏幕上方)
  const bottom = WORLD_HEIGHT / 2;   //  270 (屏幕下方)
  const near = 0.1;
  const far = 100;

  const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);

  // 摄像机置于世界正上方，垂直向下看
  camera.position.set(0, 10, 0);
  camera.lookAt(0, 0, 0);

  // 确保摄像机的"上"方向与世界 Z 轴对齐
  // 使得 top/bottom 映射到世界 Z 轴，left/right 映射到世界 X 轴
  camera.up.set(0, 0, 1);

  return camera;
}
