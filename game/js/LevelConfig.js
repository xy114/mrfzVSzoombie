export const PRELUDES = [
  {
    id: 'prelude1',
    name: '序曲 I — 初醒',
    levels: [
      { id: '1-1', name: '1-1', waves: 3, zombieTypes: ['normal'], startSun: 200, baseCrystalReward: 3, unlockPlant: null },
      { id: '1-2', name: '1-2', waves: 5, zombieTypes: ['normal', 'cone'], startSun: 150, baseCrystalReward: 5, unlockPlant: 'peashooter' },
      { id: '1-3', name: '1-3', waves: 6, zombieTypes: ['normal', 'cone'], startSun: 150, baseCrystalReward: 7, unlockPlant: null }
    ]
  },
  {
    id: 'prelude2',
    name: '序曲 II — 暗潮',
    levels: [
      { id: '2-1', name: '2-1', waves: 4, zombieTypes: ['normal', 'cone'], startSun: 200, baseCrystalReward: 5, unlockPlant: null },
      { id: '2-2', name: '2-2', waves: 6, zombieTypes: ['cone'], startSun: 150, baseCrystalReward: 8, unlockPlant: null },
      { id: '2-3', name: '2-3', waves: 8, zombieTypes: ['normal', 'cone'], startSun: 150, baseCrystalReward: 10, unlockPlant: null }
    ]
  },
  {
    id: 'prelude3',
    name: '序曲 III — 破晓',
    levels: [
      { id: '3-1', name: '3-1', waves: 5, zombieTypes: ['normal', 'cone'], startSun: 200, baseCrystalReward: 6, unlockPlant: null },
      { id: '3-2', name: '3-2', waves: 7, zombieTypes: ['normal', 'cone'], startSun: 150, baseCrystalReward: 9, unlockPlant: null },
      { id: '3-3', name: '3-3', waves: 10, zombieTypes: ['normal', 'cone'], startSun: 150, baseCrystalReward: 12, unlockPlant: null }
    ]
  }
];

export function getPreludes() { return PRELUDES; }

export function getLevel(levelId) {
  for (const prelude of PRELUDES) {
    for (const level of prelude.levels) {
      if (level.id === levelId) return level;
    }
  }
  return null;
}

export function getAllLevelIds() {
  const ids = [];
  for (const prelude of PRELUDES) {
    for (const level of prelude.levels) {
      ids.push(level.id);
    }
  }
  return ids;
}

export function getUnlockPlantForLevel(levelId) {
  const level = getLevel(levelId);
  return level ? level.unlockPlant : null;
}
