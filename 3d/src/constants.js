// 从 game/js/constants.js 手动复制，保持 3d/ 文件夹独立运行
export const GAME_CONFIG = {
  CANVAS_WIDTH: 900,
  CANVAS_HEIGHT: 540,
  LAWN_ROWS: 5,
  LAWN_COLS: 9,
  CELL_WIDTH: 100,
  CELL_HEIGHT: 108,
  FPS: 60
};

// 世界空间尺寸（与 Canvas 像素 1:1 映射）
export const WORLD_WIDTH = GAME_CONFIG.CANVAS_WIDTH;   // 900
export const WORLD_HEIGHT = GAME_CONFIG.CANVAS_HEIGHT; // 540

// 草坪在世界空间中的偏移量（左上角为原点时使用）
export const LAWN_LEFT = -WORLD_WIDTH / 2;   // -450
export const LAWN_TOP = -WORLD_HEIGHT / 2;    // -270

// 植物占位尺寸（参考 PlantConfig 默认 renderSize=80）
export const PLANT_SIZE = 40;  // 半径

// 僵尸占位尺寸
export const ZOMBIE_WIDTH = 40;
export const ZOMBIE_HEIGHT = 60;
