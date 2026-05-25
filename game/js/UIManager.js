import { StorageManager } from './StorageManager.js';
import { PRELUDES, getLevel, getPreludes } from './LevelConfig.js';
import { getPlantDef, getAllPlantDefs, getStarMultiplier, getStarCost, getSkins, getSkin } from './PlantConfig.js';
import { getZombieDef, getAllZombieDefs, getThreatLabel } from './ZombieConfig.js';
import { drawNormalZombiePortrait, drawConeZombiePortrait, drawShieldZombiePortrait, drawImpZombiePortrait } from './ZombieRenderer.js';
import { drawSunflowerPortrait, drawPeashooterPortrait, drawNutPortrait, drawCherryBombPortrait, drawSunflower, drawPeashooter, drawNut, drawCherryBomb } from './PlantRenderer.js';
import { assetManager } from './AssetManager.js';
import { getVisitorDef, getAllVisitorDefs, getVisitorDisplayName } from './VisitorConfig.js';
import { GAME_CONFIG } from './constants.js';

export class UIManager {
  constructor() {
    this.cacheDom();
    this.bindEvents();
    this.battleManager = null;
    this.dragState = null; // { plantType, mouseX, mouseY, hoverRow, hoverCol }
    this.currentLevelId = null;
    this._starUpPlantId = null;
    this._skinPlantId = null;
    this._detailType = null;
    this._detailId = null;
    this.refreshCrystalDisplay();
    this.refreshDisplayPlant();
    this._updateDevButton();
    this.drawGearIcon();
    this.drawCrystalIcon();
  }

  get selectedPlant() { return this.dragState?.plantType || null; }
  set selectedPlant(v) { this.dragState = null; }

  cacheDom() {
    this.pages = {
      main: document.getElementById('page-main'),
      levelSelect: document.getElementById('page-level-select'),
      combat: document.getElementById('page-combat'),
      handbook: document.getElementById('page-handbook'),
      enemyHandbook: document.getElementById('page-enemy-handbook')
    };
    this.canvas = document.getElementById('game-canvas');
    this.$sun = document.getElementById('combat-sun');
    this.$wave = document.getElementById('combat-wave');
    this.$crystal = document.getElementById('combat-crystal');
    this.$combatFooter = document.getElementById('combat-footer');
    this.$battleResult = document.getElementById('battle-result');
    this.$resultTitle = document.getElementById('result-title');
    this.$resultD1 = document.getElementById('result-detail-1');
    this.$resultD2 = document.getElementById('result-detail-2');
    this.$resultD3 = document.getElementById('result-detail-3');
    this.$resultBtn = document.getElementById('result-btn');
    this.$crystalVal = document.getElementById('crystal-value');
    this.$standeeEmoji = document.getElementById('standee-emoji');
    this.$psGrid = document.getElementById('ps-grid');
    this.$devInput = document.getElementById('dev-input');
    this.$toast = document.getElementById('toast');
    this.$gearCanvas = document.getElementById('gear-canvas');
    this.$crystalCanvas = document.getElementById('crystal-icon-canvas');
    this.$combatExitBtn = document.getElementById('combat-exit-btn');
    // Handbook
    this.$hbPlantGrid = document.getElementById('hb-plant-grid');
    this.$hbPlantScroll = document.getElementById('hb-plant-scroll');
    this.$ehbEnemyGrid = document.getElementById('ehb-enemy-grid');
    this.$ehbEnemyScroll = document.getElementById('ehb-enemy-scroll');
    this.$hbDetailOverlay = document.getElementById('hb-detail-overlay');
    this.$hbDetailName = document.getElementById('hb-detail-name');
    this.$hbDetailThreat = document.getElementById('hb-detail-threat');
    this.$hbDetailCanvas = document.getElementById('hb-detail-canvas');
    this.$hbDetailStats = document.getElementById('hb-detail-stats');
  }

  bindEvents() {
    const $ = (id) => document.getElementById(id);
    const on = (id, event, fn) => { const el = $(id); if (el) el.addEventListener(event, fn); };

    on('btn-combat', 'click', () => this.showPage('levelSelect'));
    on('btn-handbook', 'click', () => this.showPage('handbook'));
    on('btn-enemy-handbook', 'click', () => this.showPage('enemyHandbook'));
    on('btn-garden', 'click', () => { this.showModal('garden'); });
    on('edit-standee-btn', 'click', () => { this.showModal('plant-select'); });
    on('ls-back', 'click', () => this.showPage('main'));
    on('hb-back', 'click', () => this.showPage('main'));
    on('ehb-back', 'click', () => this.showPage('main'));
    on('dev-btn', 'click', () => { this._onDevBtnClick(); });
    on('settings-gear-btn', 'click', () => { this.showModal('settings'); });
    if (this.$combatExitBtn) {
      this.$combatExitBtn.addEventListener('click', () => this._confirmExitCombat());
    }
    on('pure-mode-btn', 'click', () => { this._confirmPureMode(); });
    on('reset-save-btn', 'click', () => { this._confirmResetSave(); });
    on('confirm-cancel', 'click', () => {
      const mc = document.getElementById('modal-confirm');
      if (mc) mc.classList.remove('active');
    });
    on('confirm-ok', 'click', () => { this._executeConfirm(); });
    on('result-btn', 'click', () => { this.hideBattleResult(); this.showPage('levelSelect'); });
    on('dev-confirm', 'click', () => this.doDevCheck());
    const devInput = $('dev-input');
    if (devInput) {
      devInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.doDevCheck(); });
    }

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.hideModal());
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.hideModal();
      });
    });

    const detailClose = document.querySelector('.hb-detail-close');
    if (detailClose) {
      detailClose.addEventListener('click', () => this.hideDetail());
    }
    if (this.$hbDetailOverlay) {
      this.$hbDetailOverlay.addEventListener('click', (e) => {
        if (e.target === this.$hbDetailOverlay) this.hideDetail();
      });
    }
  }

  showPage(pageId) {
    this.endCombat();
    const target = this.pages[pageId];
    if (!target) return;
    Object.values(this.pages).forEach(p => { if (p) p.classList.remove('active'); });
    target.classList.add('active');

    if (pageId === 'levelSelect') this.renderLevelSelect();
    if (pageId === 'handbook') this.renderHandbook();
    if (pageId === 'enemyHandbook') this.renderEnemyHandbook();
    if (pageId === 'combat') {
      // combat is started externally via startCombat()
    }
    this.dragState = null;
  }

  showModal(modalId) {
    const el = document.getElementById('modal-' + modalId);
    if (!el) return;
    el.classList.add('active');
    if (modalId === 'plant-select') this.renderPlantSelect();
    if (modalId === 'settings') this._updateSettingsPanel();
    if (modalId === 'dev') {
      document.getElementById('dev-input').value = '';
      setTimeout(() => document.getElementById('dev-input').focus(), 100);
    }
  }

  hideModal() {
    document.querySelectorAll('.modal-overlay.active').forEach(el => el.classList.remove('active'));
  }

  showToast(msg, duration = 2000) {
    this.$toast.textContent = msg;
    this.$toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.$toast.classList.remove('show'), duration);
  }

  refreshCrystalDisplay() {
    if (this.$crystalVal) this.$crystalVal.textContent = StorageManager.getCrystals();
    this.drawCrystalIcon();
  }

  refreshDisplayPlant() {
    const plantId = StorageManager.getDisplayPlant();
    const def = getPlantDef(plantId);
    if (!def) return;
    const frame = document.getElementById('standee-frame');
    if (!frame) return;

    const img = assetManager.getImage(plantId) || assetManager.getImage(plantId + '_portrait');

    let canvas = frame.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'standee-canvas';
      frame.appendChild(canvas);
    }

    // Clear old content
    if (this.$standeeEmoji) this.$standeeEmoji.style.display = 'none';

    // Use requestAnimationFrame to ensure layout is complete before measuring
    const doDraw = () => {
      // Calculate available space from viewport — main-left is flex:13, main-right is flex:10
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const leftW = vw * 13 / 23;        // main-left width
      const frameW = leftW - 80;          // 40px padding each side
      const frameH = vh - 80 - 65;        // 80px padding-top, 65px for button+margin area

      const availW = frameW * 0.9;        // 5% margin each side
      const availH = frameH * 0.9;

      const pctx = canvas.getContext('2d');
      if (img) {
        const scale = Math.min(availW / img.naturalWidth, availH / img.naturalHeight);
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        pctx.clearRect(0, 0, canvas.width, canvas.height);
        pctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      } else {
        canvas.width = Math.round(availW);
        canvas.height = Math.round(availH);
        pctx.clearRect(0, 0, canvas.width, canvas.height);
        this._drawPortrait(pctx, 'plant', plantId, canvas.width, canvas.height);
      }
      canvas.style.display = 'block';
    };

    // Delay to ensure flex layout has settled
    if (frame.clientHeight > 0 && frame.clientWidth > 0) {
      doDraw();
    } else {
      requestAnimationFrame(() => requestAnimationFrame(doDraw));
    }

    // Handle window resize
    if (!this._standeeResizeBound) {
      this._standeeResizeBound = true;
      window.addEventListener('resize', () => {
        if (document.getElementById('page-main').classList.contains('active')) {
          this.refreshDisplayPlant();
        }
      });
    }
  }

  // === Level Select ===
  renderLevelSelect() {
    const container = document.getElementById('ls-content');
    container.innerHTML = '';
    for (const prelude of PRELUDES) {
      const section = document.createElement('div');
      section.className = 'prelude-section';
      section.innerHTML = `<div class="prelude-header">${prelude.name}</div>`;
      const nodes = document.createElement('div');
      nodes.className = 'level-nodes';
      for (let i = 0; i < prelude.levels.length; i++) {
        const lvl = prelude.levels[i];
        const node = document.createElement('div');
        node.className = 'level-node';
        const unlocked = StorageManager.isLevelUnlocked(lvl.id);
        const completed = StorageManager.isLevelCompleted(lvl.id);
        if (!unlocked) node.classList.add('locked');
        if (completed) node.classList.add('completed');
        node.innerHTML = `<span class="lv-num">${lvl.name}</span><span class="lv-sub">${lvl.waves}波</span>`;
        if (unlocked) {
          node.addEventListener('click', () => this.showLevelDetail(lvl.id));
        }
        nodes.appendChild(node);
        if (i < prelude.levels.length - 1) {
          const conn = document.createElement('div');
          conn.className = 'level-connector';
          const nextUnlocked = StorageManager.isLevelUnlocked(prelude.levels[i + 1].id);
          if (!nextUnlocked) conn.classList.add('locked');
          nodes.appendChild(conn);
        }
      }
      section.appendChild(nodes);
      container.appendChild(section);
    }
  }

  // === Level Detail ===
  showLevelDetail(levelId) {
    const level = getLevel(levelId);
    if (!level) return;
    this._pendingLevelId = levelId;

    document.getElementById('ld-title').textContent = level.name + ' · ' + (getPreludes().find(p => p.levels.some(l => l.id === levelId))?.name || '');
    document.getElementById('ld-meta').innerHTML = `
      波数: ${level.waves} &nbsp;|&nbsp; 初始阳光: ${level.startSun} &nbsp;|&nbsp; 晶核: 击败敌人获得
    `;

    // Scene preview
    const sceneCanvas = document.getElementById('ld-scene-canvas');
    if (sceneCanvas) {
      const sctx = sceneCanvas.getContext('2d');
      // Use a default scene background
      const bgKey = 'lawn_bg_day';
      const bgImg = assetManager.getImage(bgKey) || assetManager.getImage('lawn_bg');
      if (bgImg) {
        sctx.drawImage(bgImg, 0, 0, 360, 216);
      } else {
        sctx.fillStyle = '#1a2a10';
        sctx.fillRect(0, 0, 360, 216);
        sctx.fillStyle = '#2a4a1a';
        sctx.fillRect(0, 80, 360, 60);
        sctx.fillStyle = 'rgba(255,255,255,0.05)';
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 9; c++) {
            sctx.strokeRect(c * 40, r * 24, 40, 24);
          }
        }
      }
    }

    // Enemy list
    const enemyList = document.getElementById('ld-enemy-list');
    if (enemyList) {
      enemyList.innerHTML = '';
      const seen = new Set();
      for (const type of level.zombieTypes) {
        if (seen.has(type)) continue;
        seen.add(type);
        const def = getZombieDef(type);
        if (!def) continue;
        const threat = getThreatLabel(def);
        const item = document.createElement('div');
        item.className = 'ld-enemy-item';
        const cvs = document.createElement('canvas');
        cvs.width = 48; cvs.height = 56;
        const cctx = cvs.getContext('2d');
        this._drawPortrait(cctx, 'enemy', type, 48, 56);
        item.appendChild(cvs);
        const nameEl = document.createElement('span');
        nameEl.className = 'ld-enemy-name'; nameEl.textContent = def.name;
        item.appendChild(nameEl);
        const threatEl = document.createElement('span');
        threatEl.className = 'ld-enemy-threat';
        threatEl.textContent = threat.text;
        threatEl.style.color = threat.class === 'threat-extreme' ? '#c04040' : threat.class === 'threat-elite' ? '#d09030' : '#3aaf5a';
        item.appendChild(threatEl);
        enemyList.appendChild(item);
      }
    }

    // Estimated crystal reward
    const totalZombies = level.waves * level.waves + 4 * level.waves;
    let estimatedCrystals = 0;
    if (level.zombieTypes.length === 1) {
      const def = getZombieDef(level.zombieTypes[0]);
      estimatedCrystals = totalZombies * (def ? def.threatLevel : 1);
    } else {
      const typeWeights = { imp: 0.20, shield: 0.20, cone: 0.15, normal: 0.45 };
      let totalWeight = 0;
      let weightedSum = 0;
      for (const type of level.zombieTypes) {
        const weight = typeWeights[type] || (1 / level.zombieTypes.length);
        const def = getZombieDef(type);
        weightedSum += weight * (def ? def.threatLevel : 1);
        totalWeight += weight;
      }
      const avgThreat = totalWeight > 0 ? weightedSum / totalWeight : 1;
      estimatedCrystals = Math.round(totalZombies * avgThreat);
    }

    const dropInfo = document.getElementById('ld-drop-info');
    if (dropInfo) {
      dropInfo.innerHTML = `预计获得晶核: ${estimatedCrystals} (约${totalZombies}名敌人)`;
      if (level.unlockPlant) {
        const def = getPlantDef(level.unlockPlant);
        if (def) dropInfo.innerHTML += `<br>首次通关解锁: ${def.name}`;
      }
    }

    // Wire start button
    const startBtn = document.getElementById('ld-start-btn');
    if (startBtn) {
      const newBtn = startBtn.cloneNode(true);
      startBtn.parentNode.replaceChild(newBtn, startBtn);
      newBtn.addEventListener('click', () => {
        this.hideModal();
        this.showSquadSelect();
      });
    }

    // Wire close button
    const closeBtn = document.getElementById('ld-close-btn');
    if (closeBtn) {
      const newClose = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newClose, closeBtn);
      newClose.addEventListener('click', () => this.hideModal());
    }

    const overlay = document.getElementById('modal-level-detail');
    if (overlay) {
      overlay.addEventListener('click', (e) => { if (e.target === overlay) this.hideModal(); });
    }

    this.showModal('level-detail');
  }

  // === Squad Select ===
  showSquadSelect() {
    this._squad = StorageManager.getLastSquad();
    // Trim squad to unlocked slots
    const maxSlots = StorageManager.getUnlockedSquadSlots();
    if (this._squad.length > maxSlots) this._squad = this._squad.slice(0, maxSlots);
    this._squadSlotIndex = -1;

    this._wireSquadButtons();
    this.renderSquadGrid();
    this.renderVisitorSquad();
    this.showModal('squad');
  }

  renderSquadGrid() {
    const grid = document.getElementById('squad-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const maxSlots = StorageManager.getUnlockedSquadSlots();
    const totalSlots = 12;
    const filled = this._squad.filter(Boolean).length;
    document.getElementById('squad-slot-info').textContent = `${filled}/${maxSlots}`;

    const startBtn = document.getElementById('squad-start-btn');
    if (startBtn) startBtn.disabled = (filled === 0);

    for (let i = 0; i < totalSlots; i++) {
      const slot = document.createElement('div');
      slot.className = 'squad-slot';
      slot.dataset.slotIndex = i;

      if (i >= maxSlots) {
        // Locked slot
        slot.classList.add('locked');
        const cost = StorageManager.getSquadSlotUnlockCost();
        const lockIcon = document.createElement('span');
        lockIcon.className = 'slot-lock-icon';
        lockIcon.textContent = '\u{1F512}';
        slot.appendChild(lockIcon);
        if (cost !== Infinity) {
          const costLabel = document.createElement('span');
          costLabel.className = 'slot-cost-label';
          costLabel.textContent = cost + ' \u{1F4CE}';
          slot.appendChild(costLabel);
        }
        slot.addEventListener('click', () => this._unlockSlot());
      } else if (i < this._squad.length && this._squad[i]) {
        // Filled slot
        const plantId = this._squad[i];
        slot.classList.add('filled');
        const def = getPlantDef(plantId);
        const canvas = document.createElement('canvas');
        canvas.width = 56; canvas.height = 70;
        const cctx = canvas.getContext('2d');
        this._drawPortrait(cctx, 'plant', plantId, 56, 70);
        slot.appendChild(canvas);
        if (def) {
          const nameEl = document.createElement('span');
          nameEl.className = 'slot-plant-name';
          nameEl.textContent = def.name;
          slot.appendChild(nameEl);
        }
        const removeBtn = document.createElement('button');
        removeBtn.className = 'slot-remove-btn';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._squad[i] = null;
          this._compactSquad();
          this._wireSquadButtons();
          this.renderSquadGrid();
        });
        slot.appendChild(removeBtn);
        slot.addEventListener('click', () => this._onFilledSlotClick(i));
      } else {
        // Empty slot
        const emptyIcon = document.createElement('span');
        emptyIcon.className = 'slot-empty-text';
        emptyIcon.textContent = '+';
        slot.appendChild(emptyIcon);
        slot.addEventListener('click', () => this.showSquadPicker(i));
      }

      grid.appendChild(slot);
    }
  }

  _compactSquad() {
    this._squad = this._squad.filter(Boolean);
    while (this._squad.length < StorageManager.getUnlockedSquadSlots()) {
      this._squad.push(null);
    }
  }

  // === Visitor Squad Methods ===
  renderVisitorSquad() {
    const grid = document.getElementById('visitor-squad-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const maxSlots = 3;
    const currentSquad = StorageManager.getVisitorSquad();
    const padded = [...currentSquad];
    while (padded.length < maxSlots) padded.push(null);

    for (let i = 0; i < maxSlots; i++) {
      const vid = padded[i];
      const slot = document.createElement('div');
      slot.className = 'visitor-squad-slot';
      slot.dataset.slotIndex = i;

      if (vid) {
        slot.classList.add('filled');
        const def = getVisitorDef(vid);
        const canvas = document.createElement('canvas');
        canvas.width = 56; canvas.height = 70;
        const cctx = canvas.getContext('2d');
        const img = assetManager.getImage('visitor_katana_zero');
        if (img) {
          cctx.drawImage(img, 0, 0, 56, 70);
        } else {
          cctx.fillStyle = '#333';
          cctx.fillRect(0, 0, 56, 70);
          cctx.fillStyle = '#c040ff';
          cctx.font = '14px sans-serif';
          cctx.textAlign = 'center';
          cctx.fillText('???', 28, 38);
        }
        slot.appendChild(canvas);
        if (def) {
          const nameEl = document.createElement('span');
          nameEl.className = 'slot-visitor-name';
          nameEl.textContent = def.displayName;
          slot.appendChild(nameEl);
        }
        const removeBtn = document.createElement('button');
        removeBtn.className = 'slot-remove-btn';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const sq = StorageManager.getVisitorSquad();
          sq[i] = null;
          StorageManager.saveVisitorSquad(sq.filter(Boolean));
          this.renderVisitorSquad();
        });
        slot.appendChild(removeBtn);
      } else {
        const emptyIcon = document.createElement('span');
        emptyIcon.className = 'slot-empty-text';
        emptyIcon.textContent = '+';
        slot.appendChild(emptyIcon);
        slot.addEventListener('click', () => this.showVisitorPicker(i));
      }
      grid.appendChild(slot);
    }
  }

  showVisitorPicker(slotIndex) {
    this._visitorSlotIndex = slotIndex;
    const currentSquad = StorageManager.getVisitorSquad();
    if (!currentSquad.includes('katana_zero')) {
      currentSquad[slotIndex] = 'katana_zero';
      StorageManager.saveVisitorSquad(currentSquad.filter(Boolean));
    }
    this.renderVisitorSquad();
  }

  _onFilledSlotClick(index) {
    const plantId = this._squad[index];
    if (!plantId) return;
    // Click on filled slot: show plant detail with option to remove
    // For now, remove the plant and allow re-selection
    this._squad[index] = null;
    this._compactSquad();
    this._wireSquadButtons();
    this.renderSquadGrid();
  }

  _unlockSlot() {
    const cost = StorageManager.getSquadSlotUnlockCost();
    if (cost === Infinity) return;
    const crystals = StorageManager.getCrystals();
    if (crystals < cost) {
      this.showToast('晶核不足！');
      return;
    }
    if (StorageManager.unlockSquadSlot()) {
      this.showToast(`解锁新编队格子！消耗 ${cost} 晶核`);
      this.refreshCrystalDisplay();
      this._wireSquadButtons();
      this.renderSquadGrid();
    }
  }

  _wireSquadButtons() {
    // Clone overlay first so event listeners aren't lost when cloning later
    const overlay = document.getElementById('modal-squad');
    if (overlay) {
      const newOverlay = overlay.cloneNode(true);
      overlay.parentNode.replaceChild(newOverlay, overlay);
      newOverlay.addEventListener('click', (e) => {
        if (e.target === newOverlay) {
          this.hideModal();
          this.showLevelDetail(this._pendingLevelId);
        }
      });
    }

    // Wire buttons in the new overlay
    const backBtn = document.getElementById('squad-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.hideModal();
        this.showLevelDetail(this._pendingLevelId);
      });
    }

    const startBtn = document.getElementById('squad-start-btn');
    if (startBtn) {
      const filled = this._squad.filter(Boolean).length;
      startBtn.disabled = (filled === 0);
      startBtn.addEventListener('click', () => {
        if (filled === 0) return;
        const squad = this._squad.filter(Boolean);
        StorageManager.saveSquad(squad);
        this.hideModal();
        const visitorSquad = StorageManager.getVisitorSquad();
        this.startCombat(this._pendingLevelId, squad, visitorSquad);
      });
    }
  }

  // === Squad Plant Picker ===
  showSquadPicker(slotIndex) {
    this._squadSlotIndex = slotIndex;
    this.hideModal(); // hide squad modal first
    this._wireSquadPickerButtons();
    this.renderSquadPicker();
    this.showModal('squad-picker');
  }

  renderSquadPicker() {
    const grid = document.getElementById('squad-picker-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Hide detail panel on re-render
    this._selectedPickerPlant = null;
    this._updatePickerDetail();

    const allPlants = getAllPlantDefs();
    const unlocked = allPlants.filter(p => StorageManager.isPlantUnlocked(p.id));
    const inSquad = new Set(this._squad.filter(Boolean));

    for (const plant of unlocked) {
      const card = document.createElement('div');
      card.className = 'squad-picker-card';
      card.dataset.plantId = plant.id;

      if (inSquad.has(plant.id)) {
        card.classList.add('disabled');
      }

      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 84;
      const cctx = canvas.getContext('2d');
      this._drawPortrait(cctx, 'plant', plant.id, 64, 84);
      card.appendChild(canvas);

      const nameEl = document.createElement('div');
      nameEl.className = 'spc-name';
      nameEl.textContent = plant.name;
      card.appendChild(nameEl);

      const descEl = document.createElement('div');
      descEl.className = 'spc-desc';
      descEl.textContent = '☀' + (plant.combat.cost || 0);
      card.appendChild(descEl);

      card.addEventListener('click', () => {
        if (card.classList.contains('disabled')) return;

        // If clicking the already-selected card, deselect
        if (this._selectedPickerPlant === plant.id) {
          this._selectedPickerPlant = null;
          // Remove 'selected' from all cards
          grid.querySelectorAll('.squad-picker-card').forEach(c => c.classList.remove('selected'));
          this._updatePickerDetail();
          return;
        }

        // Select this plant
        this._selectedPickerPlant = plant.id;
        grid.querySelectorAll('.squad-picker-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this._updatePickerDetail();
      });

      grid.appendChild(card);
    }
  }

  _updatePickerDetail() {
    const detail = document.getElementById('squad-picker-detail');
    const info = document.getElementById('spd-info');
    const skinsRow = document.getElementById('spd-skins');
    if (!detail || !info || !skinsRow) return;

    if (!this._selectedPickerPlant) {
      detail.style.display = 'none';
      return;
    }

    const plantId = this._selectedPickerPlant;
    const def = getPlantDef(plantId);
    if (!def) { detail.style.display = 'none'; return; }

    const starLevel = StorageManager.getPlantStar(plantId);
    const nextCost = starLevel < 3 ? getStarCost(starLevel, starLevel + 1) : Infinity;
    const stars = '★'.repeat(starLevel) + '☆'.repeat(3 - starLevel);
    info.innerHTML = `
      <span class="spd-name">${def.name}</span>
      <span class="spd-stars">${stars}</span>
      ${nextCost !== Infinity ? `<button class="spd-upgrade-btn" id="spd-upgrade-btn">升星 💎${nextCost}</button>` : '<span style="font-size:10px;color:var(--gold);">MAX</span>'}
      <span class="spd-cost">☀${def.combat.cost || 0}</span>
    `;

    // Wire upgrade button
    const upBtn = document.getElementById('spd-upgrade-btn');
    if (upBtn) {
      upBtn.addEventListener('click', () => {
        if (!StorageManager.spendCrystals(nextCost)) {
          this.showToast('晶核不足！');
          return;
        }
        const newStar = StorageManager.upgradePlantStar(plantId);
        if (newStar) {
          this.showToast(`${def.name} 升至 ${newStar} 星！`);
          this.refreshCrystalDisplay();
          this._updatePickerDetail();
        }
      });
    }

    // Skin row
    const equippedSkin = StorageManager.getEquippedSkin(plantId);
    const skins = getSkins(plantId);
    let skinHTML = '<span class="spd-skins-label">皮肤:</span>';

    // Default artwork (always available, first, no name)
    skinHTML += `
      <div class="spd-skin-item${!equippedSkin ? ' equipped' : ''}" data-skin-id="">
        <canvas width="40" height="48"></canvas>
      </div>`;

    // Owned skins
    for (const skin of skins) {
      if (!StorageManager.ownsSkin(plantId, skin.id)) continue;
      skinHTML += `
        <div class="spd-skin-item${equippedSkin === skin.id ? ' equipped' : ''}" data-skin-id="${skin.id}">
          <canvas width="40" height="48"></canvas>
          <span class="spd-skin-name">${skin.name}</span>
        </div>`;
    }

    // Unowned skins (locked, show cost)
    for (const skin of skins) {
      if (StorageManager.ownsSkin(plantId, skin.id)) continue;
      skinHTML += `
        <div class="spd-skin-item locked" data-skin-id="${skin.id}" data-skin-cost="${skin.cost || 0}">
          <canvas width="40" height="48"></canvas>
          <span class="spd-skin-cost">💎${skin.cost || 0}</span>
        </div>`;
    }

    skinsRow.innerHTML = skinHTML;

    // Draw skin previews
    const skinItems = skinsRow.querySelectorAll('.spd-skin-item');
    skinItems.forEach(item => {
      const skinId = item.dataset.skinId;
      const cvs = item.querySelector('canvas');
      if (cvs) {
        const ctx = cvs.getContext('2d');
        if (skinId) {
          this._drawPortrait(ctx, 'plant', plantId, 40, 48, skinId);
        } else {
          this._drawPortrait(ctx, 'plant', plantId, 40, 48);
        }
      }
    });

    // Wire skin click handlers
    skinsRow.querySelectorAll('.spd-skin-item:not(.locked)').forEach(item => {
      item.addEventListener('click', () => {
        const skinId = item.dataset.skinId || null;
        StorageManager.equipSkin(plantId, skinId);
        this._updatePickerDetail();
      });
    });

    skinsRow.querySelectorAll('.spd-skin-item.locked').forEach(item => {
      item.addEventListener('click', () => {
        const cost = parseInt(item.dataset.skinCost) || 0;
        const skinId = item.dataset.skinId;
        if (!StorageManager.spendCrystals(cost)) {
          this.showToast('晶核不足！');
          return;
        }
        StorageManager.addSkin(plantId, skinId);
        StorageManager.equipSkin(plantId, skinId);
        this.showToast('皮肤已解锁并装备！');
        this.refreshCrystalDisplay();
        this._updatePickerDetail();
      });
    });

    detail.style.display = 'flex';
  }

  _wireSquadPickerButtons() {
    // Clone overlay first so card click handlers aren't lost
    const overlay = document.getElementById('modal-squad-picker');
    if (overlay) {
      const newOverlay = overlay.cloneNode(true);
      overlay.parentNode.replaceChild(newOverlay, overlay);
      newOverlay.addEventListener('click', (e) => {
        if (e.target === newOverlay) {
          this.hideModal();
          this.showSquadSelect();
        }
      });
    }

    const backBtn = document.getElementById('squad-picker-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.hideModal();
        this.showSquadSelect();
      });
    }

    const confirmBtn = document.getElementById('spd-confirm-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const plantId = this._selectedPickerPlant;
        if (!plantId) return;
        // Remove this plant from any other slot first
        for (let i = 0; i < this._squad.length; i++) {
          if (this._squad[i] === plantId) this._squad[i] = null;
        }
        while (this._squad.length <= this._squadSlotIndex) this._squad.push(null);
        this._squad[this._squadSlotIndex] = plantId;
        this._compactSquad();
        this._selectedPickerPlant = null;
        this.hideModal();
        this._wireSquadButtons();
        this.renderSquadGrid();
        this.showModal('squad');
      });
    }
  }

  // === Handbook ===
  renderHandbook() {
    this.$hbPlantGrid.innerHTML = '';
    const allPlants = getAllPlantDefs();
    const unlockedPlants = allPlants.filter(p => StorageManager.isPlantUnlocked(p.id));
    const lockedPlants = allPlants.filter(p => !StorageManager.isPlantUnlocked(p.id));
    const sortedPlants = [...unlockedPlants, ...lockedPlants];

    // Card base: Almanac_PlantCard.png is 316×473, scale to width 168
    const cardW = 168;
    const srcW = 316, srcH = 473;
    const cardH = Math.round(cardW * srcH / srcW); // ~252
    const scale = cardW / srcW;
    // Transparent window (plant portrait slot)
    const winX = 63 * scale, winY = 22 * scale;
    const winW = 189 * scale, winH = 143 * scale;
    const margin = 10;
    // Text box (lower light-yellow area)
    const tbX = 22 * scale, tbY = 221 * scale, tbW = 268 * scale, tbH = 237 * scale;
    const textColor = 'rgb(89,32,8)';

    for (const plant of sortedPlants) {
      const card = document.createElement('canvas');
      card.className = 'hb-card';
      card.width = cardW;
      card.height = cardH;
      const isUnlocked = StorageManager.isPlantUnlocked(plant.id);
      const star = StorageManager.getPlantStar(plant.id);
      const skinId = StorageManager.getEquippedSkin(plant.id);
      const skin = skinId ? getSkin(plant.id, skinId) : null;
      const ctx = card.getContext('2d');

      if (isUnlocked) {
        // 1. Plant GIF — fit inside transparent window with margin
        const spriteImg = assetManager.getImage(plant.id) || assetManager.getImage(plant.id + '_portrait');
        if (spriteImg) {
          const availW = winW - 2 * margin, availH = winH - 2 * margin;
          const gifScale = Math.min(availW / spriteImg.naturalWidth, availH / spriteImg.naturalHeight);
          const gifW = spriteImg.naturalWidth * gifScale;
          const gifH = spriteImg.naturalHeight * gifScale;
          const gifX = winX + (winW - gifW) / 2;
          const gifY = winY + (winH - gifH) / 2;
          ctx.drawImage(spriteImg, gifX, gifY, gifW, gifH);
        } else {
          const pCanvas = document.createElement('canvas');
          pCanvas.width = winW - 2 * margin; pCanvas.height = winH - 2 * margin;
          const pctx = pCanvas.getContext('2d');
          this._drawPortrait(pctx, 'plant', plant.id, pCanvas.width, pCanvas.height);
          ctx.drawImage(pCanvas, winX + margin, winY + margin);
        }
      }

      // 2. Card background overlay (transparent window shows GIF through)
      const cardBg = assetManager.getImage('plant_card_bg');
      if (cardBg) {
        ctx.drawImage(cardBg, 0, 0, cardW, cardH);
      } else {
        ctx.fillStyle = '#1c1c28'; // bg-card
        ctx.fillRect(0, 0, cardW, cardH);
      }

      if (!isUnlocked) {
        // Locked: dark overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, cardW, cardH);
      }

      // 3. Text in light-yellow text box
      ctx.textAlign = 'center';
      const nameY = tbY + 26 * scale; // ~138
      const starY = nameY + 24 * scale; // ~151
      const descY = starY + 22 * scale; // ~163
      const skinY = descY + 22 * scale; // ~175

      // Name
      ctx.fillStyle = isUnlocked ? textColor : '#484440'; // text-dim
      ctx.font = `bold ${Math.round(14 * scale)}px "Microsoft YaHei", "Segoe UI", sans-serif`;
      ctx.fillText(isUnlocked ? plant.name : '???', cardW / 2, nameY);

      // Stars — muted gold
      ctx.fillStyle = isUnlocked ? '#a09868' : '#484440';
      ctx.font = `${Math.round(12 * scale)}px "Microsoft YaHei", "Segoe UI", sans-serif`;
      ctx.fillText(isUnlocked ? '★'.repeat(star) + '☆'.repeat(3 - star) : '☆☆☆', cardW / 2, starY);

      // Description
      ctx.fillStyle = isUnlocked ? textColor : '#484440';
      ctx.font = `${Math.round(11 * scale)}px "Microsoft YaHei", "Segoe UI", sans-serif`;
      const desc = isUnlocked ? plant.description : '未解锁';
      ctx.fillText(desc.length > 16 ? desc.slice(0, 15) + '...' : desc, cardW / 2, descY);

      // Skin info — muted cyan
      if (isUnlocked && skin) {
        ctx.fillStyle = '#5a8a9a';
        ctx.font = `${Math.round(10 * scale)}px "Microsoft YaHei", "Segoe UI", sans-serif`;
        ctx.fillText('皮肤: ' + skin.name, cardW / 2, skinY);
      }

      if (isUnlocked) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => this.showPlantDetail(plant.id));
      } else {
        card.classList.add('locked');
      }
      this.$hbPlantGrid.appendChild(card);
    }

    this._renderVisitorHandbook();
    this._setupDragScroll(this.$hbPlantScroll);
  }

  _renderVisitorHandbook() {
    const allVisitors = getAllVisitorDefs();
    const placeholderCount = 3;

    const sep = document.createElement('div');
    sep.className = 'hb-visitor-separator';
    sep.innerHTML = '<div class="hb-visitor-title">???</div><div class="hb-visitor-subtitle">似乎是来自世界之外的力量</div>';
    this.$hbPlantGrid.appendChild(sep);

    const cardW = 168;
    const srcW = 316, srcH = 473;
    const cardH = Math.round(cardW * srcH / srcW);

    for (const v of allVisitors) {
      const isUnlocked = StorageManager.isVisitorUnlocked(v.id);
      const card = document.createElement('canvas');
      card.className = 'hb-card visitor-card';
      card.width = cardW;
      card.height = cardH;
      const ctx = card.getContext('2d');

      if (isUnlocked) {
        const img = assetManager.getImage('visitor_katana_zero');
        if (img) {
          const scale = Math.min(cardW / img.naturalWidth, (cardH * 0.55) / img.naturalHeight);
          const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
          ctx.drawImage(img, (cardW - dw) / 2, 20, dw, dh);
        }
      } else {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(cardW * 0.25, 20, cardW * 0.5, cardH * 0.55);
        ctx.fillStyle = '#333';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', cardW / 2, cardH * 0.45);
      }

      const cardBg = assetManager.getImage('plant_card_bg');
      if (cardBg) {
        ctx.drawImage(cardBg, 0, 0, cardW, cardH);
      }

      if (!isUnlocked) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, cardW, cardH);
        card.classList.add('locked');
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = isUnlocked ? 'rgb(89,32,8)' : '#484440';
      ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
      ctx.fillText(isUnlocked ? v.name : '???', cardW / 2, cardH * 0.72);

      ctx.fillStyle = isUnlocked ? 'rgb(89,32,8)' : '#484440';
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillText(isUnlocked ? v.description : '未解锁', cardW / 2, cardH * 0.78);

      if (isUnlocked) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => this.showVisitorDetail(v.id));
      }

      this.$hbPlantGrid.appendChild(card);
    }

    for (let i = 0; i < placeholderCount; i++) {
      const card = document.createElement('canvas');
      card.className = 'hb-card visitor-card locked';
      card.width = cardW;
      card.height = cardH;
      const ctx = card.getContext('2d');

      ctx.fillStyle = '#111';
      ctx.fillRect(cardW * 0.3, 20, cardW * 0.4, cardH * 0.5);
      ctx.fillStyle = '#222';
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', cardW / 2, cardH * 0.4);

      const cardBg = assetManager.getImage('plant_card_bg');
      if (cardBg) ctx.drawImage(cardBg, 0, 0, cardW, cardH);

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, cardW, cardH);

      ctx.fillStyle = '#484440';
      ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('???', cardW / 2, cardH * 0.72);

      this.$hbPlantGrid.appendChild(card);
    }
  }

  showVisitorDetail(visitorId) {
    const def = getVisitorDef(visitorId);
    if (!def) return;
    this._detailType = 'visitor';
    this._detailId = visitorId;

    this.$hbDetailName.textContent = def.name;
    this.$hbDetailThreat.style.display = 'none';

    const canvas = this.$hbDetailCanvas;
    if (canvas) {
      canvas.width = 200; canvas.height = 260;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const img = assetManager.getImage('visitor_katana_zero');
      if (img) {
        const s = Math.min(200 / img.naturalWidth, 260 / img.naturalHeight);
        ctx.drawImage(img, (200 - img.naturalWidth * s) / 2, (260 - img.naturalHeight * s) / 2,
          img.naturalWidth * s, img.naturalHeight * s);
      }
    }

    let statsHTML = '';
    statsHTML += '<div class="hb-stat-row"><span class="hb-stat-label">生命值</span><span class="hb-stat-value">' + def.combat.health + '</span></div>';
    statsHTML += '<div class="hb-stat-row"><span class="hb-stat-label">攻击</span><span class="hb-stat-value">无（纯技能型）</span></div>';
    statsHTML += '<div class="hb-stat-row"><span class="hb-stat-label">主动技能</span><span class="hb-stat-value">时停0.5s · 10连斩 · 每刀50+10%最大HP · 冷却' + (def.combat.activeSkillCooldown / 1000) + 's</span></div>';
    statsHTML += '<div class="hb-stat-row"><span class="hb-stat-label">被动技能</span><span class="hb-stat-value">受击时停0.3s · 同行斩 · 每刀100+70%最大HP · 冷却' + (def.combat.passiveSkillCooldown / 1000) + 's</span></div>';

    this.$hbDetailStats.innerHTML = statsHTML;
    this.$hbDetailOverlay.classList.add('active');

    const actionSec = this.$hbDetailOverlay.querySelector('.hb-detail-action-section');
    if (actionSec) actionSec.style.display = 'none';
  }

  renderEnemyHandbook() {
    if (this.$ehbEnemyGrid) this.$ehbEnemyGrid.innerHTML = '';
    const allEnemies = getAllZombieDefs();
    const encounteredIds = StorageManager.getEncounteredEnemies();
    const encountered = allEnemies.filter(e => encounteredIds.includes(e.id));
    const unencountered = allEnemies.filter(e => !encounteredIds.includes(e.id));
    const sorted = [...encountered, ...unencountered];

    // Card base: Almanac_ZombieCard.png is 319×490, scale to width 168
    const cardW = 168;
    const srcW = 319, srcH = 490;
    const cardH = Math.round(cardW * srcH / srcW); // ~258
    const scale = cardW / srcW;
    // Transparent window (zombie portrait slot)
    const winX = 65 * scale, winY = 50 * scale;
    const winW = 192 * scale, winH = 180 * scale;
    const margin = 10;
    // Text box (lower light-purple area)
    const tbX = 25 * scale, tbY = 295 * scale, tbW = 269 * scale, tbH = 167 * scale;
    const textColor = 'rgb(16,20,28)';

    for (const enemy of sorted) {
      const card = document.createElement('canvas');
      card.className = 'hb-card';
      card.width = cardW;
      card.height = cardH;
      const isEncountered = StorageManager.isEnemyEncountered(enemy.id);
      const threat = getThreatLabel(enemy);
      const ctx = card.getContext('2d');

      if (isEncountered) {
        // 1. Enemy GIF — fit inside transparent window with margin
        const spriteImg = assetManager.getImage(enemy.id) || assetManager.getImage(enemy.id + '_portrait');
        if (spriteImg) {
          const availW = winW - 2 * margin, availH = winH - 2 * margin;
          const gifScale = Math.min(availW / spriteImg.naturalWidth, availH / spriteImg.naturalHeight);
          const gifW = spriteImg.naturalWidth * gifScale;
          const gifH = spriteImg.naturalHeight * gifScale;
          const gifX = winX + (winW - gifW) / 2;
          const gifY = winY + (winH - gifH) / 2;
          ctx.drawImage(spriteImg, gifX, gifY, gifW, gifH);
        } else {
          const pCanvas = document.createElement('canvas');
          pCanvas.width = winW - 2 * margin; pCanvas.height = winH - 2 * margin;
          const pctx = pCanvas.getContext('2d');
          this._drawPortrait(pctx, 'enemy', enemy.id, pCanvas.width, pCanvas.height);
          ctx.drawImage(pCanvas, winX + margin, winY + margin);
        }
      }

      // 2. Card background overlay (transparent window shows GIF through)
      const cardBg = assetManager.getImage('zombie_card_bg');
      if (cardBg) {
        ctx.drawImage(cardBg, 0, 0, cardW, cardH);
      } else {
        ctx.fillStyle = '#1c1c28'; // bg-card
        ctx.fillRect(0, 0, cardW, cardH);
      }

      if (!isEncountered) {
        // Locked: dark overlay
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, cardW, cardH);
      }

      // 3. Text in light-purple text box
      ctx.textAlign = 'center';
      const nameY = tbY + 26 * scale; // ~170
      const threatY = nameY + 24 * scale; // ~183
      const descY = threatY + 22 * scale; // ~195

      // Name
      ctx.fillStyle = isEncountered ? textColor : '#484440'; // text-dim
      ctx.font = `bold ${Math.round(14 * scale)}px "Microsoft YaHei", "Segoe UI", sans-serif`;
      ctx.fillText(isEncountered ? enemy.name : '???', cardW / 2, nameY);

      // Threat badge
      ctx.fillStyle = isEncountered ?
        (threat.class === 'threat-extreme' ? '#c04040' : threat.class === 'threat-elite' ? '#d09030' : '#3aaf5a') :
        '#484440';
      ctx.font = `${Math.round(12 * scale)}px "Microsoft YaHei", "Segoe UI", sans-serif`;
      ctx.fillText(isEncountered ? threat.text : '???', cardW / 2, threatY);

      // Description
      ctx.fillStyle = isEncountered ? textColor : '#484440';
      ctx.font = `${Math.round(11 * scale)}px "Microsoft YaHei", "Segoe UI", sans-serif`;
      const desc = isEncountered ? enemy.description : '尚未遭遇';
      ctx.fillText(desc.length > 16 ? desc.slice(0, 15) + '...' : desc, cardW / 2, descY);

      if (isEncountered) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => this.showEnemyDetail(enemy.id));
      } else {
        card.classList.add('locked');
      }
      this.$ehbEnemyGrid.appendChild(card);
    }
    this._setupDragScroll(this.$ehbEnemyScroll);
  }

  // === Detail Views ===
  showPlantDetail(plantId) {
    this._detailType = 'plant';
    this._detailId = plantId;
    this._starUpPlantId = plantId;
    this._skinPlantId = plantId;

    const def = getPlantDef(plantId);
    if (!def) return;

    const star = StorageManager.getPlantStar(plantId);
    const mult = getStarMultiplier(star);
    const skinId = StorageManager.getEquippedSkin(plantId);
    const skin = skinId ? getSkin(plantId, skinId) : null;

    this.$hbDetailName.textContent = def.name;
    this.$hbDetailThreat.style.display = 'none';
    // Draw portrait on canvas — _drawPortrait handles GIF + proportional scaling
    const canvas = this.$hbDetailCanvas;
    if (canvas) {
      canvas.width = 200;
      canvas.height = 260;
      const pctx = canvas.getContext('2d');
      pctx.clearRect(0, 0, canvas.width, canvas.height);
      this._drawPortrait(pctx, 'plant', plantId, canvas.width, canvas.height);
    }

    let statsHTML = '';

    // Stars
    statsHTML += `<div class="hb-stat-row">
      <span class="hb-stat-label">星级</span>
      <span class="hb-stat-value" style="color:var(--gold);">${'★'.repeat(star)}${'☆'.repeat(3 - star)}</span>
    </div>`;

    // Health
    const hp = Math.round(def.combat.health * mult.healthMult);
    statsHTML += `<div class="hb-stat-row">
      <span class="hb-stat-label">生命值</span>
      <span class="hb-stat-value">${hp}</span>
    </div>`;

    // Damage
    if (def.combat.damage) {
      const dmg = Math.round(def.combat.damage * mult.damageMult);
      statsHTML += `<div class="hb-stat-row">
        <span class="hb-stat-label">攻击力</span>
        <span class="hb-stat-value">${dmg}</span>
      </div>`;
    }

    // Sun cost
    if (def.combat.cost !== undefined) {
      statsHTML += `<div class="hb-stat-row">
        <span class="hb-stat-label">部署费用</span>
        <span class="hb-stat-value" style="color:var(--gold);">☀ ${def.combat.cost}</span>
      </div>`;
    }

    // Sun interval
    if (def.combat.sunInterval) {
      statsHTML += `<div class="hb-stat-row">
        <span class="hb-stat-label">产阳间隔</span>
        <span class="hb-stat-value">${def.combat.sunInterval / 1000}s</span>
      </div>`;
    }

    // Shoot interval
    if (def.combat.shootInterval) {
      const interval = def.combat.shootInterval * mult.cooldownMult;
      statsHTML += `<div class="hb-stat-row">
        <span class="hb-stat-label">攻击间隔</span>
        <span class="hb-stat-value">${(interval / 1000).toFixed(1)}s</span>
      </div>`;
    }

    // Skill info
    if (def.combat.skillMaxCooldown) {
      const cd = def.combat.skillMaxCooldown * mult.cooldownMult;
      statsHTML += `<div class="hb-stat-row">
        <span class="hb-stat-label">技能冷却</span>
        <span class="hb-stat-value">${(cd / 1000).toFixed(1)}s</span>
      </div>`;
      if (def.combat.skillDamage) {
        const skDmg = Math.round(def.combat.skillDamage * mult.damageMult);
        statsHTML += `<div class="hb-stat-row">
          <span class="hb-stat-label">技能伤害</span>
          <span class="hb-stat-value" style="color:#ff6644;">${skDmg} (法术)</span>
        </div>`;
      }
      if (def.combat.skillDefenseBonus) {
        statsHTML += `<div class="hb-stat-row">
          <span class="hb-stat-label">技能效果</span>
          <span class="hb-stat-value" style="color:#60a5fa;">防御力 +${def.combat.skillDefenseBonus}</span>
        </div>`;
      }
      if (def.combat.skillDuration) {
        statsHTML += `<div class="hb-stat-row">
          <span class="hb-stat-label">技能持续</span>
          <span class="hb-stat-value">${(def.combat.skillDuration / 1000).toFixed(1)}s</span>
        </div>`;
      }
    }

    // Explosion stats (cherry bomb)
    if (def.combat.explosionDamage) {
      statsHTML += `<div class="hb-stat-row">
        <span class="hb-stat-label">爆炸伤害</span>
        <span class="hb-stat-value" style="color:#ff4444;">${def.combat.explosionDamage}</span>
      </div>`;
    }
    if (def.combat.explosionRadius) {
      statsHTML += `<div class="hb-stat-row">
        <span class="hb-stat-label">爆炸范围</span>
        <span class="hb-stat-value">${def.combat.explosionRadius} 格</span>
      </div>`;
    }
    if (def.combat.armingTime) {
      statsHTML += `<div class="hb-stat-row">
        <span class="hb-stat-label">准备时间</span>
        <span class="hb-stat-value">${(def.combat.armingTime / 1000).toFixed(1)}s</span>
      </div>`;
    }

    // Description
    statsHTML += `<div class="hb-stat-desc">${def.description}</div>`;

    // Skin info
    if (skin) {
      statsHTML += `<div class="hb-stat-desc" style="color:var(--cyan);">
        当前皮肤: ${skin.emoji} ${skin.name} — ${skin.description}
      </div>`;
    }

    // Star-up section
    statsHTML += `<div class="hb-detail-action-section">
      <div class="hb-detail-action-title">升 星</div>`;
    if (star < 3) {
      const cost = getStarCost(star, star + 1);
      const crystals = StorageManager.getCrystals();
      statsHTML += `<p style="color:var(--text-secondary);font-size:13px;margin-bottom:4px;">
        ${'★'.repeat(star)}${'☆'.repeat(3 - star)} → ${'★'.repeat(star + 1)}${'☆'.repeat(2 - star)}
        &nbsp;|&nbsp; 消耗: <span style="color:var(--gold);">${cost} 晶核</span>
        &nbsp;|&nbsp; 持有: <span style="color:var(--cyan);">${crystals}</span>
      </p>
      <div class="btn-row">
        <button class="primary" id="hb-detail-starup-btn">确认升星</button>
      </div>`;
    } else {
      statsHTML += `<p style="color:var(--gold);font-size:13px;">已满星 ★★★</p>`;
    }
    statsHTML += `</div>`;

    // Skin section
    statsHTML += `<div class="hb-detail-action-section">
      <div class="hb-detail-action-title">皮 肤</div>
      <div class="hb-detail-skin-list" id="hb-detail-skin-list"></div>
    </div>`;

    this.$hbDetailStats.innerHTML = statsHTML;
    this.$hbDetailOverlay.classList.add('active');

    // Wire star-up button
    const starUpBtn = document.getElementById('hb-detail-starup-btn');
    if (starUpBtn) {
      starUpBtn.addEventListener('click', () => this.doStarUp());
    }

    // Render skin list
    this._renderDetailSkinList(plantId);
  }

  showEnemyDetail(enemyId) {
    this._detailType = 'enemy';
    this._detailId = enemyId;

    const def = getZombieDef(enemyId);
    if (!def) return;

    const threat = getThreatLabel(def);
    const isEncountered = StorageManager.isEnemyEncountered(enemyId);

    this.$hbDetailName.textContent = def.name;
    this.$hbDetailThreat.style.display = '';
    this.$hbDetailThreat.textContent = threat.text;
    this.$hbDetailThreat.className = 'hb-detail-threat ' + threat.class;
    // Draw portrait on canvas — _drawPortrait handles GIF + proportional scaling
    const canvas = this.$hbDetailCanvas;
    if (canvas) {
      canvas.width = 200;
      canvas.height = 260;
      const pctx = canvas.getContext('2d');
      pctx.clearRect(0, 0, canvas.width, canvas.height);
      if (isEncountered) {
        this._drawPortrait(pctx, 'enemy', enemyId, canvas.width, canvas.height);
      }
    }

    let statsHTML = '';

    // Threat level
    statsHTML += `<div class="hb-stat-row">
      <span class="hb-stat-label">威胁等级</span>
      <span class="hb-stat-value" style="color:var(--gold);">${'★'.repeat(def.threatLevel)}${'☆'.repeat(3 - def.threatLevel)}</span>
    </div>`;

    // Category
    statsHTML += `<div class="hb-stat-row">
      <span class="hb-stat-label">分类</span>
      <span class="hb-stat-value ${threat.class}" style="font-size:13px;">${threat.text}</span>
    </div>`;

    // Health
    statsHTML += `<div class="hb-stat-row">
      <span class="hb-stat-label">生命值</span>
      <span class="hb-stat-value">${def.health}</span>
    </div>`;

    // Defense (physical)
    if (def.defense) {
      statsHTML += `<div class="hb-stat-row">
        <span class="hb-stat-label">物理防御</span>
        <span class="hb-stat-value" style="color:#c0a860;">${def.defense}</span>
      </div>`;
    }

    // Magic resist
    if (def.magicResist) {
      statsHTML += `<div class="hb-stat-row">
        <span class="hb-stat-label">法术抗性</span>
        <span class="hb-stat-value" style="color:#a0c0f0;">${def.magicResist} (${(def.magicResist * 0.1).toFixed(1)}%)</span>
      </div>`;
    }

    // Speed
    statsHTML += `<div class="hb-stat-row">
      <span class="hb-stat-label">移动速度</span>
      <span class="hb-stat-value">${def.speed}</span>
    </div>`;

    // Damage
    statsHTML += `<div class="hb-stat-row">
      <span class="hb-stat-label">攻击力</span>
      <span class="hb-stat-value">${def.damage}</span>
    </div>`;

    // Attack interval
    statsHTML += `<div class="hb-stat-row">
      <span class="hb-stat-label">攻击间隔</span>
      <span class="hb-stat-value">${def.attackInterval / 1000}s</span>
    </div>`;

    // Description
    statsHTML += `<div class="hb-stat-desc">${def.description}</div>`;

    // First encounter
    if (def.firstEncounterLevel) {
      statsHTML += `<div class="hb-stat-desc" style="color:var(--text-dim);font-size:12px;">
        首次遭遇: 关卡 ${def.firstEncounterLevel}
      </div>`;
    }

    // Not encountered yet
    if (!isEncountered) {
      statsHTML += `<div class="hb-stat-desc" style="color:var(--text-dim);font-style:italic;">
        你尚未在战场上遭遇过这个敌人
      </div>`;
    }

    this.$hbDetailStats.innerHTML = statsHTML;
    this.$hbDetailOverlay.classList.add('active');
  }

  hideDetail() {
    this.$hbDetailOverlay.classList.remove('active');
    this._detailType = null;
    this._detailId = null;
  }

  _drawPortrait(ctx, category, id, maxW, maxH, skinId) {
    // Try skin-specific portrait first
    let portraitKey;
    if (skinId) {
      portraitKey = id + '_skin_' + skinId + '_portrait';
      const skinImg = assetManager.getImage(portraitKey);
      if (skinImg) {
        const margin = 0.9;
        const availW = maxW * margin, availH = maxH * margin;
        const s = Math.min(availW / skinImg.naturalWidth, availH / skinImg.naturalHeight);
        const gifW = skinImg.naturalWidth * s;
        const gifH = skinImg.naturalHeight * s;
        ctx.drawImage(skinImg, (maxW - gifW) / 2, (maxH - gifH) / 2, gifW, gifH);
        return;
      }
    }

    portraitKey = id + '_portrait';
    const img = assetManager.getImage(portraitKey);
    if (img) {
      // Proportional fit with margin (leave 10% padding each side)
      const margin = 0.9;
      const availW = maxW * margin, availH = maxH * margin;
      const gifScale = Math.min(availW / img.naturalWidth, availH / img.naturalHeight);
      const gifW = img.naturalWidth * gifScale;
      const gifH = img.naturalHeight * gifScale;
      const gifX = (maxW - gifW) / 2;
      const gifY = (maxH - gifH) / 2;
      ctx.drawImage(img, gifX, gifY, gifW, gifH);
      return;
    }
    ctx.save();
    ctx.scale(maxW / 200, maxH / 260);
    if (category === 'plant') {
      if (id === 'sunflower') drawSunflowerPortrait(ctx, 0, 0, 200, 260);
      else if (id === 'peashooter') drawPeashooterPortrait(ctx, 0, 0, 200, 260);
      else if (id === 'nut') drawNutPortrait(ctx, 0, 0, 200, 260);
      else if (id === 'cherrybomb') drawCherryBombPortrait(ctx, 0, 0, 200, 260);
    } else if (category === 'enemy') {
      if (id === 'normal') drawNormalZombiePortrait(ctx, 0, 0, 200, 260);
      else if (id === 'cone') drawConeZombiePortrait(ctx, 0, 0, 200, 260);
      else if (id === 'shield') drawShieldZombiePortrait(ctx, 0, 0, 200, 260);
      else if (id === 'imp') drawImpZombiePortrait(ctx, 0, 0, 200, 260);
    }
    ctx.restore();
  }

  _setupDragScroll(container) {
    if (container._dragSetup) return;
    container._dragSetup = true;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let moved = false;

    container.addEventListener('mousedown', (e) => {
      isDown = true;
      moved = false;
      container.classList.add('dragging');
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    });

    container.addEventListener('mouseleave', () => {
      isDown = false;
      container.classList.remove('dragging');
    });

    container.addEventListener('mouseup', () => {
      isDown = false;
      container.classList.remove('dragging');
    });

    container.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 3) moved = true;
      container.scrollLeft = scrollLeft - walk;
    });

    // Prevent click events on cards after a drag
    container.addEventListener('click', (e) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);
  }

  _renderDetailSkinList(plantId) {
    const container = document.getElementById('hb-detail-skin-list');
    if (!container) return;
    container.innerHTML = '';
    const skins = getSkins(plantId);
    if (skins.length === 0) {
      container.innerHTML = '<span style="color:var(--text-dim);font-size:12px;">该植物暂无皮肤</span>';
      return;
    }
    const equipped = StorageManager.getEquippedSkin(plantId);
    for (const skin of skins) {
      const item = document.createElement('div');
      item.className = 'hb-detail-skin-item';
      if (equipped === skin.id) item.classList.add('equipped');
      const owned = StorageManager.ownsSkin(plantId, skin.id);

      const skinCanvas = document.createElement('canvas');
      skinCanvas.width = 50;
      skinCanvas.height = 65;
      const sctx = skinCanvas.getContext('2d');
      this._drawPortrait(sctx, 'plant', plantId, 50, 65);
      item.appendChild(skinCanvas);

      const labelEl = document.createElement('div');
      labelEl.className = 'skin-label';
      labelEl.textContent = skin.name;
      item.appendChild(labelEl);

      const subEl = document.createElement('div');
      subEl.className = 'skin-sub';
      subEl.textContent = owned ? '已拥有' : `${skin.cost} 晶核`;
      item.appendChild(subEl);
      item.addEventListener('click', () => {
        if (!owned) {
          this._buySkin(plantId, skin.id, skin.cost);
        } else {
          StorageManager.equipSkin(plantId, skin.id);
          this.showToast(`已装备皮肤: ${skin.name}`);
          this.showPlantDetail(plantId);
          this.renderHandbook();
          this.refreshDisplayPlant();
        }
      });
      container.appendChild(item);
    }
  }

  _buySkin(plantId, skinId, cost) {
    if (StorageManager.spendCrystals(cost)) {
      StorageManager.addSkin(plantId, skinId);
      StorageManager.equipSkin(plantId, skinId);
      const skin = getSkin(plantId, skinId);
      this.showToast(`解锁皮肤: ${skin.name}`);
      this.refreshCrystalDisplay();
      this.renderHandbook();
      this.refreshDisplayPlant();
      if (this._detailType === 'plant' && this._detailId) {
        this.showPlantDetail(this._detailId);
      }
    } else {
      this.showToast('晶核不足！');
    }
  }

  doStarUp() {
    if (!this._starUpPlantId) return;
    const plantId = this._starUpPlantId;
    const star = StorageManager.getPlantStar(plantId);
    if (star >= 3) return;
    const cost = getStarCost(star, star + 1);
    if (StorageManager.spendCrystals(cost)) {
      StorageManager.upgradePlantStar(plantId);
      const def = getPlantDef(plantId);
      this.showToast(`${def.name} 升星成功！${'★'.repeat(star + 1)}`);
      this.refreshCrystalDisplay();
      this.renderHandbook();
      if (this._detailType === 'plant' && this._detailId) {
        this.showPlantDetail(this._detailId);
      }
    } else {
      this.showToast('晶核不足！');
    }
  }

  // === Combat ===
  startCombat(levelId, squad, visitorSquad = []) {
    this.currentLevelId = levelId;
    this.showPage('combat');
    this._startCombatRequested = levelId;
    this._pendingSquad = squad || null;
    window.dispatchEvent(new CustomEvent('startCombat', { detail: { levelId, squad: squad || null, visitorSquad } }));
  }

  endCombat() {
    if (this.battleManager) {
      this.battleManager.stop();
      if (this.battleManager._keyHandler) {
        document.removeEventListener('keydown', this.battleManager._keyHandler);
      }
      this.battleManager = null;
    }
  }

  startDrag(plantType) {
    this.dragState = { plantType, mouseX: 0, mouseY: 0, hoverRow: -1, hoverCol: -1 };
  }

  deselectPlant() {
    this.dragState = null;
    if (this.$combatFooter) {
      this.$combatFooter.querySelectorAll('.combat-plant-card').forEach(c => c.classList.remove('selected'));
    }
  }

  updateCombatCooldowns(cooldowns) {
    if (!this.$combatFooter) return;
    const cards = this.$combatFooter.querySelectorAll('.combat-plant-card');
    cards.forEach(card => {
      const plantType = card.dataset.plant;
      const remaining = cooldowns[plantType] || 0;
      const cdOverlay = card.querySelector('.cd-overlay');
      const cdText = card.querySelector('.cd-text');
      if (remaining > 0) {
        card.classList.add('on-cooldown');
        if (this.dragState && this.dragState.plantType === plantType) this.deselectPlant();
        if (cdOverlay) {
          cdOverlay.style.display = 'flex';
          cdText.textContent = (remaining / 1000).toFixed(1) + 's';
        }
      } else {
        card.classList.remove('on-cooldown');
        if (cdOverlay) cdOverlay.style.display = 'none';
      }
    });
  }

  updateCombatUI(sun, wave) {
    if (this.$sun) this.$sun.textContent = sun;
    if (this.$wave) this.$wave.textContent = wave;
  }

  showBattleResult(won, data) {
    this.$battleResult.classList.add('active');
    this.$resultTitle.textContent = won ? '作 战 胜 利' : '作 战 失 败';
    this.$resultTitle.className = 'result-title ' + (won ? 'victory' : 'defeat');
    this.$resultD1.textContent = `关卡: ${data.levelId}`;
    this.$resultD2.textContent = won
      ? `击败: 普通×${data.enemiesKilled.normal || 0}  路障×${data.enemiesKilled.cone || 0}  持盾×${data.enemiesKilled.shield || 0}  小鬼×${data.enemiesKilled.imp || 0}`
      : '僵尸突破了你的防线...';
    this.$resultD3.textContent = won ? `获得晶核: ${data.crystalsEarned}` : '';
  }

  hideBattleResult() {
    this.$battleResult.classList.remove('active');
  }

  // === Plant Select ===
  renderPlantSelect() {
    this.$psGrid.innerHTML = '';
    const allPlants = getAllPlantDefs();
    const currentDisplay = StorageManager.getDisplayPlant();
    const unlocked = allPlants.filter(p => StorageManager.isPlantUnlocked(p.id));
    for (const plant of unlocked) {
      const opt = document.createElement('div');
      opt.className = 'ps-option';
      if (plant.id === currentDisplay) opt.classList.add('selected');

      const canvas = document.createElement('canvas');
      canvas.width = 60;
      canvas.height = 78;
      const pctx = canvas.getContext('2d');
      this._drawPortrait(pctx, 'plant', plant.id, 60, 78);
      opt.appendChild(canvas);

      const nameDiv = document.createElement('div');
      nameDiv.className = 'ps-name';
      nameDiv.textContent = plant.name;
      opt.appendChild(nameDiv);

      opt.addEventListener('click', () => {
        StorageManager.setDisplayPlant(plant.id);
        this.refreshDisplayPlant();
        this.hideModal();
      });
      this.$psGrid.appendChild(opt);
    }
    if (unlocked.length === 0) {
      this.$psGrid.innerHTML = '<p style="color:var(--text-dim)">暂无可用植物</p>';
    }
  }

  // === Dev Mode ===
  doDevCheck() {
    const val = document.getElementById('dev-input').value.trim();
    if (val === '114514') {
      StorageManager.enableDevMode();
      this.refreshCrystalDisplay();
      this.drawCrystalIcon();
      this.hideModal();
      this._updateDevButton();
      this.showToast('开发者模式已激活');
      if (this.pages.levelSelect.classList.contains('active')) this.renderLevelSelect();
      if (this.pages.handbook.classList.contains('active')) this.renderHandbook();
      if (this.pages.enemyHandbook.classList.contains('active')) this.renderEnemyHandbook();
    } else {
      this.showToast('暗号错误');
    }
  }

  _updateDevButton() {
    const devBtn = document.getElementById('dev-btn');
    if (!devBtn) return;
    if (StorageManager.isDevMode()) {
      devBtn.textContent = '纯净';
      devBtn.classList.add('pure-mode');
    } else {
      devBtn.textContent = '开发';
      devBtn.classList.remove('pure-mode');
    }
  }

  _onDevBtnClick() {
    if (StorageManager.isDevMode()) {
      this._confirmPureMode();
    } else {
      this.showModal('dev');
    }
  }

  // === Settings ===
  _updateSettingsPanel() {
    const pureBtn = document.getElementById('pure-mode-btn');
    if (pureBtn) {
      const hasSnapshot = StorageManager.hasPreDevSnapshot();
      pureBtn.disabled = !hasSnapshot;
      if (!hasSnapshot) {
        pureBtn.title = '当前非开发者模式，无需恢复';
      } else {
        pureBtn.title = '';
      }
    }
  }

  _confirmPureMode() {
    this._confirmCallback = () => {
      if (StorageManager.restorePreDevSnapshot()) {
        this.refreshCrystalDisplay();
        this.drawCrystalIcon();
        this._updateDevButton();
        this.refreshDisplayPlant();
        this.showToast('已恢复至纯净模式');
        this.hideModal();
        if (this.pages.handbook.classList.contains('active')) this.renderHandbook();
        if (this.pages.enemyHandbook.classList.contains('active')) this.renderEnemyHandbook();
        if (this.pages.levelSelect.classList.contains('active')) this.renderLevelSelect();
      } else {
        // 无快照，延迟弹出二次确认（避免被 _executeConfirm 清除回调）
        setTimeout(() => {
          this._confirmCallback = () => {
            StorageManager.resetSave();
            this.refreshCrystalDisplay();
            this.drawCrystalIcon();
            this._updateDevButton();
            this.refreshDisplayPlant();
            this.showToast('存档已清零');
            this.hideModal();
            if (this.pages.handbook.classList.contains('active')) this.renderHandbook();
            if (this.pages.enemyHandbook.classList.contains('active')) this.renderEnemyHandbook();
            if (this.pages.levelSelect.classList.contains('active')) this.renderLevelSelect();
          };
          document.getElementById('confirm-title').textContent = '全部清零';
          document.getElementById('confirm-msg').textContent = '未找到进入开发者模式前的快照数据，无法恢复。是否改为将所有存档清零？';
          document.getElementById('confirm-ok').className = 'danger';
          this.showModal('confirm');
        }, 0);
      }
    };
    document.getElementById('confirm-title').textContent = '纯净模式';
    document.getElementById('confirm-msg').textContent = '将退出开发者模式，恢复进入前的晶核数量与图鉴解锁状态。是否确认？';
    const okBtn = document.getElementById('confirm-ok');
    okBtn.className = '';
    this.showModal('confirm');
  }

  _confirmResetSave() {
    this._confirmCallback = () => {
      StorageManager.resetSave();
      this.refreshCrystalDisplay();
      this.drawCrystalIcon();
      this._updateDevButton();
      this.refreshDisplayPlant();
      this.showToast('存档已重置');
      this.hideModal();
      if (this.pages.handbook.classList.contains('active')) this.renderHandbook();
      if (this.pages.enemyHandbook.classList.contains('active')) this.renderEnemyHandbook();
      if (this.pages.levelSelect.classList.contains('active')) this.renderLevelSelect();
    };
    document.getElementById('confirm-title').textContent = '重置存档';
    document.getElementById('confirm-msg').textContent = '将清除所有游戏进度，包括晶核、图鉴解锁、关卡记录。此操作不可撤销，是否确认？';
    const okBtn = document.getElementById('confirm-ok');
    okBtn.className = 'danger';
    this.showModal('confirm');
  }

  _executeConfirm() {
    if (this._confirmCallback) {
      this._confirmCallback();
      this._confirmCallback = null;
    }
  }

  _confirmExitCombat() {
    this._confirmCallback = () => {
      this.endCombat();
      this.dragState = null;
      this.hideModal();
      this.showPage('levelSelect');
    };
    document.getElementById('confirm-title').textContent = '退出作战';
    document.getElementById('confirm-msg').textContent = '确定要退出当前作战吗？进度将会丢失。';
    const okBtn = document.getElementById('confirm-ok');
    okBtn.className = 'danger';
    this.showModal('confirm');
  }

  // === Icon Drawing ===
  drawGearIcon() {
    const canvas = this.$gearCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = 14, cy = 14;
    ctx.clearRect(0, 0, 28, 28);

    ctx.save();
    ctx.translate(cx, cy);

    const teeth = 8;
    const outerR = 10;
    const innerR = 6.5;
    const holeR = 2.5;

    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (Math.PI * 2 * i) / (teeth * 2) - Math.PI / 2;
      const radius = i % 2 === 0 ? outerR : innerR;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Muted teal gradient — Arknights subdued palette
    const grad = ctx.createLinearGradient(-outerR, -outerR, outerR, outerR);
    /* [ORIGINAL-v1] bright cyan gradient
    grad.addColorStop(0, '#b3e8ff');
    grad.addColorStop(0.3, '#7dddfb');
    grad.addColorStop(0.6, '#4dc9f6');
    grad.addColorStop(1, '#2a8ec8');
    */
    grad.addColorStop(0, '#8ab8c4');
    grad.addColorStop(0.3, '#6a9aaa');
    grad.addColorStop(0.6, '#5a8a9a');
    grad.addColorStop(1, '#3a5a6a');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(140, 175, 190, 0.3)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Center hole
    ctx.beginPath();
    ctx.arc(0, 0, holeR, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0f';
    ctx.fill();
    ctx.strokeStyle = 'rgba(140, 175, 190, 0.25)';
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(0, 0, innerR - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.restore();
  }

  drawCrystalIcon() {
    const canvas = this.$crystalCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 28, 28);

    const img = assetManager.getImage('crystal_icon');
    if (img) {
      ctx.drawImage(img, 0, 0, 28, 28);
    }
  }

  // === Combat footer setup ===
  setupCombatFooter(plantTypes) {
    this.$combatFooter.innerHTML = '';
    for (const plantId of plantTypes) {
      const def = getPlantDef(plantId);
      if (!def) continue;
      const card = document.createElement('div');
      card.className = 'combat-plant-card';
      card.dataset.plant = plantId;

      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      const cctx = canvas.getContext('2d');

      // Use GIF sprite if available, fallback to programmatic drawing
      const plantImg = assetManager.getImage(plantId);
      if (plantImg) {
        const margin = 4, availW = 40, availH = 40;
        const scale = Math.min(availW / plantImg.naturalWidth, availH / plantImg.naturalHeight);
        const dw = plantImg.naturalWidth * scale, dh = plantImg.naturalHeight * scale;
        const dx = (48 - dw) / 2, dy = (48 - dh) / 2;
        cctx.drawImage(plantImg, dx, dy, dw, dh);
      } else {
        if (plantId === 'sunflower') drawSunflower(cctx, 0, 0, 48, 48);
        else if (plantId === 'peashooter') drawPeashooter(cctx, 0, 0, 48, 48, false);
        else if (plantId === 'nut') drawNut(cctx, 0, 0, 48, 48, false);
        else if (plantId === 'cherrybomb') drawCherryBomb(cctx, 0, 0, 48, 48, false);
      }
      card.appendChild(canvas);

      // Cooldown overlay
      const cdOverlay = document.createElement('div');
      cdOverlay.className = 'cd-overlay';
      cdOverlay.style.display = 'none';
      const cdText = document.createElement('span');
      cdText.className = 'cd-text';
      cdOverlay.appendChild(cdText);
      card.appendChild(cdOverlay);

      const costEl = document.createElement('span');
      costEl.className = 'cpc-cost';
      costEl.textContent = '☀' + def.combat.cost;
      card.appendChild(costEl);

      card.addEventListener('click', () => {
        if (card.classList.contains('on-cooldown')) return;
        if (this.dragState && this.dragState.plantType === plantId) {
          this.deselectPlant();
        } else {
          this.$combatFooter.querySelectorAll('.combat-plant-card').forEach(c => c.classList.remove('selected'));
          this.dragState = { plantType: plantId, mouseX: 0, mouseY: 0, hoverRow: -1, hoverCol: -1 };
          card.classList.add('selected');
        }
      });
      this.$combatFooter.appendChild(card);
    }
  }

  // === Visitor Combat Cards ===
  renderVisitorCards(visitorSquad) {
    const container = document.getElementById('visitor-cards');
    if (!container) return;
    container.innerHTML = '';
    if (!visitorSquad || visitorSquad.length === 0) {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'flex';

    const placedVisitors = this.battleManager
      ? this.battleManager.visitors.map(v => v.id)
      : [];

    for (const vid of visitorSquad) {
      const def = getVisitorDef(vid);
      if (!def) continue;
      const placed = placedVisitors.includes(vid);
      const card = document.createElement('div');
      card.className = 'visitor-combat-card' + (placed ? ' placed' : '');
      card.style.cssText = 'width:72px;height:96px;border:2px solid #7d3eb0;border-radius:6px;overflow:hidden;cursor:pointer;position:relative;';

      if (placed) {
        card.style.opacity = '0.4';
        card.style.cursor = 'default';
      } else {
        card.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.startDrag(vid);
        });
        card.addEventListener('click', (e) => {
          const visitor = this.battleManager && this.battleManager.visitors.find(v => v.id === vid);
          if (visitor) {
            this.showVisitorPanel(visitor);
          }
        });
      }

      const canvas = document.createElement('canvas');
      canvas.width = 72; canvas.height = 96;
      const cctx = canvas.getContext('2d');
      const img = assetManager.getImage('visitor_katana_zero');
      if (img) {
        cctx.drawImage(img, 0, 0, 72, 96);
      } else {
        cctx.fillStyle = '#333';
        cctx.fillRect(0, 0, 72, 96);
        cctx.fillStyle = '#c040ff';
        cctx.font = 'bold 18px sans-serif';
        cctx.textAlign = 'center';
        cctx.fillText('???', 36, 52);
      }
      card.appendChild(canvas);
      container.appendChild(card);
    }
  }

  // === Visitor Battle Panel ===
  showVisitorPanel(visitor) {
    if (!this.battleManager) return;
    this.battleManager.setTimeScale(GAME_CONFIG.TIME_PANEL);

    const panel = document.getElementById('visitor-panel');
    if (!panel) return;
    panel.style.display = 'flex';

    const def = getVisitorDef(visitor.id);
    document.getElementById('vp-name').textContent = def ? def.name : '???';
    document.getElementById('vp-hp').textContent = `HP: ${Math.round(visitor.health)} / ${visitor.maxHealth}`;
    document.getElementById('vp-atk').textContent = 'ATK: 技能型';

    const dmgPerSlash = def.combat.activeSkillDamage + ' + ' + (def.combat.activeSkillHpRatio * 100) + '% 敌人最大HP';
    document.getElementById('vp-active-desc').textContent =
      '时停0.5s，10连斩 · 每刀: ' + dmgPerSlash + ' · 冷却' + (def.combat.activeSkillCooldown / 1000) + 's';
    document.getElementById('vp-passive-desc').textContent =
      '受击时停0.3s · 同行斩击 · 每刀100+70%敌人最大HP · 冷却' + (def.combat.passiveSkillCooldown / 1000) + 's';

    const canvas = document.getElementById('vp-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 200, 280);
      const img = assetManager.getImage('visitor_katana_zero');
      if (img) {
        ctx.drawImage(img, 0, 0, 200, 280);
      } else {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 200, 280);
        ctx.fillStyle = '#c040ff';
        ctx.font = '36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('???', 100, 150);
      }
    }

    const skillBtn = document.getElementById('vp-active-btn');
    if (skillBtn) {
      const newBtn = skillBtn.cloneNode(true);
      skillBtn.parentNode.replaceChild(newBtn, skillBtn);
      if (visitor._activeCooldownRemaining > 0) {
        newBtn.disabled = true;
        newBtn.textContent = '冷却中...';
      }
      newBtn.addEventListener('click', () => {
        this.hideVisitorPanel();
        visitor.executeActive(this.battleManager);
      });
    }

    const closeHandler = (e) => {
      if (!panel.contains(e.target) && e.target !== panel) {
        this.hideVisitorPanel();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 50);
  }

  hideVisitorPanel() {
    const panel = document.getElementById('visitor-panel');
    if (panel) panel.style.display = 'none';
    if (this.battleManager) {
      this.battleManager.setTimeScale(1.0);
    }
  }
}
