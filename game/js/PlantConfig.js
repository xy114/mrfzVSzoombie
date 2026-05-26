export const PLANT_DEFS = [
  {
    id: 'sunflower',
    name: '向日葵',
    emoji: '🌻',
    description: '生产阳光的基础植物，每7秒产出25阳光。升星可缩短生产间隔',
    unlockLevel: null,
    combat: { cost: 50, health: 100, sunInterval: 7000 }
  },
  {
    id: 'peashooter',
    name: '豌豆射手',
    emoji: '🫛',
    description: '发射豌豆攻击前方僵尸，造成物理伤害',
    skillDescription: '发射一颗炽热的火焰豌豆，击中敌人后迸裂为烈焰风暴，灼烧周围3×3格内的所有僵尸，造成法术伤害',
    unlockLevel: null,
    combat: { cost: 100, health: 100, shootInterval: 1500, damage: 20, bulletSpeed: 5,
      skillMaxCooldown: 10000 }
  },
  {
    id: 'nut',
    name: '坚果',
    emoji: '🥜',
    description: '坚固的防御植物，拥有极高的生命值',
    skillDescription: '激发潜能，获得+30护甲持续5秒，使受到的物理伤害显著降低（法术伤害不受影响）',
    unlockLevel: '1-2',
    combat: { cost: 50, health: 400,
      skillMaxCooldown: 15000, skillDefenseBonus: 30, skillDuration: 5000 }
  },
  {
    id: 'cherrybomb',
    name: '樱桃炸弹',
    emoji: '🍒',
    description: '一次性爆炸植物，以自身为代价摧毁成片僵尸',
    skillDescription: '部署后进入1.5秒备战状态，随后引爆自身，对3×3格范围造成攻击力400%的巨额物理伤害',
    unlockLevel: '1-3',
    combat: { cost: 150, health: 100, damage: 50, explosionRadius: 3, armingTime: 1500 }
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
      skillDescription: '锁定同行最近敌人，瞄准后发射追踪爆弹。命中后引发5×5格热压爆炸（四角除外），造成巨额法术伤害并短暂眩晕',
      attackBonus: 20,
      cost: 9000,
      owned: false
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
