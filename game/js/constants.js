export const GAME_CONFIG = {
  CANVAS_WIDTH: 900,
  CANVAS_HEIGHT: 540,
  LAWN_ROWS: 5,
  LAWN_COLS: 9,
  CELL_WIDTH: 100,
  CELL_HEIGHT: 108,
  FPS: 60
};

export const PLANT_TYPES = {
  SUNFLOWER: { name: 'sunflower', cost: 50, cooldown: 5000 },
  PEASHOOTER: { name: 'peashooter', cost: 100, cooldown: 5000 }
};

export const ZOMBIE_TYPES = {
  NORMAL: { name: 'normal', health: 100, speed: 0.3 },
  CONE: { name: 'cone', health: 200, speed: 0.3 }
};

export const BULLET_CONFIG = {
  PEASHOOTER: { speed: 5, damage: 20 },
  FIRE_PEA: { speed: 7, damage: 50, explosionRadius: 1.5 }
};

export const SUN_CONFIG = {
  INITIAL: 150,
  SUNFLOWER_INTERVAL: 7000,
  SUN_VALUE: 25,
  SPAWN_INTERVAL: 10000
};