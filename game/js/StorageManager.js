import { getPlantDef } from './PlantConfig.js';

const SAVE_KEY = 'mrfzvs_save';

const DEFAULT_SAVE = {
  crystals: 0,
  plantStars: { sunflower: 1, peashooter: 1 },
  equippedSkins: {},
  ownedSkins: { peashooter: [] },
  completedLevels: {},
  completedHardLevels: {},
  encounteredEnemies: [],
  devMode: false,
  displayPlant: 'sunflower',
  unlockedSquadSlots: 6,
  savedSquads: {},
  visitorSquad: [],
  unlockedVisitors: ['katana_zero'],
  purchasedPlants: []
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
        saveData = { ...DEFAULT_SAVE, plantStars: { ...DEFAULT_SAVE.plantStars }, equippedSkins: { ...DEFAULT_SAVE.equippedSkins }, ownedSkins: { ...DEFAULT_SAVE.ownedSkins }, completedLevels: {}, encounteredEnemies: [] };
      }
    } catch (e) {
      saveData = { ...DEFAULT_SAVE, plantStars: { ...DEFAULT_SAVE.plantStars }, equippedSkins: { ...DEFAULT_SAVE.equippedSkins }, ownedSkins: { ...DEFAULT_SAVE.ownedSkins }, completedLevels: {}, encounteredEnemies: [] };
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
    const def = getPlantDef(plantId);
    if (!def) return false;
    // Crystal-cost plants always require manual purchase, even in dev mode
    if (def.crystalCost) {
      return (saveData.purchasedPlants || []).includes(plantId);
    }
    if (saveData.devMode) return true;
    if (def.unlockLevel === null) return true;
    return this.isLevelCompleted(def.unlockLevel);
  },

  isPlantPurchased(plantId) {
    return (saveData.purchasedPlants || []).includes(plantId);
  },

  purchasePlant(plantId) {
    const def = getPlantDef(plantId);
    if (!def || !def.crystalCost) return false;
    if (this.isPlantPurchased(plantId)) return false;
    if (this.spendCrystals(def.crystalCost)) {
      if (!saveData.purchasedPlants) saveData.purchasedPlants = [];
      saveData.purchasedPlants.push(plantId);
      this.save();
      return true;
    }
    return false;
  },

  getEquippedSkin(unitId) { return saveData.equippedSkins[unitId] || 'default'; },
  equipSkin(plantId, skinId) { saveData.equippedSkins[plantId] = skinId; this.save(); },
  ownsSkin(plantId, skinId) { return (saveData.ownedSkins[plantId] || []).includes(skinId); },
  addSkin(plantId, skinId) {
    if (!saveData.ownedSkins[plantId]) saveData.ownedSkins[plantId] = [];
    if (!saveData.ownedSkins[plantId].includes(skinId)) {
      saveData.ownedSkins[plantId].push(skinId);
    }
    this.save();
  },

  isLevelCompleted(levelId) { return levelId in saveData.completedLevels; },
  isLevelHardCompleted(levelId) { return levelId in (saveData.completedHardLevels || {}); },
  completeLevelHard(levelId, data) {
    if (!saveData.completedHardLevels) saveData.completedHardLevels = {};
    saveData.completedHardLevels[levelId] = data || {};
    this.save();
  },
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
        completedHardLevels: { ...(saveData.completedHardLevels || {}) },
        encounteredEnemies: [...saveData.encounteredEnemies],
        plantStars: { ...saveData.plantStars },
        equippedSkins: { ...saveData.equippedSkins },
        ownedSkins: JSON.parse(JSON.stringify(saveData.ownedSkins)),
        displayPlant: saveData.displayPlant,
        purchasedPlants: [...(saveData.purchasedPlants || [])]
      };
    }
    saveData.devMode = true;
    saveData.crystals = 9999999;
    // Auto-unlock all crystal-cost plants for testing convenience
    if (!saveData.purchasedPlants) saveData.purchasedPlants = [];
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
    saveData.completedHardLevels = snap.completedHardLevels || {};
    saveData.encounteredEnemies = snap.encounteredEnemies;
    saveData.plantStars = snap.plantStars;
    saveData.equippedSkins = snap.equippedSkins;
    saveData.ownedSkins = snap.ownedSkins;
    saveData.displayPlant = snap.displayPlant;
    saveData.devMode = false;
    delete saveData._preDevSnapshot;
    this.save();
    return true;
  },

  resetSave() {
    saveData = { ...DEFAULT_SAVE, plantStars: { ...DEFAULT_SAVE.plantStars }, equippedSkins: { ...DEFAULT_SAVE.equippedSkins }, ownedSkins: { ...DEFAULT_SAVE.ownedSkins }, completedLevels: {}, completedHardLevels: {}, encounteredEnemies: [], unlockedSquadSlots: 6, savedSquads: {}, visitorSquad: [], purchasedPlants: [] };
    this.save();
  },

  // Squad system
  getUnlockedSquadSlots() { return saveData.unlockedSquadSlots || 6; },

  getSquadSlotUnlockCost() {
    const unlocked = this.getUnlockedSquadSlots();
    if (unlocked >= 12) return Infinity;
    const costs = { 6: 100, 7: 200, 8: 400, 9: 800, 10: 1500, 11: 3000 };
    return costs[unlocked] || 0;
  },

  unlockSquadSlot() {
    const cost = this.getSquadSlotUnlockCost();
    if (cost === Infinity) return false;
    if (this.spendCrystals(cost)) {
      saveData.unlockedSquadSlots = (saveData.unlockedSquadSlots || 6) + 1;
      this.save();
      return true;
    }
    return false;
  },

  saveSquad(plantIds) {
    if (!saveData.savedSquads) saveData.savedSquads = {};
    saveData.savedSquads._last = plantIds;
    this.save();
  },

  getLastSquad() {
    return (saveData.savedSquads && saveData.savedSquads._last) || [];
  },

  // Visitor system
  isVisitorUnlocked(visitorId) {
    if (saveData.devMode) return true;
    return (saveData.unlockedVisitors || []).includes(visitorId);
  },

  unlockVisitor(visitorId) {
    if (!saveData.unlockedVisitors) saveData.unlockedVisitors = [];
    if (!saveData.unlockedVisitors.includes(visitorId)) {
      saveData.unlockedVisitors.push(visitorId);
      this.save();
      return true;
    }
    return false;
  },

  getVisitorSquad() {
    return saveData.visitorSquad || [];
  },

  saveVisitorSquad(visitorIds) {
    saveData.visitorSquad = visitorIds;
    this.save();
  },

  getUnlockedVisitors() {
    return (saveData.unlockedVisitors || []).filter(id => this.isVisitorUnlocked(id));
  }
};
