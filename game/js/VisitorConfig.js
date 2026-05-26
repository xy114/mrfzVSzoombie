export const VISITOR_DEFS = [
  {
    id: 'katana_zero',
    name: '武士零',
    displayName: '武士零',
    description: '时空中游走的刀锋<br>在另一个世界也能出鞘<br>——来自Katana Zero',
    category: 'visitor',
    combat: {
      health: 300,
      attack: 0,
      activeSkillDamage: 50,
      activeSkillHpRatio: 0.10,
      activeSkillSlashes: 10,
      activeSkillCooldown: 10000,
      activeSkillDuration: 5000,
      passiveSkillDamage: 100,
      passiveSkillHpRatio: 0.70,
      passiveSkillCooldown: 3000,
      passiveSkillDuration: 1300
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

// 每个异客在各卡面尺寸下的位置偏移（原始图像像素，应用时需乘以缩放比）
const VISITOR_CARD_OFFSETS = {
  katana_zero: {
    squadSlot:    { x: 0, y: 0 },       // 编队槽位 56×70
    pickerCard:   { x: 0, y: 0 },       // 选择器 64×84
    combatCard:   { x: 0, y: 0 },       // 战斗卡面 72×96
    displaySelect:{ x: 0, y: 0 },       // 展示选择 60×78
    handbookDetail:{ x: 0, y: 0 },      // 图鉴详情 200×260
    handbookCard: { x: 0, y: 0 },       // 图鉴卡面 168×139
  }
};

export function getVisitorCardOffset(visitorId, cardType) {
  const v = VISITOR_CARD_OFFSETS[visitorId];
  if (!v) return { x: 0, y: 0 };
  return v[cardType] || { x: 0, y: 0 };
}
