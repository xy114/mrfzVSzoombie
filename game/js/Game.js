import { GAME_CONFIG, SUN_CONFIG, PLANT_TYPES } from './constants.js';
import { Lawn } from './Lawn.js';
import { Sunflower } from './Sunflower.js';
import { PeaShooter } from './PeaShooter.js';
import { Nut } from './Nut.js';
import { CherryBomb } from './CherryBomb.js';
import { NormalZombie } from './NormalZombie.js';
import { ConeZombie } from './ConeZombie.js';
import { ShieldZombie } from './ShieldZombie.js';
import { ImpZombie } from './ImpZombie.js';

import { WaveManager } from './WaveManager.js';
import { Sun } from './Sun.js';
import { StorageManager } from './StorageManager.js';
import { getZombieDef } from './ZombieConfig.js';
import { KatanaZero } from './Visitor.js';
import { getVisitorDef } from './VisitorConfig.js';
import { DamageNumber } from './DamageNumber.js';
import { DeathEffect } from './DeathEffect.js';
import { ExplosionEffect } from './ExplosionEffect.js';
import { drawSunflower, drawPeashooter, drawNut, drawCherryBomb } from './PlantRenderer.js';
import { assetManager } from './AssetManager.js';
import { Cart } from './Cart.js';
import { Squash } from './Squash.js';
import { Jalapeno } from './Jalapeno.js';
import { Repeater } from './Repeater.js';
import { TwinSunflower } from './TwinSunflower.js';
import { GatlingPea } from './GatlingPea.js';
import { FlagZombie } from './FlagZombie.js';
import { BucketZombie } from './BucketZombie.js';
import { ClownZombie } from './ClownZombie.js';

export class BattleManager {
  constructor(canvas, levelConfig, playerData) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = GAME_CONFIG.CANVAS_WIDTH;
    this.canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
    this.lawn = new Lawn();
    this.plants = [];
    this.zombies = [];
    this.bullets = [];
    this.suns = [];
    this.sun = levelConfig.startSun || 150;
    this.wave = 1;
    this.isRunning = false;
    this.lastTime = 0;
    this.maxWaves = levelConfig.waves || 3;
    this.waveManager = new WaveManager(this, this.maxWaves, levelConfig.zombieTypes || ['normal']);
    this.sunSpawnTimer = 0;
    this.levelConfig = levelConfig;
    this.playerData = playerData;

    this.enemiesKilled = { normal: 0, cone: 0, shield: 0, imp: 0 };
    this.battleEnded = false;
    this.plantCooldowns = {}; // { plantType: remainingMs }
    this._currentTime = 0;
    this.dragState = null; // set by main.js for ghost rendering
    this.timeScale = 1.0;
    this._timeStopped = false;
    this.visitors = [];
    this.damageNumbers = [];
    this.slashEffects = [];
    this.deathEffects = [];
    this.explosionEffects = [];
    this.carts = [];
    this.dragons = [];
    this.wishadelExplosions = [];

    this.onVictory = null;
    this.onDefeat = null;
    this.onSunChange = null;
    this.onWaveChange = null;
    this.onCooldownUpdate = null;
  }

  initCarts() {
    const skinId = (this.playerData.equippedSkins || {}).cart || 'default';
    for (let row = 0; row < this.lawn.rows; row++) {
      const cart = new Cart(row, skinId);
      // Position at left edge, small offset so it's visible
      cart.x = skinId === 'fireChen' ? -25 : 5;
      // Center vertically on the row (fireChen: up 30px from default)
      const tileCenter = this.lawn.getTileCenter(row, 0);
      cart.y = tileCenter.y - cart.height / 2 + (skinId === 'fireChen' ? -20 : 10);
      this.carts.push(cart);
    }
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.initCarts();

    // Auto-pause when tab is backgrounded, resume when visible
    this._visibilityHandler = () => {
      if (document.hidden) {
        this._backgroundPaused = true;
        this.isRunning = false;
      } else {
        this.isRunning = true;
        this.lastTime = performance.now();
        this._backgroundPaused = false;
        this.gameLoop();
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);

    this.gameLoop();
  }

  stop() {
    this.isRunning = false;
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
  }

  gameLoop() {
    if (!this.isRunning) return;
    const currentTime = performance.now();
    // Clamp deltaTime to prevent physics explosion when tab is backgrounded.
    // Without this, a multi-minute delta causes zombies to teleport across
    // the screen, bypassing plants and triggering carts incorrectly.
    const rawDelta = currentTime - this.lastTime;
    const deltaTime = Math.min(rawDelta, 200); // max ~12 frames at 60fps
    this.lastTime = currentTime;
    try {
      this.update(deltaTime);
      this.render();
    } catch (e) {
      console.error('Game loop error:', e);
    }
    requestAnimationFrame(() => this.gameLoop());
  }

  update(deltaTime) {
    if (this.battleEnded) return;
    if (this.lawn.debugGrid) return; // Freeze time during grid calibration
    const currentTime = performance.now();
    this._currentTime = currentTime;

    const scaledDelta = deltaTime * this.timeScale;

    // Update plant cooldowns
    let cooldownsChanged = false;
    for (const type of Object.keys(this.plantCooldowns)) {
      if (this.plantCooldowns[type] > 0) {
        this.plantCooldowns[type] = Math.max(0, this.plantCooldowns[type] - scaledDelta);
        cooldownsChanged = true;
      }
    }
    if (cooldownsChanged && this.onCooldownUpdate) {
      this.onCooldownUpdate(this.getCooldowns());
    }

    this.waveManager.update(scaledDelta, currentTime);

    this.sunSpawnTimer += scaledDelta;
    if (this.sunSpawnTimer >= SUN_CONFIG.SPAWN_INTERVAL) {
      this.sunSpawnTimer = 0;
      this.spawnRandomSun();
    }

    this.plants.forEach(plant => plant.update(scaledDelta, this));

    // Cart & Dragon update
    this.carts.forEach(c => c.update(scaledDelta, this));
    this.dragons = this.dragons.filter(d => {
      d.update(scaledDelta, this);
      return d.active;
    });
    this.carts = this.carts.filter(c => c.alive);

    this.bullets = this.bullets.filter(bullet => {
      bullet.update(scaledDelta, this);
      return bullet.active;
    });

    this.wishadelExplosions = this.wishadelExplosions.filter(e => e.active);

    this.zombies.forEach(zombie => zombie.update(scaledDelta, this));

    // Clown death explosion hook
    for (const z of this.zombies) {
      if (z._isClown && !z.alive && !z._exploding && !z._exploded) {
        z.onDeath(this);
      }
    }

    this.suns = this.suns.filter(sun => {
      sun.update(scaledDelta);
      return sun.active;
    });

    // Visitors always operate at real time (unaffected by timeScale)
    this.visitors.forEach(v => v.update(deltaTime, this));

    // Visual effects always animate at real time
    this.damageNumbers = this.damageNumbers.filter(dn => {
      dn.update(deltaTime);
      return dn.active;
    });

    this.slashEffects = this.slashEffects.filter(se => {
      se.update(deltaTime);
      return se.active;
    });

    this.deathEffects = this.deathEffects.filter(de => {
      de.update(deltaTime);
      return de.active;
    });

    this.explosionEffects = this.explosionEffects.filter(ee => {
      ee.update(deltaTime);
      return ee.active;
    });

    this.checkCollisions();
    this._tickRetreatTimers(deltaTime);
    this.trackDeadZombies();
    this.zombies = this.zombies.filter(z => z.alive || z._timeStopFrozen || z._deathDeferred);
    this.checkVictory();
    this.checkGameOver();
  }

  spawnRandomSun() {
    const row = Math.floor(Math.random() * this.lawn.rows);
    const col = Math.floor(Math.random() * this.lawn.cols);
    const center = this.lawn.getTileCenter(row, col);
    const cellW = GAME_CONFIG.CELL_WIDTH;
    const cellH = GAME_CONFIG.CELL_HEIGHT;
    // Random position within the cell (not crossing cell top/bottom bounds)
    const sunX = center.x - cellW / 4 + Math.random() * cellW / 2;
    const sunY = center.y - cellH / 4 + Math.random() * cellH / 2;
    const sun = new Sun(sunX, 0, sunY);
    this.addSun(sun);
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // ============================================
    // Layer 3: Background
    // ============================================
    this.lawn.render(this.ctx);

    // Grid placement ghost — above background so it's visible during drag
    if (this.dragState) {
      const { hoverRow, hoverCol, plantType } = this.dragState;
      if (hoverRow >= 0 && hoverRow < this.lawn.rows &&
          hoverCol >= 0 && hoverCol < this.lawn.cols) {
        const isVisitor = !!getVisitorDef(plantType);
        const cost = isVisitor ? 0 : this._getPlantCost(plantType);
        const canAfford = isVisitor || this.sun >= cost;
        const deployOk = isVisitor ? this.getDeployCount(plantType) < 1 : true;
        const canPlace = this.lawn.canPlant(hoverRow, hoverCol) && canAfford && !this.isPlantOnCooldown(plantType) && deployOk;

        const tile = this.lawn.sceneGrid.tiles[`${hoverRow},${hoverCol}`];
        if (tile) {
          const params = this._getPlantPlacementParams(plantType);
          const rect = this.lawn.getPlacementRect(params.bodyType, params.renderSize, hoverRow, hoverCol, 0, params.aspectRatio);
          // Ghost uses rect dimensions directly — no CELL_WIDTH multiplication
          const actualW = rect.w;
          const actualH = rect.h;

          this.ctx.save();
          this.ctx.globalAlpha = canPlace ? 0.45 : 0.2;
          if (rect.rotation !== 0) {
            const cx = rect.x + actualW / 2;
            const cy = rect.y + actualH / 2;
            this.ctx.translate(cx, cy);
            this.ctx.rotate(rect.rotation);
            this.ctx.translate(-cx, -cy);
          }

          let img = null;
          if (isVisitor) {
            img = assetManager.getImageNoBg('visitor_katana_zero');
          } else {
            img = this._getSkinGhostImage(plantType);
          }
          if (img) {
            const imgScale = Math.min(actualW / img.naturalWidth, actualH / img.naturalHeight);
            const dw = img.naturalWidth * imgScale;
            const dh = img.naturalHeight * imgScale;
            const dx = rect.x + (actualW - dw) / 2;
            const dy = rect.y + actualH - dh;
            this.ctx.drawImage(img, dx, dy, dw, dh);
          }
          if (!img) {
            const gx = rect.x, gy = rect.y;
            if (plantType === 'sunflower') drawSunflower(this.ctx, gx, gy, actualW, actualH);
            else if (plantType === 'peashooter') drawPeashooter(this.ctx, gx, gy, actualW, actualH, false);
            else if (plantType === 'nut') drawNut(this.ctx, gx, gy, actualW, actualH, false);
            else if (plantType === 'cherrybomb') drawCherryBomb(this.ctx, gx, gy, actualW, actualH, false);
            else {
              // Generic fallback: filled rect matching cell size
              this.ctx.fillStyle = 'rgba(100,160,80,0.3)';
              this.ctx.fillRect(gx, gy, actualW, actualH);
            }
          }

          // Red flash overlay when placement is invalid
          if (!canPlace) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
            this.ctx.fillRect(rect.x, rect.y, actualW, actualH);
          }

          this.ctx.restore();
        }
      }
    }

    // ============================================
    // Layer 2: Attachments (bullets, suns, effects, bars)
    // ============================================
    this.bullets.forEach(bullet => bullet.render(this.ctx));
    this.dragons.forEach(dragon => dragon.render(this.ctx));
    this.slashEffects.forEach(se => se.render(this.ctx));
    this.deathEffects.forEach(de => de.render(this.ctx));
    this.explosionEffects.forEach(ee => ee.render(this.ctx));
    this.damageNumbers.forEach(dn => dn.render(this.ctx));

    // ============================================
    // Layer 1: Characters (sorted by row asc, same-row zombies in front of plants)
    // ============================================
    const chars = [];
    for (const cart of this.carts) {
      if (cart.alive) chars.push({ type: 'plant', entity: cart, row: cart.row });
    }
    for (const plant of this.plants) {
      chars.push({ type: 'plant', entity: plant, row: plant.row });
    }
    for (const zombie of this.zombies) {
      chars.push({ type: 'zombie', entity: zombie, row: zombie.row });
    }
    for (const v of this.visitors) {
      chars.push({ type: 'visitor', entity: v, row: v.row });
    }

    const typeOrder = { zombie: 2, visitor: 1, plant: 0 };
    chars.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
    });

    for (const { type, entity } of chars) {
      // Retreat animation: shrink + fade
      const ret = entity._retreating || 0;
      if (ret > 0) {
        const progress = 1 - ret / 300;
        const cx = entity.x + entity.width / 2;
        const cy = entity.y + entity.height / 2;
        this.ctx.save();
        this.ctx.globalAlpha = 1 - progress;
        this.ctx.translate(cx, cy);
        this.ctx.scale(1 - progress * 0.5, 1 - progress * 0.5);
        this.ctx.translate(-cx, -cy);
      }
      if (type === 'zombie') {
        entity.render(this.ctx);
      } else {
        const s = entity.scale || 1;
        const r = entity.rotation || 0;
        if (s !== 1 || r !== 0) {
          this.ctx.save();
          this.ctx.translate(entity.x, entity.y);
          if (r !== 0) this.ctx.rotate(r);
          this.ctx.scale(s, s);
          const ox = entity.x, oy = entity.y;
          entity.x = 0; entity.y = 0;
          entity.render(this.ctx);
          entity.x = ox; entity.y = oy;
          this.ctx.restore();
        } else {
          entity.render(this.ctx);
        }
      }
      if (ret > 0) {
        this.ctx.restore();
      }
    }

    // Health / skill bars — above characters, after render updates _barAnchorY
    this.plants.forEach(p => { if (p.alive) p.renderBars(this.ctx); });
    this.zombies.forEach(z => { if (z.alive) z.renderBars(this.ctx); });
    this.visitors.forEach(v => { if (v.alive) v.renderBars(this.ctx); });

    // Suns — above all characters, never blocked
    this.suns.forEach(sun => sun.render(this.ctx));

    // Squash jump animations — above characters (same layer as suns)
    this.plants.forEach(p => {
      if (p.renderJump) p.renderJump(this.ctx);
    });

    // Wishadel explosions — same top layer as suns
    this.wishadelExplosions.forEach(e => {
      if (e.renderExplosion) e.renderExplosion(this.ctx);
    });

    // Drag ghost — always on top of all characters
    if (this.dragState && this.dragState.mouseX !== undefined) {
      const { plantType, mouseX, mouseY } = this.dragState;
      const isVisitor = !!getVisitorDef(plantType);
      const cost = isVisitor ? 0 : this._getPlantCost(plantType);
      this.ctx.save();
      this.ctx.globalAlpha = (isVisitor || this.sun >= cost) ? 0.65 : 0.35;

      const params = this._getPlantPlacementParams(plantType);
      const virtualRect = this.lawn.getPlacementRect(params.bodyType, params.renderSize, 0, 0, 0, params.aspectRatio);
      const actualW = virtualRect.w;
      const actualH = virtualRect.h;

      let img = null;
      if (isVisitor) {
        img = assetManager.getImageNoBg('visitor_katana_zero');
        if (img) {
          const imgScale = Math.min(actualW / img.naturalWidth, actualH / img.naturalHeight);
          const dw = img.naturalWidth * imgScale;
          const dh = img.naturalHeight * imgScale;
          this.ctx.drawImage(img, mouseX - dw / 2, mouseY - dh / 2, dw, dh);
        }
      } else {
        img = this._getSkinGhostImage(plantType);
        if (img) {
          const imgScale = Math.min(actualW / img.naturalWidth, actualH / img.naturalHeight);
          const dw = img.naturalWidth * imgScale;
          const dh = img.naturalHeight * imgScale;
          this.ctx.drawImage(img, mouseX - dw / 2, mouseY - dh / 2, dw, dh);
        }
      }
      if (!img) {
        const gx = mouseX - actualW / 2;
        const gy = mouseY - actualH / 2;
        if (plantType === 'sunflower') drawSunflower(this.ctx, gx, gy, actualW, actualH);
        else if (plantType === 'peashooter') drawPeashooter(this.ctx, gx, gy, actualW, actualH, false);
        else if (plantType === 'nut') drawNut(this.ctx, gx, gy, actualW, actualH, false);
        else if (plantType === 'cherrybomb') drawCherryBomb(this.ctx, gx, gy, actualW, actualH, false);
      }
      this.ctx.restore();
    }

    // Time-stop visual overlay
    if (this._timeStopped) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.35;
      this.ctx.fillStyle = '#3040c8';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }

    // Flash red on invalid placement
    if (this._flashCell && this._flashCell.timer > 0) {
      this._flashCell.timer -= 16;
      const alpha = this._flashCell.timer / 300 * 0.5;
      const tile = this.lawn.sceneGrid.tiles[`${this._flashCell.row},${this._flashCell.col}`];
      if (tile) {
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillRect(tile.center[0] - 25, tile.center[1] - 25, 50, 50);
        this.ctx.restore();
      }
    }
  }

  _getPlantCost(plantType) {
    const key = plantType.toUpperCase();
    return PLANT_TYPES[key]?.cost || 999;
  }

  _getPlantPlacementParams(plantType) {
    if (getVisitorDef(plantType)) {
      return { bodyType: 'humanoid', renderSize: 96, aspectRatio: 1.0 };
    }
    if (plantType === 'peashooter') {
      const skinId = (this.playerData.equippedSkins || {})[plantType];
      if (skinId === 'wishadel') {
        return { bodyType: 'humanoid', renderSize: 160, aspectRatio: 0.5 };
      }
    }
    if (plantType === 'cart') {
      const skinId = (this.playerData.equippedSkins || {})[plantType];
      if (skinId === 'fireChen') {
        return { bodyType: 'humanoid', renderSize: 125, aspectRatio: 1.0 };
      }
    }
    if (plantType === 'cherrybomb') {
      return { bodyType: 'plant', renderSize: 80, aspectRatio: 0.72 };
    }
    return { bodyType: 'plant', renderSize: 80, aspectRatio: 1.0 };
  }

  _getSkinGhostImage(plantType) {
    const skinId = (this.playerData.equippedSkins || {})[plantType];
    if (skinId) {
      const combatKey = plantType + '_skin_' + skinId + '_combat';
      const combatImg = assetManager.getImage(combatKey);
      if (combatImg) return combatImg;
    }
    return assetManager.getImage(plantType);
  }

  _deadZombiesThisFrame = [];

  trackDeadZombies() {
    // During time-stop, defer death processing until time resumes
    if (this._timeStopped) return;

    const newDead = this.zombies.filter(z => !z.alive && !z._killTracked && !z._deathDeferred);
    for (const zombie of newDead) {
      zombie._killTracked = true;
      this.enemiesKilled[zombie.rewardType] = (this.enemiesKilled[zombie.rewardType] || 0) + 1;

      // Spawn death effects
      if (zombie._shouldSpawnDeathEffect && zombie.deathGifKey) {
        zombie._shouldSpawnDeathEffect = false;
        const deathX = zombie.x;
        const bottomY = zombie.y + zombie.height;
        const w = zombie.width;

        if (zombie.deathGifKey === 'imp_death') {
          this.addDeathEffect(new DeathEffect(deathX, bottomY, w, 'imp_death'));
        } else {
          this.addDeathEffect(new DeathEffect(deathX, bottomY, w, 'zombie_death'));
          this.addDeathEffect(new DeathEffect(deathX + w * 0.1, bottomY - zombie.height * 0.3, w * 0.75, 'zombie_head'));
        }
      }
    }
  }

  collectZombieKillsInRadius(centerRow, centerCol) {
    // Deaths tracked via trackDeadZombies in the update loop
  }

  checkCollisions() {
    this.bullets.forEach(bullet => {
      if (!bullet.active) return;
      if (bullet.skipCollisionCheck) return; // Wishadel bullets self-handle

      this.zombies.forEach(zombie => {
        if (zombie.row === bullet.row && zombie.alive) {
          const bulletCenterX = bullet.x + bullet.width / 2;
          const bulletCenterY = bullet.y + bullet.height / 2;
          const zombieCenterX = zombie.x + zombie.width / 2;
          const zombieCenterY = zombie.y + zombie.height / 2;

          const dx = Math.abs(bulletCenterX - zombieCenterX);
          const dy = Math.abs(bulletCenterY - zombieCenterY);

          const collisionDistance = (bullet.width + zombie.width) / 2;

          if (dx < collisionDistance && dy < 50) {
            bullet.active = false;
            zombie.takeDamage(bullet.damage, bullet.damageType);
          }
        }
      });
    });

    this.bullets = this.bullets.filter(b => b.active);
  }

  _tickRetreatTimers(deltaTime) {
    for (const p of this.plants) {
      if (p._retreating > 0) {
        p._retreating -= deltaTime;
        if (p._retreating <= 0) p.alive = false;
      }
    }
    for (const v of this.visitors) {
      if (v._retreating > 0) {
        v._retreating -= deltaTime;
        if (v._retreating <= 0) v.alive = false;
      }
    }
    for (const p of this.plants) {
      if (!p.alive && p.row !== undefined && p.col !== undefined) {
        this.lawn.removePlant(p.row, p.col);
      }
    }
    for (const v of this.visitors) {
      if (!v.alive && v.row !== undefined && v.col !== undefined) {
        this.lawn.removePlant(v.row, v.col);
      }
    }
    this.plants = this.plants.filter(p => p.alive);
    this.visitors = this.visitors.filter(v => v.alive);
  }

  checkVictory() {
    if (this.battleEnded) return;
    if (this.waveManager.allWavesComplete()) {
      this.battleEnded = true;
      this.isRunning = false;
      const crystalsEarned = this.calculateCrystals();
      if (this.onVictory) {
        this.onVictory({
          levelId: this.levelConfig.id,
          enemiesKilled: { ...this.enemiesKilled },
          crystalsEarned
        });
      }
    }
  }

  checkGameOver() {
    if (this.battleEnded) return;
    // Only game over if zombie reaches far left AND no active cart (not done) in that row can save it
    const reachedLeft = this.zombies.some(z => {
      if (z.x >= 10) return false;
      const cart = this.carts.find(c => c.row === z.row);
      return !cart;
    });
    if (reachedLeft) {
      this.battleEnded = true;
      this.isRunning = false;
      if (this.onDefeat) {
        this.onDefeat({
          levelId: this.levelConfig.id,
          enemiesKilled: { ...this.enemiesKilled }
        });
      }
    }
  }

  calculateCrystals() {
    let total = 0;
    for (const [type, count] of Object.entries(this.enemiesKilled)) {
      const def = getZombieDef(type);
      const star = def ? def.threatLevel : 1;
      total += count * star;
    }
    return total;
  }

  addPlant(plant) { this.plants.push(plant); }
  addZombie(zombie) { this.zombies.push(zombie); }
  addBullet(bullet) { this.bullets.push(bullet); }
  addSun(sun) { this.suns.push(sun); }

  addVisitor(visitor) { this.visitors.push(visitor); }
  addDamageNumber(dn) { this.damageNumbers.push(dn); }
  addSlashEffect(se) { this.slashEffects.push(se); }
  addDeathEffect(de) { this.deathEffects.push(de); }
  addExplosionEffect(ee) { this.explosionEffects.push(ee); }

  setTimeScale(scale) {
    this.timeScale = scale;
  }

  collectSun(value) {
    this.sun += value;
    if (this.onSunChange) this.onSunChange(this.sun);
  }

  spendSun(value) {
    if (this.sun >= value) {
      this.sun -= value;
      if (this.onSunChange) this.onSunChange(this.sun);
      return true;
    }
    return false;
  }

  retreatUnit(unit, isActive = false, sunTargetPos = null) {
    if (isActive && unit.actualCost !== undefined) {
      const refund = Math.floor(unit.actualCost * 0.5);
      this.sun += refund;
      if (this.onSunChange) this.onSunChange(this.sun);
      const dn = new DamageNumber(
        unit.x + unit.width / 2, unit.y, refund, false, '#90ffb0'
      );
      dn.maxLife = 1200; // slower fade
      if (sunTargetPos) {
        dn.setTarget(sunTargetPos.x, sunTargetPos.y, 0.06);
      }
      this.addDamageNumber(dn);
    }
    if (unit.row !== undefined && unit.col !== undefined) {
      this.lawn.removePlant(unit.row, unit.col);
    }
    unit._retreating = 300;
    return true;
  }

  getDeployCount(visitorId) {
    return this.visitors.filter(v => v.alive && v.id === visitorId).length;
  }

  updateWaveDisplay() {
    this.wave = this.waveManager.wave;
    if (this.onWaveChange) this.onWaveChange(this.wave);
  }

  isPlantOnCooldown(plantType) {
    return (this.plantCooldowns[plantType] || 0) > 0;
  }

  getCooldowns() {
    const result = {};
    for (const type of Object.keys(PLANT_TYPES)) {
      const key = PLANT_TYPES[type].name;
      result[key] = this.plantCooldowns[key] || 0;
    }
    return result;
  }

  handleDrop(x, y, plantType) {
    // Check if visitor
    const visitorDef = getVisitorDef(plantType);
    if (visitorDef) {
      if (this.getDeployCount(plantType) >= 1) return false;
      const { row, col } = this.lawn.getCellFromPosition(x, y);
      if (!this.lawn.canPlant(row, col)) return false;
      const center = this.lawn.getTileCenter(row, col);
      const visitor = new KatanaZero(center.x - 30, center.y - 40, row);
      visitor.col = col;
      this.addVisitor(visitor);
      this.lawn.plant(row, col, visitor);
      return true;
    }

    if (this.isPlantOnCooldown(plantType)) return false;

    const { row, col } = this.lawn.getCellFromPosition(x, y);
    if (!this.lawn.canPlant(row, col)) return false;

    const center = this.lawn.getTileCenter(row, col);
    const sc = this.lawn.standardCell;
    const plantX = center.x - sc.w / 2;
    const plantY = center.y - sc.h / 2;
    const star = (this.playerData.plantStars || {})[plantType] || 1;
    const skin = (this.playerData.equippedSkins || {})[plantType] || 'default';

    let placed = false;
    if (plantType === 'sunflower') {
      if (this.spendSun(PLANT_TYPES.SUNFLOWER.cost)) {
        this.addPlant(new Sunflower(plantX, plantY, star));
        this.plantCooldowns.sunflower = PLANT_TYPES.SUNFLOWER.cooldown;
        placed = true;
      }
    } else if (plantType === 'peashooter') {
      if (this.spendSun(PLANT_TYPES.PEASHOOTER.cost)) {
        this.addPlant(new PeaShooter(plantX, plantY, star, skin));
        this.plantCooldowns.peashooter = PLANT_TYPES.PEASHOOTER.cooldown;
        placed = true;
      }
    } else if (plantType === 'nut') {
      if (this.spendSun(PLANT_TYPES.NUT.cost)) {
        this.addPlant(new Nut(plantX, plantY, star));
        this.plantCooldowns.nut = PLANT_TYPES.NUT.cooldown;
        placed = true;
      }
    } else if (plantType === 'cherrybomb') {
      if (this.spendSun(PLANT_TYPES.CHERRY_BOMB.cost)) {
        this.addPlant(new CherryBomb(plantX, plantY, star));
        this.plantCooldowns.cherrybomb = PLANT_TYPES.CHERRY_BOMB.cooldown;
        placed = true;
      }
    } else if (plantType === 'squash') {
      if (this.spendSun(PLANT_TYPES.SQUASH.cost)) {
        const plant = new Squash(plantX, plantY, star);
        plant.row = row;
        this.addPlant(plant);
        this.plantCooldowns.squash = PLANT_TYPES.SQUASH.cooldown;
        placed = true;
      }
    } else if (plantType === 'jalapeno') {
      if (this.spendSun(PLANT_TYPES.JALAPENO.cost)) {
        const plant = new Jalapeno(plantX, plantY, star);
        plant.row = row;
        this.addPlant(plant);
        this.plantCooldowns.jalapeno = PLANT_TYPES.JALAPENO.cooldown;
        placed = true;
      }
    } else if (plantType === 'repeater') {
      if (this.spendSun(PLANT_TYPES.REPEATER.cost)) {
        const plant = new Repeater(plantX, plantY, star, skin);
        plant.row = row;
        this.addPlant(plant);
        this.plantCooldowns.repeater = PLANT_TYPES.REPEATER.cooldown;
        placed = true;
      }
    } else if (plantType === 'twinsunflower') {
      if (this.spendSun(PLANT_TYPES.TWIN_SUNFLOWER.cost)) {
        const plant = new TwinSunflower(plantX, plantY, star, skin);
        plant.row = row;
        this.addPlant(plant);
        this.plantCooldowns.twinsunflower = PLANT_TYPES.TWIN_SUNFLOWER.cooldown;
        placed = true;
      }
    } else if (plantType === 'gatlingpea') {
      if (this.spendSun(PLANT_TYPES.GATLING_PEA.cost)) {
        const plant = new GatlingPea(plantX, plantY, star, skin);
        plant.row = row;
        this.addPlant(plant);
        this.plantCooldowns.gatlingpea = PLANT_TYPES.GATLING_PEA.cooldown;
        placed = true;
      }
    }
    if (placed) {
      const plant = this.plants[this.plants.length - 1];
      plant.actualCost = this._getPlantCost(plantType);
      this.lawn.plant(row, col, plant);
      if (this.onCooldownUpdate) this.onCooldownUpdate(this.getCooldowns());
    }
    return placed;
  }

  // Grid calibration helpers
  handleDebugMouseDown(x, y) {
    if (!this.lawn.debugGrid) return false;
    const hit = this.lawn.findNearestVertex(x, y);
    if (hit) {
      this.lawn._dragVertex = hit;
      return true;
    }
    return false;
  }

  handleDebugMouseMove(x, y) {
    if (!this.lawn.debugGrid || !this.lawn._dragVertex) return;
    this.lawn.moveVertex(this.lawn._dragVertex.r, this.lawn._dragVertex.c, x, y);
  }

  handleDebugMouseUp() {
    if (!this.lawn._dragVertex) return;
    this.lawn._dragVertex = null;
  }

  spawnZombie(type = 'normal') {
    const row = Math.floor(Math.random() * this.lawn.rows);
    const x = GAME_CONFIG.CANVAS_WIDTH;
    let zombie;
    switch (type) {
      case 'cone': zombie = new ConeZombie(x, 0, row); break;
      case 'shield': zombie = new ShieldZombie(x, 0, row); break;
      case 'imp': zombie = new ImpZombie(x, 0, row); break;
      case 'flag': zombie = new FlagZombie(x, 0, row); break;
      case 'bucket': zombie = new BucketZombie(x, 0, row); break;
      case 'clown': zombie = new ClownZombie(x, 0, row); break;
      default: zombie = new NormalZombie(x, 0, row); break;
    }
    const rect = this.lawn.getPlacementRect('humanoid', zombie.width, row, 0, 0, zombie.getAspectRatio());
    zombie.y = rect.y;
    this.addZombie(zombie);
    StorageManager.encounterEnemy(type);
  }
}
