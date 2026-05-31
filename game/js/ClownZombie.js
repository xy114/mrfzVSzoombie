import { Zombie } from './Zombie.js';
import { assetManager } from './AssetManager.js';

export class ClownZombie extends Zombie {
  constructor(x, y, row) {
    super(x, y, row);
    this.type = 'clown';
    this.maxHealth = 150;
    this.health = 150;
    this.defense = 0;
    this.speed = 0.4;
    this.damage = 0;
    this._isClown = true;
    this._exploding = false;
    this._explosionPhase = 0;
    this._prepAnimator = null;
    this._boomAnimator = null;
    this._exploded = false;
    this.deathGifKey = null;
  }

  initAnimators() {
    this.walkAnimator = assetManager.createAnimator('clown');
    if (this.walkAnimator && this.walkAnimator.frameCount > 0) {
      const scale = this.width / this.walkAnimator.naturalWidth;
      this.height = Math.round(this.walkAnimator.naturalHeight * scale);
    }
    this.attackAnimator = null;
  }

  attack() { return false; }

  _triggerClownExplosion(game) {
    if (this._exploding || this._squashed) return;
    this._exploding = true;
    this._invulnerable = true;
    this._explosionPhase = 1;
    this._prepAnimator = assetManager.createAnimator('clown_prep');
    if (this._prepAnimator) this._prepAnimator.setLoop(false);
  }

  update(deltaTime, game) {
    if (this._exploding) {
      if (this._explosionPhase === 1 && this._prepAnimator) {
        this._prepAnimator.update(deltaTime);
        if (!this._prepAnimator.isActive) {
          this._explosionPhase = 2;
          this._boomAnimator = assetManager.createAnimator('clown_explosion');
          if (this._boomAnimator) this._boomAnimator.setLoop(false);
          this._applyExplosionDamage(game);
        }
      } else if (this._explosionPhase === 2 && this._boomAnimator) {
        this._boomAnimator.update(deltaTime);
        if (!this._boomAnimator.isActive) {
          this.alive = false;
          this._exploded = true;
        }
      }
      return;
    }

    super.update(deltaTime, game);

    if (!this._exploding && !this._squashed && this.targetPlant) {
      const dx = this.x - (this.targetPlant.x + this.targetPlant.width);
      if (dx < 5 && dx > -30) {
        this._triggerClownExplosion(game);
      }
    }
  }

  onDeath(game) {
    if (!this._exploding && !this._squashed) {
      this._triggerClownExplosion(game);
    }
  }

  _applyExplosionDamage(game) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const cellSize = Math.max(game.lawn.standardCell.w, game.lawn.standardCell.h);

    for (const z of game.zombies) {
      if (!z.alive || z === this) continue;
      const dist = Math.sqrt((z.x + z.width/2 - cx)**2 + (z.y + z.height/2 - cy)**2);
      if (dist < cellSize * 2) {
        z.takeDamage(300, 'physical');
      }
    }
    for (const p of game.plants) {
      if (!p.alive) continue;
      const dist = Math.sqrt((p.x + p.width/2 - cx)**2 + (p.y + p.height/2 - cy)**2);
      if (dist < cellSize * 2) {
        p.takeDamage(300);
      }
    }
  }

  render(ctx) {
    if (this._exploding) {
      if (this._explosionPhase === 1 && this._prepAnimator) {
        const frame = this._prepAnimator.getCurrentCanvas();
        if (frame) ctx.drawImage(frame, this.x, this.y, this.width, this.height);
      } else if (this._explosionPhase === 2 && this._boomAnimator) {
        const frame = this._boomAnimator.getCurrentCanvas();
        if (frame) {
          const cx = this.x + this.width / 2;
          const cy = this.y + this.height / 2;
          const scale = 2.5;
          const dw = this._boomAnimator.naturalWidth * scale;
          const dh = this._boomAnimator.naturalHeight * scale;
          ctx.drawImage(frame, cx - dw/2, cy - dh/2, dw, dh);
        }
      }
      return;
    }

    super.render(ctx);
  }
}
