export const PRELUDES = [
  {
    id: 'prelude1',
    name: '序曲 I — 初醒',
    levels: [
      { id: '1-1', name: '1-1', waves: 3, zombieTypes: ['normal'], startSun: 200, baseCrystalReward: 3, unlockPlant: null },
      { id: '1-2', name: '1-2', waves: 5, zombieTypes: ['normal', 'cone'], startSun: 150, baseCrystalReward: 5, unlockPlant: 'nut' },
      { id: '1-3', name: '1-3', waves: 6, zombieTypes: ['normal', 'cone', 'shield'], startSun: 150, baseCrystalReward: 7, unlockPlant: 'cherrybomb' }
    ]
  },
  {
    id: 'prelude2',
    name: '序曲 II — 暗潮',
    levels: [
      { id: '2-1', name: '2-1', waves: 4, zombieTypes: ['normal', 'imp'], startSun: 200, baseCrystalReward: 5, unlockPlant: 'cherrybomb' },
      { id: '2-2', name: '2-2', waves: 6, zombieTypes: ['cone', 'shield', 'imp'], startSun: 150, baseCrystalReward: 8, unlockPlant: null },
      { id: '2-3', name: '2-3', waves: 8, zombieTypes: ['normal', 'cone', 'shield', 'imp'], startSun: 150, baseCrystalReward: 10, unlockPlant: null }
    ]
  },
  {
    id: 'prelude3',
    name: '序曲 III — 破晓',
    levels: [
      { id: '3-1', name: '3-1', waves: 5, zombieTypes: ['normal', 'cone', 'shield', 'imp'], startSun: 200, baseCrystalReward: 6, unlockPlant: null },
      { id: '3-2', name: '3-2', waves: 7, zombieTypes: ['normal', 'cone', 'shield', 'imp'], startSun: 150, baseCrystalReward: 9, unlockPlant: null },
      { id: '3-3', name: '3-3', waves: 10, zombieTypes: ['normal', 'cone', 'shield', 'imp'], startSun: 150, baseCrystalReward: 12, unlockPlant: null }
    ]
  },
  {
    id: 'prelude4',
    name: '序曲 IV — 重甲',
    levels: [
      { id: '4-1', name: '4-1', waves: 3, zombieTypes: ['normal'], startSun: 200, baseCrystalReward: 5, unlockPlant: 'squash' },
      { id: '4-2', name: '4-2', waves: 4, zombieTypes: ['normal', 'cone', 'bucket'], startSun: 150, baseCrystalReward: 7, unlockPlant: null },
      { id: '4-3', name: '4-3', waves: 5, zombieTypes: ['normal', 'cone', 'shield', 'bucket'], startSun: 150, baseCrystalReward: 9, unlockPlant: null },
      { id: '4-4', name: '4-4', waves: 6, zombieTypes: ['cone', 'shield', 'imp', 'bucket'], startSun: 150, baseCrystalReward: 12, unlockPlant: 'jalapeno' },
      { id: '4-5', name: '4-5', waves: 7, zombieTypes: ['normal', 'cone', 'shield', 'imp', 'bucket'], startSun: 150, baseCrystalReward: 15, unlockPlant: null }
    ]
  },
  {
    id: 'prelude5',
    name: '序曲 V — 爆裂',
    levels: [
      { id: '5-1', name: '5-1', waves: 3, zombieTypes: ['normal', 'cone'], startSun: 200, baseCrystalReward: 6, unlockPlant: null },
      { id: '5-2', name: '5-2', waves: 4, zombieTypes: ['normal', 'cone', 'clown'], startSun: 150, baseCrystalReward: 8, unlockPlant: null },
      { id: '5-3', name: '5-3', waves: 5, zombieTypes: ['normal', 'cone', 'shield', 'clown'], startSun: 150, baseCrystalReward: 10, unlockPlant: 'repeater' },
      { id: '5-4', name: '5-4', waves: 6, zombieTypes: ['cone', 'shield', 'imp', 'clown'], startSun: 150, baseCrystalReward: 13, unlockPlant: null },
      { id: '5-5', name: '5-5', waves: 8, zombieTypes: ['normal', 'cone', 'shield', 'imp', 'bucket', 'clown'], startSun: 150, baseCrystalReward: 20, unlockPlant: null }
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
