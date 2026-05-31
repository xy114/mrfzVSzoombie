import { Plant } from './Plant.js';
import { STAR_CONFIG } from './constants.js';
import { assetManager } from './AssetManager.js';
import { drawCherryBomb } from './PlantRenderer.js';
import { GifAnimator } from './GifAnimator.js';
import { ExplosionEffect } from './ExplosionEffect.js';

export class CherryBomb extends Plant {
  constructor(x, y, starLevel = 1) {
    super(x, y, starLevel);
    this.plantType = 'cherrybomb';
    this.maxHealth = 100;
    this.health = 100;
    const m = STAR_CONFIG[starLevel] || STAR_CONFIG[1];
    this.damage = Math.floor(50 * m.damageMult);
    this.explosionRadius = 3;
    this.armingTime = 1500;
    this.armTimer = 0;
    this.armed = false;
    this.exploded = false;
    this._animator = assetManager.createAnimator('cherrybomb');
    if (this._animator) this._animator.setLoop(false);
  }

  update(deltaTime, game) {
    if (this._animator) this._animator.update(deltaTime);
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
    game.addExplosionEffect(new ExplosionEffect(
      this.x, this.y + this.height * 0.3, this.width, 'cherrybomb_explosion'
    ));

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
    if (this._animator) {
      const frame = this._animator.getCurrentCanvas();
      const scale = this.width / this._animator.naturalWidth;
      const drawW = this.width;
      const drawH = Math.round(this._animator.naturalHeight * scale);
      const drawY = this.y + this.height - drawH;
      this._barAnchorY = drawY;
      ctx.drawImage(frame, this.x, drawY, drawW, drawH);
      return;
    }
    const img = assetManager.getImage('cherrybomb');
    if (img) {
      const s = Math.min(this.width / img.naturalWidth, this.height / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      ctx.drawImage(img, this.x + (this.width - dw) / 2, this.y + (this.height - dh) / 2, dw, dh);
    } else {
      drawCherryBomb(ctx, this.x, this.y, this.width, this.height, this.armed);
    }
  }

  getAspectRatio() { return 0.72; }

  renderBars(ctx) {
    if (this.exploded) return;
    if (!this.armed) {
      const pct = this.armTimer / this.armingTime;
      const barW = this.width * 0.875;
      const barX = this.x + (this.width - barW) / 2 - 5;
      ctx.fillStyle = 'rgba(255,0,0,0.6)';
      ctx.fillRect(barX, this.y + this.height + 5, barW * pct, 5);
    }
  }
}
