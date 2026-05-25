export const VISITOR_DEFS = [
  {
    id: 'katana_zero',
    name: '武士零',
    displayName: '???',
    description: '似乎是来自世界之外的力量',
    category: 'visitor',
    combat: {
      health: 300,
      attack: 0,
      activeSkillDamage: 50,
      activeSkillHpRatio: 0.10,
      activeSkillSlashes: 10,
      activeSkillCooldown: 10000,
      activeSkillDuration: 500,
      passiveSkillDamage: 100,
      passiveSkillHpRatio: 0.70,
      passiveSkillCooldown: 3000,
      passiveSkillDuration: 300
    },
    unlockLevel: null,
    assets: {
      normal: 'visitor_katana_zero',
      timeStop: 'visitor_katana_zero_time',
      slash: 'visitor_slash'
    }
  }
];

export const VISITOR_PLACEHOLDER_IDS = ['visitor_placeholder_1', 'visitor_placeholder_2', 'visitor_placeholder_3'];

export function getVisitorDef(visitorId) {
  return VISITOR_DEFS.find(v => v.id === visitorId) || null;
}

export function getAllVisitorDefs() {
  return VISITOR_DEFS;
}

export function getVisitorDisplayName(visitorId) {
  const def = getVisitorDef(visitorId);
  return def ? def.displayName : '???';
}
