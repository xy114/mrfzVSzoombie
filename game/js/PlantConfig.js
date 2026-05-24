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
    description: '发射豌豆攻击前方僵尸，技能：火焰豌豆',
    unlockLevel: null,
    combat: { cost: 100, health: 100, shootInterval: 1500, damage: 20, bulletSpeed: 5,
      skillMaxCooldown: 10000, skillDamage: 50, explosionRadius: 1.5 }
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
      id: 'flame_emperor',
      name: '焰皇',
      cost: 200,
      emoji: '🔥',
      effects: { firePeaDamage: 80, skillCooldown: 8000 },
      description: '火焰豌豆伤害+30，冷却-2秒'
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
