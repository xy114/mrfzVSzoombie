import { GAME_CONFIG, SUN_CONFIG, PLANT_TYPES } from './constants.js';
import { Lawn } from './Lawn.js';
import { Sunflower } from './Sunflower.js';
import { PeaShooter } from './PeaShooter.js';
import { NormalZombie } from './NormalZombie.js';
import { ConeZombie } from './ConeZombie.js';
import { FireBullet } from './Bullet.js';
import { WaveManager } from './WaveManager.js';
import { Sun } from './Sun.js';

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

    this.enemiesKilled = { normal: 0, cone: 0 };
    this.battleEnded = false;

    this.onVictory = null;
    this.onDefeat = null;
    this.onSunChange = null;
    this.onWaveChange = null;
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
    const row = Math.floor(Math.random() * GAME_CONFIG.LAWN_ROWS);
    const col = Math.floor(Math.random() * GAME_CONFIG.LAWN_COLS);
    const x = col * GAME_CONFIG.CELL_WIDTH + Math.random() * 30;
    const targetY = row * GAME_CONFIG.CELL_HEIGHT + Math.random() * 50;
    const sun = new Sun(x, 0, targetY);
    this.addSun(sun);
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.lawn.render(this.ctx);
    this.plants.forEach(plant => plant.render(this.ctx));
    this.bullets.forEach(bullet => bullet.render(this.ctx));
    this.zombies.forEach(zombie => zombie.render(this.ctx));
    this.suns.forEach(sun => sun.render(this.ctx));
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
            zombie.takeDamage(bullet.damage);
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

  handlePlantClick(x, y, plantType) {
    const { row, col } = this.lawn.getCellFromPosition(x, y);
    if (!this.lawn.canPlant(row, col)) return false;

    const plantX = col * GAME_CONFIG.CELL_WIDTH;
    const plantY = row * GAME_CONFIG.CELL_HEIGHT;
    const star = (this.playerData.plantStars || {})[plantType] || 1;
    const skin = (this.playerData.plantSkins || {})[plantType] || null;

    if (plantType === 'sunflower') {
      if (this.spendSun(PLANT_TYPES.SUNFLOWER.cost)) {
        const sunflower = new Sunflower(plantX, plantY, star);
        this.lawn.plant(row, col, sunflower);
        this.addPlant(sunflower);
        return true;
      }
    } else if (plantType === 'peashooter') {
      if (this.spendSun(PLANT_TYPES.PEASHOOTER.cost)) {
        const peashooter = new PeaShooter(plantX, plantY, star, skin);
        this.lawn.plant(row, col, peashooter);
        this.addPlant(peashooter);
        return true;
      }
    }
    return false;
  }

  spawnZombie(type = 'normal') {
    const row = Math.floor(Math.random() * 5);
    const x = GAME_CONFIG.CANVAS_WIDTH;
    const y = row * GAME_CONFIG.CELL_HEIGHT;
    const zombie = type === 'cone'
      ? new ConeZombie(x, y, row)
      : new NormalZombie(x, y, row);
    this.addZombie(zombie);
  }
}
