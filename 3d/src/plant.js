import * as THREE from 'three';
import { createToonMesh, createToonMaterial, addOutline } from './toon-material.js';
import { PLANT_SIZE } from './constants.js';

const S = PLANT_SIZE; // 缩写方便使用

// --- 花瓣形状（椭圆水滴形）---
function createPetalShape() {
  const shape = new THREE.Shape();
  const w = S * 0.15;  // 半宽
  const h = S * 0.6;   // 长度
  shape.moveTo(0, 0);
  shape.bezierCurveTo(w * 1.2, h * 0.15, w * 0.8, h * 0.7, 0, h);
  shape.bezierCurveTo(-w * 0.8, h * 0.7, -w * 1.2, h * 0.15, 0, 0);
  return shape;
}

// --- 叶片形状 ---
function createLeafShape() {
  const shape = new THREE.Shape();
  const hw = S * 0.12;
  const len = S * 0.45;
  shape.moveTo(0, 0);
  shape.bezierCurveTo(hw * 0.5, len * 0.2, hw, len * 0.6, 0, len);
  shape.bezierCurveTo(-hw, len * 0.6, -hw * 0.5, len * 0.2, 0, 0);
  return shape;
}

/**
 * 创建精细向日葵程序化模型
 * 双层花瓣 + 花盘纹理 + 弧形叶片
 */
export function createSunflower() {
  const group = new THREE.Group();

  // === 花瓣 ===
  const petalShape = createPetalShape();
  const petalExtrudeSettings = { depth: S * 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 };
  const petalGeom = new THREE.ExtrudeGeometry(petalShape, petalExtrudeSettings);

  // 外层花瓣（12 片）
  const outerCount = 12;
  const outerLayer = new THREE.Group();
  for (let i = 0; i < outerCount; i++) {
    const angle = (i / outerCount) * Math.PI * 2;
    const petal = createToonMesh(petalGeom, 0xffc107, 0.02);
    petal.position.set(0, 0, 0);
    // 花瓣从中心点出发，尖端朝外
    petal.rotation.y = -angle;
    petal.rotation.x = -Math.PI * 0.42; // 轻微上翘
    petal.position.x = Math.cos(angle) * S * 0.28;
    petal.position.z = Math.sin(angle) * S * 0.28;
    petal.rotation.y = -angle + Math.PI / 2;
    outerLayer.add(petal);
  }
  outerLayer.position.y = S * 0.42;
  group.add(outerLayer);

  // 内层花瓣（8 片，稍小，颜色更亮）
  const innerPetalShape = createPetalShape();
  const innerScale = 0.7;
  // 缩放内层花瓣形状
  const innerGeom = new THREE.ExtrudeGeometry(innerPetalShape, {
    depth: S * 0.03,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2
  });
  const innerCount = 8;
  const innerLayer = new THREE.Group();
  for (let i = 0; i < innerCount; i++) {
    const angle = (i / innerCount) * Math.PI * 2 + Math.PI / innerCount; // 错开角度
    const petal = new THREE.Mesh(innerGeom, createToonMaterial(0xffd54f));
    petal.castShadow = true;
    petal.receiveShadow = true;
    petal.scale.set(innerScale, innerScale, innerScale);
    petal.position.x = Math.cos(angle) * S * 0.14;
    petal.position.z = Math.sin(angle) * S * 0.14;
    petal.rotation.y = -angle + Math.PI / 2;
    petal.rotation.x = -Math.PI * 0.38;
    innerLayer.add(petal);
  }
  innerLayer.position.y = S * 0.44;
  group.add(innerLayer);

  // === 花盘（扁球体 + 种子纹理点） ===
  const discGeom = new THREE.SphereGeometry(S * 0.32, 20, 12);
  // 压扁成花盘形状
  const discMesh = new THREE.Mesh(discGeom, createToonMaterial(0x8d6e2e));
  discMesh.scale.set(1, 0.35, 1);
  discMesh.castShadow = true;
  discMesh.receiveShadow = true;
  discMesh.position.y = S * 0.43;
  // 添加描边
  const discOutlineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
  const discOutline = new THREE.Mesh(discGeom, discOutlineMaterial);
  discOutline.scale.set(1.03, 0.37, 1.03);
  discOutline.position.copy(discMesh.position);
  discOutline.castShadow = false;
  discOutline.receiveShadow = false;
  group.add(discMesh);
  group.add(discOutline);

  // 花盘中心小凸点（模拟种子）
  const seedGeom = new THREE.SphereGeometry(S * 0.04, 6, 4);
  const seedMaterial = createToonMaterial(0x5d4037);
  for (let r = 0; r < 4; r++) {
    const ringRadius = S * 0.06 * (r + 1);
    const count = 6 + r * 4;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + r * 0.3;
      const seed = new THREE.Mesh(seedGeom, seedMaterial);
      seed.position.set(
        Math.cos(angle) * ringRadius,
        S * 0.48,
        Math.sin(angle) * ringRadius
      );
      seed.scale.set(1, 0.5, 1);
      group.add(seed);
    }
  }

  // === 茎（渐变粗细） ===
  const stemTopGeom = new THREE.CylinderGeometry(S * 0.06, S * 0.07, S * 0.25, 8);
  const stemTop = createToonMesh(stemTopGeom, 0x4caf50, 0.02);
  stemTop.position.y = S * 0.3;
  group.add(stemTop);

  const stemMainGeom = new THREE.CylinderGeometry(S * 0.07, S * 0.08, S * 0.35, 8);
  const stemMain = createToonMesh(stemMainGeom, 0x388e3c, 0.02);
  stemMain.position.y = S * 0.1;
  group.add(stemMain);

  // === 叶片 ===
  const leafShape = createLeafShape();
  const leafExtrudeSettings = { depth: S * 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 };
  const leafGeom = new THREE.ExtrudeGeometry(leafShape, leafExtrudeSettings);

  // 左叶
  const leaf1Grp = new THREE.Group();
  const leaf1 = createToonMesh(leafGeom, 0x4caf50, 0.02);
  leaf1.rotation.x = -Math.PI / 2;
  leaf1Grp.add(leaf1);
  leaf1Grp.position.set(S * 0.2, S * 0.18, 0);
  leaf1Grp.rotation.z = 0.5;
  leaf1Grp.rotation.y = 0.3;
  group.add(leaf1Grp);

  // 右叶
  const leaf2Grp = new THREE.Group();
  const leaf2 = createToonMesh(leafGeom, 0x4caf50, 0.02);
  leaf2.rotation.x = -Math.PI / 2;
  leaf2Grp.add(leaf2);
  leaf2Grp.position.set(-S * 0.2, S * 0.18, 0);
  leaf2Grp.rotation.z = -0.5;
  leaf2Grp.rotation.y = -0.3;
  group.add(leaf2Grp);

  return group;
}

/**
 * 更新植物待机动画（呼吸 + 花瓣微动）
 */
export function updatePlantAnimation(plantGroup, time) {
  const breath = 1 + Math.sin(time * 2.2) * 0.03;
  plantGroup.scale.set(breath, breath, breath);
  plantGroup.rotation.z = Math.sin(time * 1.5) * 0.02;
  plantGroup.rotation.x = Math.cos(time * 1.7) * 0.015;
}
