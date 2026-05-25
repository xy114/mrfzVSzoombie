// roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
    this.beginPath();
    this.moveTo(x + r.tl, y);
    this.lineTo(x + w - r.tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    this.lineTo(x + w, y + h - r.br);
    this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    this.lineTo(x + r.bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    this.lineTo(x, y + r.tl);
    this.quadraticCurveTo(x, y, x + r.tl, y);
    this.closePath();
  };
}

import { StorageManager } from './StorageManager.js';
import { UIManager } from './UIManager.js';
import { BattleManager } from './Game.js';
import { assetManager } from './AssetManager.js';
import { getLevel, getUnlockPlantForLevel } from './LevelConfig.js';
import { getPlantDef, getAllPlantDefs } from './PlantConfig.js';

document.addEventListener('DOMContentLoaded', async () => {
  await assetManager.loadImages();

  StorageManager.load();
  let ui;
  try {
    ui = new UIManager();
  } catch (e) {
    console.error('UIManager initialization failed:', e);
    const errEl = document.createElement('div');
    errEl.style.cssText = 'position:fixed;top:10px;left:10px;color:#ff4444;z-index:9999;background:#0a0a0f;padding:12px 16px;border:1px solid #ff4444;font-family:monospace;font-size:13px;max-width:400px;';
    errEl.textContent = '初始化失败: ' + (e && e.message ? e.message : String(e));
    document.body.appendChild(errEl);
    throw e;
  }

  // Handle startCombat event from UIManager
  window.addEventListener('startCombat', (e) => {
    const { levelId, squad } = e.detail;
    const levelConfig = getLevel(levelId);
    if (!levelConfig) return;

    const saveData = StorageManager.load();
    const playerData = {
      plantStars: { ...saveData.plantStars },
      plantSkins: { ...saveData.plantSkins }
    };

    const bm = new BattleManager(ui.canvas, levelConfig, playerData);
    ui.battleManager = bm;

    // Setup combat footer — use squad if provided, otherwise all unlocked plants
    let availablePlants;
    if (squad && squad.length > 0) {
      availablePlants = squad;
    } else {
      availablePlants = [];
      for (const plantDef of getAllPlantDefs()) {
        if (plantDef && StorageManager.isPlantUnlocked(plantDef.id)) {
          availablePlants.push(plantDef.id);
        }
      }
    }
    ui.setupCombatFooter(availablePlants);

    // Wire canvas interactions — PvZ-style drag-and-drop
    const updateDrag = () => {
      if (ui.dragState) {
        bm.dragState = ui.dragState;
        ui.canvas.classList.add('dragging');
      } else {
        bm.dragState = null;
        ui.canvas.classList.remove('dragging');
      }
    };

    ui.canvas.onmousemove = (ev) => {
      if (!ui.dragState) return;
      const rect = ui.canvas.getBoundingClientRect();
      const mx = ev.clientX - rect.left;
      const my = ev.clientY - rect.top;
      ui.dragState.mouseX = mx;
      ui.dragState.mouseY = my;
      const cell = bm.lawn.getCellFromPosition(mx, my);
      ui.dragState.hoverRow = cell.row;
      ui.dragState.hoverCol = cell.col;
      updateDrag();
    };

    ui.canvas.onmouseleave = () => {
      if (ui.dragState) {
        ui.dragState.hoverRow = -1;
        ui.dragState.hoverCol = -1;
        updateDrag();
      }
    };

    ui.canvas.onclick = (ev) => {
      const rect = ui.canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;

      // Drag-and-drop plant placement
      if (ui.dragState) {
        if (bm.isPlantOnCooldown(ui.dragState.plantType)) {
          ui.showToast('该植物正在冷却中...');
          ui.deselectPlant();
          updateDrag();
          return;
        }
        const placed = bm.handleDrop(x, y, ui.dragState.plantType);
        if (!placed) {
          // Flash red on invalid drop
          const cell = bm.lawn.getCellFromPosition(x, y);
          if (cell.row >= 0 && cell.col >= 0) {
            bm._flashCell = { row: cell.row, col: cell.col, timer: 300 };
          }
        }
        ui.deselectPlant();
        updateDrag();
        return;
      }

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

      // Click peashooter or nut for skill
      for (const plant of bm.plants) {
        if (plant.constructor.name === 'PeaShooter' || plant.constructor.name === 'Nut') {
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
    };

    ui.canvas.oncontextmenu = (ev) => {
      ev.preventDefault();
      if (ui.dragState) {
        ui.deselectPlant();
        updateDrag();
      }
    };

    // Keyboard: Space for skills, Escape to cancel drag
    const keyHandler = (ev) => {
      if (ev.code === 'Escape') {
        if (ui.dragState) {
          ui.deselectPlant();
          updateDrag();
        }
      }
      if (ev.code === 'Space') {
        ev.preventDefault();
        for (const plant of bm.plants) {
          if (plant.constructor.name === 'PeaShooter' || plant.constructor.name === 'Nut') {
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
    bm.onCooldownUpdate = (cooldowns) => {
      ui.updateCombatCooldowns(cooldowns);
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
