import { StorageManager } from './StorageManager.js';
import { PRELUDES } from './LevelConfig.js';
import { getPlantDef, getAllPlantDefs, getStarMultiplier, getStarCost, getSkins, getSkin } from './PlantConfig.js';

export class UIManager {
  constructor() {
    this.cacheDom();
    this.bindEvents();
    this.battleManager = null;
    this.selectedPlant = null;
    this.currentLevelId = null;
    this._starUpPlantId = null;
    this._skinPlantId = null;
    this.refreshCrystalDisplay();
    this.refreshDisplayPlant();
  }

  cacheDom() {
    this.pages = {
      main: document.getElementById('page-main'),
      levelSelect: document.getElementById('page-level-select'),
      combat: document.getElementById('page-combat'),
      handbook: document.getElementById('page-handbook')
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
    this.$standeeName = document.getElementById('standee-name');
    this.$psGrid = document.getElementById('ps-grid');
    this.$starUpInfo = document.getElementById('star-up-info');
    this.$skinList = document.getElementById('skin-list');
    this.$devInput = document.getElementById('dev-input');
    this.$toast = document.getElementById('toast');
  }

  bindEvents() {
    document.getElementById('btn-combat').addEventListener('click', () => this.showPage('levelSelect'));
    document.getElementById('btn-handbook').addEventListener('click', () => this.showPage('handbook'));
    document.getElementById('btn-garden').addEventListener('click', () => { this.showModal('garden'); });
    document.getElementById('edit-standee-btn').addEventListener('click', () => { this.showModal('plant-select'); });
    document.getElementById('ls-back').addEventListener('click', () => this.showPage('main'));
    document.getElementById('hb-back').addEventListener('click', () => this.showPage('main'));
    document.getElementById('dev-btn').addEventListener('click', () => { this.showModal('dev'); });

    document.getElementById('result-btn').addEventListener('click', () => {
      this.hideBattleResult();
      this.showPage('levelSelect');
    });

    document.getElementById('star-up-cancel').addEventListener('click', () => this.hideModal());
    document.getElementById('star-up-confirm').addEventListener('click', () => this.doStarUp());

    document.getElementById('dev-confirm').addEventListener('click', () => this.doDevCheck());
    document.getElementById('dev-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.doDevCheck();
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.hideModal());
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.hideModal();
      });
    });
  }

  showPage(pageId) {
    if (this.battleManager) {
      this.battleManager.stop();
      this.battleManager = null;
    }
    Object.values(this.pages).forEach(p => p.classList.remove('active'));
    this.pages[pageId].classList.add('active');

    if (pageId === 'levelSelect') this.renderLevelSelect();
    if (pageId === 'handbook') this.renderHandbook();
    if (pageId === 'combat') {
      // combat is started externally via startCombat()
    }
    this.selectedPlant = null;
  }

  showModal(modalId) {
    const el = document.getElementById('modal-' + modalId);
    if (!el) return;
    el.classList.add('active');
    if (modalId === 'plant-select') this.renderPlantSelect();
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
    this.$crystalVal.textContent = StorageManager.getCrystals();
  }

  refreshDisplayPlant() {
    const plantId = StorageManager.getDisplayPlant();
    const def = getPlantDef(plantId);
    if (def) {
      this.$standeeEmoji.textContent = def.emoji;
      this.$standeeName.textContent = def.name;
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
          node.addEventListener('click', () => this.startCombat(lvl.id));
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

  // === Handbook ===
  renderHandbook() {
    const grid = document.getElementById('hb-grid');
    grid.innerHTML = '';
    const allPlants = getAllPlantDefs();
    const unlocked = allPlants.filter(p => StorageManager.isPlantUnlocked(p.id));
    const locked = allPlants.filter(p => !StorageManager.isPlantUnlocked(p.id));
    const sorted = [...unlocked, ...locked];
    for (const plant of sorted) {
      const card = document.createElement('div');
      card.className = 'hb-card';
      const isUnlocked = StorageManager.isPlantUnlocked(plant.id);
      if (!isUnlocked) card.classList.add('locked');
      const star = StorageManager.getPlantStar(plant.id);
      const skinId = StorageManager.getEquippedSkin(plant.id);
      const skin = skinId ? getSkin(plant.id, skinId) : null;
      card.innerHTML = `
        <div class="hb-emoji">${isUnlocked ? (skin ? skin.emoji : plant.emoji) : '❓'}</div>
        <div class="hb-name">${isUnlocked ? plant.name : '???'}</div>
        <div class="hb-stars">${isUnlocked ? '★'.repeat(star) + '☆'.repeat(3 - star) : '☆☆☆'}</div>
        <div class="hb-desc">${isUnlocked ? plant.description : '未解锁'}</div>
        ${isUnlocked && skin ? `<div class="hb-skin-name">皮肤: ${skin.name}</div>` : ''}
      `;
      if (isUnlocked) {
        card.addEventListener('click', () => this._onHandbookClick(plant.id));
      }
      grid.appendChild(card);
    }
  }

  _onHandbookClick(plantId) {
    this._starUpPlantId = plantId;
    this._skinPlantId = plantId;
    const star = StorageManager.getPlantStar(plantId);
    const def = getPlantDef(plantId);
    if (star < 3) {
      const cost = getStarCost(star, star + 1);
      this.$starUpInfo.innerHTML = `
        <p>${def.emoji} ${def.name}</p>
        <p>当前: <span class="highlight">${'★'.repeat(star)}${'☆'.repeat(3-star)}</span></p>
        <p>升星消耗: <span class="highlight">${cost} 晶核</span></p>
        <p>当前晶核: <span class="highlight">${StorageManager.getCrystals()}</span></p>
        ${cost !== Infinity ? '' : '<p style="color:var(--danger)">已满星</p>'}
      `;
    } else {
      this.$starUpInfo.innerHTML = `
        <p>${def.emoji} ${def.name}</p>
        <p>当前: <span class="highlight">★★★</span></p>
        <p style="color:var(--gold)">已满星</p>
      `;
    }
    document.getElementById('star-up-confirm').style.display = (star < 3) ? '' : 'none';
    this.showModal('star-up');

    // Render skin list
    this.renderSkinList(plantId);
  }

  renderSkinList(plantId) {
    this.$skinList.innerHTML = '';
    const skins = getSkins(plantId);
    if (skins.length === 0) {
      this.$skinList.innerHTML = '<p style="color:var(--text-dim)">该植物暂无皮肤</p>';
      return;
    }
    const equipped = StorageManager.getEquippedSkin(plantId);
    for (const skin of skins) {
      const opt = document.createElement('div');
      opt.className = 'skin-option';
      if (equipped === skin.id) opt.classList.add('equipped');
      const owned = StorageManager.ownsSkin(plantId, skin.id);
      opt.innerHTML = `
        <div style="font-size:40px;">${skin.emoji}</div>
        <div class="skin-name">${skin.name}</div>
        <div class="skin-cost">${owned ? '已拥有' : `消耗 ${skin.cost} 晶核`}</div>
        <div class="skin-effect">${skin.description}</div>
      `;
      opt.addEventListener('click', () => {
        if (!owned) {
          this._buySkin(plantId, skin.id, skin.cost);
        } else {
          StorageManager.equipSkin(plantId, skin.id);
          this.showToast(`已装备皮肤: ${skin.name}`);
          this.hideModal();
          this.renderHandbook();
          this.refreshDisplayPlant();
        }
      });
      this.$skinList.appendChild(opt);
    }
  }

  _buySkin(plantId, skinId, cost) {
    if (StorageManager.spendCrystals(cost)) {
      StorageManager.addSkin(plantId, skinId);
      StorageManager.equipSkin(plantId, skinId);
      const skin = getSkin(plantId, skinId);
      this.showToast(`解锁皮肤: ${skin.name}`);
      this.refreshCrystalDisplay();
      this.hideModal();
      this.renderHandbook();
      this.refreshDisplayPlant();
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
      this.hideModal();
      this.renderHandbook();
    } else {
      this.showToast('晶核不足！');
    }
  }

  // === Combat ===
  startCombat(levelId) {
    this.currentLevelId = levelId;
    this.showPage('combat');
    // Use dynamic import approach — BattleManager will be created in main.js callback
    // Instead, we dispatch an event that main.js listens to
    this._startCombatRequested = levelId;
    window.dispatchEvent(new CustomEvent('startCombat', { detail: { levelId } }));
  }

  endCombat() {
    if (this.battleManager) {
      this.battleManager.stop();
      this.battleManager = null;
    }
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
      ? `击败: 普通僵尸×${data.enemiesKilled.normal || 0}  路障僵尸×${data.enemiesKilled.cone || 0}`
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
      opt.innerHTML = `<div>${plant.emoji}</div><div class="ps-name">${plant.name}</div>`;
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
      this.hideModal();
      this.showToast('开发者模式已激活');
      if (this.pages.levelSelect.classList.contains('active')) this.renderLevelSelect();
      if (this.pages.handbook.classList.contains('active')) this.renderHandbook();
    } else {
      this.showToast('暗号错误');
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
      card.innerHTML = `<span>${def.emoji}</span><span class="cpc-cost">☀${def.combat.cost}</span>`;
      card.addEventListener('click', () => {
        if (this.selectedPlant === plantId) {
          this.selectedPlant = null;
          card.classList.remove('selected');
        } else {
          this.$combatFooter.querySelectorAll('.combat-plant-card').forEach(c => c.classList.remove('selected'));
          this.selectedPlant = plantId;
          card.classList.add('selected');
        }
      });
      this.$combatFooter.appendChild(card);
    }
  }
}
