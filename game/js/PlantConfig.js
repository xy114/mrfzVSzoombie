export const PLANT_DEFS = [
  {
    id: 'sunflower',
    name: '向日葵',
    emoji: '🌻',
    description: '生产阳光的基础植物，每7秒产出25阳光',
    unlockLevel: null,
    combat: { cost: 50, health: 100, sunInterval: 7000 }
  },
  {
    id: 'peashooter',
    name: '豌豆射手',
    emoji: '🫛',
    description: '发射豌豆攻击前方僵尸',
    unlockLevel: null,
    combat: { cost: 100, health: 100, shootInterval: 1500, damage: 20, bulletSpeed: 5,
      skillMaxCooldown: 10000 }
  },
  {
    id: 'nut',
    name: '坚果',
    emoji: '🥜',
    description: '坚固的防御植物，技能：短时间内防御力大幅提升',
    unlockLevel: '1-2',
    combat: { cost: 50, health: 400,
      skillMaxCooldown: 15000, skillDefenseBonus: 30, skillDuration: 5000 }
  },
  {
    id: 'cherrybomb',
    name: '樱桃炸弹',
    emoji: '🍒',
    description: '一次性爆炸植物，对3x3范围造成巨额伤害',
    unlockLevel: '1-3',
    combat: { cost: 150, health: 100, explosionDamage: 200, explosionRadius: 3, armingTime: 1500 }
  }
];

export const STAR_CONFIG = {
  1: { healthMult: 1.0, damageMult: 1.0, cooldownMult: 1.0 },
  2: { healthMult: 1.25, damageMult: 1.2, cooldownMult: 0.9 },
  3: { healthMult: 1.6, damageMult: 1.5, cooldownMult: 0.75 }
};

export const STAR_COST = { '1-2': 100, '2-3': 300 };

export const SKIN_DEFS = {
  peashooter: [
    {
      id: 'wishadel',
      name: '维什戴尔',
      emoji: '💥',
      description: '异界的轰鸣点燃草坪，碾碎不识好歹的敌人',
      cost: 300,
      owned: true
    }
  ]
};

export function getPlantDef(plantId) {
  return PLANT_DEFS.find(p => p.id === plantId) || null;
}

export function getAllPlantDefs() {
  return PLANT_DEFS;
}

export function getStarMultiplier(starLevel) {
  return STAR_CONFIG[starLevel] || STAR_CONFIG[1];
}

export function getStarCost(fromStar, toStar) {
  const key = `${fromStar}-${toStar}`;
  return STAR_COST[key] || Infinity;
}

export function getSkins(plantId) {
  return SKIN_DEFS[plantId] || [];
}

export function getSkin(plantId, skinId) {
  const skins = getSkins(plantId);
  return skins.find(s => s.id === skinId) || null;
}
