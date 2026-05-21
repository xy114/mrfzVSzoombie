import { Plant } from './Plant.js';
import { Sun } from './Sun.js';
import { SUN_CONFIG } from './constants.js';

export class Sunflower extends Plant {
  constructor(x, y) {
    super(x, y);
    this.sunTimer = 0;
    this.sunInterval = SUN_CONFIG.SUNFLOWER_INTERVAL;
  }

  update(deltaTime, game) {
    this.sunTimer += deltaTime;
    if (this.sunTimer >= this.sunInterval) {
      this.sunTimer = 0;
      const sunX = this.x + Math.random() * 50;
      const sunY = this.y + Math.random() * 30;
      game.addSun(new Sun(sunX, sunY));
    }
  }

  render(ctx) {
    ctx.font = '50px Arial';
    ctx.fillText('🌻', this.x + 20, this.y + 70);
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(this.x + 10, this.y + 5, 80 * healthPercent, 5);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(this.x + 10, this.y + 5, 80, 5);
  }
}