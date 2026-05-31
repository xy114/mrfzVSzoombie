import { GAME_CONFIG, ZOMBIE_TYPES } from './constants.js';
import { assetManager } from './AssetManager.js';
import { drawNormalZombie, drawConeZombie } from './ZombieRenderer.js';

export class Zombie {
  constructor(x, y, row) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.width = 125;
    this.height = 125;
    this.health = 100;
    this.maxHealth = 100;
    this.speed = 0.3;
    this.damage = 20;
    this.defense = 0;
    this.magicResist = 0;
    this.alive = true;
    this.attacking = false;
    this.targetPlant = null;
    this.attackTimer = 0;
    this.attackInterval = 1000;
    this.type = 'normal';
    this.rewardType = 'normal';
    this.rewardValue = 1;
    this._pauseTimer = 0;
    this._timeStopFrozen = false;
    this.walkAnimator = null;
    this.attackAnimator = null;
    this._flashTimer = 0;
    this._shouldSpawnDeathEffect = false;
    this.deathGifKey = null;
    this._originalType = null;
    this._flashStartTime = 0;
    this._deathDeferred = false;
    this._squashed = false;
    this._isClown = false;
    this._invulnerable = false;
  }

  initAnimators() {
    this.walkAnimator = assetManager.createAnimator(this.type);
    this.attackAnimator = assetManager.createAnimator(this.type + '_attack');

    if (this.walkAnimator && this.walkAnimator.frameCount > 0) {
      const scale = this.width / this.walkAnimator.naturalWidth;
      this.height = Math.round(this.walkAnimator.naturalHeight * scale);
    }

    if (this.type === 'imp') {
      this.deathGifKey = 'imp_death';
    } else {
      this.deathGifKey = 'zombie_death';
    }
  }

  getRenderSize() { return this.width; }
  getAspectRatio() { return this.height / this.width; }
  getBodyType() { return 'humanoid'; }

  update(deltaTime, game) {
    // Update GIF animators (always run, even during pause)
    if (this.walkAnimator) this.walkAnimator.update(deltaTime);
    if (this.attackAnimator) this.attackAnimator.update(deltaTime);
    if (this._flashTimer > 0) this._flashTimer -= deltaTime;

    // Pause during slash effect
    if (this._pauseTimer > 0) {
      this._pauseTimer -= deltaTime;
      return;
    }

    // Death deferred by skill animation — freeze in place until released
    if (this._deathDeferred) return;

    const blocker =
      game.plants.find(p => {
        if (p.row !== this.row) return false;
        const r = (p.getRenderSize ? p.getRenderSize() : 80) * (p.scale || 1);
        const zcx = this.x + this.width / 2;
        const pcx = p.x + r / 2;
        const halfCell = game.lawn.standardCell.w / 2;
        return Math.abs(zcx - pcx) <= halfCell * 0.6;
      }) ||
      game.visitors.find(v => {
        if (!v.alive || v.row !== this.row) return false;
        const r = (v.getRenderSize ? v.getRenderSize() : 80) * (v.scale || 1);
        const zcx = this.x + this.width / 2;
        const vcx = v.x + r / 2;
        const halfCell = game.lawn.standardCell.w / 2;
        return Math.abs(zcx - vcx) <= halfCell * 0.6;
      });

    if (blocker) {
      this.attacking = true;
      this.targetPlant = blocker;
      this.attackTimer += deltaTime;
      if (this.attackTimer >= this.attackInterval) {
        this.attackTimer = 0;
        this.attack();
      }
    } else {
      this.attacking = false;
      this.targetPlant = null;
      this.x -= this.speed * (deltaTime / 16);
    }

    if (this.health <= 0) {
      this.alive = false;
      this._shouldSpawnDeathEffect = true;
    }
  }

  attack() {
    if (this.targetPlant) {
      this.targetPlant.takeDamage(this.damage);
    }
  }

  takeDamage(damage, damageType = 'physical') {
    let actualDamage = damage;
    if (damageType === 'physical') {
      actualDamage = Math.max(1, damage - this.defense);
    } else if (damageType === 'magic') {
      actualDamage = damage * (1 - this.magicResist * 0.001);
    }
    this.health -= actualDamage;

    // Track original type for equipment break
    if (this._originalType === null) {
      this._originalType = this.type;
    }

    // Equipment break: cone/shield lose gear at ≤30% health
    if (this.health > 0 &&
        this.health <= this.maxHealth * 0.3 &&
        (this.type === 'cone' || this.type === 'shield')) {
      this.type = 'normal';
      this.walkAnimator = assetManager.createAnimator('normal');
      this.attackAnimator = assetManager.createAnimator('normal_attack');
      if (this.walkAnimator && this.walkAnimator.frameCount > 0) {
        const scale = this.width / this.walkAnimator.naturalWidth;
        this.height = Math.round(this.walkAnimator.naturalHeight * scale);
      }
      this._flashTimer = 1500;
      this._flashStartTime = performance.now();
      this.deathGifKey = 'zombie_death';
    }

    // Bucket degradation: HP ≤ 30% → normal (helmet shatters, defense drops)
    if (this.health > 0 &&
        this.health <= this.maxHealth * 0.3 &&
        this.type === 'bucket') {
      this.type = 'normal';
      this.defense = 0;
      this.walkAnimator = assetManager.createAnimator('normal');
      this.attackAnimator = assetManager.createAnimator('normal_attack');
      if (this.walkAnimator && this.walkAnimator.frameCount > 0) {
        const scale = this.width / this.walkAnimator.naturalWidth;
        this.height = Math.round(this.walkAnimator.naturalHeight * scale);
      }
      this._showShatterEffect = true;
      this._shatterTimer = 500;
      this.deathGifKey = 'zombie_death';
    }

    if (this.health <= 0) {
      this.alive = false;
      this._shouldSpawnDeathEffect = true;
    }
  }

  render(ctx) {
    const animator = this.attacking ? this.attackAnimator : this.walkAnimator;
    const hasGif = animator && animator.frameCount > 0;

    // Calculate draw dimensions with proportional scaling
    let drawW = this.width;
    let drawH = this.height;
    let drawX = this.x;
    let drawY = this.y;

    if (hasGif) {
      const scale = this.width / animator.naturalWidth;
      drawW = this.width;
      drawH = Math.round(animator.naturalHeight * scale);
      drawY = this.y + this.height - drawH;
    }

    // Helper to draw the current image (GIF frame or static fallback)
    const drawImage = (targetCtx, tx, ty, tw, th) => {
      if (hasGif) {
        targetCtx.drawImage(animator.getCurrentCanvas(), tx, ty, tw, th);
      } else {
        const fallbackKey = this.attacking ? (this.type + '_attack') : this.type;
        const img = assetManager.getImage(fallbackKey) || assetManager.getImage(this.type);
        if (img) {
          targetCtx.drawImage(img, tx, ty, tw, th);
        } else if (this.type === 'cone') {
          drawConeZombie(targetCtx, tx, ty, tw, th, this.attacking);
        } else {
          drawNormalZombie(targetCtx, tx, ty, tw, th, this.attacking);
        }
      }
    };

    if (this._timeStopFrozen || this._flashTimer > 0) {
      const bcx = this.x + this.width / 2;
      const bcy = this.y + this.height;
      const off = document.createElement('canvas');
      off.width = drawW;
      off.height = drawH;
      const octx = off.getContext('2d');
      drawImage(octx, 0, 0, drawW, drawH);

      // Single source-atop fill blending blue tint + white flash
      let r = 30, g = 80, b = 180, a = 0.45; // time-stop blue base
      if (!this._timeStopFrozen) {
        // Flash only (no time-stop): white flash
        const elapsed = performance.now() - this._flashStartTime;
        const flash = 0.5 + 0.5 * Math.sin(elapsed * 0.015);
        r = 255; g = 255; b = 255; a = flash * 0.6;
      } else if (this._flashTimer > 0) {
        // Both: blend blue with flashing highlight
        const elapsed = performance.now() - this._flashStartTime;
        const flash = 0.5 + 0.5 * Math.sin(elapsed * 0.015);
        r = Math.round(30 + (180 - 30) * flash * 0.6);
        g = Math.round(80 + (220 - 80) * flash * 0.6);
        b = Math.round(180 + (255 - 180) * flash * 0.6);
        a = 0.45 + flash * 0.2;
      }
      octx.globalCompositeOperation = 'source-atop';
      octx.fillStyle = `rgba(${r},${g},${b},${a})`;
      octx.fillRect(0, 0, drawW, drawH);

      // Apply rotation for time-stop
      if (this._timeStopFrozen) {
        ctx.save();
        ctx.translate(bcx, bcy);
        ctx.rotate(0.12);
        ctx.translate(-bcx, -bcy);
        ctx.drawImage(off, drawX, drawY);
        ctx.restore();
      } else {
        ctx.drawImage(off, drawX, drawY);
      }
      return;
    }

    // Normal rendering
    drawImage(ctx, drawX, drawY, drawW, drawH);
  }

  renderBars(ctx) {
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.x + 7, this.y - 5, 72, 5);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x + 7, this.y - 5, 72 * healthPercent, 5);
  }
}
