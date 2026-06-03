import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createToonMaterial } from './toon-material.js';
import * as THREE from 'three';

const loader = new GLTFLoader();

/**
 * 加载 glTF/GLB 模型并应用卡通材质
 * @param {string} url - 模型文件路径
 * @returns {Promise<THREE.Group>} 加载完成的模型组
 */
export function loadModel(url) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;

        // 遍历所有 mesh，替换为卡通材质 + 添加描边
        model.traverse((child) => {
          if (child.isMesh) {
            const originalColor = child.material.color
              ? child.material.color.getHex()
              : 0xcccccc;
            child.material = createToonMaterial(originalColor);
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        resolve(model);
      },
      (progress) => {
        if (progress.total > 0) {
          console.log(`模型加载: ${Math.round((progress.loaded / progress.total) * 100)}%`);
        }
      },
      (error) => {
        console.error('模型加载失败:', error);
        reject(error);
      }
    );
  });
}

/**
 * 加载模型文件列表
 * @param {Array<{name: string, url: string}>} manifest - 模型清单
 * @returns {Promise<Object>} { name: THREE.Group }
 */
export async function loadModelBatch(manifest) {
  const results = {};
  const promises = manifest.map(async ({ name, url }) => {
    try {
      results[name] = await loadModel(url);
      console.log(`已加载: ${name}`);
    } catch (err) {
      console.warn(`加载失败: ${name}`, err.message);
      results[name] = null;
    }
  });
  await Promise.all(promises);
  return results;
}
