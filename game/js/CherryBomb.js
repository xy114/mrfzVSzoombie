import { Plant } from './Plant.js';
import { STAR_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';
import { drawCherryBomb } from './PlantRenderer.js';

export class CherryBomb extends Plant {
  constructor(x, y, starLevel = 1) {
    super(x, y, starLevel);
    // Cherry Bomb doesn't need HP — it explodes on arm. Scale damage instead.
    this.maxHealth = 100;
    this.health = 100;
    const damageMult = (STAR_CONFIG[starLevel] || STAR_CONFIG[1]).damageMult;
    this.explosionDamage = Math.floor(200 * damageMult);
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
        zombie.takeDamage(this.explosionDamage, 'physical');
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
      ctx.drawImage(img, this.x, this.y, 80, 80);
    } else {
      drawCherryBomb(ctx, this.x, this.y, 80, 80, this.armed);
    }
  }

  renderBars(ctx) {
    if (this.exploded) return;
    if (!this.armed) {
      const pct = this.armTimer / this.armingTime;
      ctx.fillStyle = 'rgba(255,0,0,0.6)';
      ctx.fillRect(this.x + 10, this.y + 5, 70 * pct, 5);
    }
  }
}
