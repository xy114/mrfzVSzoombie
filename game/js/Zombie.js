import { GAME_CONFIG, ZOMBIE_TYPES } from './constants.js';
import { assetManager } from './AssetManager.js';
import { drawNormalZombie, drawConeZombie } from './ZombieRenderer.js';

export class Zombie {
  constructor(x, y, row) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.width = 86;
    this.height = 115;
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
  }

  getRenderSize() { return this.height; }

  update(deltaTime, game) {
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
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  render(ctx) {
    const attackKey = this.type + '_attack';
    let img = assetManager.getImage(attackKey) || assetManager.getImage(this.type);

    if (this._timeStopFrozen) {
      const bcx = this.x + this.width / 2;
      const bcy = this.y + this.height;
      // Render zombie + blue tint on offscreen canvas to avoid
      // source-atop bleeding into lawn background
      const off = document.createElement('canvas');
      off.width = this.width;
      off.height = this.height;
      const octx = off.getContext('2d');
      if (img) {
        octx.drawImage(img, 0, 0, this.width, this.height);
      } else if (this.type === 'cone') {
        drawConeZombie(octx, 0, 0, this.width, this.height, this.attacking);
      } else {
        drawNormalZombie(octx, 0, 0, this.width, this.height, this.attacking);
      }
      octx.globalCompositeOperation = 'source-atop';
      octx.fillStyle = 'rgba(30, 80, 180, 0.45)';
      octx.fillRect(0, 0, this.width, this.height);
      // Draw tinted result with backward tilt
      ctx.save();
      ctx.translate(bcx, bcy);
      ctx.rotate(0.12);
      ctx.translate(-bcx, -bcy);
      ctx.drawImage(off, this.x, this.y);
      ctx.restore();
      return;
    }

    if (img) {
      ctx.drawImage(img, this.x, this.y, 86, 115);
    } else if (this.type === 'cone') {
      drawConeZombie(ctx, this.x, this.y, 86, 115, this.attacking);
    } else {
      drawNormalZombie(ctx, this.x, this.y, 86, 115, this.attacking);
    }
  }

  renderBars(ctx) {
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.x + 7, this.y - 5, 72, 5);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(this.x + 7, this.y - 5, 72 * healthPercent, 5);
  }
}
