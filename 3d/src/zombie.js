import * as THREE from 'three';
import { createToonMesh, createToonMaterial } from './toon-material.js';
import { ZOMBIE_WIDTH, ZOMBIE_HEIGHT } from './constants.js';

const W = ZOMBIE_WIDTH;
const H = ZOMBIE_HEIGHT;

/**
 * 创建精细僵尸程序化模型
 * 椭圆头部 + 分段躯干 + 四肢关节 + 破衣 + 鞋子
 */
export function createNormalZombie() {
  const group = new THREE.Group();

  const skinColor = 0x8fbc8f;
  const darkSkin = 0x6b8e6b;
  const clothColor = 0x5c4a3a;
  const pantsColor = 0x3d3d5c;

  // === 头部组 ===
  const headGroup = new THREE.Group();

  // 颅骨（竖向椭圆）
  const skullGeom = new THREE.SphereGeometry(W * 0.3, 14, 16);
  const skull = new THREE.Mesh(skullGeom, createToonMaterial(skinColor));
  skull.scale.set(1, 1.15, 0.85);
  skull.castShadow = true;
  skull.receiveShadow = true;
  headGroup.add(skull);

  // 下颌
  const jawGeom = new THREE.BoxGeometry(W * 0.35, H * 0.06, W * 0.28);
  const jaw = createToonMesh(jawGeom, darkSkin, 0.02);
  jaw.position.y = -W * 0.25;
  headGroup.add(jaw);

  // 红眼
  const eyeGeom = new THREE.SphereGeometry(W * 0.06, 6, 6);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
  leftEye.position.set(-W * 0.1, W * 0.08, W * 0.22);
  const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
  rightEye.position.set(W * 0.1, W * 0.08, W * 0.22);
  headGroup.add(leftEye);
  headGroup.add(rightEye);

  headGroup.position.y = H * 0.52;
  group.add(headGroup);

  // === 躯干（两段） ===
  const chestGeom = new THREE.CylinderGeometry(W * 0.28, W * 0.32, H * 0.22, 8);
  const chest = createToonMesh(chestGeom, clothColor, 0.02);
  chest.position.y = H * 0.32;
  group.add(chest);

  const bellyGeom = new THREE.CylinderGeometry(W * 0.26, W * 0.28, H * 0.12, 8);
  const belly = createToonMesh(bellyGeom, clothColor, 0.02);
  belly.position.y = H * 0.18;
  group.add(belly);

  // 破衣领
  const collarGeom = new THREE.TorusGeometry(W * 0.18, W * 0.04, 6, 8);
  const collar = createToonMesh(collarGeom, 0x4a3728, 0.02);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = H * 0.42;
  group.add(collar);

  // === 左臂组（上臂 + 前臂 + 手） ===
  const leftArmGroup = new THREE.Group();
  leftArmGroup.position.set(-W * 0.42, H * 0.34, 0);

  const upperArmGeom = new THREE.CylinderGeometry(W * 0.07, W * 0.08, H * 0.2, 6);
  const upperArm = new THREE.Mesh(upperArmGeom, createToonMaterial(clothColor));
  upperArm.castShadow = true;
  upperArm.receiveShadow = true;
  upperArm.position.y = -H * 0.05;
  leftArmGroup.add(upperArm);

  const forearmGeom = new THREE.CylinderGeometry(W * 0.06, W * 0.07, H * 0.18, 6);
  const forearm = createToonMesh(forearmGeom, skinColor, 0.02);
  forearm.position.y = -H * 0.22;
  leftArmGroup.add(forearm);

  const handGeom = new THREE.SphereGeometry(W * 0.09, 6, 6);
  const hand = createToonMesh(handGeom, skinColor, 0.02);
  hand.position.y = -H * 0.33;
  leftArmGroup.add(hand);

  group.add(leftArmGroup);

  // === 右臂组 ===
  const rightArmGroup = new THREE.Group();
  rightArmGroup.position.set(W * 0.42, H * 0.34, 0);

  const rUpperArmGeom = new THREE.CylinderGeometry(W * 0.07, W * 0.08, H * 0.2, 6);
  const rUpperArm = new THREE.Mesh(rUpperArmGeom, createToonMaterial(clothColor));
  rUpperArm.castShadow = true;
  rUpperArm.receiveShadow = true;
  rUpperArm.position.y = -H * 0.05;
  rightArmGroup.add(rUpperArm);

  const rForearmGeom = new THREE.CylinderGeometry(W * 0.06, W * 0.07, H * 0.18, 6);
  const rForearm = createToonMesh(rForearmGeom, skinColor, 0.02);
  rForearm.position.y = -H * 0.22;
  rightArmGroup.add(rForearm);

  const rHandGeom = new THREE.SphereGeometry(W * 0.09, 6, 6);
  const rHand = createToonMesh(rHandGeom, skinColor, 0.02);
  rHand.position.y = -H * 0.33;
  rightArmGroup.add(rHand);

  group.add(rightArmGroup);

  // === 左腿组（大腿 + 小腿 + 鞋） ===
  const leftLegGroup = new THREE.Group();
  leftLegGroup.position.set(-W * 0.16, 0, 0);

  const thighGeom = new THREE.CylinderGeometry(W * 0.1, W * 0.09, H * 0.18, 6);
  const thigh = createToonMesh(thighGeom, pantsColor, 0.02);
  thigh.position.y = -H * 0.05;
  leftLegGroup.add(thigh);

  const shinGeom = new THREE.CylinderGeometry(W * 0.08, W * 0.07, H * 0.2, 6);
  const shin = createToonMesh(shinGeom, skinColor, 0.02);
  shin.position.y = -H * 0.2;
  leftLegGroup.add(shin);

  const shoeGeom = new THREE.BoxGeometry(W * 0.18, H * 0.06, W * 0.28);
  const shoe = createToonMesh(shoeGeom, 0x3d2828, 0.02);
  shoe.position.set(0, -H * 0.31, W * 0.06);
  leftLegGroup.add(shoe);

  group.add(leftLegGroup);

  // === 右腿组 ===
  const rightLegGroup = new THREE.Group();
  rightLegGroup.position.set(W * 0.16, 0, 0);

  const rThighGeom = new THREE.CylinderGeometry(W * 0.1, W * 0.09, H * 0.18, 6);
  const rThigh = createToonMesh(rThighGeom, pantsColor, 0.02);
  rThigh.position.y = -H * 0.05;
  rightLegGroup.add(rThigh);

  const rShinGeom = new THREE.CylinderGeometry(W * 0.08, W * 0.07, H * 0.2, 6);
  const rShin = createToonMesh(rShinGeom, skinColor, 0.02);
  rShin.position.y = -H * 0.2;
  rightLegGroup.add(rShin);

  const rShoeGeom = new THREE.BoxGeometry(W * 0.18, H * 0.06, W * 0.28);
  const rShoe = createToonMesh(rShoeGeom, 0x3d2828, 0.02);
  rShoe.position.set(0, -H * 0.31, W * 0.06);
  rightLegGroup.add(rShoe);

  group.add(rightLegGroup);

  // 存储引用用于动画
  group.userData = { leftArmGroup, rightArmGroup, leftLegGroup, rightLegGroup };

  return group;
}

/**
 * 更新僵尸行走/待机动画
 */
export function updateZombieAnimation(zombieGroup, time) {
  zombieGroup.position.y = Math.abs(Math.sin(time * 3)) * 0.1;

  const { leftArmGroup, rightArmGroup, leftLegGroup, rightLegGroup } = zombieGroup.userData;

  if (leftArmGroup) {
    leftArmGroup.rotation.x = Math.sin(time * 3) * 0.5;
  }
  if (rightArmGroup) {
    rightArmGroup.rotation.x = Math.sin(time * 3 + Math.PI) * 0.5;
  }
  if (leftLegGroup) {
    leftLegGroup.rotation.x = Math.sin(time * 3 + Math.PI) * 0.25;
  }
  if (rightLegGroup) {
    rightLegGroup.rotation.x = Math.sin(time * 3) * 0.25;
  }
}
