import { GAME_CONFIG, ZOMBIE_TYPES } from './constants.js';
import { assetManager } from './AssetManager.js';
import { drawNormalZombie, drawConeZombie } from './ZombieRenderer.js';

export class Zombie {
  constructor(x, y, row) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.width = 96;
    this.height = 96;
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

    const blocker =
      game.plants.find(p => {
        if (p.row !== this.row) return false;
        const r = (p.getRenderSize ? p.getRenderSize() : 80) * (p.scale || 1);
        const zcx = this.x + this.width / 2;
        const pcx = p.x + r / 2;
        const halfCell = game.lawn.standardCell.w / 2;
        return pcx < zcx && Math.abs(zcx - pcx) <= halfCell;
      }) ||
      game.visitors.find(v => {
        if (!v.alive || v.row !== this.row) return false;
        const r = (v.getRenderSize ? v.getRenderSize() : 80) * (v.scale || 1);
        const zcx = this.x + this.width / 2;
        const vcx = v.x + r / 2;
        const halfCell = game.lawn.standardCell.w / 2;
        return vcx < zcx && Math.abs(zcx - vcx) <= halfCell;
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

    // Equipment break: cone/shield lose gear at <30% health
    if (this.health > 0 &&
        this.health < this.maxHealth * 0.3 &&
        (this.type === 'cone' || this.type === 'shield')) {
      this.type = 'normal';
      this.walkAnimator = assetManager.createAnimator('normal');
      this.attackAnimator = assetManager.createAnimator('normal_attack');
      if (this.walkAnimator && this.walkAnimator.frameCount > 0) {
        const scale = this.width / this.walkAnimator.naturalWidth;
        this.height = Math.round(this.walkAnimator.naturalHeight * scale);
      }
      this._flashTimer = 1500;
      this.deathGifKey = 'zombie_death';
    }

    if (this.health <= 0) {
      this.alive = false;
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

    // Equipment break flash
    if (this._flashTimer > 0) {
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this._flashTimer * 0.02);
      drawImage(ctx, drawX, drawY, drawW, drawH);
      ctx.restore();
      return;
    }

    // Time stop rendering
    if (this._timeStopFrozen) {
      const bcx = this.x + this.width / 2;
      const bcy = this.y + this.height;
      const off = document.createElement('canvas');
      off.width = drawW;
      off.height = drawH;
      const octx = off.getContext('2d');
      drawImage(octx, 0, 0, drawW, drawH);
      octx.globalCompositeOperation = 'source-atop';
      octx.fillStyle = 'rgba(30, 80, 180, 0.45)';
      octx.fillRect(0, 0, drawW, drawH);
      ctx.save();
      ctx.translate(bcx, bcy);
      ctx.rotate(0.12);
      ctx.translate(-bcx, -bcy);
      ctx.drawImage(off, drawX, drawY);
      ctx.restore();
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
