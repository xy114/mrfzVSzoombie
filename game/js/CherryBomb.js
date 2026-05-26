import { Plant } from './Plant.js';
import { STAR_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';
import { drawCherryBomb } from './PlantRenderer.js';

export class CherryBomb extends Plant {
  constructor(x, y, starLevel = 1) {
    super(x, y, starLevel);
    // Explosion is the skill: deals 400% of attack power
    this.maxHealth = 100;
    this.health = 100;
    const m = STAR_CONFIG[starLevel] || STAR_CONFIG[1];
    this.damage = Math.floor(50 * m.damageMult);
    this.explosionRadius = 3;
    this.armingTime = 1500;
    this.armTimer = 0;
    this.armed = false;
    this.exploded = false;
  }

  update(deltaTime, game) {
    if (this.exploded) return;
    this.armTimer += deltaTime;
    if (this.armTimer >= this.armingTime && !this.armed) {
      this.armed = true;
    }
    if (this.armed) {
      this.explode(game);
    }
  }

  explode(game) {
    this.exploded = true;
    this.alive = false;

    const cellW = 100;
    for (const zombie of game.zombies) {
      const dx = Math.abs(zombie.x + 30 - this.x);
      const dy = Math.abs(zombie.y + 40 - this.y);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < this.explosionRadius * cellW * 0.6) {
        zombie.takeDamage(Math.floor(this.damage * 4), 'physical');
        if (!zombie.alive) {
          game.enemiesKilled[zombie.rewardType] = (game.enemiesKilled[zombie.rewardType] || 0) + 1;
          zombie._killTracked = true;
        }
      }
    }
    // Remove from lawn
    if (this.row !== undefined && this.col !== undefined) {
      game.lawn.removePlant(this.row, this.col);
    }
  }

  render(ctx) {
    if (this.exploded) return;
    const img = assetManager.getImage('cherrybomb');
    if (img) {
      const s = Math.min(80 / img.naturalWidth, 80 / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      ctx.drawImage(img, this.x + (80 - dw) / 2, this.y + (80 - dh) / 2, dw, dh);
    } else {
      drawCherryBomb(ctx, this.x, this.y, 80, 80, this.armed);
    }
  }

  renderBars(ctx) {
    if (this.exploded) return;
    if (!this.armed) {
      const pct = this.armTimer / this.armingTime;
      ctx.fillStyle = 'rgba(255,0,0,0.6)';
      ctx.fillRect(this.x + 10, this.y - 8, 70 * pct, 5);
    }
  }
}
