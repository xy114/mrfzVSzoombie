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
  }

  update(deltaTime, game) {
    // Pause during slash effect
    if (this._pauseTimer > 0) {
      this._pauseTimer -= deltaTime;
      return;
    }

    const blocker =
      game.plants.find(p =>
        p.row === this.row &&
        p.x < this.x + 100 &&
        p.x > this.x - 100
      ) ||
      game.visitors.find(v =>
        v.alive && v.row === this.row &&
        v.x < this.x + 100 &&
        v.x > this.x - 100
      );

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
