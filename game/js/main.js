import { StorageManager } from './StorageManager.js';
import { UIManager } from './UIManager.js';
import { BattleManager } from './Game.js';
import { assetManager } from './AssetManager.js';
import { getLevel, getUnlockPlantForLevel } from './LevelConfig.js';
import { getPlantDef } from './PlantConfig.js';

document.addEventListener('DOMContentLoaded', async () => {
  await assetManager.loadImages();

  StorageManager.load();
  const ui = new UIManager();

  // Handle startCombat event from UIManager
  window.addEventListener('startCombat', (e) => {
    const { levelId } = e.detail;
    const levelConfig = getLevel(levelId);
    if (!levelConfig) return;

    const saveData = StorageManager.load();
    const playerData = {
      plantStars: { ...saveData.plantStars },
      plantSkins: { ...saveData.plantSkins }
    };

    const bm = new BattleManager(ui.canvas, levelConfig, playerData);
    ui.battleManager = bm;

    // Setup combat footer with available plant types
    const availablePlants = [];
    for (const plantDef of [getPlantDef('sunflower'), getPlantDef('peashooter')]) {
      if (plantDef && StorageManager.isPlantUnlocked(plantDef.id)) {
        availablePlants.push(plantDef.id);
      }
    }
    ui.setupCombatFooter(availablePlants);

    // Wire canvas clicks
    ui.canvas.onclick = (ev) => {
      const rect = ui.canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;

      // Sun collection
      for (const sun of bm.suns) {
        const dx = x - sun.x;
        const dy = y - sun.y;
        if (dx > -20 && dx < 40 && dy > -20 && dy < 40) {
          const value = sun.collect();
          bm.collectSun(value);
          return;
        }
      }

      // Click peashooter for skill
      for (const plant of bm.plants) {
        if (plant.constructor.name === 'PeaShooter') {
          const px = plant.x;
          const py = plant.y;
          const dx = x - px;
          const dy = y - py;
          if (dx > -10 && dx < 90 && dy > -10 && dy < 100) {
            plant.useSkill(bm);
            return;
          }
        }
      }

      // Plant placement
      if (ui.selectedPlant) {
        bm.handlePlantClick(x, y, ui.selectedPlant);
      }
    };

    // Wire keyboard
    const keyHandler = (ev) => {
      if (ev.code === 'Space') {
        ev.preventDefault();
        for (const plant of bm.plants) {
          if (plant.constructor.name === 'PeaShooter') {
            if (plant.useSkill(bm)) break;
          }
        }
      }
    };
    document.addEventListener('keydown', keyHandler);
    bm._keyHandler = keyHandler;

    // Callbacks
    bm.onSunChange = (sun) => {
      document.getElementById('combat-sun').textContent = sun;
    };
    bm.onWaveChange = (wave) => {
      document.getElementById('combat-wave').textContent = wave;
    };
    bm.onVictory = (data) => {
      document.removeEventListener('keydown', bm._keyHandler);
      const unlockPlant = getUnlockPlantForLevel(data.levelId);
      StorageManager.completeLevel(data.levelId, {
        enemiesKilled: data.enemiesKilled,
        crystalsEarned: data.crystalsEarned
      });
      StorageManager.addCrystals(data.crystalsEarned);
      if (unlockPlant && !StorageManager.isPlantUnlocked(unlockPlant)) {
        const def = getPlantDef(unlockPlant);
        ui.showToast(`解锁新植物: ${def ? def.name : unlockPlant}`);
      }
      ui.refreshCrystalDisplay();
      ui.showBattleResult(true, data);
      document.getElementById('combat-crystal').textContent = data.crystalsEarned;
    };
    bm.onDefeat = (data) => {
      document.removeEventListener('keydown', bm._keyHandler);
      ui.showBattleResult(false, data);
    };

    ui.updateCombatUI(bm.sun, 1);
    document.getElementById('combat-crystal').textContent = '0';

    bm.start();
  });

  console.log('Arknights PvZ initialized');
});
