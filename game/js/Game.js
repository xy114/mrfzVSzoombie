import { GAME_CONFIG, SUN_CONFIG, PLANT_TYPES } from './constants.js';
import { Lawn } from './Lawn.js';
import { Sunflower } from './Sunflower.js';
import { PeaShooter } from './PeaShooter.js';
import { NormalZombie } from './NormalZombie.js';
import { ConeZombie } from './ConeZombie.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = GAME_CONFIG.CANVAS_WIDTH;
    this.canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
    this.lawn = new Lawn();
    this.plants = [];
    this.zombies = [];
    this.bullets = [];
    this.suns = [];
    this.sun = SUN_CONFIG.INITIAL;
    this.wave = 1;
    this.isRunning = false;
    this.lastTime = 0;
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.gameLoop();
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
    this.plants.forEach(plant => plant.update(deltaTime, this));
    this.bullets = this.bullets.filter(bullet => {
      bullet.update(deltaTime);
      return bullet.x < GAME_CONFIG.CANVAS_WIDTH && bullet.active;
    });
    this.zombies.forEach(zombie => zombie.update(deltaTime, this));
    this.suns = this.suns.filter(sun => {
      sun.update(deltaTime);
      return sun.active;
    });
    this.checkCollisions();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.lawn.render(this.ctx);
    this.plants.forEach(plant => plant.render(this.ctx));
    this.bullets.forEach(bullet => bullet.render(this.ctx));
    this.zombies.forEach(zombie => zombie.render(this.ctx));
    this.suns.forEach(sun => sun.render(this.ctx));
  }

  checkCollisions() {
    this.bullets = this.bullets.filter(b => b.active);
    this.zombies = this.zombies.filter(z => z.alive);
    this.plants = this.plants.filter(p => p.alive);
  }

  addPlant(plant) {
    this.plants.push(plant);
  }

  addZombie(zombie) {
    this.zombies.push(zombie);
  }

  addBullet(bullet) {
    this.bullets.push(bullet);
  }

  addSun(sun) {
    this.suns.push(sun);
  }

  collectSun(value) {
    this.sun += value;
    this.updateSunDisplay();
  }

  spendSun(value) {
    if (this.sun >= value) {
      this.sun -= value;
      this.updateSunDisplay();
      return true;
    }
    return false;
  }

  updateSunDisplay() {
    const sunElement = document.getElementById('sun-count');
    if (sunElement) sunElement.textContent = `☀️ ${this.sun}`;
  }

  updateWaveDisplay() {
    const waveElement = document.getElementById('wave-info');
    if (waveElement) waveElement.textContent = `波次 ${this.wave}`;
  }

  handlePlantClick(x, y, plantType) {
    const { row, col } = this.lawn.getCellFromPosition(x, y);
    if (!this.lawn.canPlant(row, col)) return false;

    const plantX = col * GAME_CONFIG.CELL_WIDTH;
    const plantY = row * GAME_CONFIG.CELL_HEIGHT;

    if (plantType === 'sunflower') {
      if (this.spendSun(PLANT_TYPES.SUNFLOWER.cost)) {
        const sunflower = new Sunflower(plantX, plantY);
        this.lawn.plant(row, col, sunflower);
        this.addPlant(sunflower);
        return true;
      }
    } else if (plantType === 'peashooter') {
      if (this.spendSun(PLANT_TYPES.PEASHOOTER.cost)) {
        const peashooter = new PeaShooter(plantX, plantY);
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