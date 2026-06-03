import * as THREE from 'three';

/**
 * 创建卡通赛璐璐材质
 * MeshToonMaterial 自带色阶过渡（默认 3 阶），减少中间调呈现动画质感
 * @param {number|string} color - 颜色值
 * @returns {THREE.MeshToonMaterial}
 */
export function createToonMaterial(color) {
  return new THREE.MeshToonMaterial({
    color: color,
    // 不设置 gradientMap 则使用默认 3 阶梯度
  });
}

/**
 * 反 hull 法描边
 * 复制模型几何体，放大后从背面渲染纯黑色，形成轮廓线
 * 适用于凸面体（球、盒、柱），性能优于后处理方案
 *
 * @param {THREE.Mesh} mesh - 待描边的网格
 * @param {number} [color=0x000000] - 描边颜色
 * @param {number} [thickness=0.03] - 描边厚度（相对于模型尺寸的比例）
 * @returns {THREE.Group} 包含原 mesh 和描边 mesh 的组
 */
export function addOutline(mesh, color = 0x000000, thickness = 0.03) {
  // 创建描边 mesh：使用相同几何体，纯黑材质，仅渲染背面
  const outlineMaterial = new THREE.MeshBasicMaterial({
    color: color,
    side: THREE.BackSide  // 关键：只渲染背面，防止遮挡原模型
  });

  const outlineMesh = new THREE.Mesh(mesh.geometry, outlineMaterial);
  outlineMesh.scale.setScalar(1 + thickness);
  outlineMesh.castShadow = false;
  outlineMesh.receiveShadow = false;

  const group = new THREE.Group();
  group.add(mesh);
  group.add(outlineMesh);

  return group;
}

/**
 * 便捷函数：创建带描边的卡通网格
 * @param {THREE.BufferGeometry} geometry
 * @param {number|string} color
 * @param {number} [outlineThickness=0.03]
 * @returns {THREE.Group}
 */
export function createToonMesh(geometry, color, outlineThickness = 0.03) {
  const material = createToonMaterial(color);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return addOutline(mesh, 0x000000, outlineThickness);
}
