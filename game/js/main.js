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
    // Load GIF animation frames only when entering combat
    assetManager.loadGifManifest();

    const { levelId, squad } = e.detail;
    const levelConfig = getLevel(levelId);
    if (!levelConfig) return;

    const saveData = StorageManager.load();
    const playerData = {
      plantStars: { ...saveData.plantStars },
      equippedSkins: { ...saveData.equippedSkins }
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
        if (plantDef && plantDef.id !== 'cart' && StorageManager.isPlantUnlocked(plantDef.id)) {
          availablePlants.push(plantDef.id);
        }
      }
    }
    ui.setupCombatFooter(availablePlants);
    ui.updateCardAffordability(bm.sun);

    const visitorSquad = e.detail.visitorSquad || StorageManager.getVisitorSquad();
    ui.renderVisitorCards(visitorSquad);

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

    // Helper to get canvas coords
    const canvasCoords = (ev) => {
      const rect = ui.canvas.getBoundingClientRect();
      return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
    };

    ui.canvas.onmousemove = (ev) => {
      // Debug mode: drag vertex
      if (bm.lawn.debugGrid) {
        const { x, y } = canvasCoords(ev);
        bm.handleDebugMouseMove(x, y);
        return;
      }
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

    ui.canvas.onmousedown = (ev) => {
      // Debug mode: grab vertex
      if (bm.lawn.debugGrid) {
        const { x, y } = canvasCoords(ev);
        bm.handleDebugMouseDown(x, y);
        return;
      }
    };

    ui.canvas.onmouseup = (ev) => {
      // Debug mode: release vertex
      if (bm.lawn.debugGrid) {
        bm.handleDebugMouseUp();
        return;
      }
      if (!ui.dragState) return;
      const rect = ui.canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;

      // Check if dropping on a visitor — just cancel drag, let onclick handle it
      const dropCell = bm.lawn.getCellFromPosition(x, y);
      for (const visitor of bm.visitors) {
        if (visitor.row === dropCell.row && visitor.col === dropCell.col) {
          ui.deselectPlant();
          updateDrag();
          return;
        }
      }

      if (bm.isPlantOnCooldown(ui.dragState.plantType)) {
        ui.showToast('该物体正在冷却中...');
        ui.deselectPlant();
        updateDrag();
        return;
      }
      const placed = bm.handleDrop(x, y, ui.dragState.plantType);
      if (!placed) {
        const cell = bm.lawn.getCellFromPosition(x, y);
        if (cell.row >= 0 && cell.col >= 0) {
          bm._flashCell = { row: cell.row, col: cell.col, timer: 300 };
        }
      }
      ui.deselectPlant();
      updateDrag();
    };

    ui.canvas.onmouseleave = () => {
      if (ui.dragState) {
        ui.dragState.hoverRow = -1;
        ui.dragState.hoverCol = -1;
        updateDrag();
      }
    };

    // Global mouseup — clear ghost wherever the mouse is released
    window.addEventListener('mouseup', () => {
      if (bm.lawn.debugGrid) {
        bm.handleDebugMouseUp();
        return;
      }
      if (ui.dragState) {
        ui.deselectPlant();
        updateDrag();
      }
    });

    ui.canvas.onclick = (ev) => {
      if (bm.lawn.debugGrid) return; // No combat interactions in debug mode
      const rect = ui.canvas.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;

      // Sun collection — highest priority so suns are always clickable
      for (const sun of bm.suns) {
        const dx = x - sun.x;
        const dy = y - sun.y;
        if (dx > -20 && dx < 40 && dy > -20 && dy < 40) {
          const value = sun.collect();
          bm.collectSun(value);
          return;
        }
      }

      // Click visitor — check first by cell, then by bounding box
      const clickCell = bm.lawn.getCellFromPosition(x, y);
      for (const visitor of bm.visitors) {
        if (visitor.row === clickCell.row && visitor.col === clickCell.col) {
          ui.showUnitPanel(visitor);
          return;
        }
      }
      // Fallback: bounding box check for visitors
      for (const visitor of bm.visitors) {
        const vx = visitor.x, vy = visitor.y, vw = visitor.width, vh = visitor.height;
        if (x >= vx && x <= vx + vw && y >= vy && y <= vy + vh) {
          ui.showUnitPanel(visitor);
          return;
        }
      }

      // Click plant — open info panel by cell
      for (const plant of bm.plants) {
        if (plant.row === clickCell.row && plant.col === clickCell.col) {
          ui.showUnitPanel(plant);
          return;
        }
      }
      // Fallback: bounding box check for plants
      for (const plant of bm.plants) {
        const px = plant.x, py = plant.y;
        if (x >= px && x <= px + plant.width && y >= py && y <= py + plant.height) {
          ui.showUnitPanel(plant);
          return;
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

    // Keyboard: P to pause, Space for skills, Escape to cancel drag, E to export grid, D to toggle debug
    const keyHandler = (ev) => {
      if (ev.code === 'KeyP' || ev.code === 'KeyF') {
        ui._togglePause();
        return;
      }
      if (ev.code === 'KeyD') {
        bm.lawn.debugGrid = !bm.lawn.debugGrid;
        if (bm.lawn.debugGrid) {
          localStorage.setItem('debugGrid', '1');
          ui.showToast('调试模式已开启 (按D关闭)', 2000);
        } else {
          localStorage.removeItem('debugGrid');
          ui.showToast('调试模式已关闭', 2000);
        }
        const exportBtn2 = document.getElementById('debug-export-btn');
        if (exportBtn2) exportBtn2.style.display = bm.lawn.debugGrid ? '' : 'none';
        return;
      }
      if (ev.code === 'KeyE' && bm.lawn.debugGrid) {
        bm.lawn.exportGrid();
        ui.showToast('网格已导出到控制台 (F12查看)', 2000);
        return;
      }
      if (ev.code === 'Escape') {
        if (ui.dragState) {
          ui.deselectPlant();
          updateDrag();
        }
      }
    };
    document.addEventListener('keydown', keyHandler);
    bm._keyHandler = keyHandler;

    // Debug export button
    const exportBtn = document.getElementById('debug-export-btn');
    if (exportBtn && bm.lawn.debugGrid) {
      exportBtn.style.display = '';
      exportBtn.onclick = () => {
        const json = bm.lawn.exportGrid();
        navigator.clipboard.writeText(json).then(() => {
          ui.showToast('网格数据已复制到剪贴板！', 2000);
        }).catch(() => {
          ui.showToast('复制失败，请查看控制台(F12)', 3000);
        });
      };
    }

    // Callbacks
    bm.onSunChange = (sun) => {
      document.getElementById('combat-sun').textContent = sun;
      ui.updateCardAffordability(sun);
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
