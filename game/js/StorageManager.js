import { getPlantDef } from './PlantConfig.js';

const SAVE_KEY = 'mrfzvs_save';

const DEFAULT_SAVE = {
  crystals: 0,
  plantStars: { sunflower: 1, peashooter: 1 },
  plantSkins: { peashooter: null },
  ownedSkins: { peashooter: [] },
  completedLevels: {},
  encounteredEnemies: [],
  devMode: false,
  displayPlant: 'sunflower'
};

let saveData = null;

export const StorageManager = {
  load() {
    if (saveData) return saveData;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        saveData = JSON.parse(raw);
        for (const key of Object.keys(DEFAULT_SAVE)) {
          if (!(key in saveData)) saveData[key] = DEFAULT_SAVE[key];
        }
      } else {
        saveData = { ...DEFAULT_SAVE, plantStars: { ...DEFAULT_SAVE.plantStars }, plantSkins: { ...DEFAULT_SAVE.plantSkins }, ownedSkins: { ...DEFAULT_SAVE.ownedSkins }, completedLevels: {}, encounteredEnemies: [] };
      }
    } catch (e) {
      saveData = { ...DEFAULT_SAVE, plantStars: { ...DEFAULT_SAVE.plantStars }, plantSkins: { ...DEFAULT_SAVE.plantSkins }, ownedSkins: { ...DEFAULT_SAVE.ownedSkins }, completedLevels: {}, encounteredEnemies: [] };
    }
    return saveData;
  },

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
      console.warn('Failed to save:', e);
    }
  },

  getCrystals() { return saveData.crystals; },
  addCrystals(n) { saveData.crystals += n; this.save(); return saveData.crystals; },
  spendCrystals(n) {
    if (saveData.crystals >= n) { saveData.crystals -= n; this.save(); return true; }
    return false;
  },

  getPlantStar(plantId) { return saveData.plantStars[plantId] || 1; },
  upgradePlantStar(plantId) {
    const current = saveData.plantStars[plantId] || 1;
    if (current >= 3) return false;
    saveData.plantStars[plantId] = current + 1;
    this.save();
    return current + 1;
  },

  isPlantUnlocked(plantId) {
    if (saveData.devMode) return true;
    const def = getPlantDef(plantId);
    if (!def) return false;
    if (def.unlockLevel === null) return true;
    return this.isLevelCompleted(def.unlockLevel);
  },

  getEquippedSkin(plantId) { return saveData.plantSkins[plantId] || null; },
  equipSkin(plantId, skinId) { saveData.plantSkins[plantId] = skinId; this.save(); },
  ownsSkin(plantId, skinId) { return (saveData.ownedSkins[plantId] || []).includes(skinId); },
  addSkin(plantId, skinId) {
    if (!saveData.ownedSkins[plantId]) saveData.ownedSkins[plantId] = [];
    if (!saveData.ownedSkins[plantId].includes(skinId)) {
      saveData.ownedSkins[plantId].push(skinId);
    }
    this.save();
  },

  isLevelCompleted(levelId) { return levelId in saveData.completedLevels; },
  isLevelUnlocked(levelId) {
    if (saveData.devMode) return true;
    const [prelude, level] = levelId.split('-').map(Number);
    if (level === 1) return true;
    const prevId = `${prelude}-${level - 1}`;
    return this.isLevelCompleted(prevId);
  },
  completeLevel(levelId, data) {
    saveData.completedLevels[levelId] = data;
    this.save();
  },

  getDisplayPlant() { return saveData.displayPlant; },
  setDisplayPlant(plantId) { saveData.displayPlant = plantId; this.save(); },

  encounterEnemy(enemyId) {
    if (!saveData.encounteredEnemies.includes(enemyId)) {
      saveData.encounteredEnemies.push(enemyId);
      this.save();
    }
  },
  isEnemyEncountered(enemyId) {
    if (saveData.devMode) return true;
    return saveData.encounteredEnemies.includes(enemyId);
  },
  getEncounteredEnemies() {
    return saveData.encounteredEnemies;
  },

  isDevMode() { return saveData.devMode; },

  enableDevMode() {
    // Save pre-dev snapshot for pure mode restoration
    if (!saveData.devMode) {
      saveData._preDevSnapshot = {
        crystals: saveData.crystals,
        completedLevels: { ...saveData.completedLevels },
        encounteredEnemies: [...saveData.encounteredEnemies],
        plantStars: { ...saveData.plantStars },
        plantSkins: { ...saveData.plantSkins },
        ownedSkins: JSON.parse(JSON.stringify(saveData.ownedSkins)),
        displayPlant: saveData.displayPlant
      };
    }
    saveData.devMode = true;
    saveData.crystals = 9999999;
    this.save();
  },

  hasPreDevSnapshot() {
    return !!saveData._preDevSnapshot;
  },

  restorePreDevSnapshot() {
    if (!saveData._preDevSnapshot) return false;
    const snap = saveData._preDevSnapshot;
    saveData.crystals = snap.crystals;
    saveData.completedLevels = snap.completedLevels;
    saveData.encounteredEnemies = snap.encounteredEnemies;
    saveData.plantStars = snap.plantStars;
    saveData.plantSkins = snap.plantSkins;
    saveData.ownedSkins = snap.ownedSkins;
    saveData.displayPlant = snap.displayPlant;
    saveData.devMode = false;
    delete saveData._preDevSnapshot;
    this.save();
    return true;
  },

  resetSave() {
    saveData = { ...DEFAULT_SAVE, plantStars: { ...DEFAULT_SAVE.plantStars }, plantSkins: { ...DEFAULT_SAVE.plantSkins }, ownedSkins: { ...DEFAULT_SAVE.ownedSkins }, completedLevels: {}, encounteredEnemies: [] };
    this.save();
  }
};
