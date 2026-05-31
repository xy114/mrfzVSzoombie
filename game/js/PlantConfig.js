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
    skillDescription: '发射一颗炽热的火焰豌豆，击中敌人后迸裂为烈焰风暴，灼烧周围3×3格内的所有僵尸，造成50法术伤害。冷却10s',
    unlockLevel: null,
    combat: { cost: 100, health: 100, shootInterval: 1500, damage: 20, bulletSpeed: 5,
      skillMaxCooldown: 10000 }
  },
  {
    id: 'nut',
    name: '坚果',
    emoji: '🥜',
    description: '坚固的防御植物，拥有极高的生命值',
    skillDescription: '激发潜能，获得+30护甲持续5秒，使受到的物理伤害显著降低（法术伤害不受影响）。冷却15s',
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
  },
  {
    id: 'cart',
    name: '小推车',
    emoji: '',
    description: '最后一道防线。当僵尸突破到草坪最左侧时自动启动，碾压整行敌人',
    unlockLevel: null,
    combat: { cost: 0, health: 0 }
  },
  // --- New plants (解锁条件 6-1, 暂不可解锁) ---
  {
    id: 'squash', name: '窝瓜', category: 'plant',
    description: '前方有敌人时跳起砸下，造成攻击力300%的物理伤害，随后消失',
    skillDescription: '陷入10秒眩晕，苏醒后攻击力永久提升50%。冷却15s',
    unlockLevel: '4-1', cost: 50, cooldownSec: 10,
    combat: {
      bodyType: 'plant', cost: 50, health: 150, damage: 80, attackInterval: 5000,
      skillCooldown: 15000, stunDuration: 10000, attackBoost: 0.5
    }
  },
  {
    id: 'jalapeno', name: '火爆辣椒', category: 'plant',
    description: '部署1.5秒后引爆整行，造成60+200%攻击力的法术伤害，随后消失',
    skillDescription: '',
    unlockLevel: '4-4', cost: 100, cooldownSec: 20,
    combat: { bodyType: 'plant', cost: 100, health: 100, damage: 180, deployTime: 1500 }
  },
  {
    id: 'repeater', name: '双重射手', category: 'plant',
    description: '每次射出2颗豌豆，造成物理伤害',
    skillDescription: '发射2颗穿透火豆，贯穿整行敌人，每颗造成攻击力150%的法术伤害。冷却10s',
    unlockLevel: '5-3', cost: 200, cooldownSec: 10,
    combat: { bodyType: 'plant', cost: 200, health: 150, damage: 30, peaDamage: 30, peaSpeed: 8,
      skillCooldown: 10000, firePeaDamage: 30 }
  },
  {
    id: 'twinsunflower', name: '双胞向日葵', category: 'plant',
    description: '每次产出2个阳光，每个25阳光，间隔10秒',
    skillDescription: '锁定当前阳光余额的40%（单次上限200），释放太阳光束照射整行3秒，每秒造成等额法术伤害。冷却15s',
    unlockLevel: null, crystalCost: 4000, cost: 150, cooldownSec: 10,
    combat: { bodyType: 'plant', cost: 150, health: 200, sunInterval: 10000, sunAmount: 25,
      skillCooldown: 15000, beamDuration: 3000 }
  },
  {
    id: 'gatlingpea', name: '机枪射手', category: 'plant',
    description: '每次射出4颗豌豆，造成物理伤害',
    skillDescription: '召唤5行火豆弹幕，每行5发，每发造成50+100%攻击力的法术伤害。冷却15s',
    unlockLevel: null, crystalCost: 4000, cost: 300, cooldownSec: 10,
    combat: { bodyType: 'plant', cost: 300, health: 200, damage: 40, peaDamage: 40, peaSpeed: 8, bulletCount: 4,
      skillCooldown: 15000, firePeaPerRow: 5 }
  }
];

export const STAR_CONFIG = {
  1: { healthMult: 1.0, damageMult: 1.0, cooldownMult: 1.0 },
  2: { healthMult: 1.25, damageMult: 1.2, cooldownMult: 0.9 },
  3: { healthMult: 1.6, damageMult: 1.5, cooldownMult: 0.75 }
};

export const STAR_COST = { '1-2': 100, '2-3': 300 };

export const SKIN_DEFS = {
  sunflower: [
    {
      id: 'default', name: '原皮', emoji: '🌻', category: 'original',
      description: '生产阳光的基础植物，每7秒产出25阳光',
      skillDescription: '', cost: 0, owned: true, combat: {}
    }
  ],
  peashooter: [
    {
      id: 'default', name: '原皮', emoji: '🫛', category: 'original',
      description: '发射豌豆攻击前方僵尸，造成物理伤害',
      skillDescription: '发射一颗炽热的火焰豌豆，击中敌人后迸裂为烈焰风暴，灼烧周围3×3格内的所有僵尸，造成50法术伤害。冷却10s',
      cost: 0, owned: true, combat: {}
    },
    {
      id: 'wishadel', name: '维什戴尔', emoji: '💥', category: 'derived',
      description: '异界的轰鸣点燃草坪，碾碎不识好歹的敌人',
      skillDescription: '锁定同行最近敌人，瞄准后发射追踪爆弹。命中后引发5×5格热压爆炸（四角除外），造成120物理伤害并短暂眩晕。冷却10s',
      attackBonus: 20, cost: 9000, owned: false,
      combat: {
        skillDamage: 120, skillCooldown: 10000,
        skillDamageType: 'physical',
        shellSpeed: 22, aimDuration: 600,
        explosionRadius: 2.5, peaDamage: 25,
        peaSpeed: 22, peaAttackBonus: 20,
        bodyType: 'humanoid'
      }
    }
  ],
  nut: [
    {
      id: 'default', name: '原皮', emoji: '🥜', category: 'original',
      description: '坚固的防御植物，拥有极高的生命值',
      skillDescription: '激发潜能，获得+30护甲持续5秒，使受到的物理伤害显著降低（法术伤害不受影响）。冷却15s',
      cost: 0, owned: true, combat: {}
    }
  ],
  cherrybomb: [
    {
      id: 'default', name: '原皮', emoji: '🍒', category: 'original',
      description: '一次性爆炸植物，以自身为代价摧毁成片僵尸',
      skillDescription: '部署后进入1.5秒备战状态，随后引爆自身，对3×3格范围造成攻击力400%的巨额物理伤害',
      cost: 0, owned: true, combat: {}
    }
  ],
  katana_zero: [
    {
      id: 'default', name: '原皮', emoji: '⚔️', category: 'original',
      description: '异界来客，以太刀斩裂时空',
      skillDescription: '', cost: 0, owned: true, combat: {}
    }
  ],
  cart: [
    {
      id: 'default', name: '原皮', emoji: '', category: 'original',
      description: '朴实的推车，可靠的清行工具',
      skillDescription: '压扁面前的所有僵尸',
      cost: 0, owned: true, combat: {}
    },
    {
      id: 'fireChen', name: '火陈', emoji: '', category: 'derived',
      description: '书刀一笔，裁剪岁月，天喟之剑，当明则明',
      skillDescription: '剑气冲霄，化为巨龙荡涤全场，一击致命',
      cost: 15000, owned: false, combat: {
        bodyType: 'humanoid',
        dragonSpeed: 5,
        attackAnimDuration: 1000,
        dragonSpawnDelay: 500
      }
    }
  ],
  squash: [
    { id: 'default', name: '原皮', category: 'default', description: '', skillDescription: '', cost: 0, owned: true, combat: {} }
  ],
  jalapeno: [
    { id: 'default', name: '原皮', category: 'default', description: '', skillDescription: '', cost: 0, owned: true, combat: {} }
  ],
  repeater: [
    { id: 'default', name: '原皮', category: 'default', description: '', skillDescription: '', cost: 0, owned: true, combat: {} }
  ],
  twinsunflower: [
    { id: 'default', name: '原皮', category: 'default', description: '', skillDescription: '', cost: 0, owned: true, combat: {} }
  ],
  gatlingpea: [
    { id: 'default', name: '原皮', category: 'default', description: '', skillDescription: '', cost: 0, owned: true, combat: {} }
  ]
};

// --- Dynamic description system: auto-generate descriptions from combat data ---

function fmt(val) { return Math.round(val); }

export function getFormattedDescription(def) {
  if (!def || !def.combat) return def ? def.description : '';
  const c = def.combat;
  switch (def.id) {
    case 'sunflower':
      return `每次产出1个阳光（${c.sunAmount || 25}阳光），间隔${(c.sunInterval || 7000) / 1000}秒`;
    case 'peashooter':
      return `每次射出1颗豌豆，造成${c.damage || 20}点物理伤害，间隔${((c.shootInterval || 1500) / 1000).toFixed(1)}秒`;
    case 'nut':
      return `拥有${c.health || 400}点生命值的高防御植物`;
    case 'cherrybomb':
      return `部署${(c.armingTime || 1500) / 1000}秒后引爆，对3×3格造成攻击力400%（${fmt((c.damage || 50) * 4)}点）的物理伤害，随后消失`;
    case 'cart':
      return '最后一道防线。当僵尸突破到草坪最左侧时自动启动，碾压整行敌人';
    case 'squash':
      return `前方有敌人时跳起砸下，造成攻击力300%（${fmt((c.damage || 80) * 3)}点）的物理伤害，随后消失`;
    case 'jalapeno':
      return `部署${(c.deployTime || 1500) / 1000}秒后引爆整行，造成${fmt(60 + (c.damage || 180) * 2)}点法术伤害，随后消失`;
    case 'repeater':
      return `每次射出2颗豌豆，每颗造成${c.peaDamage || 30}点物理伤害`;
    case 'twinsunflower':
      return `每次产出2个阳光（每个${c.sunAmount || 25}阳光），间隔${(c.sunInterval || 10000) / 1000}秒`;
    case 'gatlingpea':
      return `每次射出${c.bulletCount || 4}颗豌豆，每颗造成${c.peaDamage || 40}点物理伤害`;
    default:
      return def.description || '';
  }
}

export function getFormattedSkillDescription(def) {
  if (!def || !def.combat) return def ? (def.skillDescription || '') : '';
  const c = def.combat;
  switch (def.id) {
    case 'peashooter':
      return `发射一颗火焰豌豆，击中后3×3格爆炸，造成50点法术伤害。冷却${(c.skillMaxCooldown || 10000) / 1000}s`;
    case 'nut':
      return `激发潜能，获得+${c.skillDefenseBonus || 30}护甲持续${(c.skillDuration || 5000) / 1000}秒，受到的物理伤害降低。冷却${(c.skillMaxCooldown || 15000) / 1000}s`;
    case 'cherrybomb':
      return `部署后进入${(c.armingTime || 1500) / 1000}秒备战状态，随后引爆自身，对3×3格范围造成攻击力400%（${fmt((c.damage || 50) * 4)}点）的巨额物理伤害`;
    case 'squash':
      return `陷入${(c.stunDuration || 10000) / 1000}秒眩晕，苏醒后攻击力永久提升${fmt((c.attackBoost || 0.5) * 100)}%。冷却${(c.skillCooldown || 15000) / 1000}s`;
    case 'jalapeno':
      return '';
    case 'repeater':
      return `发射2颗穿透火豆，贯穿整行敌人，每颗造成攻击力150%（${fmt((c.firePeaDamage || 30) * 1.5)}点）的法术伤害。冷却${(c.skillCooldown || 10000) / 1000}s`;
    case 'twinsunflower':
      return `锁定当前阳光余额的40%（单次上限200），释放太阳光束照射整行${(c.beamDuration || 3000) / 1000}秒，每秒造成等额法术伤害。冷却${(c.skillCooldown || 15000) / 1000}s`;
    case 'gatlingpea':
      return `召唤5行火豆弹幕，每行${c.firePeaPerRow || 5}发，每发造成${fmt(50 + (c.peaDamage || 40))}点法术伤害。冷却${(c.skillCooldown || 15000) / 1000}s`;
    case 'cart':
      return '';
    default:
      return def.skillDescription || '';
  }
}

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
  if (!skinId) skinId = 'default';
  return skins.find(s => s.id === skinId) || null;
}
