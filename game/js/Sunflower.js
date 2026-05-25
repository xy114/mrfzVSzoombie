import { Plant } from './Plant.js';
import { Sun } from './Sun.js';
import { SUN_CONFIG, STAR_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';
import { drawSunflower } from './PlantRenderer.js';

export class Sunflower extends Plant {
  constructor(x, y, starLevel = 1) {
    super(x, y, starLevel);
    this.sunTimer = 0;
    this.baseSunInterval = SUN_CONFIG.SUNFLOWER_INTERVAL;
    const m = STAR_CONFIG[this.starLevel] || STAR_CONFIG[1];
    this.sunInterval = Math.floor(this.baseSunInterval * m.cooldownMult);
  }

  update(deltaTime, game) {
    this.sunTimer += deltaTime;
    if (this.sunTimer >= this.sunInterval) {
      this.sunTimer = 0;
      const sunX = this.x + Math.random() * 50;
      const sunY = this.y + Math.random() * 30;
      game.addSun(new Sun(sunX, sunY, sunY));
    }
  }

  render(ctx) {
    const img = assetManager.getImage('sunflower');
    if (img) {
      ctx.drawImage(img, this.x, this.y, 80, 80);
    } else {
      drawSunflower(ctx, this.x, this.y, 80, 80);
    }
  }

  renderBars(ctx) {
    const healthPercent = this.health / this.maxHealth;
    const barW = 70;
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.x + 10, this.y + 5, barW, 5);
    ctx.fillStyle = '#0dc5d0';
    ctx.fillRect(this.x + 10, this.y + 5, barW * healthPercent, 5);
  }
}
