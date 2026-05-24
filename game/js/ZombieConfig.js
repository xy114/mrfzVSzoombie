export const ZOMBIE_DEFS = [
  {
    id: 'normal',
    name: '普通僵尸',
    emoji: '🧟',
    description: '最常见的感染者，行动迟缓但数量众多。基础威胁单位。',
    health: 100, defense: 0, magicResist: 0,
    speed: 0.3, damage: 20, attackInterval: 1000,
    threatLevel: 1, category: 'normal',
    firstEncounterLevel: '1-1'
  },
  {
    id: 'cone',
    name: '路障僵尸',
    emoji: '🚧',
    description: '戴着路障的感染者，拥有更高的生命值，需要更多火力才能击倒。',
    health: 200, defense: 0, magicResist: 0,
    speed: 0.3, damage: 20, attackInterval: 1000,
    threatLevel: 2, category: 'normal',
    firstEncounterLevel: '1-2'
  },
  {
    id: 'shield',
    name: '持盾僵尸',
    emoji: '🛡️',
    description: '装备盾牌的感染者，物理防御极高，但无法抵挡法术伤害。',
    health: 180, defense: 15, magicResist: 0,
    speed: 0.25, damage: 20, attackInterval: 1000,
    threatLevel: 2, category: 'elite',
    firstEncounterLevel: '1-3'
  },
  {
    id: 'imp',
    name: '小僵尸',
    emoji: '👾',
    description: '体型小巧的感染者，移动速度极快但生命值低，容易成群出现。',
    health: 60, defense: 0, magicResist: 0,
    speed: 0.6, damage: 15, attackInterval: 800,
    threatLevel: 1, category: 'normal',
    firstEncounterLevel: '2-1'
  }
];

export function getZombieDef(zombieId) {
  return ZOMBIE_DEFS.find(z => z.id === zombieId) || null;
}

export function getAllZombieDefs() {
  return ZOMBIE_DEFS;
}

export function getZombiesByCategory(category) {
  return ZOMBIE_DEFS.filter(z => z.category === category);
}

export function getThreatLabel(zombieDef) {
  if (zombieDef.category === 'boss') return { text: '极高', class: 'threat-extreme' };
  if (zombieDef.category === 'elite' || zombieDef.threatLevel >= 3) return { text: '精英敌人', class: 'threat-elite' };
  return { text: '普通敌人', class: 'threat-normal' };
}
