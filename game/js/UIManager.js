import { StorageManager } from './StorageManager.js';
import { PRELUDES } from './LevelConfig.js';
import { getPlantDef, getAllPlantDefs, getStarMultiplier, getStarCost, getSkins, getSkin } from './PlantConfig.js';
import { getZombieDef, getAllZombieDefs, getThreatLabel } from './ZombieConfig.js';
import { drawNormalZombiePortrait, drawConeZombiePortrait, drawShieldZombiePortrait, drawImpZombiePortrait } from './ZombieRenderer.js';
import { drawSunflowerPortrait, drawPeashooterPortrait, drawNutPortrait, drawCherryBombPortrait, drawSunflower, drawPeashooter, drawNut, drawCherryBomb } from './PlantRenderer.js';
import { assetManager } from './AssetManager.js';

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
    this.$standeeName = document.getElementById('standee-name');
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
    if (this.$standeeName) this.$standeeName.textContent = def.name;
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

    const pctx = canvas.getContext('2d');
    if (img) {
      // Proportional scaling: use natural dimensions, max width 200px
      const maxW = 200;
      const scale = Math.min(1, maxW / img.naturalWidth);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      pctx.clearRect(0, 0, canvas.width, canvas.height);
      pctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
      canvas.width = 200;
      canvas.height = 260;
      pctx.clearRect(0, 0, 200, 260);
      this._drawPortrait(pctx, 'plant', plantId, 200, 260);
    }
    canvas.style.display = 'block';
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
        ctx.fillStyle = '#1a1a3a';
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
      ctx.fillStyle = isUnlocked ? textColor : '#4e5870';
      ctx.font = `bold ${Math.round(14 * scale)}px "Microsoft YaHei", "Segoe UI", sans-serif`;
      ctx.fillText(isUnlocked ? plant.name : '???', cardW / 2, nameY);

      // Stars
      ctx.fillStyle = isUnlocked ? '#ffd700' : '#4e5870';
      ctx.font = `${Math.round(12 * scale)}px "Microsoft YaHei", "Segoe UI", sans-serif`;
      ctx.fillText(isUnlocked ? '★'.repeat(star) + '☆'.repeat(3 - star) : '☆☆☆', cardW / 2, starY);

      // Description
      ctx.fillStyle = isUnlocked ? textColor : '#4e5870';
      ctx.font = `${Math.round(11 * scale)}px "Microsoft YaHei", "Segoe UI", sans-serif`;
      const desc = isUnlocked ? plant.description : '未解锁';
      ctx.fillText(desc.length > 16 ? desc.slice(0, 15) + '...' : desc, cardW / 2, descY);

      // Skin info
      if (isUnlocked && skin) {
        ctx.fillStyle = '#4dc9f6';
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

    this._setupDragScroll(this.$hbPlantScroll);
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
        ctx.fillStyle = '#1a1a3a';
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
      ctx.fillStyle = isEncountered ? textColor : '#4e5870';
      ctx.font = `bold ${Math.round(14 * scale)}px "Microsoft YaHei", "Segoe UI", sans-serif`;
      ctx.fillText(isEncountered ? enemy.name : '???', cardW / 2, nameY);

      // Threat badge
      ctx.fillStyle = isEncountered ?
        (threat.class === 'threat-extreme' ? '#e84040' : threat.class === 'threat-elite' ? '#f0a030' : '#3ecf6b') :
        '#4e5870';
      ctx.font = `${Math.round(12 * scale)}px "Microsoft YaHei", "Segoe UI", sans-serif`;
      ctx.fillText(isEncountered ? threat.text : '???', cardW / 2, threatY);

      // Description
      ctx.fillStyle = isEncountered ? textColor : '#4e5870';
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
    // Draw portrait on canvas — proportional scaling
    const canvas = this.$hbDetailCanvas;
    if (canvas) {
      const portraitKey = plantId + '_portrait';
      const img = assetManager.getImage(portraitKey);
      const maxW = 200, maxH = 260;
      if (img) {
        const margin = 0.9;
        const gifScale = Math.min((maxW * margin) / img.naturalWidth, (maxH * margin) / img.naturalHeight);
        canvas.width = Math.round(img.naturalWidth * gifScale);
        canvas.height = Math.round(img.naturalHeight * gifScale);
      } else {
        canvas.width = maxW;
        canvas.height = maxH;
      }
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
    // Draw portrait on canvas — proportional scaling
    const canvas = this.$hbDetailCanvas;
    if (canvas) {
      const maxW = 200, maxH = 260;
      if (isEncountered) {
        const portraitKey = enemyId + '_portrait';
        const img = assetManager.getImage(portraitKey);
        if (img) {
          const margin = 0.9;
          const gifScale = Math.min((maxW * margin) / img.naturalWidth, (maxH * margin) / img.naturalHeight);
          canvas.width = Math.round(img.naturalWidth * gifScale);
          canvas.height = Math.round(img.naturalHeight * gifScale);
        } else {
          canvas.width = maxW;
          canvas.height = maxH;
        }
      } else {
        canvas.width = maxW;
        canvas.height = maxH;
      }
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

  _drawPortrait(ctx, category, id, maxW, maxH) {
    const portraitKey = id + '_portrait';
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
  startCombat(levelId) {
    this.currentLevelId = levelId;
    this.showPage('combat');
    this._startCombatRequested = levelId;
    window.dispatchEvent(new CustomEvent('startCombat', { detail: { levelId } }));
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
        this.showToast('恢复失败：无快照数据');
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

    // Bright cyan gradient — visible against dark top bar
    const grad = ctx.createLinearGradient(-outerR, -outerR, outerR, outerR);
    grad.addColorStop(0, '#b3e8ff');
    grad.addColorStop(0.3, '#7dddfb');
    grad.addColorStop(0.6, '#4dc9f6');
    grad.addColorStop(1, '#2a8ec8');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(180, 230, 255, 0.6)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Center hole
    ctx.beginPath();
    ctx.arc(0, 0, holeR, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a0f';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 230, 255, 0.5)';
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(0, 0, innerR - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.restore();
  }

  drawCrystalIcon() {
    const canvas = this.$crystalCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 28, 28);

    // Prismatic crystal — hexagonal elongated shape
    const cx = 14, cy = 14;
    const topY = 4, botY = 24;
    const midTopY = 9, midBotY = 19;
    const leftX = 5, rightX = 23;
    const midLeftX = 8, midRightX = 20;

    ctx.save();

    // Crystal body — hexagonal shape
    ctx.beginPath();
    ctx.moveTo(cx, topY);        // top point
    ctx.lineTo(rightX, midTopY);  // upper right
    ctx.lineTo(rightX, midBotY);  // lower right
    ctx.lineTo(cx, botY);        // bottom point
    ctx.lineTo(leftX, midBotY);  // lower left
    ctx.lineTo(leftX, midTopY);  // upper left
    ctx.closePath();

    // Gradient fill with prismatic shine
    const grad = ctx.createLinearGradient(leftX, topY, rightX, botY);
    grad.addColorStop(0, '#b3e8ff');
    grad.addColorStop(0.15, '#7dddfb');
    grad.addColorStop(0.35, '#3aa8d8');
    grad.addColorStop(0.55, '#1a6a9e');
    grad.addColorStop(0.7, '#2a8cc0');
    grad.addColorStop(0.85, '#5cc8f0');
    grad.addColorStop(1, '#8dd8f8');
    ctx.fillStyle = grad;
    ctx.fill();

    // Inner edge highlight
    ctx.strokeStyle = 'rgba(180, 230, 255, 0.4)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Left facet highlight (brighter)
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(leftX, midTopY);
    ctx.lineTo(leftX, midBotY);
    ctx.lineTo(cx, botY);
    ctx.closePath();
    const leftGrad = ctx.createLinearGradient(leftX, topY, cx, botY);
    leftGrad.addColorStop(0, 'rgba(200, 240, 255, 0.25)');
    leftGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
    leftGrad.addColorStop(1, 'rgba(120, 200, 240, 0.05)');
    ctx.fillStyle = leftGrad;
    ctx.fill();

    // Top-right facet — bright specular
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(rightX, midTopY);
    ctx.lineTo(cx, midTopY + 2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fill();

    // Central bright line (vertical prism edge)
    ctx.beginPath();
    ctx.moveTo(cx, topY + 2);
    ctx.lineTo(cx, botY - 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Bottom glint point
    ctx.beginPath();
    ctx.arc(cx, botY - 2, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();

    ctx.restore();
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
      if (plantId === 'sunflower') drawSunflower(cctx, 0, 0, 48, 48);
      else if (plantId === 'peashooter') drawPeashooter(cctx, 0, 0, 48, 48, false);
      else if (plantId === 'nut') drawNut(cctx, 0, 0, 48, 48, false);
      else if (plantId === 'cherrybomb') drawCherryBomb(cctx, 0, 0, 48, 48, false);
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
}
