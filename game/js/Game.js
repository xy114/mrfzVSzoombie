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
import { FireBullet } from './Bullet.js';
import { WaveManager } from './WaveManager.js';
import { Sun } from './Sun.js';
import { StorageManager } from './StorageManager.js';
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
    this.update(deltaTime);
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }

  update(deltaTime) {
    if (this.battleEnded) return;
    const currentTime = performance.now();
    this._currentTime = currentTime;

    // Update plant cooldowns
    let cooldownsChanged = false;
    for (const type of Object.keys(this.plantCooldowns)) {
      if (this.plantCooldowns[type] > 0) {
        this.plantCooldowns[type] = Math.max(0, this.plantCooldowns[type] - deltaTime);
        cooldownsChanged = true;
      }
    }
    if (cooldownsChanged && this.onCooldownUpdate) {
      this.onCooldownUpdate(this.getCooldowns());
    }

    this.waveManager.update(deltaTime, currentTime);

    this.sunSpawnTimer += deltaTime;
    if (this.sunSpawnTimer >= SUN_CONFIG.SPAWN_INTERVAL) {
      this.sunSpawnTimer = 0;
      this.spawnRandomSun();
    }

    this.plants.forEach(plant => plant.update(deltaTime, this));

    this.bullets = this.bullets.filter(bullet => {
      if (bullet instanceof FireBullet) {
        bullet.update(deltaTime, this);
      } else {
        bullet.update(deltaTime);
      }
      return bullet.active;
    });

    this.zombies.forEach(zombie => zombie.update(deltaTime, this));

    this.suns = this.suns.filter(sun => {
      sun.update(deltaTime);
      return sun.active;
    });

    this.checkCollisions();
    this.trackDeadZombies();
    this.checkVictory();
    this.checkGameOver();
  }

  spawnRandomSun() {
    const row = Math.floor(Math.random() * this.lawn.rows);
    const col = Math.floor(Math.random() * this.lawn.cols);
    const x = col * GAME_CONFIG.CELL_WIDTH + Math.random() * 30;
    const targetY = this.lawn.getRowY(row) + Math.random() * 50;
    const sun = new Sun(x, 0, targetY);
    this.addSun(sun);
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.lawn.render(this.ctx);

    // Draw plant ghost on valid target cell during drag
    if (this.dragState) {
      const { hoverRow, hoverCol, plantType } = this.dragState;
      if (hoverRow >= 0 && hoverRow < this.lawn.rows &&
          hoverCol >= 0 && hoverCol < this.lawn.cols) {
        const cost = this._getPlantCost(plantType);
        const canPlace = this.lawn.canPlant(hoverRow, hoverCol) && this.sun >= cost && !this.isPlantOnCooldown(plantType);

        if (canPlace) {
          // Draw plant ghost at tile center, scaled to tile size
          const tile = this.lawn.sceneGrid.tiles[`${hoverRow},${hoverCol}`];
          if (tile) {
            const tileSize = this.lawn.getTileSize(hoverRow, hoverCol);
            const sz = Math.min(tileSize.w, tileSize.h) * 0.7;
            const cx = tile.center[0], cy = tile.center[1];

            this.ctx.save();
            this.ctx.globalAlpha = 0.45;
            // If slanted column, tilt 45°
            if (this.lawn.isSlanted(hoverCol)) {
              this.ctx.translate(cx, cy);
              this.ctx.rotate(-Math.PI / 4);
              this.ctx.translate(-cx, -cy);
            }

            const img = assetManager.getImage(plantType);
            if (img) {
              const imgScale = Math.min(sz / img.naturalWidth, sz / img.naturalHeight);
              const dw = img.naturalWidth * imgScale;
              const dh = img.naturalHeight * imgScale;
              this.ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
            } else {
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

    this.plants.forEach(plant => {
      const s = plant.scale || 1;
      const r = plant.rotation || 0;
      if (s !== 1 || r !== 0) {
        this.ctx.save();
        this.ctx.translate(plant.x, plant.y);
        if (r !== 0) this.ctx.rotate(r);
        this.ctx.scale(s, s);
        const ox = plant.x, oy = plant.y;
        plant.x = -40;
        plant.y = -40;
        plant.render(this.ctx);
        plant.x = ox;
        plant.y = oy;
        this.ctx.restore();
      } else {
        plant.render(this.ctx);
      }
    });
    this.bullets.forEach(bullet => bullet.render(this.ctx));
    this.zombies.forEach(zombie => zombie.render(this.ctx));
    this.suns.forEach(sun => sun.render(this.ctx));

    // Draw drag ghost on top (GIF优先，程序化fallback)
    if (this.dragState && this.dragState.mouseX !== undefined) {
      const { plantType, mouseX, mouseY } = this.dragState;
      const cost = this._getPlantCost(plantType);
      this.ctx.save();
      this.ctx.globalAlpha = this.sun >= cost ? 0.65 : 0.35;

      const img = assetManager.getImage(plantType);
      if (img) {
        const tileSize = this.lawn.getAvgTileSize();
        const sz = Math.min(tileSize.w, tileSize.h) * 0.85;
        const imgScale = Math.min(sz / img.naturalWidth, sz / img.naturalHeight);
        const dw = img.naturalWidth * imgScale;
        const dh = img.naturalHeight * imgScale;
        this.ctx.drawImage(img, mouseX - dw / 2, mouseY - dh / 2, dw, dh);
      } else {
        const gx = mouseX - 40;
        const gy = mouseY - 50;
        if (plantType === 'sunflower') drawSunflower(this.ctx, gx, gy, 80, 80);
        else if (plantType === 'peashooter') drawPeashooter(this.ctx, gx, gy, 80, 80, false);
        else if (plantType === 'nut') drawNut(this.ctx, gx, gy, 80, 80, false);
        else if (plantType === 'cherrybomb') drawCherryBomb(this.ctx, gx, gy, 80, 80, false);
      }
      this.ctx.restore();
    }
  }

  _getPlantCost(plantType) {
    const key = plantType.toUpperCase();
    return PLANT_TYPES[key]?.cost || 999;
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
    // Called by FireBullet for explosion kills — already handled by takeDamage
    // We track deaths via trackDeadZombies in the update loop
  }

  checkCollisions() {
    this.bullets.forEach(bullet => {
      if (!bullet.active) return;
      if (bullet instanceof FireBullet) return;

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
    this.zombies = this.zombies.filter(z => z.alive);
    this.plants = this.plants.filter(p => p.alive);
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
    let total = this.levelConfig.baseCrystalReward || 0;
    total += (this.enemiesKilled.normal || 0) * 1;
    total += (this.enemiesKilled.cone || 0) * 2;
    total += (this.enemiesKilled.shield || 0) * 3;
    total += (this.enemiesKilled.imp || 0) * 1;
    return total;
  }

  addPlant(plant) { this.plants.push(plant); }
  addZombie(zombie) { this.zombies.push(zombie); }
  addBullet(bullet) { this.bullets.push(bullet); }
  addSun(sun) { this.suns.push(sun); }

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

  handlePlantClick(x, y, plantType) {
    if (this.isPlantOnCooldown(plantType)) return false;

    const { row, col } = this.lawn.getCellFromPosition(x, y);
    if (!this.lawn.canPlant(row, col)) return false;

    const plantX = col * GAME_CONFIG.CELL_WIDTH;
    const plantY = row * GAME_CONFIG.CELL_HEIGHT;
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
      this.lawn.plant(row, col, this.plants[this.plants.length - 1]);
      if (this.onCooldownUpdate) this.onCooldownUpdate(this.getCooldowns());
    }
    return placed;
  }

  spawnZombie(type = 'normal') {
    const row = Math.floor(Math.random() * this.lawn.rows);
    const x = GAME_CONFIG.CANVAS_WIDTH;
    const y = this.lawn.getRowY(row);
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
