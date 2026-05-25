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
import { drawSunflower, drawPeashooter, drawNut, drawCherryBomb } from './PlantRenderer.js';
import { assetManager } from './AssetManager.js';

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
    this.visitors = [];
    this._deployedVisitorIds = new Set();
    this.damageNumbers = [];
    this.slashEffects = [];

    this.onVictory = null;
    this.onDefeat = null;
    this.onSunChange = null;
    this.onWaveChange = null;
    this.onCooldownUpdate = null;
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  stop() {
    this.isRunning = false;
  }

  gameLoop() {
    if (!this.isRunning) return;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
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

    this.bullets = this.bullets.filter(bullet => {
      bullet.update(scaledDelta, this);
      return bullet.active;
    });

    this.zombies.forEach(zombie => zombie.update(scaledDelta, this));

    this.suns = this.suns.filter(sun => {
      sun.update(scaledDelta);
      return sun.active;
    });

    // Visitors always operate at real time (unaffected by timeScale)
    this.visitors.forEach(v => v.update(deltaTime, this));
    for (const v of this.visitors) {
      if (!v.alive && v.row !== undefined && v.col !== undefined) {
        this.lawn.removePlant(v.row, v.col);
      }
    }
    this.visitors = this.visitors.filter(v => v.alive);

    // Visual effects always animate at real time
    this.damageNumbers = this.damageNumbers.filter(dn => {
      dn.update(deltaTime);
      return dn.active;
    });

    this.slashEffects = this.slashEffects.filter(se => {
      se.update(deltaTime);
      return se.active;
    });

    this.checkCollisions();
    this.trackDeadZombies();
    this.zombies = this.zombies.filter(z => z.alive);
    this.checkVictory();
    this.checkGameOver();
  }

  spawnRandomSun() {
    const row = Math.floor(Math.random() * this.lawn.rows);
    const col = Math.floor(Math.random() * this.lawn.cols);
    const center = this.lawn.getTileCenter(row, col);
    const x = center.x - GAME_CONFIG.CELL_WIDTH / 2 + Math.random() * 30;
    const targetY = this.lawn.getRowY(row) + Math.random() * 50;
    const sun = new Sun(x, 0, targetY);
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
        const canPlace = this.lawn.canPlant(hoverRow, hoverCol) && canAfford && !this.isPlantOnCooldown(plantType);

        if (canPlace) {
          const tile = this.lawn.sceneGrid.tiles[`${hoverRow},${hoverCol}`];
          if (tile) {
            const sc = this.lawn.standardCell;
            const scale = sc.w / this.lawn.cellWidth;
            let baseRenderSize = 80;
            if (plantType === 'peashooter') {
              const skinId = (this.playerData.plantSkins || {})[plantType];
              if (skinId === 'wishadel') baseRenderSize = 96;
            }
            const sz = baseRenderSize * scale;
            const cx = tile.center[0], cy = tile.center[1];

            this.ctx.save();
            this.ctx.globalAlpha = 0.45;
            if (this.lawn.isSlanted(hoverCol)) {
              this.ctx.translate(cx, cy);
              this.ctx.rotate(-Math.PI / 4);
              this.ctx.translate(-cx, -cy);
            }

            let img = null;
            if (isVisitor) {
              img = assetManager.getImageNoBg('visitor_katana_zero');
              if (img) {
                const imgScale = Math.min(sz / img.naturalWidth, sz / img.naturalHeight);
                const dw = img.naturalWidth * imgScale;
                const dh = img.naturalHeight * imgScale;
                this.ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
              }
            } else {
              img = this._getSkinGhostImage(plantType);
              if (img) {
                const imgScale = Math.min(sz / img.naturalWidth, sz / img.naturalHeight);
                const dw = img.naturalWidth * imgScale;
                const dh = img.naturalHeight * imgScale;
                this.ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
              }
            }
            if (!img) {
              if (plantType === 'sunflower') drawSunflower(this.ctx, cx - sz / 2, cy - sz / 2, sz, sz);
              else if (plantType === 'peashooter') drawPeashooter(this.ctx, cx - sz / 2, cy - sz / 2, sz, sz, false);
              else if (plantType === 'nut') drawNut(this.ctx, cx - sz / 2, cy - sz / 2, sz, sz, false);
              else if (plantType === 'cherrybomb') drawCherryBomb(this.ctx, cx - sz / 2, cy - sz / 2, sz, sz, false);
            }
            this.ctx.restore();
          }
        }
      }
    }

    // ============================================
    // Layer 2: Attachments (bullets, suns, effects, bars)
    // ============================================
    this.bullets.forEach(bullet => bullet.render(this.ctx));
    this.slashEffects.forEach(se => se.render(this.ctx));
    this.damageNumbers.forEach(dn => dn.render(this.ctx));

    // Health / skill bars — behind characters so they don't cover other entities
    this.plants.forEach(p => { if (p.alive) p.renderBars(this.ctx); });
    this.zombies.forEach(z => { if (z.alive) z.renderBars(this.ctx); });
    this.visitors.forEach(v => { if (v.alive) v.renderBars(this.ctx); });

    // ============================================
    // Layer 1: Characters (sorted by row asc, same-row zombies in front of plants)
    // ============================================
    const chars = [];
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
    }

    // Suns — above all characters, never blocked
    this.suns.forEach(sun => sun.render(this.ctx));

    // Drag ghost — always on top of all characters
    if (this.dragState && this.dragState.mouseX !== undefined) {
      const { plantType, mouseX, mouseY } = this.dragState;
      const isVisitor = !!getVisitorDef(plantType);
      const cost = isVisitor ? 0 : this._getPlantCost(plantType);
      this.ctx.save();
      this.ctx.globalAlpha = (isVisitor || this.sun >= cost) ? 0.65 : 0.35;

      const sc = this.lawn.standardCell;
      const scale = sc.w / this.lawn.cellWidth;
      let baseRenderSize = 80;
      if (plantType === 'peashooter') {
        const skinId = (this.playerData.plantSkins || {})[plantType];
        if (skinId === 'wishadel') baseRenderSize = 96;
      }
      const sz = baseRenderSize * scale;

      let img = null;
      if (isVisitor) {
        img = assetManager.getImageNoBg('visitor_katana_zero');
        if (img) {
          const imgScale = Math.min(sz / img.naturalWidth, sz / img.naturalHeight);
          const dw = img.naturalWidth * imgScale;
          const dh = img.naturalHeight * imgScale;
          this.ctx.drawImage(img, mouseX - dw / 2, mouseY - dh / 2, dw, dh);
        }
      } else {
        img = this._getSkinGhostImage(plantType);
        if (img) {
          const imgScale = Math.min(sz / img.naturalWidth, sz / img.naturalHeight);
          const dw = img.naturalWidth * imgScale;
          const dh = img.naturalHeight * imgScale;
          this.ctx.drawImage(img, mouseX - dw / 2, mouseY - dh / 2, dw, dh);
        }
      }
      if (!img) {
        const gx = mouseX - sz / 2;
        const gy = mouseY - sz / 2;
        if (plantType === 'sunflower') drawSunflower(this.ctx, gx, gy, sz, sz);
        else if (plantType === 'peashooter') drawPeashooter(this.ctx, gx, gy, sz, sz, false);
        else if (plantType === 'nut') drawNut(this.ctx, gx, gy, sz, sz, false);
        else if (plantType === 'cherrybomb') drawCherryBomb(this.ctx, gx, gy, sz, sz, false);
      }
      this.ctx.restore();
    }

    // Time-stop visual overlay
    if (this.timeScale <= GAME_CONFIG.TIME_STOP + 0.01) {
      this.ctx.save();
      this.ctx.globalAlpha = 0.2;
      this.ctx.fillStyle = '#a000c8';
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

  _getSkinGhostImage(plantType) {
    const skinId = (this.playerData.plantSkins || {})[plantType];
    if (skinId) {
      const combatKey = plantType + '_skin_' + skinId + '_combat';
      const combatImg = assetManager.getImage(combatKey);
      if (combatImg) return combatImg;
    }
    return assetManager.getImage(plantType);
  }

  _deadZombiesThisFrame = [];

  trackDeadZombies() {
    const newDead = this.zombies.filter(z => !z.alive && !z._killTracked);
    for (const zombie of newDead) {
      zombie._killTracked = true;
      this.enemiesKilled[zombie.rewardType] = (this.enemiesKilled[zombie.rewardType] || 0) + 1;
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
    const reachedLeft = this.zombies.some(z => z.x < 10);
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
      if (this._deployedVisitorIds.has(plantType)) return false;
      const { row, col } = this.lawn.getCellFromPosition(x, y);
      if (!this.lawn.canPlant(row, col)) return false;
      const center = this.lawn.getTileCenter(row, col);
      const visitor = new KatanaZero(center.x - 30, center.y - 40, row);
      this.addVisitor(visitor);
      this.lawn.plant(row, col, visitor);
      if (visitor.getBodyType() === 'humanoid') {
        const rowCenter = this.lawn.getRowY(row);
        const offset = this.lawn.standardCell.h / 2 * 0.15;
        visitor.y = rowCenter + offset - visitor.getRenderSize() * (visitor.scale || 1);
      }
      this._deployedVisitorIds.add(plantType);
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
    const skin = (this.playerData.plantSkins || {})[plantType] || null;

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
    }
    if (placed) {
      const plant = this.plants[this.plants.length - 1];
      this.lawn.plant(row, col, plant);
      // Humanoid: feet on line 15% below row center
      if (plant.getBodyType() === 'humanoid') {
        const rowCenter = this.lawn.getRowY(row);
        const offset = this.lawn.standardCell.h / 2 * 0.15;
        plant.y = rowCenter + offset - plant.getRenderSize() * plant.scale;
      }
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
    const offset = this.lawn.standardCell.h / 2 * 0.15;
    const y = this.lawn.getRowY(row) + offset - 115;  // humanoid feet 15% below center
    let zombie;
    switch (type) {
      case 'cone': zombie = new ConeZombie(x, y, row); break;
      case 'shield': zombie = new ShieldZombie(x, y, row); break;
      case 'imp': zombie = new ImpZombie(x, y, row); break;
      default: zombie = new NormalZombie(x, y, row); break;
    }
    this.addZombie(zombie);
    StorageManager.encounterEnemy(type);
  }
}
