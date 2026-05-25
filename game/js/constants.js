export const GAME_CONFIG = {
  CANVAS_WIDTH: 900,
  CANVAS_HEIGHT: 540,
  LAWN_ROWS: 5,
  LAWN_COLS: 9,
  CELL_WIDTH: 100,
  CELL_HEIGHT: 108,
  FPS: 60,
  TIME_PANEL: 0.25,
  TIME_STOP: 0.05
};

export const PLANT_TYPES = {
  SUNFLOWER: { name: 'sunflower', cost: 50, cooldown: 5000 },
  PEASHOOTER: { name: 'peashooter', cost: 100, cooldown: 5000 },
  NUT: { name: 'nut', cost: 50, cooldown: 15000 },
  CHERRY_BOMB: { name: 'cherrybomb', cost: 150, cooldown: 30000 }
};

export const ZOMBIE_TYPES = {
  NORMAL: { name: 'normal', health: 100, speed: 0.3, defense: 0, magicResist: 0 },
  CONE: { name: 'cone', health: 200, speed: 0.3, defense: 0, magicResist: 0 },
  SHIELD: { name: 'shield', health: 180, speed: 0.25, defense: 15, magicResist: 0 },
  IMP: { name: 'imp', health: 60, speed: 0.6, defense: 0, magicResist: 0 }
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

export const STAR_CONFIG = {
  1: { healthMult: 1.0, damageMult: 1.0, cooldownMult: 1.0 },
  2: { healthMult: 1.25, damageMult: 1.2, cooldownMult: 0.9 },
  3: { healthMult: 1.6, damageMult: 1.5, cooldownMult: 0.75 }
};

export const SKIN_CONFIG = {
  peashooter: {
    flame_emperor: {
      firePeaDamage: 80,
      skillCooldown: 8000
    }
  }
};
